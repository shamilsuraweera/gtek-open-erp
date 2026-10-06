import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsDateString, IsInt, ValidateNested } from 'class-validator';
import { CreateInvoiceLineDto } from './create-invoice-line.dto';

export class CreateInvoiceDto {
  @IsInt()
  ContactId: number;

  @IsDateString()
  Date: string;

  @IsDateString()
  DueDate: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceLineDto)
  Lines: CreateInvoiceLineDto[];
}
