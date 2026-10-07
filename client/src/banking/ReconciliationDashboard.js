import { useEffect, useState } from "react";
import { useReferenceData } from "../finance/useReferenceData";
import apiClient from "../api/client";


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

  return (
    <div>
      <h2>Bank Reconciliation</h2>

      <div className="field">
        <label htmlFor="reconcile-account">
          Account
        </label>
        <select
          id="reconcile-account"
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
      {matchError && <p className="msg msg-error">{matchError}</p>}

      {!accountId ? (
        <p className="msg msg-muted">Select an account to begin reconciling.</p>
      ) : isLoading ? (
        <p>Loading unreconciled lines...</p>
      ) : (
        <>
          <div className="split">
            <div className="grow">
              <h3>Unreconciled Bank Lines</h3>
              {bankLines.length === 0 ? (
                <p className="msg msg-muted">No unreconciled bank lines.</p>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Description</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bankLines.map((line) => (
                      <tr
                        key={line.Id}
                        onClick={() => setSelectedBankLineId(line.Id)}
                        className={selectedBankLineId === line.Id ? "row-selected" : "row-selectable"}
                      >
                        <td>{line.Date}</td>
                        <td>{line.Description}</td>
                        <td>{line.Amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="grow">
              <h3>Unreconciled Ledger Lines</h3>
              {ledgerLines.length === 0 ? (
                <p className="msg msg-muted">No unreconciled ledger lines.</p>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Reference</th>
                      <th>Debit</th>
                      <th>Credit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledgerLines.map((line) => (
                      <tr
                        key={line.Id}
                        onClick={() => setSelectedLedgerLineId(line.Id)}
                        className={selectedLedgerLineId === line.Id ? "row-selected" : "row-selectable"}
                      >
                        <td>{line.JournalEntry ? line.JournalEntry.EntryDate : "—"}</td>
                        <td>{line.JournalEntry ? line.JournalEntry.Reference : "—"}</td>
                        <td>{line.Debit}</td>
                        <td>{line.Credit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {canMatch && (
            <div className="center">
              <button
                type="button"
                onClick={handleMatch}
                disabled={isMatching}
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
