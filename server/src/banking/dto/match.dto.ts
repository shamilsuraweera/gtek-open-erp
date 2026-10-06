import { IsInt } from 'class-validator';

export class MatchDto {
  @IsInt()
  BankLineId: number;

  @IsInt()
  JournalLineId: number;
}
