import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BankStatement } from './bank-statement.entity';
import { JournalEntryLine } from '../finance/entities/journal-entry-line.entity';
import { decimalTransformer } from '../common/transformers/decimal.transformer';

@Entity('BankStatementLines')
export class BankStatementLine {
  @PrimaryGeneratedColumn()
  Id: number;

  @ManyToOne(() => BankStatement, (statement) => statement.Lines, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'BankStatementId' })
  BankStatement: BankStatement;

  @Column({ type: 'date' })
  Date: string;

  @Column({ type: 'nvarchar', length: 500 })
  Description: string;

  // Positive for deposits, negative for withdrawals — a single signed
  // column rather than separate Debit/Credit fields, since a bank
  // statement line represents one real-world transaction, not a
  // double-entry posting.
  @Column({
    type: 'decimal',
    precision: 19,
    scale: 4,
    default: 0,
    transformer: decimalTransformer,
  })
  Amount: string;

  @Column({ type: 'bit', default: false })
  IsReconciled: boolean;

  // Nullable: unmatched until reconciliation links it to the internal
  // ledger line it corresponds to. NO ACTION so a JournalEntryLine can
  // never be deleted out from under a reconciliation record (matches the
  // "archive, never delete" rule already enforced everywhere else).
  @ManyToOne(() => JournalEntryLine, { nullable: true, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'MatchedJournalEntryLineId' })
  MatchedJournalEntryLine: JournalEntryLine | null;
}
