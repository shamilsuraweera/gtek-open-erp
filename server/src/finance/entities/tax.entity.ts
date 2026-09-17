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
import { decimalTransformer } from '../../common/transformers/decimal.transformer';
import { TaxAmountType, TaxScope } from '../finance.enums';

@Entity('Taxes')
export class Tax {
  @PrimaryGeneratedColumn()
  Id: number;

  @Column({ type: 'nvarchar', length: 100 })
  Name: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  Code: string;

  @Column({ type: 'simple-enum', enum: TaxAmountType, length: 20 })
  AmountType: TaxAmountType;

  @Column({
    type: 'decimal',
    precision: 19,
    scale: 4,
    transformer: decimalTransformer,
  })
  Amount: string;

  @Column({ type: 'simple-enum', enum: TaxScope, length: 20 })
  Scope: TaxScope;

  @ManyToOne(() => Account, { nullable: false, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'TaxAccountId' })
  TaxAccount: Account;

  @Column({ type: 'bit', default: false })
  IsPriceIncluded: boolean;

  @Column({ type: 'bit', default: true })
  IsActive: boolean;

  @CreateDateColumn({ type: 'datetime2' })
  CreatedAt: Date;

  @UpdateDateColumn({ type: 'datetime2' })
  UpdatedAt: Date;
}
