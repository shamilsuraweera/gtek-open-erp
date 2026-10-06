import { useMemo, useState } from "react";
import { useReferenceData } from "../finance/useReferenceData";
import { fromMinorUnits, multiplyMinorUnits, toMinorUnits } from "../finance/utils/money";

let lineKeySeq = 0;
function makeBlankLine() {
  lineKeySeq += 1;
  return { key: `line-${lineKeySeq}`, ProductId: "", Quantity: "1", UnitPrice: "" };
}

const inputStyle = { padding: "8px", boxSizing: "border-box", width: "100%" };
const labelStyle = { display: "block", fontSize: "13px", marginBottom: "4px", color: "#374151" };
const thStyle = { textAlign: "left", padding: "6px 8px", fontSize: "12px", color: "#6b7280", textTransform: "uppercase" };
const tdStyle = { padding: "6px 8px" };

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
    <form onSubmit={handleSubmit}>
      <h2>New Invoice</h2>

      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "20px" }}>
        <div>
          <label style={labelStyle} htmlFor="inv-contact">
            Customer
          </label>
          <select
            id="inv-contact"
            value={contactId}
            onChange={(event) => setContactId(event.target.value)}
            required
            style={inputStyle}
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
          <label style={labelStyle} htmlFor="inv-date">
            Date
          </label>
          <input
            id="inv-date"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            required
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="inv-due-date">
            Due Date
          </label>
          <input
            id="inv-due-date"
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
            required
            style={inputStyle}
          />
        </div>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={thStyle}>Product</th>
            <th style={thStyle}>Quantity</th>
            <th style={thStyle}>Unit Price</th>
            <th style={thStyle}>Line Total</th>
            <th style={thStyle} />
          </tr>
        </thead>
        <tbody>
          {lines.map((line, index) => (
            <tr key={line.key}>
              <td style={tdStyle}>
                <select
                  value={line.ProductId}
                  onChange={(event) => updateLine(line.key, "ProductId", event.target.value)}
                  required
                  style={inputStyle}
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
              <td style={tdStyle}>
                <input
                  value={line.Quantity}
                  onChange={(event) => updateLine(line.key, "Quantity", event.target.value)}
                  type="number"
                  min="0"
                  step="any"
                  style={inputStyle}
                  aria-label={`Line ${index + 1} quantity`}
                />
              </td>
              <td style={tdStyle}>
                <input
                  value={line.UnitPrice}
                  onChange={(event) => updateLine(line.key, "UnitPrice", event.target.value)}
                  inputMode="decimal"
                  placeholder="0.00"
                  style={inputStyle}
                  aria-label={`Line ${index + 1} unit price`}
                />
              </td>
              <td style={tdStyle}>{fromMinorUnits(lineTotalsMinor[index] ?? 0)}</td>
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
        <strong>Total Amount:</strong> {fromMinorUnits(totalMinor)}
      </div>

      {formError && <p style={{ color: "#dc2626" }}>{formError}</p>}

      <div style={{ marginTop: "16px", display: "flex", gap: "8px" }}>
        <button type="submit" disabled={!canSave} style={{ padding: "10px 20px" }}>
          {isSubmitting ? "Saving..." : "Save Draft"}
        </button>
        <button type="button" onClick={onCancel} style={{ padding: "10px 20px" }}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export default InvoiceForm;
