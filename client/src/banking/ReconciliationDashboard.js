import { useEffect, useState } from "react";
import { useReferenceData } from "../finance/useReferenceData";
import apiClient from "../api/client";

const inputStyle = { padding: "8px", boxSizing: "border-box" };
const labelStyle = { display: "block", fontSize: "13px", marginBottom: "4px", color: "#374151" };
const thStyle = {
  textAlign: "left",
  padding: "8px 12px",
  borderBottom: "2px solid #e5e7eb",
  fontSize: "13px",
  color: "#6b7280",
  textTransform: "uppercase",
};
const tdStyle = { padding: "8px 12px", borderBottom: "1px solid #f3f4f6" };

function ReconciliationDashboard() {
  const accountsData = useReferenceData("/finance/accounts");
  const [accountId, setAccountId] = useState("");
  const [bankLines, setBankLines] = useState([]);
  const [ledgerLines, setLedgerLines] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedBankLineId, setSelectedBankLineId] = useState(null);
  const [selectedLedgerLineId, setSelectedLedgerLineId] = useState(null);
  const [isMatching, setIsMatching] = useState(false);
  const [matchError, setMatchError] = useState(null);

  const activeAccounts = accountsData.items.filter((account) => account.IsActive);

  useEffect(() => {
    setSelectedBankLineId(null);
    setSelectedLedgerLineId(null);
    setMatchError(null);

    if (!accountId) {
      setBankLines([]);
      setLedgerLines([]);
      return;
    }

    let isCurrent = true;
    setIsLoading(true);
    setError(null);

    Promise.all([
      apiClient.get(`/banking/reconciliation/unreconciled-bank-lines?accountId=${accountId}`),
      apiClient.get(`/banking/reconciliation/unreconciled-ledger-lines?accountId=${accountId}`),
    ])
      .then(([bankRes, ledgerRes]) => {
        if (isCurrent) {
          setBankLines(bankRes.data);
          setLedgerLines(ledgerRes.data);
        }
      })
      .catch((err) => {
        if (isCurrent) {
          setError(err.message);
        }
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [accountId]);

  const handleMatch = async () => {
    if (selectedBankLineId === null || selectedLedgerLineId === null) {
      return;
    }
    setMatchError(null);
    setIsMatching(true);
    try {
      await apiClient.post("/banking/reconciliation/match", {
        BankLineId: selectedBankLineId,
        JournalLineId: selectedLedgerLineId,
      });
      // Optimistic removal: the match succeeded server-side, so both lines
      // are no longer "unreconciled" — drop them from both lists
      // immediately rather than refetching.
      setBankLines((prev) => prev.filter((line) => line.Id !== selectedBankLineId));
      setLedgerLines((prev) => prev.filter((line) => line.Id !== selectedLedgerLineId));
      setSelectedBankLineId(null);
      setSelectedLedgerLineId(null);
    } catch (err) {
      setMatchError(err.message);
    } finally {
      setIsMatching(false);
    }
  };

  const canMatch = selectedBankLineId !== null && selectedLedgerLineId !== null;

  const rowStyle = (isSelected) => ({
    cursor: "pointer",
    background: isSelected ? "#dbeafe" : "transparent",
  });

  return (
    <div>
      <h2>Bank Reconciliation</h2>

      <div style={{ marginBottom: "20px" }}>
        <label style={labelStyle} htmlFor="reconcile-account">
          Account
        </label>
        <select
          id="reconcile-account"
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
      {matchError && <p style={{ color: "#dc2626" }}>{matchError}</p>}

      {!accountId ? (
        <p style={{ color: "#6b7280" }}>Select an account to begin reconciling.</p>
      ) : isLoading ? (
        <p>Loading unreconciled lines...</p>
      ) : (
        <>
          <div style={{ display: "flex", gap: "24px", alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <h3>Unreconciled Bank Lines</h3>
              {bankLines.length === 0 ? (
                <p style={{ color: "#6b7280" }}>No unreconciled bank lines.</p>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Date</th>
                      <th style={thStyle}>Description</th>
                      <th style={thStyle}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bankLines.map((line) => (
                      <tr
                        key={line.Id}
                        onClick={() => setSelectedBankLineId(line.Id)}
                        style={rowStyle(selectedBankLineId === line.Id)}
                      >
                        <td style={tdStyle}>{line.Date}</td>
                        <td style={tdStyle}>{line.Description}</td>
                        <td style={tdStyle}>{line.Amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div style={{ flex: 1 }}>
              <h3>Unreconciled Ledger Lines</h3>
              {ledgerLines.length === 0 ? (
                <p style={{ color: "#6b7280" }}>No unreconciled ledger lines.</p>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Date</th>
                      <th style={thStyle}>Reference</th>
                      <th style={thStyle}>Debit</th>
                      <th style={thStyle}>Credit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledgerLines.map((line) => (
                      <tr
                        key={line.Id}
                        onClick={() => setSelectedLedgerLineId(line.Id)}
                        style={rowStyle(selectedLedgerLineId === line.Id)}
                      >
                        <td style={tdStyle}>{line.JournalEntry ? line.JournalEntry.EntryDate : "—"}</td>
                        <td style={tdStyle}>{line.JournalEntry ? line.JournalEntry.Reference : "—"}</td>
                        <td style={tdStyle}>{line.Debit}</td>
                        <td style={tdStyle}>{line.Credit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {canMatch && (
            <div style={{ marginTop: "24px", textAlign: "center" }}>
              <button
                type="button"
                onClick={handleMatch}
                disabled={isMatching}
                style={{ padding: "12px 32px", fontSize: "15px" }}
              >
                {isMatching ? "Matching..." : "Match"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ReconciliationDashboard;
