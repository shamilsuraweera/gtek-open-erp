import { IsEnum, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { JournalType } from '../finance.enums';

// NextSequenceNumber is deliberately not settable through the API — it is
// an internal counter mutated only inside JournalEntriesService.postEntry,
// under a row lock, to guarantee gapless/unique reference allocation.
export class UpdateJournalDto {
  @IsOptional()
  @IsString()
  @MaxLength(10)
  Code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  Name?: string;

  @IsOptional()
  @IsEnum(JournalType)
  Type?: JournalType;

  @IsOptional()
  @IsInt()
  DefaultAccountId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  SequencePrefix?: string;
}
