import { IsEnum, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { AccountType } from '../finance.enums';

export class CreateAccountDto {
  @IsString()
  @MaxLength(20)
  Code: string;

  @IsString()
  @MaxLength(200)
  Name: string;

  @IsEnum(AccountType)
  Type: AccountType;

  @IsOptional()
  @IsInt()
  ParentId?: number;
}
