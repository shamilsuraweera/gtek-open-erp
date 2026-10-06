import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductCategory } from './product-category.entity';
import { Product } from './product.entity';
import { Account } from '../finance/entities/account.entity';
import { ProductCategoriesService } from './product-categories.service';
import { ProductCategoriesController } from './product-categories.controller';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ProductCategory, Product, Account])],
  controllers: [ProductCategoriesController, ProductsController],
  providers: [ProductCategoriesService, ProductsService],
  exports: [ProductCategoriesService, ProductsService],
})
export class InventoryModule {}
