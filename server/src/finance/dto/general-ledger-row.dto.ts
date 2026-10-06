export interface GeneralLedgerRow {
  lineId: number;
  entryId: number;
  reference: string;
  entryDate: string;
  description: string | null;
  debit: string;
  credit: string;
  runningBalance: string;
}
