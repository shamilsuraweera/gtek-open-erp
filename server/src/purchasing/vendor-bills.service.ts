import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { VendorBill } from './vendor-bill.entity';
import { VendorBillLine } from './vendor-bill-line.entity';
import { VendorBillStatus } from './purchasing.enums';
import { Contact } from '../contacts/contact.entity';
import { Product } from '../inventory/product.entity';
import { Journal } from '../finance/entities/journal.entity';
import { JournalEntry } from '../finance/entities/journal-entry.entity';
import { JournalEntryLine } from '../finance/entities/journal-entry-line.entity';
import { JournalEntryState, JournalType } from '../finance/finance.enums';
import { JournalEntriesService } from '../finance/journal-entries.service';
import { CreateVendorBillDto } from './dto/create-vendor-bill.dto';
import { fromMinorUnits, multiplyMinorUnits, toMinorUnits } from '../finance/utils/money';

@Injectable()
export class VendorBillsService {
  constructor(
    @InjectRepository(VendorBill)
    private readonly vendorBillRepository: Repository<VendorBill>,
    @InjectRepository(Contact)
    private readonly contactRepository: Repository<Contact>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly journalEntriesService: JournalEntriesService,
  ) {}

  async findAll(): Promise<VendorBill[]> {
    return this.vendorBillRepository.find({
      relations: { Contact: true, Lines: { Product: true } },
      order: { Id: 'DESC' },
    });
  }

  async findOne(id: number): Promise<VendorBill> {
    const bill = await this.vendorBillRepository.findOne({
      where: { Id: id },
      relations: { Contact: true, Lines: { Product: true } },
    });
    if (!bill) {
      throw new NotFoundException(`Vendor bill ${id} not found`);
    }
    return bill;
  }

  async createDraft(dto: CreateVendorBillDto): Promise<VendorBill> {
    const contact = await this.contactRepository.findOneBy({ Id: dto.ContactId });
    if (!contact || !contact.IsActive) {
      throw new BadRequestException('Contact not found or inactive');
    }

    const productIds = [...new Set(dto.Lines.map((line) => line.ProductId))];
    const products = await this.productRepository.findBy({ Id: In(productIds) });
    if (products.length !== productIds.length || products.some((product) => !product.IsActive)) {
      throw new BadRequestException('One or more products do not exist or are inactive');
    }
    const productsById = new Map(products.map((product) => [product.Id, product]));

    let totalMinor = 0;
    const lines = dto.Lines.map((line) => {
      const product = productsById.get(line.ProductId)!;
      const quantityMinor = toMinorUnits(line.Quantity);
      const unitPriceMinor = toMinorUnits(line.UnitPrice);
      const lineTotalMinor = multiplyMinorUnits(quantityMinor, unitPriceMinor);
      totalMinor += lineTotalMinor;

      const billLine = new VendorBillLine();
      billLine.Product = product;
      billLine.Description = line.Description ?? product.Name;
      billLine.Quantity = fromMinorUnits(quantityMinor);
      billLine.UnitPrice = fromMinorUnits(unitPriceMinor);
      billLine.LineTotal = fromMinorUnits(lineTotalMinor);
      return billLine;
    });

    const bill = this.vendorBillRepository.create({
      BillNumber: '',
      Date: dto.Date,
      DueDate: dto.DueDate,
      Contact: contact,
      Status: VendorBillStatus.Draft,
      TotalAmount: fromMinorUnits(totalMinor),
      Lines: lines,
    });

    return this.vendorBillRepository.save(bill);
  }

