import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { BankStatementsService } from './bank-statements.service';
import { BankStatement } from './bank-statement.entity';
import { Account } from '../finance/entities/account.entity';

describe('BankStatementsService', () => {
  let service: BankStatementsService;
  let bankStatementRepository: jest.Mocked<Repository<BankStatement>>;
  let accountRepository: jest.Mocked<Repository<Account>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BankStatementsService,
        {
          provide: getRepositoryToken(BankStatement),
          useValue: { find: jest.fn(), findOne: jest.fn(), create: jest.fn(), save: jest.fn() },
        },
        {
          provide: getRepositoryToken(Account),
          useValue: { findOneBy: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<BankStatementsService>(BankStatementsService);
    bankStatementRepository = module.get(getRepositoryToken(BankStatement));
    accountRepository = module.get(getRepositoryToken(Account));
  });

  describe('createDraft', () => {
    it('computes EndingBalance as StartingBalance plus the sum of signed line amounts', async () => {
      accountRepository.findOneBy.mockResolvedValue({ Id: 1, IsActive: true } as Account);
      bankStatementRepository.create.mockImplementation((v) => v as BankStatement);
      bankStatementRepository.save.mockImplementation(async (s) => s as BankStatement);

      const result = await service.createDraft({
        AccountId: 1,
        StatementDate: '2026-02-01',
        Reference: 'STMT-FEB',
        StartingBalance: '1000',
        Lines: [
          { Date: '2026-02-02', Description: 'Deposit', Amount: '250.50' },
          { Date: '2026-02-03', Description: 'Withdrawal', Amount: '-75.25' },
        ],
      });

      // 1000 + 250.50 - 75.25 = 1175.25 exactly.
      expect(result.EndingBalance).toBe('1175.2500');
      expect(result.StartingBalance).toBe('1000.0000');
      expect(result.Lines[0].Amount).toBe('250.5000');
      expect(result.Lines[1].Amount).toBe('-75.2500');
    });

    it('rejects an inactive account', async () => {
      accountRepository.findOneBy.mockResolvedValue({ Id: 1, IsActive: false } as Account);

      await expect(
        service.createDraft({
          AccountId: 1,
          StatementDate: '2026-02-01',
          Reference: 'STMT-FEB',
          StartingBalance: '1000',
          Lines: [{ Date: '2026-02-02', Description: 'Deposit', Amount: '100' }],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects a zero-amount line', async () => {
      accountRepository.findOneBy.mockResolvedValue({ Id: 1, IsActive: true } as Account);

      await expect(
        service.createDraft({
          AccountId: 1,
          StatementDate: '2026-02-01',
          Reference: 'STMT-FEB',
          StartingBalance: '1000',
          Lines: [{ Date: '2026-02-02', Description: 'Nothing', Amount: '0' }],
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
