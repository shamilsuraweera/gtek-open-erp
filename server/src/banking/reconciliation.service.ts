import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BankStatementLine } from './bank-statement-line.entity';
import { JournalEntryLine } from '../finance/entities/journal-entry-line.entity';
import { JournalEntryState } from '../finance/finance.enums';
import { toMinorUnits } from '../finance/utils/money';

@Injectable()
export class ReconciliationService {
  constructor(
    @InjectRepository(BankStatementLine)
    private readonly bankStatementLineRepository: Repository<BankStatementLine>,
    @InjectRepository(JournalEntryLine)
    private readonly journalEntryLineRepository: Repository<JournalEntryLine>,
  ) {}

  /** Unmatched bank lines for one ledger account, oldest first. */
  async getUnreconciledBankLines(accountId: number): Promise<BankStatementLine[]> {
    return this.bankStatementLineRepository
      .createQueryBuilder('line')
      .innerJoinAndSelect('line.BankStatement', 'statement')
      .innerJoin('statement.Account', 'account')
      .where('account.Id = :accountId', { accountId })
      .andWhere('line.IsReconciled = :isReconciled', { isReconciled: false })
      .orderBy('line.Date', 'ASC')
      .getMany();
  }

  /**
   * Posted JournalEntryLines for one account that no BankStatementLine has
   * claimed yet. JournalEntryLine carries no reconciliation flag of its
   * own — "unreconciled" here means no row in BankStatementLines points at
   * it via MatchedJournalEntryLineId, hence the LEFT JOIN ... IS NULL
   * (an anti-join) against a table JournalEntryLine has no relation to in
   * the other direction, joined by entity class rather than a hardcoded
   * table name.
   */
  async getUnreconciledLedgerLines(accountId: number): Promise<JournalEntryLine[]> {
    return this.journalEntryLineRepository
      .createQueryBuilder('line')
      .innerJoinAndSelect('line.JournalEntry', 'entry')
      .innerJoin('line.Account', 'account')
      .leftJoin(BankStatementLine, 'bsl', 'bsl.MatchedJournalEntryLineId = line.Id')
      .where('account.Id = :accountId', { accountId })
      .andWhere('entry.State = :state', { state: JournalEntryState.Posted })
      .andWhere('bsl.Id IS NULL')
      .orderBy('entry.EntryDate', 'ASC')
      .getMany();
  }

  /**
   * Runs inside a single transaction: re-validates both lines are still
   * unreconciled at the moment of matching (never trust state read
   * earlier in the request — another match request could have claimed
   * either line in between), verifies the amounts agree exactly via
   * integer minor-unit comparison, then links them.
   *
   * The mapping is deliberate, not arbitrary: a bank Amount is a single
   * signed real-world transaction, while the ledger side is always a
   * Debit/Credit pair. A positive Amount (money arriving) can only be the
   * bank's mirror of a Debit to this asset account; a negative Amount
   * (money leaving) can only mirror a Credit. Matching a deposit against
   * a Credit — or a withdrawal against a Debit — would silently launder a
   * sign error, so the two directions are checked separately, not folded
   * into a single abs()-based comparison.
   */
  async match(bankLineId: number, journalLineId: number): Promise<BankStatementLine> {
    return this.bankStatementLineRepository.manager.transaction(async (manager) => {
      const bankLine = await manager.findOne(BankStatementLine, { where: { Id: bankLineId } });
      if (!bankLine) {
        throw new NotFoundException(`Bank statement line ${bankLineId} not found`);
      }
      if (bankLine.IsReconciled) {
        throw new ConflictException('This bank statement line is already reconciled');
      }

      const journalLine = await manager.findOne(JournalEntryLine, { where: { Id: journalLineId } });
      if (!journalLine) {
        throw new NotFoundException(`Journal entry line ${journalLineId} not found`);
      }

      const existingMatch = await manager.findOne(BankStatementLine, {
        where: { MatchedJournalEntryLine: { Id: journalLineId } },
      });
      if (existingMatch) {
        throw new ConflictException('This ledger line is already reconciled');
      }

      const bankAmountMinor = toMinorUnits(bankLine.Amount);
      const debitMinor = toMinorUnits(journalLine.Debit);
      const creditMinor = toMinorUnits(journalLine.Credit);

      if (bankAmountMinor === 0) {
        throw new BadRequestException('Bank statement line amount cannot be zero');
      }

      if (bankAmountMinor > 0) {
        // Deposit: must equal the ledger Debit exactly.
        if (bankAmountMinor !== debitMinor) {
          throw new BadRequestException(
            `Amount mismatch: bank deposit ${bankLine.Amount} does not equal ledger debit ${journalLine.Debit}`,
          );
        }
      } else if (-bankAmountMinor !== creditMinor) {
        // Withdrawal: absolute value must equal the ledger Credit exactly.
        throw new BadRequestException(
          `Amount mismatch: bank withdrawal ${bankLine.Amount} does not equal ledger credit ${journalLine.Credit}`,
        );
      }

      bankLine.IsReconciled = true;
      bankLine.MatchedJournalEntryLine = journalLine;
      return manager.save(BankStatementLine, bankLine);
    });
  }
}
