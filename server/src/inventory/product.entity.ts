import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProductCategory } from './product-category.entity';
import { decimalTransformer } from '../common/transformers/decimal.transformer';
import { ProductType } from './inventory.enums';

@Entity('Products')
export class Product {
  @PrimaryGeneratedColumn()
  Id: number;

  @Column({ type: 'nvarchar', length: 200 })
  Name: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  SKU: string;

  @Column({ type: 'simple-enum', enum: ProductType, length: 20 })
  Type: ProductType;

  @ManyToOne(() => ProductCategory, { nullable: false, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'CategoryId' })
  Category: ProductCategory;

  @Column({
    type: 'decimal',
    precision: 19,
    scale: 4,
    default: 0,
    transformer: decimalTransformer,
  })
  SalePrice: string;

  @Column({
    type: 'decimal',
    precision: 19,
    scale: 4,
    default: 0,
    transformer: decimalTransformer,
  })
  CostPrice: string;

  @Column({ type: 'bit', default: true })
  IsActive: boolean;

  @CreateDateColumn({ type: 'datetime2' })
  CreatedAt: Date;

  @UpdateDateColumn({ type: 'datetime2' })
  UpdatedAt: Date;
}
