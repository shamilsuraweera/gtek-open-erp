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
import { AccountType } from '../finance.enums';

@Entity('Accounts')
export class Account {
  @PrimaryGeneratedColumn()
  Id: number;

  @Column({ type: 'varchar', length: 20, unique: true })
  Code: string;

  @Column({ type: 'nvarchar', length: 200 })
  Name: string;

  @Column({ type: 'simple-enum', enum: AccountType, length: 20 })
  Type: AccountType;

  @ManyToOne(() => Account, (account) => account.Children, {
    nullable: true,
    onDelete: 'NO ACTION',
  })
  @JoinColumn({ name: 'ParentId' })
  Parent: Account | null;

  @OneToMany(() => Account, (account) => account.Parent)
  Children: Account[];

  @Column({ type: 'bit', default: true })
  IsActive: boolean;

  @CreateDateColumn({ type: 'datetime2' })
  CreatedAt: Date;

  @UpdateDateColumn({ type: 'datetime2' })
  UpdatedAt: Date;
}
