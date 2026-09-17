import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Journal } from './journal.entity';
import { JournalEntryLine } from './journal-entry-line.entity';
import { decimalTransformer } from '../../common/transformers/decimal.transformer';
import { JournalEntryState } from '../finance.enums';

@Entity('JournalEntries')
export class JournalEntry {
  @PrimaryGeneratedColumn()
  Id: number;

  @Column({ type: 'varchar', length: 50 })
  Reference: string;

  @Column({ type: 'date' })
  EntryDate: string;

  @Column({
    type: 'simple-enum',
    enum: JournalEntryState,
    length: 20,
    default: JournalEntryState.Draft,
  })
  State: JournalEntryState;

  @ManyToOne(() => Journal, { nullable: false, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'JournalId' })
  Journal: Journal;

  @Column({ type: 'nvarchar', length: 500, nullable: true })
  Narration: string | null;

  @Column({
    type: 'decimal',
    precision: 19,
    scale: 4,
    default: 0,
    transformer: decimalTransformer,
  })
  TotalDebit: string;

  @Column({
    type: 'decimal',
    precision: 19,
    scale: 4,
    default: 0,
    transformer: decimalTransformer,
  })
  TotalCredit: string;

  @ManyToOne(() => JournalEntry, { nullable: true, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'ReversalOfId' })
  ReversalOf: JournalEntry | null;

  @OneToMany(() => JournalEntryLine, (line) => line.JournalEntry, { cascade: true })
  Lines: JournalEntryLine[];

  @Column({ type: 'datetime2', nullable: true })
  PostedAt: Date | null;

  @CreateDateColumn({ type: 'datetime2' })
  CreatedAt: Date;

  @UpdateDateColumn({ type: 'datetime2' })
  UpdatedAt: Date;
}
