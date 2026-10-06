import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tax } from './entities/tax.entity';
import { Account } from './entities/account.entity';
import { CreateTaxDto } from './dto/create-tax.dto';
import { UpdateTaxDto } from './dto/update-tax.dto';
import { fromMinorUnits, toMinorUnits } from './utils/money';

@Injectable()
export class TaxesService {
  constructor(
    @InjectRepository(Tax)
    private readonly taxRepository: Repository<Tax>,
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
  ) {}

  async findAll(includeInactive = false): Promise<Tax[]> {
    return this.taxRepository.find({
      where: includeInactive ? {} : { IsActive: true },
      relations: { TaxAccount: true },
      order: { Code: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Tax> {
    const tax = await this.taxRepository.findOneBy({ Id: id });
    if (!tax) {
      throw new NotFoundException(`Tax ${id} not found`);
    }
    return tax;
  }

  async create(dto: CreateTaxDto): Promise<Tax> {
    const existing = await this.taxRepository.findOneBy({ Code: dto.Code });
    if (existing) {
      throw new ConflictException(`Tax code '${dto.Code}' is already in use`);
    }

    const taxAccount = await this.resolveTaxAccount(dto.TaxAccountId);

    const tax = this.taxRepository.create({
      Name: dto.Name,
      Code: dto.Code,
      AmountType: dto.AmountType,
      Amount: fromMinorUnits(toMinorUnits(dto.Amount)),
      Scope: dto.Scope,
      TaxAccount: taxAccount,
      IsPriceIncluded: dto.IsPriceIncluded ?? false,
    });
    return this.taxRepository.save(tax);
  }

  async update(id: number, dto: UpdateTaxDto): Promise<Tax> {
    const tax = await this.findOne(id);

    if (dto.Code && dto.Code !== tax.Code) {
      const existing = await this.taxRepository.findOneBy({ Code: dto.Code });
      if (existing) {
        throw new ConflictException(`Tax code '${dto.Code}' is already in use`);
      }
      tax.Code = dto.Code;
    }
    if (dto.Name !== undefined) tax.Name = dto.Name;
    if (dto.AmountType !== undefined) tax.AmountType = dto.AmountType;
    if (dto.Amount !== undefined) tax.Amount = fromMinorUnits(toMinorUnits(dto.Amount));
    if (dto.Scope !== undefined) tax.Scope = dto.Scope;
    if (dto.IsPriceIncluded !== undefined) tax.IsPriceIncluded = dto.IsPriceIncluded;
    if (dto.TaxAccountId !== undefined) {
      tax.TaxAccount = await this.resolveTaxAccount(dto.TaxAccountId);
    }

    return this.taxRepository.save(tax);
  }

  async archive(id: number): Promise<Tax> {
    const tax = await this.findOne(id);
    tax.IsActive = false;
    return this.taxRepository.save(tax);
  }

  private async resolveTaxAccount(accountId: number): Promise<Account> {
    const account = await this.accountRepository.findOneBy({ Id: accountId });
    if (!account || !account.IsActive) {
      throw new BadRequestException(`Tax account ${accountId} not found or inactive`);
    }
    return account;
  }
}
