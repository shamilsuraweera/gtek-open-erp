import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from './entities/account.entity';
import { JournalEntryLine } from './entities/journal-entry-line.entity';
import { AccountType, JournalEntryState } from './finance.enums';
import { formatAggregate, fromMinorUnits, toMinorUnits } from './utils/money';
import { TrialBalanceRow } from './dto/trial-balance-row.dto';
import { GeneralLedgerRow } from './dto/general-ledger-row.dto';

interface RawTrialBalanceRow {
  accountId: number;
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  totalDebit: number | string | null;
  totalCredit: number | string | null;
}

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(JournalEntryLine)
    private readonly lineRepository: Repository<JournalEntryLine>,
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
  ) {}

  /**
   * Groups every posted JournalEntryLine by Account and sums Debit/Credit
   * in SQL (efficient — never pulls individual line rows into the app).
   * Drafts are invisible here: the join against JournalEntry filters on
   * State = Posted, so an entry that never got past Draft can never
   * appear on a financial report.
   */
  async getTrialBalance(): Promise<TrialBalanceRow[]> {
    const rows = await this.lineRepository
      .createQueryBuilder('line')
      .innerJoin('line.JournalEntry', 'entry')
      .innerJoin('line.Account', 'account')
      .select('account.Id', 'accountId')
      .addSelect('account.Code', 'accountCode')
      .addSelect('account.Name', 'accountName')
      .addSelect('account.Type', 'accountType')
      .addSelect('CAST(SUM(line.Debit) AS DECIMAL(19,4))', 'totalDebit')
      .addSelect('CAST(SUM(line.Credit) AS DECIMAL(19,4))', 'totalCredit')
      .where('entry.State = :state', { state: JournalEntryState.Posted })
      .groupBy('account.Id')
      .addGroupBy('account.Code')
      .addGroupBy('account.Name')
      .addGroupBy('account.Type')
      .orderBy('account.Code', 'ASC')
      .getRawMany<RawTrialBalanceRow>();

    return rows.map((row) => ({
      accountId: row.accountId,
      accountCode: row.accountCode,
      accountName: row.accountName,
      accountType: row.accountType,
      totalDebit: formatAggregate(row.totalDebit),
      totalCredit: formatAggregate(row.totalCredit),
    }));
  }

  /**
   * All posted lines for one account, oldest first, with a running balance.
   * The running total is inherently sequential (each row depends on the
   * previous one), so it's computed here in JS rather than in SQL — but
   * safely: every Debit/Credit arrives as a decimalTransformer-formatted
   * string, and is only ever combined via toMinorUnits/fromMinorUnits
   * (integer ten-thousandths), never parseFloat or native +/-.
   */
  async getGeneralLedger(accountId: number): Promise<GeneralLedgerRow[]> {
    const account = await this.accountRepository.findOneBy({ Id: accountId });
    if (!account) {
      throw new NotFoundException(`Account ${accountId} not found`);
    }

    const lines = await this.lineRepository.find({
      where: {
        Account: { Id: accountId },
        JournalEntry: { State: JournalEntryState.Posted },
      },
      relations: { JournalEntry: true },
      order: { JournalEntry: { EntryDate: 'ASC' }, Id: 'ASC' },
    });

    const isDebitNormal = account.Type === AccountType.Asset || account.Type === AccountType.Expense;

    let runningBalanceMinor = 0;
    return lines.map((line) => {
      const debitMinor = toMinorUnits(line.Debit);
      const creditMinor = toMinorUnits(line.Credit);
      runningBalanceMinor += isDebitNormal ? debitMinor - creditMinor : creditMinor - debitMinor;

      return {
        lineId: line.Id,
        entryId: line.JournalEntry.Id,
        reference: line.JournalEntry.Reference,
        entryDate: line.JournalEntry.EntryDate,
        description: line.Description,
        // Re-normalized to a canonical 4-decimal string: decimalTransformer
        // just stringifies whatever the driver returns, which drops
        // trailing zeros for whole numbers (e.g. "100" instead of
        // "100.0000") — round-tripping through the exact integer helpers
        // fixes the display without touching the underlying value.
        debit: fromMinorUnits(debitMinor),
        credit: fromMinorUnits(creditMinor),
        runningBalance: fromMinorUnits(runningBalanceMinor),
      };
    });
  }
}
