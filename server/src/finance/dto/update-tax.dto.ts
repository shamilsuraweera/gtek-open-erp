import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { TaxAmountType, TaxScope } from '../finance.enums';
import { DECIMAL_PATTERN } from './create-tax.dto';

export class UpdateTaxDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  Name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  Code?: string;

  @IsOptional()
  @IsEnum(TaxAmountType)
  AmountType?: TaxAmountType;

  @IsOptional()
  @Matches(DECIMAL_PATTERN, {
    message: 'Amount must be a non-negative decimal with up to 4 decimal places',
  })
  Amount?: string;

  @IsOptional()
  @IsEnum(TaxScope)
  Scope?: TaxScope;

  @IsOptional()
  @IsInt()
  TaxAccountId?: number;

  @IsOptional()
  @IsBoolean()
  IsPriceIncluded?: boolean;
}
