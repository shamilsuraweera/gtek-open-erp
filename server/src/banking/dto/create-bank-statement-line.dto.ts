import { IsDateString, IsString, Matches, MaxLength } from 'class-validator';

// Unlike Debit/Credit/Quantity elsewhere (always non-negative by
// convention), a bank statement Amount is genuinely signed — positive for
// deposits, negative for withdrawals — so this pattern allows a leading
// minus sign where the shared DECIMAL_PATTERN used elsewhere does not.
export const SIGNED_DECIMAL_PATTERN = /^-?\d+(\.\d{1,4})?$/;

export class CreateBankStatementLineDto {
  @IsDateString()
  Date: string;

  @IsString()
  @MaxLength(500)
  Description: string;

  @Matches(SIGNED_DECIMAL_PATTERN, {
    message: 'Amount must be a decimal with up to 4 decimal places (negative for withdrawals)',
  })
  Amount: string;
}
