import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsDateString, IsInt, ValidateNested } from 'class-validator';
import { CreateVendorBillLineDto } from './create-vendor-bill-line.dto';

export class CreateVendorBillDto {
  @IsInt()
  ContactId: number;

  @IsDateString()
  Date: string;

  @IsDateString()
  DueDate: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateVendorBillLineDto)
  Lines: CreateVendorBillLineDto[];
}
