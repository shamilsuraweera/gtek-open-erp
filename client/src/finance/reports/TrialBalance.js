import { useMemo } from "react";
import { useReport } from "../useReport";
import { fromMinorUnits, toMinorUnits } from "../utils/money";


function TrialBalance() {
  const { data: rows, isLoading, error } = useReport("/finance/reports/trial-balance");

  // Grand totals computed via the exact integer-minor-units helpers, never
  // parseFloat/+ on the raw strings — this is what lets this footer
  // actually prove the ledger balances, rather than just looking like it
  // does until a run of odd decimals drifts it by a cent.
  const { totalDebit, totalCredit } = useMemo(() => {
    if (!rows) {
      return { totalDebit: "0.0000", totalCredit: "0.0000" };
    }
    let debitMinor = 0;
    let creditMinor = 0;
    for (const row of rows) {
      debitMinor += toMinorUnits(row.totalDebit);
      creditMinor += toMinorUnits(row.totalCredit);
    }
    return { totalDebit: fromMinorUnits(debitMinor), totalCredit: fromMinorUnits(creditMinor) };
  }, [rows]);

  const isBalanced = totalDebit === totalCredit;

  return (
    <div>
      {error && <p className="msg msg-error">{error}</p>}

      {isLoading ? (
        <p>Loading trial balance...</p>
      ) : !rows || rows.length === 0 ? (
        <p className="msg msg-muted">No posted activity yet.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Type</th>
              <th className="num">Total Debit</th>
              <th className="num">Total Credit</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.accountId}>
                <td>{row.accountCode}</td>
                <td>{row.accountName}</td>
                <td>{row.accountType}</td>
                <td className="num">{row.totalDebit}</td>
                <td className="num">{row.totalCredit}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td
                colSpan={3}
                className="strong total-row"
              >
                Grand Total
              </td>
              <td
                data-testid="grand-total-debit"
                className="num strong total-row"
              >
                {totalDebit}
              </td>
              <td
                data-testid="grand-total-credit"
                className="num strong total-row"
              >
                {totalCredit}
              </td>
            </tr>
            <tr>
              <td
                colSpan={5}
                className={isBalanced ? "balance-note text-success" : "balance-note text-danger"}
              >
                {isBalanced ? "✓ Ledger is balanced" : "⚠ Ledger is NOT balanced"}
              </td>
            </tr>
          </tfoot>
        </table>
      )}
    </div>
  );
}

export default TrialBalance;
