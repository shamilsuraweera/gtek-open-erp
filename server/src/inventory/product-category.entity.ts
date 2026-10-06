import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Account } from '../finance/entities/account.entity';

@Entity('ProductCategories')
export class ProductCategory {
  @PrimaryGeneratedColumn()
  Id: number;

  @Column({ type: 'nvarchar', length: 200, unique: true })
  Name: string;

  @Column({ type: 'nvarchar', length: 500, nullable: true })
  Description: string | null;

  // Nullable: a category need not have accounting defaults set from day
  // one, but when set, these are what future Invoice/Bill automation will
  // fall back to for lines using a product in this category.
  @ManyToOne(() => Account, { nullable: true, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'IncomeAccountId' })
  IncomeAccount: Account | null;

  @ManyToOne(() => Account, { nullable: true, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'ExpenseAccountId' })
  ExpenseAccount: Account | null;

  @Column({ type: 'bit', default: true })
  IsActive: boolean;

  @CreateDateColumn({ type: 'datetime2' })
  CreatedAt: Date;

  @UpdateDateColumn({ type: 'datetime2' })
  UpdatedAt: Date;
}
