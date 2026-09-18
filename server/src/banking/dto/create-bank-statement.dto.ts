import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsDateString, IsInt, IsString, Matches, MaxLength, ValidateNested } from 'class-validator';
import { CreateBankStatementLineDto, SIGNED_DECIMAL_PATTERN } from './create-bank-statement-line.dto';

export class CreateBankStatementDto {
  @IsInt()
  AccountId: number;

  @IsDateString()
  StatementDate: string;

  @IsString()
  @MaxLength(100)
  Reference: string;

  // Signed: a bank account can legitimately start a statement period
  // overdrawn.
  @Matches(SIGNED_DECIMAL_PATTERN, {
    message: 'StartingBalance must be a decimal with up to 4 decimal places',
  })
  StartingBalance: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateBankStatementLineDto)
  Lines: CreateBankStatementLineDto[];
}