  /**
   * The Purchasing<->Finance bridge — the structural mirror of
   * InvoicesService.postInvoice. Everything below runs in one transaction
   * that also encloses JournalEntriesService.postEntry (via its optional
   * `manager` parameter), so the VendorBill's flip to Posted and the
   * generated JournalEntry commit — or roll back — as a single atomic
   * unit. A bill can never end up "Posted" without its accounting entry,
   * or vice versa: if postEntry's own balance/lock validation throws for
   * any reason, this whole transaction (including the bill's status
   * change) rolls back with it.
   */
  async postBill(id: number): Promise<VendorBill> {
    return this.vendorBillRepository.manager.transaction(async (manager) => {
      const bill = await manager.findOne(VendorBill, {
        where: { Id: id },
        relations: {
          Contact: { AccountsPayable: true },
          Lines: { Product: { Category: { ExpenseAccount: true } } },
        },
      });

      if (!bill) {
        throw new NotFoundException(`Vendor bill ${id} not found`);
      }
      if (bill.Status !== VendorBillStatus.Draft) {
        throw new ConflictException('Only draft vendor bills can be posted');
      }
      if (!bill.Lines || bill.Lines.length === 0) {
        throw new BadRequestException('A vendor bill must have at least one line to post');
      }
      if (!bill.Contact.AccountsPayable) {
        throw new BadRequestException(
          `Contact '${bill.Contact.Name}' has no Accounts Payable account configured`,
        );
      }
      const apAccount = bill.Contact.AccountsPayable;

      for (const line of bill.Lines) {
        if (!line.Product.Category?.ExpenseAccount) {
          throw new BadRequestException(
            `Product '${line.Product.Name}' has no Expense Account configured on its category`,
          );
        }
      }

      // Never trust precomputed state at the moment of posting: recompute
      // the total from the lines and confirm it still matches what was
      // stored when the draft was created.
      let totalMinor = 0;
      for (const line of bill.Lines) {
        totalMinor += toMinorUnits(line.LineTotal);
      }
      if (totalMinor !== toMinorUnits(bill.TotalAmount)) {
        throw new BadRequestException('Vendor bill total does not match the sum of its lines');
      }
      if (totalMinor <= 0) {
        throw new BadRequestException('A vendor bill cannot be posted with a zero or negative total');
      }

      const purchaseJournal = await manager.findOne(Journal, {
        where: { Type: JournalType.Purchase, IsActive: true },
      });
      if (!purchaseJournal) {
        throw new BadRequestException('No active Purchase journal is configured');
      }

      // Build the accounting entry: one CREDIT line for the vendor's AP
      // account, one DEBIT line per bill line for its product's expense
      // account. Exact decimal math throughout (values are already
      // decimalTransformer-formatted strings; toMinorUnits/fromMinorUnits
      // do the actual arithmetic), never a JS float.
      const apLine = new JournalEntryLine();
      apLine.LineNumber = 1;
      apLine.Account = apAccount;
      apLine.Description = `Accounts Payable — Bill ${bill.Id}`;
      apLine.Debit = fromMinorUnits(0);
      apLine.Credit = fromMinorUnits(totalMinor);

      const expenseLines = bill.Lines.map((line, index) => {
        const entryLine = new JournalEntryLine();
        entryLine.LineNumber = index + 2;
        entryLine.Account = line.Product.Category.ExpenseAccount!;
        entryLine.Description = line.Description;
        entryLine.Debit = line.LineTotal;
        entryLine.Credit = fromMinorUnits(0);
        return entryLine;
      });

      const journalEntry = manager.create(JournalEntry, {
        Journal: purchaseJournal,
        EntryDate: bill.Date,
        Narration: `Auto-generated from Vendor Bill ${bill.Id}`,
        Reference: '',
        State: JournalEntryState.Draft,
        Lines: [apLine, ...expenseLines],
      });
      const savedEntry = await manager.save(JournalEntry, journalEntry);

      // Reuse the exact same Layer-2 balance/lock/sequence logic that
      // governs every manually-created entry, inside this transaction.
      await this.journalEntriesService.postEntry(savedEntry.Id, manager);

      const year = bill.Date.slice(0, 4);
      bill.BillNumber = `BILL-${year}-${bill.Id}`;
      bill.Status = VendorBillStatus.Posted;
      return manager.save(VendorBill, bill);
    });
  }
}
