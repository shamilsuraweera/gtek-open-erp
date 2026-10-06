import { IsBoolean, IsEmail, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateContactDto {
  @IsString()
  @MaxLength(200)
  Name: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  Email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  Phone?: string;

  @IsOptional()
  @IsBoolean()
  IsCustomer?: boolean;

  @IsOptional()
  @IsBoolean()
  IsVendor?: boolean;

  @IsOptional()
  @IsInt()
  AccountsReceivableId?: number;

  @IsOptional()
  @IsInt()
  AccountsPayableId?: number;
}
