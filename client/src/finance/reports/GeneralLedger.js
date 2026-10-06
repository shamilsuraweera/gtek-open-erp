import { useState } from "react";
import { useReferenceData } from "../useReferenceData";
import { useReport } from "../useReport";

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
const labelStyle = { display: "block", fontSize: "13px", marginBottom: "4px", color: "#374151" };
const inputStyle = { padding: "8px", boxSizing: "border-box" };

function GeneralLedger() {
  const accountsData = useReferenceData("/finance/accounts");
  const [accountId, setAccountId] = useState("");

  // useReport refetches whenever this URL changes, and clears its data
  // when it's null — exactly the "no account selected yet" state.
  const reportUrl = accountId ? `/finance/reports/general-ledger?accountId=${accountId}` : null;
  const { data: rows, isLoading, error } = useReport(reportUrl);

  const activeAccounts = accountsData.items.filter((account) => account.IsActive);

  return (
    <div>
      <h2>General Ledger</h2>

      <div style={{ marginBottom: "20px" }}>
        <label style={labelStyle} htmlFor="gl-account">
          Account
        </label>
        <select
          id="gl-account"
          value={accountId}
          onChange={(event) => setAccountId(event.target.value)}
          style={inputStyle}
        >
          <option value="">Select an account...</option>
          {activeAccounts.map((account) => (
            <option key={account.Id} value={account.Id}>
              {account.Code} — {account.Name}
            </option>
          ))}
        </select>
      </div>

      {error && <p style={{ color: "#dc2626" }}>{error}</p>}

      {!accountId ? (
        <p style={{ color: "#6b7280" }}>Select an account to view its ledger.</p>
      ) : isLoading ? (
        <p>Loading ledger...</p>
      ) : !rows || rows.length === 0 ? (
        <p style={{ color: "#6b7280" }}>No posted activity for this account yet.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "12px" }}>
          <thead>
            <tr>
              <th style={thStyle}>Date</th>
              <th style={thStyle}>Reference</th>
              <th style={thStyle}>Description</th>
              <th style={numericTh}>Debit</th>
              <th style={numericTh}>Credit</th>
              <th style={numericTh}>Running Balance</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.lineId}>
                <td style={tdStyle}>{row.entryDate}</td>
                <td style={tdStyle}>{row.reference}</td>
                <td style={tdStyle}>{row.description || "—"}</td>
                <td style={numericTd}>{row.debit}</td>
                <td style={numericTd}>{row.credit}</td>
                <td style={{ ...numericTd, fontWeight: "bold" }}>{row.runningBalance}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default GeneralLedger;
