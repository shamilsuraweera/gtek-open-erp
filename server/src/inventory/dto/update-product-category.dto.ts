import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateProductCategoryDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  Name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  Description?: string;

  @IsOptional()
  @IsInt()
  IncomeAccountId?: number;

  @IsOptional()
  @IsInt()
  ExpenseAccountId?: number;
}
