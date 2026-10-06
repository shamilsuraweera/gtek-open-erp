import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InvoicesService } from './invoices.service';
import { Invoice } from './invoice.entity';
import { InvoiceLine } from './invoice-line.entity';
import { InvoiceStatus } from './sales.enums';
import { Contact } from '../contacts/contact.entity';
import { Product } from '../inventory/product.entity';
import { ProductCategory } from '../inventory/product-category.entity';
import { Account } from '../finance/entities/account.entity';
import { Journal } from '../finance/entities/journal.entity';
import { JournalEntry } from '../finance/entities/journal-entry.entity';
import { AccountType, JournalEntryState, JournalType } from '../finance/finance.enums';
import { JournalEntriesService } from '../finance/journal-entries.service';

describe('InvoicesService', () => {
  let service: InvoicesService;
  let invoiceRepository: jest.Mocked<Repository<Invoice>>;
  let contactRepository: jest.Mocked<Repository<Contact>>;
  let productRepository: jest.Mocked<Repository<Product>>;
  let journalEntriesService: jest.Mocked<JournalEntriesService>;
  let manager: { findOne: jest.Mock; save: jest.Mock; create: jest.Mock };

  const activeAccount = (id: number, type = AccountType.Income): Account =>
    ({ Id: id, Code: String(id), Name: `Account ${id}`, Type: type, IsActive: true }) as Account;

  const activeCategory = (incomeAccount: Account | null): ProductCategory =>
    ({ Id: 1, Name: 'Category', IncomeAccount: incomeAccount, IsActive: true }) as ProductCategory;

  const activeProduct = (id: number, category: ProductCategory): Product =>
    ({ Id: id, Name: `Product ${id}`, Category: category, IsActive: true }) as Product;

  beforeEach(async () => {
    manager = { findOne: jest.fn(), save: jest.fn(), create: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoicesService,
        {
          provide: getRepositoryToken(Invoice),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            findOneBy: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            manager: { transaction: jest.fn((cb: any) => cb(manager)) },
          },
        },
        {
          provide: getRepositoryToken(Contact),
          useValue: { findOneBy: jest.fn() },
        },
        {
          provide: getRepositoryToken(Product),
          useValue: { findBy: jest.fn() },
        },
        {
          provide: JournalEntriesService,
          useValue: { postEntry: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<InvoicesService>(InvoicesService);
    invoiceRepository = module.get(getRepositoryToken(Invoice));
    contactRepository = module.get(getRepositoryToken(Contact));
    productRepository = module.get(getRepositoryToken(Product));
    journalEntriesService = module.get(JournalEntriesService);
  });

  describe('createDraft', () => {
    it('computes LineTotal and TotalAmount via exact minor-unit math', async () => {
      contactRepository.findOneBy.mockResolvedValue({ Id: 1, IsActive: true } as Contact);
      const category = activeCategory(activeAccount(100));
      const product = activeProduct(5, category);
      productRepository.findBy.mockResolvedValue([product]);
      invoiceRepository.create.mockImplementation((v) => v as Invoice);
      invoiceRepository.save.mockImplementation(async (i) => i as Invoice);

      const result = await service.createDraft({
        ContactId: 1,
        Date: '2026-01-01',
        DueDate: '2026-01-31',
        Lines: [{ ProductId: 5, Quantity: '3', UnitPrice: '19.99' }],
      });

      expect(result.Lines[0].LineTotal).toBe('59.9700');
      expect(result.TotalAmount).toBe('59.9700');
      expect(result.InvoiceNumber).toBe('');
      expect(result.Status).toBe(InvoiceStatus.Draft);
    });

    it('rejects an inactive contact', async () => {
      contactRepository.findOneBy.mockResolvedValue({ Id: 1, IsActive: false } as Contact);

      await expect(
        service.createDraft({
          ContactId: 1,
          Date: '2026-01-01',
          DueDate: '2026-01-31',
          Lines: [{ ProductId: 5, Quantity: '1', UnitPrice: '10' }],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects a product that does not exist', async () => {
      contactRepository.findOneBy.mockResolvedValue({ Id: 1, IsActive: true } as Contact);
      productRepository.findBy.mockResolvedValue([]);

      await expect(
        service.createDraft({
          ContactId: 1,
          Date: '2026-01-01',
          DueDate: '2026-01-31',
          Lines: [{ ProductId: 999, Quantity: '1', UnitPrice: '10' }],
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('postInvoice', () => {
    function draftInvoice(overrides: Partial<Invoice> = {}): Invoice {
      const category = activeCategory(activeAccount(100));
      const product = activeProduct(5, category);
      return {
        Id: 1,
        Date: '2026-01-15',
        Status: InvoiceStatus.Draft,
        TotalAmount: '59.9700',
        Contact: { Id: 1, Name: 'Acme Corp', AccountsReceivable: activeAccount(200, AccountType.Asset) } as Contact,
        Lines: [
          { Id: 1, Description: 'Widget', Quantity: '3.0000', UnitPrice: '19.9900', LineTotal: '59.9700', Product: product } as InvoiceLine,
        ],
        ...overrides,
      } as Invoice;
    }

    it('creates a balanced JournalEntry (AR debit + income credit) and posts the invoice', async () => {
      const invoice = draftInvoice();
      const salesJournal = { Id: 1, Type: JournalType.Sales, IsActive: true } as Journal;
      manager.findOne.mockImplementation((entity: any) => {
        if (entity === Invoice) return invoice;
        if (entity === Journal) return salesJournal;
        return null;
      });
      manager.create.mockImplementation((_entity: any, v: any) => v);
      manager.save.mockImplementation(async (entity: any, v: any) => (entity === JournalEntry ? { ...v, Id: 42 } : v));
      journalEntriesService.postEntry.mockResolvedValue({ Id: 42, State: JournalEntryState.Posted } as JournalEntry);

      const result = await service.postInvoice(1);

      expect(journalEntriesService.postEntry).toHaveBeenCalledWith(42, manager);
      const createdEntryArg = manager.create.mock.calls[0][1];
      expect(createdEntryArg.Lines).toHaveLength(2);
      expect(createdEntryArg.Lines[0].Debit).toBe('59.9700');
      expect(createdEntryArg.Lines[0].Credit).toBe('0.0000');
      expect(createdEntryArg.Lines[1].Debit).toBe('0.0000');
      expect(createdEntryArg.Lines[1].Credit).toBe('59.9700');
      expect(result.Status).toBe(InvoiceStatus.Posted);
      expect(result.InvoiceNumber).toBe('INV-2026-1');
    });

    it('rejects an invoice that is not Draft', async () => {
      manager.findOne.mockResolvedValue(draftInvoice({ Status: InvoiceStatus.Posted }));

      await expect(service.postInvoice(1)).rejects.toThrow(ConflictException);
    });

    it('rejects an invoice that does not exist', async () => {
      manager.findOne.mockResolvedValue(null);

      await expect(service.postInvoice(999)).rejects.toThrow(NotFoundException);
    });

    it('rejects a contact with no Accounts Receivable account configured', async () => {
      const invoice = draftInvoice({ Contact: { Id: 1, Name: 'Acme Corp', AccountsReceivable: null } as Contact });
      manager.findOne.mockResolvedValue(invoice);

      await expect(service.postInvoice(1)).rejects.toThrow(BadRequestException);
    });

    it('rejects a product whose category has no Income Account configured', async () => {
      const category = activeCategory(null);
      const product = activeProduct(5, category);
      const invoice = draftInvoice({
        Lines: [
          { Id: 1, Description: 'Widget', Quantity: '3.0000', UnitPrice: '19.9900', LineTotal: '59.9700', Product: product } as InvoiceLine,
        ],
      });
      manager.findOne.mockResolvedValue(invoice);

      await expect(service.postInvoice(1)).rejects.toThrow(BadRequestException);
    });

    it('rejects when the stored total does not match the sum of its lines', async () => {
      const invoice = draftInvoice({ TotalAmount: '999.0000' });
      manager.findOne.mockResolvedValue(invoice);

      await expect(service.postInvoice(1)).rejects.toThrow(BadRequestException);
    });

    it('rejects when no active Sales journal is configured', async () => {
      const invoice = draftInvoice();
      manager.findOne.mockImplementation((entity: any) => (entity === Invoice ? invoice : null));

      await expect(service.postInvoice(1)).rejects.toThrow(BadRequestException);
    });
  });
});
