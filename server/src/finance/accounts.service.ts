import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from './entities/account.entity';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
  ) {}

  async findAll(includeInactive = false): Promise<Account[]> {
    return this.accountRepository.find({
      where: includeInactive ? {} : { IsActive: true },
      relations: { Parent: true },
      order: { Code: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Account> {
    const account = await this.accountRepository.findOneBy({ Id: id });
    if (!account) {
      throw new NotFoundException(`Account ${id} not found`);
    }
    return account;
  }

  async create(dto: CreateAccountDto): Promise<Account> {
    const existing = await this.accountRepository.findOneBy({ Code: dto.Code });
    if (existing) {
      throw new ConflictException(`Account code '${dto.Code}' is already in use`);
    }

    const parent = await this.resolveParent(dto.ParentId);

    const account = this.accountRepository.create({
      Code: dto.Code,
      Name: dto.Name,
      Type: dto.Type,
      Parent: parent,
    });
    return this.accountRepository.save(account);
  }

  async update(id: number, dto: UpdateAccountDto): Promise<Account> {
    const account = await this.findOne(id);

    if (dto.Code && dto.Code !== account.Code) {
      const existing = await this.accountRepository.findOneBy({ Code: dto.Code });
      if (existing) {
        throw new ConflictException(`Account code '${dto.Code}' is already in use`);
      }
      account.Code = dto.Code;
    }
    if (dto.Name !== undefined) account.Name = dto.Name;
    if (dto.Type !== undefined) account.Type = dto.Type;
    if (dto.ParentId !== undefined) {
      account.Parent = await this.resolveParent(dto.ParentId, id);
    }

    return this.accountRepository.save(account);
  }

  async archive(id: number): Promise<Account> {
    const account = await this.findOne(id);
    account.IsActive = false;
    return this.accountRepository.save(account);
  }

  private async resolveParent(parentId?: number, selfId?: number): Promise<Account | null> {
    if (parentId === undefined || parentId === null) {
      return null;
    }
    if (parentId === selfId) {
      throw new BadRequestException('An account cannot be its own parent');
    }
    const parent = await this.accountRepository.findOneBy({ Id: parentId });
    if (!parent || !parent.IsActive) {
      throw new BadRequestException(`Parent account ${parentId} not found or inactive`);
    }
    return parent;
  }
}
