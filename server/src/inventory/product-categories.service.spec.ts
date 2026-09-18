import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ProductCategoriesService } from './product-categories.service';
import { ProductCategory } from './product-category.entity';
import { Account } from '../finance/entities/account.entity';

describe('ProductCategoriesService', () => {
  let service: ProductCategoriesService;
  let categoryRepository: jest.Mocked<Repository<ProductCategory>>;
  let accountRepository: jest.Mocked<Repository<Account>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductCategoriesService,
        {
          provide: getRepositoryToken(ProductCategory),
          useValue: { find: jest.fn(), findOneBy: jest.fn(), create: jest.fn(), save: jest.fn() },
        },
        {
          provide: getRepositoryToken(Account),
          useValue: { findOneBy: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<ProductCategoriesService>(ProductCategoriesService);
    categoryRepository = module.get(getRepositoryToken(ProductCategory));
    accountRepository = module.get(getRepositoryToken(Account));
  });

  describe('findAll', () => {
    it('eager-loads IncomeAccount and ExpenseAccount', async () => {
      categoryRepository.find.mockResolvedValue([]);

      await service.findAll();

      expect(categoryRepository.find).toHaveBeenCalledWith({
        where: { IsActive: true },
        relations: { IncomeAccount: true, ExpenseAccount: true },
        order: { Name: 'ASC' },
      });
    });
  });

  describe('create', () => {
    it('creates a category with no accounts set', async () => {
      categoryRepository.findOneBy.mockResolvedValue(null);
      const created: Partial<ProductCategory> = { Name: 'Software' };
      categoryRepository.create.mockReturnValue(created as ProductCategory);
      categoryRepository.save.mockResolvedValue({ Id: 1, ...created } as ProductCategory);

      const result = await service.create({ Name: 'Software' });

      expect(categoryRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ Name: 'Software', IncomeAccount: null, ExpenseAccount: null }),
      );
      expect(result.Id).toBe(1);
      expect(accountRepository.findOneBy).not.toHaveBeenCalled();
    });

    it('rejects a duplicate name', async () => {
      categoryRepository.findOneBy.mockResolvedValue({ Id: 1 } as ProductCategory);

      await expect(service.create({ Name: 'Software' })).rejects.toThrow(ConflictException);
    });

    it('rejects an inactive income account', async () => {
      categoryRepository.findOneBy.mockResolvedValue(null);
      accountRepository.findOneBy.mockResolvedValue({ Id: 5, IsActive: false } as Account);

      await expect(
        service.create({ Name: 'Software', IncomeAccountId: 5 }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('archive', () => {
    it('sets IsActive to false rather than deleting', async () => {
      categoryRepository.findOneBy.mockResolvedValue({ Id: 1, IsActive: true } as ProductCategory);
      categoryRepository.save.mockImplementation(async (c) => c as ProductCategory);

      const result = await service.archive(1);

      expect(result.IsActive).toBe(false);
    });

    it('throws when the category does not exist', async () => {
      categoryRepository.findOneBy.mockResolvedValue(null);

      await expect(service.archive(999)).rejects.toThrow(NotFoundException);
    });
  });
});
