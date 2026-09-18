import { IsEnum, IsInt, IsString, Matches, MaxLength } from 'class-validator';
import { ProductType } from '../inventory.enums';

// Prices are validated as decimal strings, never numbers, so a monetary
// value never passes through a JS float on its way from the HTTP boundary
// — same rule as the Finance module's DTOs.
export const DECIMAL_PATTERN = /^\d+(\.\d{1,4})?$/;

export class CreateProductDto {
  @IsString()
  @MaxLength(200)
  Name: string;

  @IsString()
  @MaxLength(50)
  SKU: string;

  @IsEnum(ProductType)
  Type: ProductType;

  @IsInt()
  CategoryId: number;

  @Matches(DECIMAL_PATTERN, {
    message: 'SalePrice must be a non-negative decimal with up to 4 decimal places',
  })
  SalePrice: string;

  @Matches(DECIMAL_PATTERN, {
    message: 'CostPrice must be a non-negative decimal with up to 4 decimal places',
  })
  CostPrice: string;
}
