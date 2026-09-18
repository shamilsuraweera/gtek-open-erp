import { IsEnum, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { AccountType } from '../finance.enums';

export class UpdateAccountDto {
  @IsOptional()
  @IsString()
  @MaxLength(20)
  Code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  Name?: string;

  @IsOptional()
  @IsEnum(AccountType)
  Type?: AccountType;

  @IsOptional()
  @IsInt()
  ParentId?: number;
}
