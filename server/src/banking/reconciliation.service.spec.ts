import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ReconciliationService } from './reconciliation.service';
import { BankStatementLine } from './bank-statement-line.entity';
import { JournalEntryLine } from '../finance/entities/journal-entry-line.entity';
import { JournalEntryState } from '../finance/finance.enums';

function createQueryBuilderMock(result: unknown[]) {
  const qb: any = {};
  ['innerJoinAndSelect', 'innerJoin', 'leftJoin', 'where', 'andWhere', 'orderBy'].forEach((method) => {
    qb[method] = jest.fn().mockReturnValue(qb);
  });
  qb.getMany = jest.fn().mockResolvedValue(result);
  return qb;
}

describe('ReconciliationService', () => {
  let service: ReconciliationService;
  let bankStatementLineRepository: jest.Mocked<Repository<BankStatementLine>>;
  let journalEntryLineRepository: jest.Mocked<Repository<JournalEntryLine>>;
  let manager: { findOne: jest.Mock; save: jest.Mock };

  beforeEach(async () => {
    manager = { findOne: jest.fn(), save: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReconciliationService,
        {
          provide: getRepositoryToken(BankStatementLine),
          useValue: {
            createQueryBuilder: jest.fn(),
            manager: { transaction: jest.fn((cb: any) => cb(manager)) },
          },
        },
        {
          provide: getRepositoryToken(JournalEntryLine),
          useValue: { createQueryBuilder: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<ReconciliationService>(ReconciliationService);
    bankStatementLineRepository = module.get(getRepositoryToken(BankStatementLine));
    journalEntryLineRepository = module.get(getRepositoryToken(JournalEntryLine));
  });

  describe('getUnreconciledBankLines', () => {
    it('filters by account and IsReconciled = false', async () => {
      const qb = createQueryBuilderMock([{ Id: 1 }]);
      bankStatementLineRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getUnreconciledBankLines(1);

      expect(qb.where).toHaveBeenCalledWith('account.Id = :accountId', { accountId: 1 });
      expect(qb.andWhere).toHaveBeenCalledWith('line.IsReconciled = :isReconciled', { isReconciled: false });
      expect(result).toEqual([{ Id: 1 }]);
    });
  });

  describe('getUnreconciledLedgerLines', () => {
    it('filters by account, Posted state, and no existing match', async () => {
      const qb = createQueryBuilderMock([{ Id: 2 }]);
      journalEntryLineRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getUnreconciledLedgerLines(1);

      expect(qb.where).toHaveBeenCalledWith('account.Id = :accountId', { accountId: 1 });
      expect(qb.andWhere).toHaveBeenCalledWith('entry.State = :state', { state: JournalEntryState.Posted });
      expect(qb.andWhere).toHaveBeenCalledWith('bsl.Id IS NULL');
      expect(result).toEqual([{ Id: 2 }]);
    });
  });

  describe('match', () => {
    const bankLine = (amount: string, overrides: Partial<BankStatementLine> = {}): BankStatementLine =>
      ({ Id: 1, Amount: amount, IsReconciled: false, ...overrides }) as BankStatementLine;
    const journalLine = (debit: string, credit: string): JournalEntryLine =>
      ({ Id: 2, Debit: debit, Credit: credit }) as JournalEntryLine;

    it('matches a deposit (positive Amount) against an equal ledger Debit', async () => {
      manager.findOne.mockImplementation((entity: any, options: any) => {
        if (entity === BankStatementLine && options.where.Id) return bankLine('250.5000');
        if (entity === BankStatementLine) return null; // existingMatch check
        if (entity === JournalEntryLine) return journalLine('250.5000', '0.0000');
        return null;
      });
      manager.save.mockImplementation(async (_entity: any, v: any) => v);

      const result = await service.match(1, 2);

      expect(result.IsReconciled).toBe(true);
      expect(result.MatchedJournalEntryLine).toEqual(journalLine('250.5000', '0.0000'));
    });

    it('matches a withdrawal (negative Amount) against an equal ledger Credit', async () => {
      manager.findOne.mockImplementation((entity: any, options: any) => {
        if (entity === BankStatementLine && options.where.Id) return bankLine('-75.2500');
        if (entity === BankStatementLine) return null;
        if (entity === JournalEntryLine) return journalLine('0.0000', '75.2500');
        return null;
      });
      manager.save.mockImplementation(async (_entity: any, v: any) => v);

      const result = await service.match(1, 2);

      expect(result.IsReconciled).toBe(true);
    });

    it('rejects a deposit matched against the wrong side (a Credit instead of a Debit)', async () => {
      manager.findOne.mockImplementation((entity: any, options: any) => {
        if (entity === BankStatementLine && options.where.Id) return bankLine('250.5000');
        if (entity === BankStatementLine) return null;
        if (entity === JournalEntryLine) return journalLine('0.0000', '250.5000');
        return null;
      });

      await expect(service.match(1, 2)).rejects.toThrow(BadRequestException);
    });

    it('rejects a withdrawal matched against the wrong side (a Debit instead of a Credit)', async () => {
      manager.findOne.mockImplementation((entity: any, options: any) => {
        if (entity === BankStatementLine && options.where.Id) return bankLine('-75.2500');
        if (entity === BankStatementLine) return null;
        if (entity === JournalEntryLine) return journalLine('75.2500', '0.0000');
        return null;
      });

      await expect(service.match(1, 2)).rejects.toThrow(BadRequestException);
    });

    it('rejects an amount that does not match exactly', async () => {
      manager.findOne.mockImplementation((entity: any, options: any) => {
        if (entity === BankStatementLine && options.where.Id) return bankLine('250.5000');
        if (entity === BankStatementLine) return null;
        if (entity === JournalEntryLine) return journalLine('250.4900', '0.0000');
        return null;
      });

      await expect(service.match(1, 2)).rejects.toThrow(BadRequestException);
    });

    it('rejects when the bank line is already reconciled', async () => {
      manager.findOne.mockResolvedValue(bankLine('250.5000', { IsReconciled: true }));

      await expect(service.match(1, 2)).rejects.toThrow(ConflictException);
    });

    it('rejects when the ledger line is already matched by another bank line', async () => {
      manager.findOne.mockImplementation((entity: any, options: any) => {
        if (entity === BankStatementLine && options.where.Id) return bankLine('250.5000');
        if (entity === JournalEntryLine) return journalLine('250.5000', '0.0000');
        if (entity === BankStatementLine) return { Id: 99 } as BankStatementLine; // existingMatch found
        return null;
      });

      await expect(service.match(1, 2)).rejects.toThrow(ConflictException);
    });

    it('rejects when the bank line does not exist', async () => {
      manager.findOne.mockResolvedValue(null);

      await expect(service.match(999, 2)).rejects.toThrow(NotFoundException);
    });

    it('rejects when the journal line does not exist', async () => {
      manager.findOne.mockImplementation((entity: any, options: any) => {
        if (entity === BankStatementLine && options.where.Id) return bankLine('250.5000');
        if (entity === BankStatementLine) return null;
        return null;
      });

      await expect(service.match(1, 999)).rejects.toThrow(NotFoundException);
    });
  });
});
