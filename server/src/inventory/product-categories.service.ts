import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductCategory } from './product-category.entity';
import { Account } from '../finance/entities/account.entity';
import { CreateProductCategoryDto } from './dto/create-product-category.dto';
import { UpdateProductCategoryDto } from './dto/update-product-category.dto';

@Injectable()
export class ProductCategoriesService {
  constructor(
    @InjectRepository(ProductCategory)
    private readonly categoryRepository: Repository<ProductCategory>,
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
  ) {}

  async findAll(includeInactive = false): Promise<ProductCategory[]> {
    return this.categoryRepository.find({
      where: includeInactive ? {} : { IsActive: true },
      relations: { IncomeAccount: true, ExpenseAccount: true },
      order: { Name: 'ASC' },
    });
  }

  async findOne(id: number): Promise<ProductCategory> {
    const category = await this.categoryRepository.findOneBy({ Id: id });
    if (!category) {
      throw new NotFoundException(`Product category ${id} not found`);
    }
    return category;
  }

  async create(dto: CreateProductCategoryDto): Promise<ProductCategory> {
    const existing = await this.categoryRepository.findOneBy({ Name: dto.Name });
    if (existing) {
      throw new ConflictException(`Category name '${dto.Name}' is already in use`);
    }

    const category = this.categoryRepository.create({
      Name: dto.Name,
      Description: dto.Description ?? null,
      IncomeAccount: await this.resolveAccount(dto.IncomeAccountId),
      ExpenseAccount: await this.resolveAccount(dto.ExpenseAccountId),
    });
    return this.categoryRepository.save(category);
  }

  async update(id: number, dto: UpdateProductCategoryDto): Promise<ProductCategory> {
    const category = await this.findOne(id);

    if (dto.Name && dto.Name !== category.Name) {
      const existing = await this.categoryRepository.findOneBy({ Name: dto.Name });
      if (existing) {
        throw new ConflictException(`Category name '${dto.Name}' is already in use`);
      }
      category.Name = dto.Name;
    }
    if (dto.Description !== undefined) {
      category.Description = dto.Description;
    }
    if (dto.IncomeAccountId !== undefined) {
      category.IncomeAccount = await this.resolveAccount(dto.IncomeAccountId);
    }
    if (dto.ExpenseAccountId !== undefined) {
      category.ExpenseAccount = await this.resolveAccount(dto.ExpenseAccountId);
    }

    return this.categoryRepository.save(category);
  }

  async archive(id: number): Promise<ProductCategory> {
    const category = await this.findOne(id);
    category.IsActive = false;
    return this.categoryRepository.save(category);
  }

  private async resolveAccount(accountId?: number): Promise<Account | null> {
    if (accountId === undefined || accountId === null) {
      return null;
    }
    const account = await this.accountRepository.findOneBy({ Id: accountId });
    if (!account || !account.IsActive) {
      throw new BadRequestException(`Account ${accountId} not found or inactive`);
    }
    return account;
  }
}
