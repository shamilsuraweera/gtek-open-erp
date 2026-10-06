import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Contact } from '../contacts/contact.entity';
import { InvoiceLine } from './invoice-line.entity';
import { decimalTransformer } from '../common/transformers/decimal.transformer';
import { InvoiceStatus } from './sales.enums';

@Entity('Invoices')
@Index('UQ_Invoices_InvoiceNumber', ['InvoiceNumber'], {
  unique: true,
  where: `"InvoiceNumber" <> ''`,
})
export class Invoice {
  @PrimaryGeneratedColumn()
  Id: number;

  // Draft invoices carry '' here (an application-level placeholder set at
  // creation time, since the column is NOT NULL with no DB default) until
  // posting assigns the real number. Uniqueness is enforced by a filtered
  // index (see migration), not a plain UNIQUE constraint — the same
  // JournalEntry.Reference pattern, needed so unlimited blank drafts can
  // coexist without colliding.
  @Column({ type: 'varchar', length: 50 })
  InvoiceNumber: string;

  @Column({ type: 'date' })
  Date: string;

  @Column({ type: 'date' })
  DueDate: string;

  @ManyToOne(() => Contact, { nullable: false, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'ContactId' })
  Contact: Contact;

  @Column({
    type: 'simple-enum',
    enum: InvoiceStatus,
    length: 20,
    default: InvoiceStatus.Draft,
  })
  Status: InvoiceStatus;

  @Column({
    type: 'decimal',
    precision: 19,
    scale: 4,
    default: 0,
    transformer: decimalTransformer,
  })
  TotalAmount: string;

  @OneToMany(() => InvoiceLine, (line) => line.Invoice, { cascade: true })
  Lines: InvoiceLine[];

  @CreateDateColumn({ type: 'datetime2' })
  CreatedAt: Date;

  @UpdateDateColumn({ type: 'datetime2' })
  UpdatedAt: Date;
}
