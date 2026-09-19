import { AccountType } from '../finance.enums';

export interface TrialBalanceRow {
  accountId: number;
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  totalDebit: string;
  totalCredit: string;
}
