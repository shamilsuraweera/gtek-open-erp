import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { AccountsService } from './accounts.service';
import { Account } from './entities/account.entity';
import { AccountType } from './finance.enums';

describe('AccountsService', () => {
  let service: AccountsService;
  let repository: jest.Mocked<Repository<Account>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountsService,
        {
          provide: getRepositoryToken(Account),
          useValue: {
            find: jest.fn(),
            findOneBy: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AccountsService>(AccountsService);
    repository = module.get(getRepositoryToken(Account));
  });

  describe('create', () => {
    it('creates an account with no parent', async () => {
      repository.findOneBy.mockResolvedValue(null);
      const created: Partial<Account> = { Code: '1000', Name: 'Cash', Type: AccountType.Asset };
      repository.create.mockReturnValue(created as Account);
      repository.save.mockResolvedValue({ Id: 1, ...created } as Account);

      const result = await service.create({ Code: '1000', Name: 'Cash', Type: AccountType.Asset });

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ Code: '1000', Parent: null }),
      );
      expect(result.Id).toBe(1);
    });

    it('rejects a duplicate code', async () => {
      repository.findOneBy.mockResolvedValue({ Id: 1 } as Account);

      await expect(
        service.create({ Code: '1000', Name: 'Cash', Type: AccountType.Asset }),
      ).rejects.toThrow(ConflictException);
    });

    it('rejects a parent that does not exist', async () => {
      repository.findOneBy.mockResolvedValue(null);

      await expect(
        service.create({ Code: '1100', Name: 'Bank', Type: AccountType.Asset, ParentId: 999 }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('archive', () => {
    it('sets IsActive to false rather than deleting', async () => {
      const account = { Id: 1, IsActive: true } as Account;
      repository.findOneBy.mockResolvedValue(account);
      repository.save.mockImplementation(async (a) => a as Account);

      const result = await service.archive(1);

      expect(result.IsActive).toBe(false);
      expect(repository.save).toHaveBeenCalledWith(expect.objectContaining({ IsActive: false }));
    });

    it('throws when the account does not exist', async () => {
      repository.findOneBy.mockResolvedValue(null);

      await expect(service.archive(999)).rejects.toThrow(NotFoundException);
    });
  });
});
