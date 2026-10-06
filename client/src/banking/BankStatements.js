import { useMemo, useState } from "react";
import { useReferenceData } from "../finance/useReferenceData";
import { useBankStatements } from "./useBankStatements";
import { fromMinorUnits, toMinorUnits } from "../finance/utils/money";

let lineKeySeq = 0;
function makeBlankLine() {
  lineKeySeq += 1;
  return { key: `line-${lineKeySeq}`, Date: "", Description: "", Amount: "" };
}

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
      <h2>Bank Statements</h2>

      <form onSubmit={handleSubmit}>
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "20px" }}>
          <div>
            <label style={labelStyle} htmlFor="stmt-account">
              Account
            </label>
            <select
              id="stmt-account"
              value={form.AccountId}
              onChange={handleFormChange("AccountId")}
              required
              style={inputStyle}
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
            <label style={labelStyle} htmlFor="stmt-date">
              Statement Date
            </label>
            <input
              id="stmt-date"
              type="date"
              value={form.StatementDate}
              onChange={handleFormChange("StatementDate")}
              required
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle} htmlFor="stmt-reference">
              Reference
            </label>
            <input
              id="stmt-reference"
              value={form.Reference}
              onChange={handleFormChange("Reference")}
              required
              maxLength={100}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle} htmlFor="stmt-starting-balance">
              Starting Balance
            </label>
            <input
              id="stmt-starting-balance"
              value={form.StartingBalance}
              onChange={handleFormChange("StartingBalance")}
              inputMode="decimal"
              placeholder="0.00"
              required
              style={inputStyle}
            />
          </div>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={thStyle}>Date</th>
              <th style={thStyle}>Description</th>
              <th style={thStyle}>Amount</th>
              <th style={thStyle} />
            </tr>
          </thead>
          <tbody>
            {lines.map((line, index) => (
              <tr key={line.key}>
                <td style={tdStyle}>
                  <input
                    type="date"
                    value={line.Date}
                    onChange={(event) => updateLine(line.key, "Date", event.target.value)}
                    required
                    style={inputStyle}
                    aria-label={`Line ${index + 1} date`}
                  />
                </td>
                <td style={tdStyle}>
                  <input
                    value={line.Description}
                    onChange={(event) => updateLine(line.key, "Description", event.target.value)}
                    required
                    maxLength={500}
                    style={inputStyle}
                    aria-label={`Line ${index + 1} description`}
                  />
                </td>
                <td style={tdStyle}>
                  <input
                    value={line.Amount}
                    onChange={(event) => updateLine(line.key, "Amount", event.target.value)}
                    inputMode="decimal"
                    placeholder="e.g. 250.00 or -75.25"
                    style={inputStyle}
                    aria-label={`Line ${index + 1} amount`}
                  />
                </td>
                <td style={tdStyle}>
                  <button
                    type="button"
                    onClick={() => removeLine(line.key)}
                    style={{ padding: "4px 8px", cursor: "pointer" }}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <button type="button" onClick={addLine} style={{ marginTop: "8px", padding: "6px 12px" }}>
          + Add Line
        </button>

        <div
          style={{
            marginTop: "20px",
            padding: "12px 16px",
            background: "#f9fafb",
            borderRadius: "6px",
          }}
        >
          <strong>Ending Balance:</strong> {fromMinorUnits(endingBalanceMinor)}
        </div>

        {formError && <p style={{ color: "#dc2626" }}>{formError}</p>}

        <button type="submit" disabled={!canSave} style={{ marginTop: "16px", padding: "10px 20px" }}>
          {isSubmitting ? "Saving..." : "Save Statement"}
        </button>
      </form>

      <h3 style={{ marginTop: "32px" }}>Existing Statements</h3>
      {error && <p style={{ color: "#dc2626" }}>{error}</p>}
      {isLoading ? (
        <p>Loading statements...</p>
      ) : statements.length === 0 ? (
        <p style={{ color: "#6b7280" }}>No bank statements yet.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "12px" }}>
          <thead>
            <tr>
              <th style={thStyle}>Reference</th>
              <th style={thStyle}>Account</th>
              <th style={thStyle}>Statement Date</th>
              <th style={thStyle}>Starting Balance</th>
              <th style={thStyle}>Ending Balance</th>
            </tr>
          </thead>
          <tbody>
            {statements.map((statement) => (
              <tr key={statement.Id}>
                <td style={tdStyle}>{statement.Reference}</td>
                <td style={tdStyle}>
                  {statement.Account ? `${statement.Account.Code} — ${statement.Account.Name}` : "—"}
                </td>
                <td style={tdStyle}>{statement.StatementDate}</td>
                <td style={tdStyle}>{statement.StartingBalance}</td>
                <td style={tdStyle}>{statement.EndingBalance}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default BankStatements;
