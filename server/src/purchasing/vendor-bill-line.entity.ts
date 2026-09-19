import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { VendorBill } from './vendor-bill.entity';
import { Product } from '../inventory/product.entity';
import { decimalTransformer } from '../common/transformers/decimal.transformer';

@Entity('VendorBillLines')
export class VendorBillLine {
  @PrimaryGeneratedColumn()
  Id: number;

  @ManyToOne(() => VendorBill, (bill) => bill.Lines, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'VendorBillId' })
  VendorBill: VendorBill;

  @ManyToOne(() => Product, { nullable: false, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'ProductId' })
  Product: Product;

  @Column({ type: 'nvarchar', length: 500 })
  Description: string;

  @Column({
    type: 'decimal',
    precision: 19,
    scale: 4,
    default: 0,
    transformer: decimalTransformer,
  })
  Quantity: string;

  @Column({
    type: 'decimal',
    precision: 19,
    scale: 4,
    default: 0,
    transformer: decimalTransformer,
  })
  UnitPrice: string;

  @Column({
    type: 'decimal',
    precision: 19,
    scale: 4,
    default: 0,
    transformer: decimalTransformer,
  })
  LineTotal: string;
}
