import { IsEnum, IsInt, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { ProductType } from '../inventory.enums';
import { DECIMAL_PATTERN } from './create-product.dto';

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  Name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  SKU?: string;

  @IsOptional()
  @IsEnum(ProductType)
  Type?: ProductType;

  @IsOptional()
  @IsInt()
  CategoryId?: number;

  @IsOptional()
  @Matches(DECIMAL_PATTERN, {
    message: 'SalePrice must be a non-negative decimal with up to 4 decimal places',
  })
  SalePrice?: string;

  @IsOptional()
  @Matches(DECIMAL_PATTERN, {
    message: 'CostPrice must be a non-negative decimal with up to 4 decimal places',
  })
  CostPrice?: string;
}
