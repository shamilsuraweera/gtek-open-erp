import { useMemo, useState } from "react";
import { useReferenceData } from "../finance/useReferenceData";
import { useBankStatements } from "./useBankStatements";
import { fromMinorUnits, toMinorUnits } from "../finance/utils/money";

let lineKeySeq = 0;
function makeBlankLine() {
  lineKeySeq += 1;
  return { key: `line-${lineKeySeq}`, Date: "", Description: "", Amount: "" };
}


const EMPTY_FORM = { AccountId: "", StatementDate: "", Reference: "", StartingBalance: "" };

function BankStatements() {
  const accountsData = useReferenceData("/finance/accounts");
  const { statements, isLoading, error, createDraft } = useBankStatements();

  const [form, setForm] = useState(EMPTY_FORM);
  const [lines, setLines] = useState(() => [makeBlankLine()]);
  const [formError, setFormError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeAccounts = accountsData.items.filter((account) => account.IsActive);

  const handleFormChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const updateLine = (key, field, value) => {
    setLines((prev) => prev.map((line) => (line.key === key ? { ...line, [field]: value } : line)));
  };
  const addLine = () => setLines((prev) => [...prev, makeBlankLine()]);
  const removeLine = (key) => setLines((prev) => prev.filter((line) => line.key !== key));

  // EndingBalance preview via exact integer minor-unit math — never
  // parseFloat/+ on the raw signed strings, same rule as every other
  // money computation in the app.
  const endingBalanceMinor = useMemo(() => {
    const startingMinor = toMinorUnits(form.StartingBalance || "0");
    return lines.reduce((sum, line) => sum + toMinorUnits(line.Amount || "0"), startingMinor);
  }, [form.StartingBalance, lines]);

  const canSave =
    form.AccountId !== "" &&
    form.StatementDate !== "" &&
    form.Reference.trim() !== "" &&
    form.StartingBalance.trim() !== "" &&
    lines.length > 0 &&
    lines.every(
      (line) => line.Date !== "" && line.Description.trim() !== "" && toMinorUnits(line.Amount || "0") !== 0,
    ) &&
    !isSubmitting;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError(null);

    if (!canSave) {
      return;
    }

    setIsSubmitting(true);
    try {
      await createDraft({
        AccountId: Number(form.AccountId),
        StatementDate: form.StatementDate,
        Reference: form.Reference.trim(),
        StartingBalance: form.StartingBalance.trim(),
        Lines: lines.map((line) => ({
          Date: line.Date,
          Description: line.Description.trim(),
          Amount: line.Amount.trim(),
        })),
      });
      setForm(EMPTY_FORM);
      setLines([makeBlankLine()]);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="card-form">
        <div className="form-row">
          <div>
            <label htmlFor="stmt-account">
              Account
            </label>
            <select
              id="stmt-account"
              value={form.AccountId}
              onChange={handleFormChange("AccountId")}
              required
            >
              <option value="">Select...</option>
              {activeAccounts.map((account) => (
                <option key={account.Id} value={account.Id}>
                  {account.Code} — {account.Name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="stmt-date">
              Statement Date
            </label>
            <input
              id="stmt-date"
              type="date"
              value={form.StatementDate}
              onChange={handleFormChange("StatementDate")}
              required
            />
          </div>
          <div>
            <label htmlFor="stmt-reference">
              Reference
            </label>
            <input
              id="stmt-reference"
              value={form.Reference}
              onChange={handleFormChange("Reference")}
              required
              maxLength={100}
            />
          </div>
          <div>
            <label htmlFor="stmt-starting-balance">
              Starting Balance
            </label>
            <input
              id="stmt-starting-balance"
              value={form.StartingBalance}
              onChange={handleFormChange("StartingBalance")}
              inputMode="decimal"
              placeholder="0.00"
              required
            />
          </div>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Amount</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {lines.map((line, index) => (
              <tr key={line.key}>
                <td>
                  <input
                    type="date"
                    value={line.Date}
                    onChange={(event) => updateLine(line.key, "Date", event.target.value)}
                    required
                    aria-label={`Line ${index + 1} date`}
                  />
                </td>
                <td>
                  <input
                    value={line.Description}
                    onChange={(event) => updateLine(line.key, "Description", event.target.value)}
                    required
                    maxLength={500}
                    aria-label={`Line ${index + 1} description`}
                  />
                </td>
                <td>
                  <input
                    value={line.Amount}
                    onChange={(event) => updateLine(line.key, "Amount", event.target.value)}
                    inputMode="decimal"
                    placeholder="e.g. 250.00 or -75.25"
                    aria-label={`Line ${index + 1} amount`}
                  />
                </td>
                <td>
                  <button
                    type="button"
                    onClick={() => removeLine(line.key)}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <button type="button" onClick={addLine}>
          + Add Line
        </button>

        <div className="summary-bar">
          <strong>Ending Balance:</strong> {fromMinorUnits(endingBalanceMinor)}
        </div>

        {formError && <p className="msg msg-error">{formError}</p>}

        <button type="submit" disabled={!canSave}>
          {isSubmitting ? "Saving..." : "Save Statement"}
        </button>
      </form>

      <h3>Existing Statements</h3>
      {error && <p className="msg msg-error">{error}</p>}
      {isLoading ? (
        <p>Loading statements...</p>
      ) : statements.length === 0 ? (
        <p className="msg msg-muted">No bank statements yet.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Reference</th>
              <th>Account</th>
              <th>Statement Date</th>
              <th>Starting Balance</th>
              <th>Ending Balance</th>
            </tr>
          </thead>
          <tbody>
            {statements.map((statement) => (
              <tr key={statement.Id}>
                <td>{statement.Reference}</td>
                <td>
                  {statement.Account ? `${statement.Account.Code} — ${statement.Account.Name}` : "—"}
                </td>
                <td>{statement.StatementDate}</td>
                <td>{statement.StartingBalance}</td>
                <td>{statement.EndingBalance}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default BankStatements;
