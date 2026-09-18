import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { JournalsService } from './journals.service';
import { Journal } from './entities/journal.entity';
import { Account } from './entities/account.entity';
import { JournalType } from './finance.enums';

describe('JournalsService', () => {
  let service: JournalsService;
  let journalRepository: jest.Mocked<Repository<Journal>>;
  let accountRepository: jest.Mocked<Repository<Account>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JournalsService,
        {
          provide: getRepositoryToken(Journal),
          useValue: { findOneBy: jest.fn(), create: jest.fn(), save: jest.fn() },
        },
        {
          provide: getRepositoryToken(Account),
          useValue: { findOneBy: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<JournalsService>(JournalsService);
    journalRepository = module.get(getRepositoryToken(Journal));
    accountRepository = module.get(getRepositoryToken(Account));
  });

  describe('create', () => {
    it('creates a journal with no default account', async () => {
      journalRepository.findOneBy.mockResolvedValue(null);
      const created: Partial<Journal> = { Code: 'SAL', Name: 'Sales', Type: JournalType.Sales };
      journalRepository.create.mockReturnValue(created as Journal);
      journalRepository.save.mockResolvedValue({ Id: 1, ...created } as Journal);

      const result = await service.create({ Code: 'SAL', Name: 'Sales', Type: JournalType.Sales });

      expect(result.Id).toBe(1);
      expect(accountRepository.findOneBy).not.toHaveBeenCalled();
    });

    it('rejects a duplicate code', async () => {
      journalRepository.findOneBy.mockResolvedValue({ Id: 1 } as Journal);

      await expect(
        service.create({ Code: 'SAL', Name: 'Sales', Type: JournalType.Sales }),
      ).rejects.toThrow(ConflictException);
    });

    it('rejects an inactive default account', async () => {
      journalRepository.findOneBy.mockResolvedValue(null);
      accountRepository.findOneBy.mockResolvedValue({ Id: 5, IsActive: false } as Account);

      await expect(
        service.create({
          Code: 'BNK1',
          Name: 'Bank',
          Type: JournalType.Bank,
          DefaultAccountId: 5,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('archive', () => {
    it('sets IsActive to false', async () => {
      journalRepository.findOneBy.mockResolvedValue({ Id: 1, IsActive: true } as Journal);
      journalRepository.save.mockImplementation(async (j) => j as Journal);

      const result = await service.archive(1);

      expect(result.IsActive).toBe(false);
    });

    it('throws when the journal does not exist', async () => {
      journalRepository.findOneBy.mockResolvedValue(null);

      await expect(service.archive(999)).rejects.toThrow(NotFoundException);
    });
  });
});
