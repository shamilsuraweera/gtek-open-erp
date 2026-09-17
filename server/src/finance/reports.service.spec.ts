import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ReportsService } from './reports.service';
import { JournalEntryLine } from './entities/journal-entry-line.entity';
import { Account } from './entities/account.entity';
import { JournalEntry } from './entities/journal-entry.entity';
import { AccountType, JournalEntryState } from './finance.enums';

function createQueryBuilderMock(result: unknown[]) {
  const qb: any = {};
  ['innerJoin', 'select', 'addSelect', 'where', 'groupBy', 'addGroupBy', 'orderBy'].forEach((method) => {
    qb[method] = jest.fn().mockReturnValue(qb);
  });
  qb.getRawMany = jest.fn().mockResolvedValue(result);
  return qb;
}

describe('ReportsService', () => {
  let service: ReportsService;
  let lineRepository: jest.Mocked<Repository<JournalEntryLine>>;
  let accountRepository: jest.Mocked<Repository<Account>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: getRepositoryToken(JournalEntryLine),
          useValue: { createQueryBuilder: jest.fn(), find: jest.fn() },
        },
        {
          provide: getRepositoryToken(Account),
          useValue: { findOneBy: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    lineRepository = module.get(getRepositoryToken(JournalEntryLine));
    accountRepository = module.get(getRepositoryToken(Account));
  });

  describe('getTrialBalance', () => {
    it('filters to posted entries only and returns formatted totals', async () => {
      const qb = createQueryBuilderMock([
        {
          accountId: 1,
          accountCode: '1000',
          accountName: 'Cash',
          accountType: AccountType.Asset,
          totalDebit: 150.5,
          totalCredit: 50,
        },
      ]);
      lineRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getTrialBalance();

      expect(qb.where).toHaveBeenCalledWith('entry.State = :state', {
        state: JournalEntryState.Posted,
      });
      expect(result).toEqual([
        {
          accountId: 1,
          accountCode: '1000',
          accountName: 'Cash',
          accountType: AccountType.Asset,
          totalDebit: '150.5000',
          totalCredit: '50.0000',
        },
      ]);
    });

    it('defaults a null aggregate (no rows for a group) to zero', async () => {
      const qb = createQueryBuilderMock([
        {
          accountId: 2,
          accountCode: '2000',
          accountName: 'Accounts Payable',
          accountType: AccountType.Liability,
          totalDebit: null,
          totalCredit: null,
        },
      ]);
      lineRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getTrialBalance();

      expect(result[0].totalDebit).toBe('0.0000');
      expect(result[0].totalCredit).toBe('0.0000');
    });
  });

  describe('getGeneralLedger', () => {
    it('throws when the account does not exist', async () => {
      accountRepository.findOneBy.mockResolvedValue(null);

      await expect(service.getGeneralLedger(999)).rejects.toThrow(NotFoundException);
    });

    it('computes a debit-normal running balance for an Asset account', async () => {
      accountRepository.findOneBy.mockResolvedValue({ Id: 1, Type: AccountType.Asset } as Account);
      lineRepository.find.mockResolvedValue([
        {
          Id: 1,
          Debit: '100.0000',
          Credit: '0.0000',
          Description: 'Opening balance',
          JournalEntry: { Id: 10, Reference: 'GEN/1', EntryDate: '2026-01-01' } as JournalEntry,
        } as JournalEntryLine,
        {
          Id: 2,
          Debit: '0.0000',
          Credit: '40.0000',
          Description: 'Payment',
          JournalEntry: { Id: 11, Reference: 'GEN/2', EntryDate: '2026-01-02' } as JournalEntry,
        } as JournalEntryLine,
      ]);

      const result = await service.getGeneralLedger(1);

      expect(result).toEqual([
        expect.objectContaining({ lineId: 1, runningBalance: '100.0000' }),
        expect.objectContaining({ lineId: 2, runningBalance: '60.0000' }),
      ]);
    });

    it('computes a credit-normal running balance for a Liability account', async () => {
      accountRepository.findOneBy.mockResolvedValue({ Id: 2, Type: AccountType.Liability } as Account);
      lineRepository.find.mockResolvedValue([
        {
          Id: 1,
          Debit: '0.0000',
          Credit: '200.0000',
          Description: 'Invoice received',
          JournalEntry: { Id: 20, Reference: 'PUR/1', EntryDate: '2026-01-01' } as JournalEntry,
        } as JournalEntryLine,
        {
          Id: 2,
          Debit: '50.0000',
          Credit: '0.0000',
          Description: 'Partial payment',
          JournalEntry: { Id: 21, Reference: 'BNK/1', EntryDate: '2026-01-05' } as JournalEntry,
        } as JournalEntryLine,
      ]);

      const result = await service.getGeneralLedger(2);

      expect(result).toEqual([
        expect.objectContaining({ runningBalance: '200.0000' }),
        expect.objectContaining({ runningBalance: '150.0000' }),
      ]);
    });

    it('never lets float-prone amounts drift the running balance', async () => {
      // 0.1 + 0.2 !== 0.3 under naive float arithmetic.
      accountRepository.findOneBy.mockResolvedValue({ Id: 1, Type: AccountType.Asset } as Account);
      lineRepository.find.mockResolvedValue([
        {
          Id: 1,
          Debit: '0.10',
          Credit: '0.0000',
          Description: null,
          JournalEntry: { Id: 1, Reference: 'GEN/1', EntryDate: '2026-01-01' } as JournalEntry,
        } as JournalEntryLine,
        {
          Id: 2,
          Debit: '0.20',
          Credit: '0.0000',
          Description: null,
          JournalEntry: { Id: 2, Reference: 'GEN/2', EntryDate: '2026-01-02' } as JournalEntry,
        } as JournalEntryLine,
      ]);

      const result = await service.getGeneralLedger(1);

      expect(result[1].runningBalance).toBe('0.3000');
    });

    it('queries only posted lines for the requested account, ordered by entry date', async () => {
      accountRepository.findOneBy.mockResolvedValue({ Id: 1, Type: AccountType.Asset } as Account);
      lineRepository.find.mockResolvedValue([]);

      await service.getGeneralLedger(1);

      expect(lineRepository.find).toHaveBeenCalledWith({
        where: {
          Account: { Id: 1 },
          JournalEntry: { State: JournalEntryState.Posted },
        },
        relations: { JournalEntry: true },
        order: { JournalEntry: { EntryDate: 'ASC' }, Id: 'ASC' },
      });
    });
  });
});
