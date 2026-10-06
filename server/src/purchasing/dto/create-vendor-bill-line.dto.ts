import { IsInt, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

// Same decimal-string rule as everywhere else: never a JS number on the
// wire for a monetary/quantity value.
export const DECIMAL_PATTERN = /^\d+(\.\d{1,4})?$/;

export class CreateVendorBillLineDto {
  @IsInt()
  ProductId: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  Description?: string;

  @Matches(DECIMAL_PATTERN, {
    message: 'Quantity must be a non-negative decimal with up to 4 decimal places',
  })
  Quantity: string;

  @Matches(DECIMAL_PATTERN, {
    message: 'UnitPrice must be a non-negative decimal with up to 4 decimal places',
  })
  UnitPrice: string;
}
