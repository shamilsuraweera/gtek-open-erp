import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { TaxAmountType, TaxScope } from '../finance.enums';

// Amounts are validated as decimal strings, never numbers, so a monetary
// value never passes through a JS float on its way from the HTTP boundary.
export const DECIMAL_PATTERN = /^\d+(\.\d{1,4})?$/;

export class CreateTaxDto {
  @IsString()
  @MaxLength(100)
  Name: string;

  @IsString()
  @MaxLength(20)
  Code: string;

  @IsEnum(TaxAmountType)
  AmountType: TaxAmountType;

  @Matches(DECIMAL_PATTERN, {
    message: 'Amount must be a non-negative decimal with up to 4 decimal places',
  })
  Amount: string;

  @IsEnum(TaxScope)
  Scope: TaxScope;

  @IsInt()
  TaxAccountId: number;

  @IsOptional()
  @IsBoolean()
  IsPriceIncluded?: boolean;
}
