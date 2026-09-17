import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { JournalEntry } from './journal-entry.entity';
import { Account } from './account.entity';
import { Tax } from './tax.entity';
import { decimalTransformer } from '../../common/transformers/decimal.transformer';

@Entity('JournalEntryLines')
export class JournalEntryLine {
  @PrimaryGeneratedColumn()
  Id: number;

  @ManyToOne(() => JournalEntry, (entry) => entry.Lines, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'JournalEntryId' })
  JournalEntry: JournalEntry;

  @ManyToOne(() => Account, { nullable: false, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'AccountId' })
  Account: Account;

  @ManyToOne(() => Tax, { nullable: true, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'TaxId' })
  Tax: Tax | null;

  @Column({ type: 'int' })
  LineNumber: number;

  @Column({ type: 'nvarchar', length: 500, nullable: true })
  Description: string | null;

  @Column({
    type: 'decimal',
    precision: 19,
    scale: 4,
    default: 0,
    transformer: decimalTransformer,
  })
  Debit: string;

  @Column({
    type: 'decimal',
    precision: 19,
    scale: 4,
    default: 0,
    transformer: decimalTransformer,
  })
  Credit: string;
}
