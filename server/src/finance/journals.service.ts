import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Journal } from './entities/journal.entity';
import { Account } from './entities/account.entity';
import { CreateJournalDto } from './dto/create-journal.dto';
import { UpdateJournalDto } from './dto/update-journal.dto';

@Injectable()
export class JournalsService {
  constructor(
    @InjectRepository(Journal)
    private readonly journalRepository: Repository<Journal>,
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
  ) {}

  async findAll(includeInactive = false): Promise<Journal[]> {
    return this.journalRepository.find({
      where: includeInactive ? {} : { IsActive: true },
      relations: { DefaultAccount: true },
      order: { Code: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Journal> {
    const journal = await this.journalRepository.findOneBy({ Id: id });
    if (!journal) {
      throw new NotFoundException(`Journal ${id} not found`);
    }
    return journal;
  }

  async create(dto: CreateJournalDto): Promise<Journal> {
    const existing = await this.journalRepository.findOneBy({ Code: dto.Code });
    if (existing) {
      throw new ConflictException(`Journal code '${dto.Code}' is already in use`);
    }

    const defaultAccount = await this.resolveDefaultAccount(dto.DefaultAccountId);

    const journal = this.journalRepository.create({
      Code: dto.Code,
      Name: dto.Name,
      Type: dto.Type,
      DefaultAccount: defaultAccount,
      SequencePrefix: dto.SequencePrefix ?? '',
    });
    return this.journalRepository.save(journal);
  }

  async update(id: number, dto: UpdateJournalDto): Promise<Journal> {
    const journal = await this.findOne(id);

    if (dto.Code && dto.Code !== journal.Code) {
      const existing = await this.journalRepository.findOneBy({ Code: dto.Code });
      if (existing) {
        throw new ConflictException(`Journal code '${dto.Code}' is already in use`);
      }
      journal.Code = dto.Code;
    }
    if (dto.Name !== undefined) journal.Name = dto.Name;
    if (dto.Type !== undefined) journal.Type = dto.Type;
    if (dto.SequencePrefix !== undefined) journal.SequencePrefix = dto.SequencePrefix;
    if (dto.DefaultAccountId !== undefined) {
      journal.DefaultAccount = await this.resolveDefaultAccount(dto.DefaultAccountId);
    }

    return this.journalRepository.save(journal);
  }

  async archive(id: number): Promise<Journal> {
    const journal = await this.findOne(id);
    journal.IsActive = false;
    return this.journalRepository.save(journal);
  }

  private async resolveDefaultAccount(accountId?: number): Promise<Account | null> {
    if (accountId === undefined || accountId === null) {
      return null;
    }
    const account = await this.accountRepository.findOneBy({ Id: accountId });
    if (!account || !account.IsActive) {
      throw new BadRequestException(`Default account ${accountId} not found or inactive`);
    }
    return account;
  }
}
