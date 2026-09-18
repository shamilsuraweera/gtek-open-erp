import { useMemo } from "react";
import { useReport } from "../useReport";
import { fromMinorUnits, toMinorUnits } from "../utils/money";

const thStyle = {
  textAlign: "left",
  padding: "8px 12px",
  borderBottom: "2px solid #e5e7eb",
  fontSize: "13px",
  color: "#6b7280",
  textTransform: "uppercase",
};
const tdStyle = { padding: "8px 12px", borderBottom: "1px solid #f3f4f6" };
const numericTh = { ...thStyle, textAlign: "right" };
const numericTd = { ...tdStyle, textAlign: "right" };

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
      <h2>Trial Balance</h2>

      {error && <p style={{ color: "#dc2626" }}>{error}</p>}

      {isLoading ? (
        <p>Loading trial balance...</p>
      ) : !rows || rows.length === 0 ? (
        <p style={{ color: "#6b7280" }}>No posted activity yet.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "12px" }}>
          <thead>
            <tr>
              <th style={thStyle}>Code</th>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Type</th>
              <th style={numericTh}>Total Debit</th>
              <th style={numericTh}>Total Credit</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.accountId}>
                <td style={tdStyle}>{row.accountCode}</td>
                <td style={tdStyle}>{row.accountName}</td>
                <td style={tdStyle}>{row.accountType}</td>
                <td style={numericTd}>{row.totalDebit}</td>
                <td style={numericTd}>{row.totalCredit}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td
                colSpan={3}
                style={{ ...tdStyle, fontWeight: "bold", borderTop: "2px solid #111827" }}
              >
                Grand Total
              </td>
              <td
                data-testid="grand-total-debit"
                style={{ ...numericTd, fontWeight: "bold", borderTop: "2px solid #111827" }}
              >
                {totalDebit}
              </td>
              <td
                data-testid="grand-total-credit"
                style={{ ...numericTd, fontWeight: "bold", borderTop: "2px solid #111827" }}
              >
                {totalCredit}
              </td>
            </tr>
            <tr>
              <td
                colSpan={5}
                style={{
                  padding: "10px 12px",
                  textAlign: "center",
                  fontWeight: "bold",
                  color: isBalanced ? "#16a34a" : "#dc2626",
                }}
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
