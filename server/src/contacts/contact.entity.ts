import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Account } from '../finance/entities/account.entity';

@Entity('Contacts')
export class Contact {
  @PrimaryGeneratedColumn()
  Id: number;

  @Column({ type: 'nvarchar', length: 200 })
  Name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  Email: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  Phone: string | null;

  @Column({ type: 'bit', default: true })
  IsCustomer: boolean;

  @Column({ type: 'bit', default: false })
  IsVendor: boolean;

  // Nullable: a contact need not have accounting defaults set from day
  // one, but when set, these are what future Invoice/Bill automation will
  // post to (customer AR / vendor AP), mirroring the same pattern used for
  // ProductCategory.IncomeAccount / ExpenseAccount.
  @ManyToOne(() => Account, { nullable: true, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'AccountsReceivableId' })
  AccountsReceivable: Account | null;

  @ManyToOne(() => Account, { nullable: true, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'AccountsPayableId' })
  AccountsPayable: Account | null;

  @Column({ type: 'bit', default: true })
  IsActive: boolean;

  @CreateDateColumn({ type: 'datetime2' })
  CreatedAt: Date;

  @UpdateDateColumn({ type: 'datetime2' })
  UpdatedAt: Date;
}
