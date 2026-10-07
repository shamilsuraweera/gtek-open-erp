import { useState } from "react";
import { useReferenceData } from "../useReferenceData";
import { useReport } from "../useReport";


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
      <div className="field">
        <label htmlFor="gl-account">
          Account
        </label>
        <select
          id="gl-account"
          value={accountId}
          onChange={(event) => setAccountId(event.target.value)}
        >
          <option value="">Select an account...</option>
          {activeAccounts.map((account) => (
            <option key={account.Id} value={account.Id}>
              {account.Code} — {account.Name}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="msg msg-error">{error}</p>}

      {!accountId ? (
        <p className="msg msg-muted">Select an account to view its ledger.</p>
      ) : isLoading ? (
        <p>Loading ledger...</p>
      ) : !rows || rows.length === 0 ? (
        <p className="msg msg-muted">No posted activity for this account yet.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Reference</th>
              <th>Description</th>
              <th className="num">Debit</th>
              <th className="num">Credit</th>
              <th className="num">Running Balance</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.lineId}>
                <td>{row.entryDate}</td>
                <td>{row.reference}</td>
                <td>{row.description || "—"}</td>
                <td className="num">{row.debit}</td>
                <td className="num">{row.credit}</td>
                <td className="num strong">{row.runningBalance}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default GeneralLedger;
