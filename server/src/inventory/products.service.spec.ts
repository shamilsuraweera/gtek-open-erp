import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ProductsService } from './products.service';
import { Product } from './product.entity';
import { ProductCategory } from './product-category.entity';
import { ProductType } from './inventory.enums';

describe('ProductsService', () => {
  let service: ProductsService;
  let productRepository: jest.Mocked<Repository<Product>>;
  let categoryRepository: jest.Mocked<Repository<ProductCategory>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getRepositoryToken(Product),
          useValue: { find: jest.fn(), findOneBy: jest.fn(), create: jest.fn(), save: jest.fn() },
        },
        {
          provide: getRepositoryToken(ProductCategory),
          useValue: { findOneBy: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    productRepository = module.get(getRepositoryToken(Product));
    categoryRepository = module.get(getRepositoryToken(ProductCategory));
  });

  describe('findAll', () => {
    it('eager-loads Category', async () => {
      productRepository.find.mockResolvedValue([]);

      await service.findAll();

      expect(productRepository.find).toHaveBeenCalledWith({
        where: { IsActive: true },
        relations: { Category: true },
        order: { SKU: 'ASC' },
      });
    });
  });

  describe('create', () => {
    it('creates a product and normalizes prices to 4 decimal places', async () => {
      productRepository.findOneBy.mockResolvedValue(null);
      categoryRepository.findOneBy.mockResolvedValue({ Id: 1, IsActive: true } as ProductCategory);
      const created: Partial<Product> = {};
      productRepository.create.mockReturnValue(created as Product);
      productRepository.save.mockImplementation(async (p) => p as Product);

      await service.create({
        Name: 'Widget',
        SKU: 'WID-1',
        Type: ProductType.Storable,
        CategoryId: 1,
        SalePrice: '19.99',
        CostPrice: '10',
      });

      expect(productRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ SalePrice: '19.9900', CostPrice: '10.0000' }),
      );
    });

    it('rejects a duplicate SKU', async () => {
      productRepository.findOneBy.mockResolvedValue({ Id: 1 } as Product);

      await expect(
        service.create({
          Name: 'Widget',
          SKU: 'WID-1',
          Type: ProductType.Storable,
          CategoryId: 1,
          SalePrice: '10',
          CostPrice: '5',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('rejects a category that does not exist or is inactive', async () => {
      productRepository.findOneBy.mockResolvedValue(null);
      categoryRepository.findOneBy.mockResolvedValue(null);

      await expect(
        service.create({
          Name: 'Widget',
          SKU: 'WID-1',
          Type: ProductType.Storable,
          CategoryId: 999,
          SalePrice: '10',
          CostPrice: '5',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('archive', () => {
    it('sets IsActive to false rather than deleting', async () => {
      productRepository.findOneBy.mockResolvedValue({ Id: 1, IsActive: true } as Product);
      productRepository.save.mockImplementation(async (p) => p as Product);

      const result = await service.archive(1);

      expect(result.IsActive).toBe(false);
    });

    it('throws when the product does not exist', async () => {
      productRepository.findOneBy.mockResolvedValue(null);

      await expect(service.archive(999)).rejects.toThrow(NotFoundException);
    });
  });
});
