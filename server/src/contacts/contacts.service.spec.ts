import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ContactsService } from './contacts.service';
import { Contact } from './contact.entity';
import { Account } from '../finance/entities/account.entity';

describe('ContactsService', () => {
  let service: ContactsService;
  let contactRepository: jest.Mocked<Repository<Contact>>;
  let accountRepository: jest.Mocked<Repository<Account>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContactsService,
        {
          provide: getRepositoryToken(Contact),
          useValue: { find: jest.fn(), findOneBy: jest.fn(), create: jest.fn(), save: jest.fn() },
        },
        {
          provide: getRepositoryToken(Account),
          useValue: { findOneBy: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<ContactsService>(ContactsService);
    contactRepository = module.get(getRepositoryToken(Contact));
    accountRepository = module.get(getRepositoryToken(Account));
  });

  describe('findAll', () => {
    it('eager-loads AccountsReceivable and AccountsPayable', async () => {
      contactRepository.find.mockResolvedValue([]);

      await service.findAll();

      expect(contactRepository.find).toHaveBeenCalledWith({
        where: { IsActive: true },
        relations: { AccountsReceivable: true, AccountsPayable: true },
        order: { Name: 'ASC' },
      });
    });
  });

  describe('create', () => {
    it('defaults IsCustomer to true and IsVendor to false when omitted', async () => {
      const created: Partial<Contact> = { Name: 'Acme Corp' };
      contactRepository.create.mockReturnValue(created as Contact);
      contactRepository.save.mockResolvedValue({ Id: 1, ...created } as Contact);

      await service.create({ Name: 'Acme Corp' });

      expect(contactRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ IsCustomer: true, IsVendor: false }),
      );
      expect(accountRepository.findOneBy).not.toHaveBeenCalled();
    });

    it('rejects an inactive AccountsReceivable account', async () => {
      accountRepository.findOneBy.mockResolvedValue({ Id: 9, IsActive: false } as Account);

      await expect(
        service.create({ Name: 'Acme Corp', AccountsReceivableId: 9 }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('archive', () => {
    it('sets IsActive to false rather than deleting', async () => {
      contactRepository.findOneBy.mockResolvedValue({ Id: 1, IsActive: true } as Contact);
      contactRepository.save.mockImplementation(async (c) => c as Contact);

      const result = await service.archive(1);

      expect(result.IsActive).toBe(false);
    });

    it('throws when the contact does not exist', async () => {
      contactRepository.findOneBy.mockResolvedValue(null);

      await expect(service.archive(999)).rejects.toThrow(NotFoundException);
    });
  });
});
