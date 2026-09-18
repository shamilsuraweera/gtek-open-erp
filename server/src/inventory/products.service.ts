import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';
import { ProductCategory } from './product-category.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
// Reused from the Finance module rather than duplicated: both modules live
// in the same server package (unlike the client, which genuinely can't
// share code with the server), so there's no reason for Inventory to carry
// its own copy of this exact-decimal logic.
import { fromMinorUnits, toMinorUnits } from '../finance/utils/money';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductCategory)
    private readonly categoryRepository: Repository<ProductCategory>,
  ) {}

  async findAll(includeInactive = false): Promise<Product[]> {
    return this.productRepository.find({
      where: includeInactive ? {} : { IsActive: true },
      relations: { Category: true },
      order: { SKU: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.productRepository.findOneBy({ Id: id });
    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }
    return product;
  }

  async create(dto: CreateProductDto): Promise<Product> {
    const existing = await this.productRepository.findOneBy({ SKU: dto.SKU });
    if (existing) {
      throw new ConflictException(`SKU '${dto.SKU}' is already in use`);
    }

    const category = await this.resolveCategory(dto.CategoryId);

    const product = this.productRepository.create({
      Name: dto.Name,
      SKU: dto.SKU,
      Type: dto.Type,
      Category: category,
      SalePrice: fromMinorUnits(toMinorUnits(dto.SalePrice)),
      CostPrice: fromMinorUnits(toMinorUnits(dto.CostPrice)),
    });
    return this.productRepository.save(product);
  }

  async update(id: number, dto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);

    if (dto.SKU && dto.SKU !== product.SKU) {
      const existing = await this.productRepository.findOneBy({ SKU: dto.SKU });
      if (existing) {
        throw new ConflictException(`SKU '${dto.SKU}' is already in use`);
      }
      product.SKU = dto.SKU;
    }
    if (dto.Name !== undefined) {
      product.Name = dto.Name;
    }
    if (dto.Type !== undefined) {
      product.Type = dto.Type;
    }
    if (dto.SalePrice !== undefined) {
      product.SalePrice = fromMinorUnits(toMinorUnits(dto.SalePrice));
    }
    if (dto.CostPrice !== undefined) {
      product.CostPrice = fromMinorUnits(toMinorUnits(dto.CostPrice));
    }
    if (dto.CategoryId !== undefined) {
      product.Category = await this.resolveCategory(dto.CategoryId);
    }

    return this.productRepository.save(product);
  }

  async archive(id: number): Promise<Product> {
    const product = await this.findOne(id);
    product.IsActive = false;
    return this.productRepository.save(product);
  }

  private async resolveCategory(categoryId: number): Promise<ProductCategory> {
    const category = await this.categoryRepository.findOneBy({ Id: categoryId });
    if (!category || !category.IsActive) {
      throw new BadRequestException(`Category ${categoryId} not found or inactive`);
    }
    return category;
  }
}
