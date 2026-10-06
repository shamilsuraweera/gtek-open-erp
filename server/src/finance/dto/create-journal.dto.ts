import { IsEnum, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { JournalType } from '../finance.enums';

export class CreateJournalDto {
  @IsString()
  @MaxLength(10)
  Code: string;

  @IsString()
  @MaxLength(100)
  Name: string;

  @IsEnum(JournalType)
  Type: JournalType;

  @IsOptional()
  @IsInt()
  DefaultAccountId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  SequencePrefix?: string;
}
