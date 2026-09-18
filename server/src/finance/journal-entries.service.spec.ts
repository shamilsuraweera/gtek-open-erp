import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { JournalEntriesService } from './journal-entries.service';
import { JournalEntry } from './entities/journal-entry.entity';
import { JournalEntryLine } from './entities/journal-entry-line.entity';
import { Journal } from './entities/journal.entity';
import { Account } from './entities/account.entity';
import { Tax } from './entities/tax.entity';
import { AccountType, JournalEntryState, JournalType } from './finance.enums';

describe('JournalEntriesService', () => {
  let service: JournalEntriesService;
  let journalEntryRepository: jest.Mocked<Repository<JournalEntry>>;
  let journalRepository: jest.Mocked<Repository<Journal>>;
  let accountRepository: jest.Mocked<Repository<Account>>;
  let taxRepository: jest.Mocked<Repository<Tax>>;
  let manager: { findOne: jest.Mock; save: jest.Mock };

  const activeAccount = (id: number): Account =>
    ({ Id: id, Code: String(id), Name: 'Account', Type: AccountType.Asset, IsActive: true }) as Account;

  beforeEach(async () => {
    manager = { findOne: jest.fn(), save: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JournalEntriesService,
        {
          provide: getRepositoryToken(JournalEntry),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            manager: { transaction: jest.fn((cb: any) => cb(manager)) },
          },
        },
        {
          provide: getRepositoryToken(Journal),
          useValue: { findOneBy: jest.fn() },
        },
        {
          provide: getRepositoryToken(Account),
          useValue: { findBy: jest.fn() },
        },
        {
          provide: getRepositoryToken(Tax),
          useValue: { findBy: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<JournalEntriesService>(JournalEntriesService);
    journalEntryRepository = module.get(getRepositoryToken(JournalEntry));
    journalRepository = module.get(getRepositoryToken(Journal));
    accountRepository = module.get(getRepositoryToken(Account));
    taxRepository = module.get(getRepositoryToken(Tax));
  });

  describe('createDraft', () => {
    it('creates a draft with an empty placeholder Reference', async () => {
      journalRepository.findOneBy.mockResolvedValue({ Id: 1, IsActive: true } as Journal);
      accountRepository.findBy.mockResolvedValue([activeAccount(10), activeAccount(20)]);
      journalEntryRepository.create.mockImplementation((v) => v as JournalEntry);
      journalEntryRepository.save.mockImplementation(async (e) => e as JournalEntry);

      const result = await service.createDraft({
        JournalId: 1,
        EntryDate: '2026-09-16',
        Lines: [
          { AccountId: 10, Debit: '100.00', Credit: '0' },
          { AccountId: 20, Debit: '0', Credit: '100.00' },
        ],
      });

      expect(result.Reference).toBe('');
      expect(result.State).toBe(JournalEntryState.Draft);
      expect(result.Lines).toHaveLength(2);
    });

    it('rejects a line with both debit and credit set', async () => {
      journalRepository.findOneBy.mockResolvedValue({ Id: 1, IsActive: true } as Journal);
      accountRepository.findBy.mockResolvedValue([activeAccount(10)]);

      await expect(
        service.createDraft({
          JournalId: 1,
          EntryDate: '2026-09-16',
          Lines: [{ AccountId: 10, Debit: '50', Credit: '50' }],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects an inactive journal', async () => {
      journalRepository.findOneBy.mockResolvedValue({ Id: 1, IsActive: false } as Journal);

      await expect(
        service.createDraft({
          JournalId: 1,
          EntryDate: '2026-09-16',
          Lines: [{ AccountId: 10, Debit: '50', Credit: '0' }],
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('postEntry', () => {
    function draftEntry(overrides: Partial<JournalEntry> = {}): JournalEntry {
      return {
        Id: 1,
        State: JournalEntryState.Draft,
        Journal: { Id: 1 } as Journal,
        Lines: [
          { Id: 1, Debit: '100.0000', Credit: '0.0000', Account: activeAccount(10), Tax: null } as JournalEntryLine,
          { Id: 2, Debit: '0.0000', Credit: '100.0000', Account: activeAccount(20), Tax: null } as JournalEntryLine,
        ],
        ...overrides,
      } as JournalEntry;
    }

    function activeJournal(overrides: Partial<Journal> = {}): Journal {
      return {
        Id: 1,
        Code: 'GEN',
        Type: JournalType.General,
        SequencePrefix: 'GEN/',
        NextSequenceNumber: 1,
        IsActive: true,
        ...overrides,
      } as Journal;
    }

    it('posts a balanced entry, assigns the sequence reference, and increments the journal counter', async () => {
      const entry = draftEntry();
      const journal = activeJournal();
      manager.findOne.mockImplementation((entity: any) =>
        entity === JournalEntry ? entry : journal,
      );
      manager.save.mockImplementation(async (_entity: any, value: any) => value);

      const result = await service.postEntry(1);

      expect(result.State).toBe(JournalEntryState.Posted);
      expect(result.Reference).toBe('GEN/1');
      expect(result.TotalDebit).toBe('100.0000');
      expect(result.TotalCredit).toBe('100.0000');
      expect(journal.NextSequenceNumber).toBe(2);
      expect(manager.save).toHaveBeenCalledWith(Journal, expect.objectContaining({ NextSequenceNumber: 2 }));
    });

    it('rejects an entry that is not found', async () => {
      manager.findOne.mockResolvedValue(null);

      await expect(service.postEntry(999)).rejects.toThrow(NotFoundException);
    });

    it('rejects an entry that is already posted', async () => {
      manager.findOne.mockResolvedValue(draftEntry({ State: JournalEntryState.Posted }));

      await expect(service.postEntry(1)).rejects.toThrow(ConflictException);
    });

    it('rejects an entry with fewer than two lines', async () => {
      manager.findOne.mockResolvedValue(draftEntry({ Lines: [draftEntry().Lines[0]] }));

      await expect(service.postEntry(1)).rejects.toThrow(BadRequestException);
    });

    it('rejects an unbalanced entry', async () => {
      const entry = draftEntry({
        Lines: [
          { Id: 1, Debit: '100.0000', Credit: '0.0000', Account: activeAccount(10), Tax: null } as JournalEntryLine,
          { Id: 2, Debit: '0.0000', Credit: '99.9900', Account: activeAccount(20), Tax: null } as JournalEntryLine,
        ],
      });
      manager.findOne.mockImplementation((entity: any) => (entity === JournalEntry ? entry : null));

      await expect(service.postEntry(1)).rejects.toThrow(BadRequestException);
    });

    it('rejects an all-zero entry', async () => {
      const entry = draftEntry({
        Lines: [
          { Id: 1, Debit: '0.0000', Credit: '0.0000', Account: activeAccount(10), Tax: null } as JournalEntryLine,
          { Id: 2, Debit: '0.0000', Credit: '0.0000', Account: activeAccount(20), Tax: null } as JournalEntryLine,
        ],
      });
      manager.findOne.mockImplementation((entity: any) => (entity === JournalEntry ? entry : null));

      await expect(service.postEntry(1)).rejects.toThrow(BadRequestException);
    });

    it('rejects a line referencing an inactive account', async () => {
      const entry = draftEntry({
        Lines: [
          {
            Id: 1,
            Debit: '100.0000',
            Credit: '0.0000',
            Account: { ...activeAccount(10), IsActive: false },
            Tax: null,
          } as JournalEntryLine,
          { Id: 2, Debit: '0.0000', Credit: '100.0000', Account: activeAccount(20), Tax: null } as JournalEntryLine,
        ],
      });
      manager.findOne.mockImplementation((entity: any) => (entity === JournalEntry ? entry : null));

      await expect(service.postEntry(1)).rejects.toThrow(BadRequestException);
    });

    it('rejects when the journal itself is inactive', async () => {
      const entry = draftEntry();
      const journal = activeJournal({ IsActive: false });
      manager.findOne.mockImplementation((entity: any) => (entity === JournalEntry ? entry : journal));

      await expect(service.postEntry(1)).rejects.toThrow(BadRequestException);
    });

    it('never lets float-prone amounts slip through the balance check', async () => {
      // 0.1 + 0.2 !== 0.3 under naive float arithmetic; exact minor-unit
      // math must treat this as balanced.
      const entry = draftEntry({
        Lines: [
          { Id: 1, Debit: '0.10', Credit: '0.0000', Account: activeAccount(10), Tax: null } as JournalEntryLine,
          { Id: 2, Debit: '0.20', Credit: '0.0000', Account: activeAccount(20), Tax: null } as JournalEntryLine,
          { Id: 3, Debit: '0.0000', Credit: '0.30', Account: activeAccount(30), Tax: null } as JournalEntryLine,
        ],
      });
      const journal = activeJournal();
      manager.findOne.mockImplementation((entity: any) => (entity === JournalEntry ? entry : journal));
      manager.save.mockImplementation(async (_entity: any, value: any) => value);

      const result = await service.postEntry(1);

      expect(result.State).toBe(JournalEntryState.Posted);
      expect(result.TotalDebit).toBe('0.3000');
      expect(result.TotalCredit).toBe('0.3000');
    });

    it('runs directly against a caller-supplied manager instead of opening a new transaction', async () => {
      const entry = draftEntry();
      const journal = activeJournal();
      const externalManager = {
        findOne: jest.fn((entity: any) => (entity === JournalEntry ? entry : journal)),
        save: jest.fn(async (_entity: any, value: any) => value),
      };

      const result = await service.postEntry(1, externalManager as any);

      expect(result.State).toBe(JournalEntryState.Posted);
      expect(journalEntryRepository.manager.transaction).not.toHaveBeenCalled();
      expect(externalManager.findOne).toHaveBeenCalled();
    });
  });
});
