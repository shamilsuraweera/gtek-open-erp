import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { TaxesService } from './taxes.service';
import { Tax } from './entities/tax.entity';
import { Account } from './entities/account.entity';
import { TaxAmountType, TaxScope } from './finance.enums';

describe('TaxesService', () => {
  let service: TaxesService;
  let taxRepository: jest.Mocked<Repository<Tax>>;
  let accountRepository: jest.Mocked<Repository<Account>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaxesService,
        {
          provide: getRepositoryToken(Tax),
          useValue: { findOneBy: jest.fn(), create: jest.fn(), save: jest.fn() },
        },
        {
          provide: getRepositoryToken(Account),
          useValue: { findOneBy: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<TaxesService>(TaxesService);
    taxRepository = module.get(getRepositoryToken(Tax));
    accountRepository = module.get(getRepositoryToken(Account));
  });

  describe('create', () => {
    it('normalizes the amount to 4 decimal places via exact minor-unit math', async () => {
      taxRepository.findOneBy.mockResolvedValue(null);
      accountRepository.findOneBy.mockResolvedValue({ Id: 9, IsActive: true } as Account);
      const created: Partial<Tax> = {};
      taxRepository.create.mockReturnValue(created as Tax);
      taxRepository.save.mockImplementation(async (t) => t as Tax);

      await service.create({
        Name: 'VAT 15%',
        Code: 'VAT15',
        AmountType: TaxAmountType.Percentage,
        Amount: '15',
        Scope: TaxScope.Sales,
        TaxAccountId: 9,
      });

      expect(taxRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ Amount: '15.0000' }),
      );
    });

    it('rejects a duplicate code', async () => {
      taxRepository.findOneBy.mockResolvedValue({ Id: 1 } as Tax);

      await expect(
        service.create({
          Name: 'VAT 15%',
          Code: 'VAT15',
          AmountType: TaxAmountType.Percentage,
          Amount: '15',
          Scope: TaxScope.Sales,
          TaxAccountId: 9,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('rejects a tax account that does not exist', async () => {
      taxRepository.findOneBy.mockResolvedValue(null);
      accountRepository.findOneBy.mockResolvedValue(null);

      await expect(
        service.create({
          Name: 'VAT 15%',
          Code: 'VAT15',
          AmountType: TaxAmountType.Percentage,
          Amount: '15',
          Scope: TaxScope.Sales,
          TaxAccountId: 999,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
