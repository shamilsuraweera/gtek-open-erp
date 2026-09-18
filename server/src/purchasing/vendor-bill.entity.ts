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
import { Contact } from '../contacts/contact.entity';
import { VendorBillLine } from './vendor-bill-line.entity';
import { decimalTransformer } from '../common/transformers/decimal.transformer';
import { VendorBillStatus } from './purchasing.enums';

@Entity('VendorBills')
export class VendorBill {
  @PrimaryGeneratedColumn()
  Id: number;

  // Draft bills carry '' here (an application-level placeholder set at
  // creation time, since the column is NOT NULL with no DB default) until
  // posting assigns the real number. Uniqueness is enforced by a filtered
  // index (see migration), not a plain UNIQUE constraint — the same
  // Invoice.InvoiceNumber / JournalEntry.Reference pattern, needed so
  // unlimited blank drafts can coexist without colliding.
  @Column({ type: 'varchar', length: 50 })
  BillNumber: string;

  @Column({ type: 'date' })
  Date: string;

  @Column({ type: 'date' })
  DueDate: string;

  @ManyToOne(() => Contact, { nullable: false, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'ContactId' })
  Contact: Contact;

  @Column({
    type: 'simple-enum',
    enum: VendorBillStatus,
    length: 20,
    default: VendorBillStatus.Draft,
  })
  Status: VendorBillStatus;

  @Column({
    type: 'decimal',
    precision: 19,
    scale: 4,
    default: 0,
    transformer: decimalTransformer,
  })
  TotalAmount: string;

  @OneToMany(() => VendorBillLine, (line) => line.VendorBill, { cascade: true })
  Lines: VendorBillLine[];

  @CreateDateColumn({ type: 'datetime2' })
  CreatedAt: Date;

  @UpdateDateColumn({ type: 'datetime2' })
  UpdatedAt: Date;
}
