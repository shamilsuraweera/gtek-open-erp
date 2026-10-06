export enum AccountType {
  Asset = 'Asset',
  Liability = 'Liability',
  Equity = 'Equity',
  Income = 'Income',
  Expense = 'Expense',
}

export enum JournalType {
  Sales = 'Sales',
  Purchase = 'Purchase',
  Bank = 'Bank',
  Cash = 'Cash',
  General = 'General',
}

export enum TaxAmountType {
  Percentage = 'Percentage',
  Fixed = 'Fixed',
}

export enum TaxScope {
  Sales = 'Sales',
  Purchase = 'Purchase',
}

export enum JournalEntryState {
  Draft = 'Draft',
  Posted = 'Posted',
  Cancelled = 'Cancelled',
}
