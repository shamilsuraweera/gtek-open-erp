import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Account } from './account.entity';
import { JournalType } from '../finance.enums';

@Entity('Journals')
export class Journal {
  @PrimaryGeneratedColumn()
  Id: number;

  @Column({ type: 'varchar', length: 10, unique: true })
  Code: string;

  @Column({ type: 'nvarchar', length: 100 })
  Name: string;

  @Column({ type: 'simple-enum', enum: JournalType, length: 20 })
  Type: JournalType;

  @ManyToOne(() => Account, { nullable: true, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'DefaultAccountId' })
  DefaultAccount: Account | null;

  @Column({ type: 'varchar', length: 20, default: '' })
  SequencePrefix: string;

  @Column({ type: 'int', default: 1 })
  NextSequenceNumber: number;

  @Column({ type: 'bit', default: true })
  IsActive: boolean;

  @CreateDateColumn({ type: 'datetime2' })
  CreatedAt: Date;

  @UpdateDateColumn({ type: 'datetime2' })
  UpdatedAt: Date;
}
