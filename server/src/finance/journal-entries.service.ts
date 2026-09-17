import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { JournalEntry } from './entities/journal-entry.entity';
import { JournalEntryLine } from './entities/journal-entry-line.entity';
import { Journal } from './entities/journal.entity';
import { Account } from './entities/account.entity';
import { Tax } from './entities/tax.entity';
import { JournalEntryState } from './finance.enums';
import { CreateJournalEntryDto } from './dto/create-journal-entry.dto';
import { fromMinorUnits, toMinorUnits } from './utils/money';

@Injectable()
export class JournalEntriesService {
  constructor(
    @InjectRepository(JournalEntry)
    private readonly journalEntryRepository: Repository<JournalEntry>,
    @InjectRepository(Journal)
    private readonly journalRepository: Repository<Journal>,
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    @InjectRepository(Tax)
    private readonly taxRepository: Repository<Tax>,
  ) {}

  async findAll(): Promise<JournalEntry[]> {
    return this.journalEntryRepository.find({
      relations: { Journal: true, Lines: { Account: true, Tax: true } },
      order: { Id: 'DESC' },
    });
  }

  async findOne(id: number): Promise<JournalEntry> {
    const entry = await this.journalEntryRepository.findOne({
      where: { Id: id },
      relations: { Journal: true, Lines: { Account: true, Tax: true } },
    });
    if (!entry) {
      throw new NotFoundException(`Journal entry ${id} not found`);
    }
    return entry;
  }

  async createDraft(dto: CreateJournalEntryDto): Promise<JournalEntry> {
    const journal = await this.journalRepository.findOneBy({ Id: dto.JournalId });
    if (!journal || !journal.IsActive) {
      throw new BadRequestException('Journal not found or inactive');
    }

    const accountIds = [...new Set(dto.Lines.map((line) => line.AccountId))];
    const accounts = await this.accountRepository.findBy({ Id: In(accountIds) });
    if (accounts.length !== accountIds.length || accounts.some((account) => !account.IsActive)) {
      throw new BadRequestException('One or more accounts do not exist or are inactive');
    }
    const accountsById = new Map(accounts.map((account) => [account.Id, account]));

    const taxIds = [
      ...new Set(
        dto.Lines.map((line) => line.TaxId).filter((id): id is number => id !== undefined),
      ),
    ];
    let taxesById = new Map<number, Tax>();
    if (taxIds.length > 0) {
      const taxes = await this.taxRepository.findBy({ Id: In(taxIds) });
      if (taxes.length !== taxIds.length || taxes.some((tax) => !tax.IsActive)) {
        throw new BadRequestException('One or more taxes do not exist or are inactive');
      }
      taxesById = new Map(taxes.map((tax) => [tax.Id, tax]));
    }

    const lines = dto.Lines.map((line, index) => {
      const debitMinor = toMinorUnits(line.Debit);
      const creditMinor = toMinorUnits(line.Credit);
      if (debitMinor !== 0 && creditMinor !== 0) {
        throw new BadRequestException(
          `Line ${index + 1}: a line cannot have both a debit and a credit amount`,
        );
      }
      if (debitMinor === 0 && creditMinor === 0) {
        throw new BadRequestException(`Line ${index + 1}: must have either a debit or a credit amount`);
      }

      const entryLine = new JournalEntryLine();
      entryLine.LineNumber = index + 1;
      entryLine.Account = accountsById.get(line.AccountId)!;
      entryLine.Tax = line.TaxId ? taxesById.get(line.TaxId)! : null;
      entryLine.Description = line.Description ?? null;
      entryLine.Debit = fromMinorUnits(debitMinor);
      entryLine.Credit = fromMinorUnits(creditMinor);
      return entryLine;
    });

    const entry = this.journalEntryRepository.create({
      Journal: journal,
      EntryDate: dto.EntryDate,
      Narration: dto.Narration ?? null,
      Reference: '',
      State: JournalEntryState.Draft,
      Lines: lines,
    });

    return this.journalEntryRepository.save(entry);
  }

  /**
   * The posting gate (design doc "Layer 2"). Runs in one transaction that:
   *  1. re-validates Draft state, line count, and balance at the moment of
   *     posting (never trust state computed earlier in the request);
   *  2. takes a row lock on the Journal (UPDLOCK, ROWLOCK via
   *     pessimistic_write) so concurrent posts against the same journal
   *     cannot race for the same sequence number;
   *  3. writes the header totals and flips State to Posted.
   * Once committed, JournalEntry immutability (enforced at the controller/
   * service boundary for any future edit endpoints) keeps this guarantee
   * from ever being invalidated after the fact.
   */
  async postEntry(id: number): Promise<JournalEntry> {
    return this.journalEntryRepository.manager.transaction(async (manager) => {
      const entry = await manager.findOne(JournalEntry, {
        where: { Id: id },
        relations: { Lines: { Account: true, Tax: true }, Journal: true },
      });

      if (!entry) {
        throw new NotFoundException(`Journal entry ${id} not found`);
      }
      if (entry.State !== JournalEntryState.Draft) {
        throw new ConflictException('Only draft entries can be posted');
      }
      if (!entry.Lines || entry.Lines.length < 2) {
        throw new BadRequestException('A journal entry must have at least two lines to post');
      }

      let totalDebit = 0;
      let totalCredit = 0;
      for (const line of entry.Lines) {
        if (!line.Account.IsActive || (line.Tax && !line.Tax.IsActive)) {
          throw new BadRequestException('One or more lines reference an inactive account or tax');
        }
        totalDebit += toMinorUnits(line.Debit);
        totalCredit += toMinorUnits(line.Credit);
      }

      if (totalDebit !== totalCredit) {
        throw new BadRequestException(
          `Entry is not balanced: total debit ${fromMinorUnits(totalDebit)} does not equal total credit ${fromMinorUnits(totalCredit)}`,
        );
      }
      if (totalDebit === 0) {
        throw new BadRequestException('A journal entry cannot be all zero');
      }

      // Row lock: WITH (UPDLOCK, ROWLOCK) on the Journal row. Any concurrent
      // postEntry() targeting the same journal blocks here until this
      // transaction commits or rolls back, so NextSequenceNumber can never
      // be handed out twice.
      const journal = await manager.findOne(Journal, {
        where: { Id: entry.Journal.Id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!journal || !journal.IsActive) {
        throw new BadRequestException('Journal is not active');
      }

      const sequenceNumber = journal.NextSequenceNumber;
      journal.NextSequenceNumber += 1;
      await manager.save(Journal, journal);

      const prefix = journal.SequencePrefix || `${journal.Code}/`;
      entry.Reference = `${prefix}${sequenceNumber}`;
      entry.TotalDebit = fromMinorUnits(totalDebit);
      entry.TotalCredit = fromMinorUnits(totalCredit);
      entry.State = JournalEntryState.Posted;
      entry.PostedAt = new Date();

      return manager.save(JournalEntry, entry);
    });
  }
}
