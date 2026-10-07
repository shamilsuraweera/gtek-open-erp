import { useMemo, useState } from "react";
import { useReferenceData } from "../finance/useReferenceData";
import { fromMinorUnits, multiplyMinorUnits, toMinorUnits } from "../finance/utils/money";

let lineKeySeq = 0;
function makeBlankLine() {
  lineKeySeq += 1;
  return { key: `line-${lineKeySeq}`, ProductId: "", Quantity: "1", UnitPrice: "" };
}


// onSubmit is the caller's createDraft (from useInvoices) — this component
// never calls apiClient for the create itself, so the invoice list (owned
// by the parent) and this form's payload never diverge.
function InvoiceForm({ onSubmit, onCancel }) {
  const contactsData = useReferenceData("/contacts");
  const productsData = useReferenceData("/inventory/products");

  const [contactId, setContactId] = useState("");
  const [date, setDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [lines, setLines] = useState(() => [makeBlankLine()]);
  const [formError, setFormError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeContacts = contactsData.items.filter((contact) => contact.IsActive && contact.IsCustomer);
  const activeProducts = productsData.items.filter((product) => product.IsActive);
  const productsById = useMemo(
    () => new Map(activeProducts.map((product) => [String(product.Id), product])),
    [activeProducts],
  );

  const updateLine = (key, field, value) => {
    setLines((prev) =>
      prev.map((line) => {
        if (line.key !== key) {
          return line;
        }
        const next = { ...line, [field]: value };
        if (field === "ProductId") {
          const product = productsById.get(value);
          // Auto-fill UnitPrice from the selected product's SalePrice; the
          // value stays a plain editable input afterward, not locked.
          next.UnitPrice = product ? product.SalePrice : line.UnitPrice;
        }
        return next;
      }),
    );
  };

  const addLine = () => setLines((prev) => [...prev, makeBlankLine()]);
  const removeLine = (key) => setLines((prev) => prev.filter((line) => line.key !== key));

  // Live per-line and total amounts via exact integer minor-unit math —
  // never parseFloat or native +/- on the raw strings, same rule as the
  // Journal Entry form's live balance preview.
  const lineTotalsMinor = useMemo(
    () =>
      lines.map((line) => {
        const quantityMinor = toMinorUnits(line.Quantity || "0");
        const unitPriceMinor = toMinorUnits(line.UnitPrice || "0");
        return multiplyMinorUnits(quantityMinor, unitPriceMinor);
      }),
    [lines],
  );
  const totalMinor = lineTotalsMinor.reduce((sum, minor) => sum + minor, 0);

  const hasValidLines =
    lines.length > 0 && lines.every((line) => line.ProductId && toMinorUnits(line.Quantity || "0") > 0);
  const canSave = contactId !== "" && date !== "" && dueDate !== "" && hasValidLines && !isSubmitting;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError(null);

    if (!canSave) {
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ContactId: Number(contactId),
        Date: date,
        DueDate: dueDate,
        Lines: lines.map((line) => ({
          ProductId: Number(line.ProductId),
          Quantity: line.Quantity.trim() === "" ? "0" : line.Quantity.trim(),
          UnitPrice: line.UnitPrice.trim() === "" ? "0" : line.UnitPrice.trim(),
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
      <h2>New Invoice</h2>

      <div className="form-row">
        <div>
          <label htmlFor="inv-contact">
            Customer
          </label>
          <select
            id="inv-contact"
            value={contactId}
            onChange={(event) => setContactId(event.target.value)}
            required
          >
            <option value="">Select...</option>
            {activeContacts.map((contact) => (
              <option key={contact.Id} value={contact.Id}>
                {contact.Name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="inv-date">
            Date
          </label>
          <input
            id="inv-date"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="inv-due-date">
            Due Date
          </label>
          <input
            id="inv-due-date"
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
            required
          />
        </div>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Quantity</th>
            <th>Unit Price</th>
            <th>Line Total</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {lines.map((line, index) => (
            <tr key={line.key}>
              <td>
                <select
                  value={line.ProductId}
                  onChange={(event) => updateLine(line.key, "ProductId", event.target.value)}
                  required
                  aria-label={`Line ${index + 1} product`}
                >
                  <option value="">Select...</option>
                  {activeProducts.map((product) => (
                    <option key={product.Id} value={product.Id}>
                      {product.SKU} — {product.Name}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <input
                  value={line.Quantity}
                  onChange={(event) => updateLine(line.key, "Quantity", event.target.value)}
                  type="number"
                  min="0"
                  step="any"
                  aria-label={`Line ${index + 1} quantity`}
                />
              </td>
              <td>
                <input
                  value={line.UnitPrice}
                  onChange={(event) => updateLine(line.key, "UnitPrice", event.target.value)}
                  inputMode="decimal"
                  placeholder="0.00"
                  aria-label={`Line ${index + 1} unit price`}
                />
              </td>
              <td>{fromMinorUnits(lineTotalsMinor[index] ?? 0)}</td>
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
        <strong>Total Amount:</strong> {fromMinorUnits(totalMinor)}
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

export default InvoiceForm;
