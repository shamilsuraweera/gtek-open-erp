import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contact } from './contact.entity';
import { Account } from '../finance/entities/account.entity';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

@Injectable()
export class ContactsService {
  constructor(
    @InjectRepository(Contact)
    private readonly contactRepository: Repository<Contact>,
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
  ) {}

  async findAll(includeInactive = false): Promise<Contact[]> {
    return this.contactRepository.find({
      where: includeInactive ? {} : { IsActive: true },
      relations: { AccountsReceivable: true, AccountsPayable: true },
      order: { Name: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Contact> {
    const contact = await this.contactRepository.findOneBy({ Id: id });
    if (!contact) {
      throw new NotFoundException(`Contact ${id} not found`);
    }
    return contact;
  }

  async create(dto: CreateContactDto): Promise<Contact> {
    const contact = this.contactRepository.create({
      Name: dto.Name,
      Email: dto.Email ?? null,
      Phone: dto.Phone ?? null,
      IsCustomer: dto.IsCustomer ?? true,
      IsVendor: dto.IsVendor ?? false,
      AccountsReceivable: await this.resolveAccount(dto.AccountsReceivableId),
      AccountsPayable: await this.resolveAccount(dto.AccountsPayableId),
    });
    return this.contactRepository.save(contact);
  }

  async update(id: number, dto: UpdateContactDto): Promise<Contact> {
    const contact = await this.findOne(id);

    if (dto.Name !== undefined) {
      contact.Name = dto.Name;
    }
    if (dto.Email !== undefined) {
      contact.Email = dto.Email;
    }
    if (dto.Phone !== undefined) {
      contact.Phone = dto.Phone;
    }
    if (dto.IsCustomer !== undefined) {
      contact.IsCustomer = dto.IsCustomer;
    }
    if (dto.IsVendor !== undefined) {
      contact.IsVendor = dto.IsVendor;
    }
    if (dto.AccountsReceivableId !== undefined) {
      contact.AccountsReceivable = await this.resolveAccount(dto.AccountsReceivableId);
    }
    if (dto.AccountsPayableId !== undefined) {
      contact.AccountsPayable = await this.resolveAccount(dto.AccountsPayableId);
    }

    return this.contactRepository.save(contact);
  }

  async archive(id: number): Promise<Contact> {
    const contact = await this.findOne(id);
    contact.IsActive = false;
    return this.contactRepository.save(contact);
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
