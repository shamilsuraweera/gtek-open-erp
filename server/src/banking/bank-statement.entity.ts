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
import { Account } from '../finance/entities/account.entity';
import { BankStatementLine } from './bank-statement-line.entity';
import { decimalTransformer } from '../common/transformers/decimal.transformer';
import { BankStatementStatus } from './banking.enums';

@Entity('BankStatements')
export class BankStatement {
  @PrimaryGeneratedColumn()
  Id: number;

  @Column({ type: 'date' })
  StatementDate: string;

  @Column({ type: 'varchar', length: 100 })
  Reference: string;

  // The ledger bank/cash Account this statement is being reconciled
  // against — NO ACTION so archiving an account can never silently orphan
  // historical reconciliation records.
  @ManyToOne(() => Account, { nullable: false, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'AccountId' })
  Account: Account;

  @Column({
    type: 'decimal',
    precision: 19,
    scale: 4,
    default: 0,
    transformer: decimalTransformer,
  })
  StartingBalance: string;

  @Column({
    type: 'decimal',
    precision: 19,
    scale: 4,
    default: 0,
    transformer: decimalTransformer,
  })
  EndingBalance: string;

  @Column({
    type: 'simple-enum',
    enum: BankStatementStatus,
    length: 20,
    default: BankStatementStatus.Draft,
  })
  Status: BankStatementStatus;

  @OneToMany(() => BankStatementLine, (line) => line.BankStatement, { cascade: true })
  Lines: BankStatementLine[];

  @CreateDateColumn({ type: 'datetime2' })
  CreatedAt: Date;

  @UpdateDateColumn({ type: 'datetime2' })
  UpdatedAt: Date;
}
