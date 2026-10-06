import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';

const DECIMAL_PATTERN = /^\d+(\.\d{1,4})?$/;

export class CreateJournalEntryLineDto {
  @IsInt()
  AccountId: number;

  @IsOptional()
  @IsInt()
  TaxId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  Description?: string;

  @Matches(DECIMAL_PATTERN, {
    message: 'Debit must be a non-negative decimal with up to 4 decimal places',
  })
  Debit: string;

  @Matches(DECIMAL_PATTERN, {
    message: 'Credit must be a non-negative decimal with up to 4 decimal places',
  })
  Credit: string;
}

export class CreateJournalEntryDto {
  @IsInt()
  JournalId: number;

  @IsDateString()
  EntryDate: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  Narration?: string;

  // At least 2 lines are required to *post* an entry (enforced in
  // JournalEntriesService.postEntry), but a single-line draft is allowed
  // here so a UI can build an entry incrementally before posting it.
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateJournalEntryLineDto)
  Lines: CreateJournalEntryLineDto[];
}
