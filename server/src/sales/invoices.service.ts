import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Invoice } from './invoice.entity';
import { InvoiceLine } from './invoice-line.entity';
import { InvoiceStatus } from './sales.enums';
import { Contact } from '../contacts/contact.entity';
import { Product } from '../inventory/product.entity';
import { Journal } from '../finance/entities/journal.entity';
import { JournalEntry } from '../finance/entities/journal-entry.entity';
import { JournalEntryLine } from '../finance/entities/journal-entry-line.entity';
import { JournalEntryState, JournalType } from '../finance/finance.enums';
import { JournalEntriesService } from '../finance/journal-entries.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { fromMinorUnits, multiplyMinorUnits, toMinorUnits } from '../finance/utils/money';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    @InjectRepository(Contact)
    private readonly contactRepository: Repository<Contact>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly journalEntriesService: JournalEntriesService,
  ) {}

  async findAll(): Promise<Invoice[]> {
    return this.invoiceRepository.find({
      relations: { Contact: true, Lines: { Product: true } },
      order: { Id: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({
      where: { Id: id },
      relations: { Contact: true, Lines: { Product: true } },
    });
    if (!invoice) {
      throw new NotFoundException(`Invoice ${id} not found`);
    }
    return invoice;
  }

  async createDraft(dto: CreateInvoiceDto): Promise<Invoice> {
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

      const invoiceLine = new InvoiceLine();
      invoiceLine.Product = product;
      invoiceLine.Description = line.Description ?? product.Name;
      invoiceLine.Quantity = fromMinorUnits(quantityMinor);
      invoiceLine.UnitPrice = fromMinorUnits(unitPriceMinor);
      invoiceLine.LineTotal = fromMinorUnits(lineTotalMinor);
      return invoiceLine;
    });

    const invoice = this.invoiceRepository.create({
      InvoiceNumber: '',
      Date: dto.Date,
      DueDate: dto.DueDate,
      Contact: contact,
      Status: InvoiceStatus.Draft,
      TotalAmount: fromMinorUnits(totalMinor),
      Lines: lines,
    });

    return this.invoiceRepository.save(invoice);
  }

  /**
   * The Sales<->Finance bridge. Everything below runs in one transaction
   * that also encloses JournalEntriesService.postEntry (via its optional
   * `manager` parameter), so the Invoice's flip to Posted and the
   * generated JournalEntry commit — or roll back — as a single atomic
   * unit. An invoice can never end up "Posted" without its accounting
   * entry, or vice versa: if postEntry's own balance/lock validation
   * throws for any reason, this whole transaction (including the
   * Invoice's status change) rolls back with it.
   */
  async postInvoice(id: number): Promise<Invoice> {
    return this.invoiceRepository.manager.transaction(async (manager) => {
      const invoice = await manager.findOne(Invoice, {
        where: { Id: id },
        relations: {
          Contact: { AccountsReceivable: true },
          Lines: { Product: { Category: { IncomeAccount: true } } },
        },
      });

      if (!invoice) {
        throw new NotFoundException(`Invoice ${id} not found`);
      }
      if (invoice.Status !== InvoiceStatus.Draft) {
        throw new ConflictException('Only draft invoices can be posted');
      }
      if (!invoice.Lines || invoice.Lines.length === 0) {
        throw new BadRequestException('An invoice must have at least one line to post');
      }
      if (!invoice.Contact.AccountsReceivable) {
        throw new BadRequestException(
          `Contact '${invoice.Contact.Name}' has no Accounts Receivable account configured`,
        );
      }
      const arAccount = invoice.Contact.AccountsReceivable;

      for (const line of invoice.Lines) {
        if (!line.Product.Category?.IncomeAccount) {
          throw new BadRequestException(
            `Product '${line.Product.Name}' has no Income Account configured on its category`,
          );
        }
      }

      // Never trust precomputed state at the moment of posting: recompute
      // the total from the lines and confirm it still matches what was
      // stored when the draft was created.
      let totalMinor = 0;
      for (const line of invoice.Lines) {
        totalMinor += toMinorUnits(line.LineTotal);
      }
      if (totalMinor !== toMinorUnits(invoice.TotalAmount)) {
        throw new BadRequestException('Invoice total does not match the sum of its lines');
      }
      if (totalMinor <= 0) {
        throw new BadRequestException('An invoice cannot be posted with a zero or negative total');
      }

      const salesJournal = await manager.findOne(Journal, {
        where: { Type: JournalType.Sales, IsActive: true },
      });
      if (!salesJournal) {
        throw new BadRequestException('No active Sales journal is configured');
      }

      // Build the accounting entry: one DEBIT line for the customer's AR
      // account, one CREDIT line per invoice line for its product's
      // income account. Exact decimal math throughout (values are already
      // decimalTransformer-formatted strings; toMinorUnits/fromMinorUnits
      // do the actual arithmetic), never a JS float.
      const arLine = new JournalEntryLine();
      arLine.LineNumber = 1;
      arLine.Account = arAccount;
      arLine.Description = `Accounts Receivable — Invoice ${invoice.Id}`;
      arLine.Debit = fromMinorUnits(totalMinor);
      arLine.Credit = fromMinorUnits(0);

      const incomeLines = invoice.Lines.map((line, index) => {
        const entryLine = new JournalEntryLine();
        entryLine.LineNumber = index + 2;
        entryLine.Account = line.Product.Category.IncomeAccount!;
        entryLine.Description = line.Description;
        entryLine.Debit = fromMinorUnits(0);
        entryLine.Credit = line.LineTotal;
        return entryLine;
      });

      const journalEntry = manager.create(JournalEntry, {
        Journal: salesJournal,
        EntryDate: invoice.Date,
        Narration: `Auto-generated from Invoice ${invoice.Id}`,
        Reference: '',
        State: JournalEntryState.Draft,
        Lines: [arLine, ...incomeLines],
      });
      const savedEntry = await manager.save(JournalEntry, journalEntry);

      // Reuse the exact same Layer-2 balance/lock/sequence logic that
      // governs every manually-created entry, inside this transaction.
      await this.journalEntriesService.postEntry(savedEntry.Id, manager);

      const year = invoice.Date.slice(0, 4);
      invoice.InvoiceNumber = `INV-${year}-${invoice.Id}`;
      invoice.Status = InvoiceStatus.Posted;
      return manager.save(Invoice, invoice);
    });
  }
}
