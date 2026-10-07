import { useMemo, useState } from "react";
import { useReferenceData } from "../useReferenceData";
import { DECIMAL_PATTERN, fromMinorUnits, toMinorUnits } from "../utils/money";

let lineKeySeq = 0;
function makeBlankLine() {
  lineKeySeq += 1;
  return { key: `line-${lineKeySeq}`, AccountId: "", Description: "", Debit: "", Credit: "" };
}


// onSubmit is the caller's createDraft (from useJournalEntries) — this
// component never calls apiClient for the create itself, so the entries
// list (owned by the parent) and this form's payload never diverge.
function JournalEntryForm({ onSubmit, onCancel }) {
  const journalsData = useReferenceData("/finance/journals");
  const accountsData = useReferenceData("/finance/accounts");

  const [journalId, setJournalId] = useState("");
  const [entryDate, setEntryDate] = useState("");
  const [narration, setNarration] = useState("");
  const [lines, setLines] = useState(() => [makeBlankLine(), makeBlankLine()]);
  const [formError, setFormError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeJournals = journalsData.items.filter((journal) => journal.IsActive);
  const activeAccounts = accountsData.items.filter((account) => account.IsActive);

  const updateLine = (key, field, value) => {
    setLines((prev) => prev.map((line) => (line.key === key ? { ...line, [field]: value } : line)));
  };

  const addLine = () => setLines((prev) => [...prev, makeBlankLine()]);
  const removeLine = (key) => setLines((prev) => prev.filter((line) => line.key !== key));

  // Exact decimal totals for the live preview — every line's Debit/Credit
  // stays a string until this point, and is only ever converted through
  // toMinorUnits (integer ten-thousandths), never parseFloat or +/- on the
  // raw text. This is what keeps the on-screen total from ever drifting
  // the way naive float summation would (e.g. 0.1 + 0.2 !== 0.3).
  const { totalDebitMinor, totalCreditMinor, hasInvalidAmount } = useMemo(() => {
    let debitSum = 0;
    let creditSum = 0;
    let invalid = false;
    for (const line of lines) {
      const debitText = line.Debit.trim() === "" ? "0" : line.Debit.trim();
      const creditText = line.Credit.trim() === "" ? "0" : line.Credit.trim();
      if (!DECIMAL_PATTERN.test(debitText) || !DECIMAL_PATTERN.test(creditText)) {
        invalid = true;
        continue;
      }
      debitSum += toMinorUnits(debitText);
      creditSum += toMinorUnits(creditText);
    }
    return { totalDebitMinor: debitSum, totalCreditMinor: creditSum, hasInvalidAmount: invalid };
  }, [lines]);

  const isBalanced = !hasInvalidAmount && totalDebitMinor === totalCreditMinor;
  const hasPositiveTotal = totalDebitMinor > 0;
  const hasEnoughLines = lines.length >= 2;
  const canSave =
    isBalanced && hasPositiveTotal && hasEnoughLines && journalId !== "" && entryDate !== "" && !isSubmitting;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError(null);

    if (!canSave) {
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        JournalId: Number(journalId),
        EntryDate: entryDate,
        Narration: narration || undefined,
        Lines: lines.map((line) => ({
          AccountId: Number(line.AccountId),
          Description: line.Description || undefined,
          Debit: line.Debit.trim() === "" ? "0" : line.Debit.trim(),
          Credit: line.Credit.trim() === "" ? "0" : line.Credit.trim(),
        })),
      };
      await onSubmit(payload);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card-form">
      <h2>New Journal Entry</h2>

      <div className="form-row">
        <div>
          <label htmlFor="je-journal">
            Journal
          </label>
          <select
            id="je-journal"
            value={journalId}
            onChange={(event) => setJournalId(event.target.value)}
            required
          >
            <option value="">Select...</option>
            {activeJournals.map((journal) => (
              <option key={journal.Id} value={journal.Id}>
                {journal.Code} — {journal.Name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="je-date">
            Date
          </label>
          <input
            id="je-date"
            type="date"
            value={entryDate}
            onChange={(event) => setEntryDate(event.target.value)}
            required
          />
        </div>
        <div className="grow">
          <label htmlFor="je-narration">
            Narration
          </label>
          <input
            id="je-narration"
            value={narration}
            onChange={(event) => setNarration(event.target.value)}
            maxLength={500}
          />
        </div>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Account</th>
            <th>Description</th>
            <th>Debit</th>
            <th>Credit</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {lines.map((line, index) => (
            <tr key={line.key}>
              <td>
                <select
                  value={line.AccountId}
                  onChange={(event) => updateLine(line.key, "AccountId", event.target.value)}
                  required
                  aria-label={`Line ${index + 1} account`}
                >
                  <option value="">Select...</option>
                  {activeAccounts.map((account) => (
                    <option key={account.Id} value={account.Id}>
                      {account.Code} — {account.Name}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <input
                  value={line.Description}
                  onChange={(event) => updateLine(line.key, "Description", event.target.value)}
                  maxLength={500}
                  aria-label={`Line ${index + 1} description`}
                />
              </td>
              <td>
                <input
                  value={line.Debit}
                  onChange={(event) => updateLine(line.key, "Debit", event.target.value)}
                  inputMode="decimal"
                  placeholder="0.00"
                  aria-label={`Line ${index + 1} debit`}
                />
              </td>
              <td>
                <input
                  value={line.Credit}
                  onChange={(event) => updateLine(line.key, "Credit", event.target.value)}
                  inputMode="decimal"
                  placeholder="0.00"
                  aria-label={`Line ${index + 1} credit`}
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
        <div>
          <strong>Total Debit:</strong> {fromMinorUnits(totalDebitMinor)}
        </div>
        <div>
          <strong>Total Credit:</strong> {fromMinorUnits(totalCreditMinor)}
        </div>
        <div className={isBalanced ? "text-success strong" : "text-danger strong"}>
          {isBalanced ? "Balanced" : "Not balanced"}
        </div>
      </div>

      {formError && <p className="msg msg-error">{formError}</p>}

      <div className="form-actions">
        <button type="submit" disabled={!canSave}>
          {isSubmitting ? "Saving..." : "Save Draft"}
        </button>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export default JournalEntryForm;
