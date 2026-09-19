import { useState } from "react";
import ReferenceDataTable from "../components/ReferenceDataTable";

const AMOUNT_TYPES = ["Percentage", "Fixed"];
const TAX_SCOPES = ["Sales", "Purchase"];
const DECIMAL_PATTERN = "^\\d+(\\.\\d{1,4})?$";
const inputStyle = { padding: "8px", boxSizing: "border-box" };
const labelStyle = { display: "block", fontSize: "13px", marginBottom: "4px", color: "#374151" };

const EMPTY_FORM = {
  Code: "",
  Name: "",
  AmountType: AMOUNT_TYPES[0],
  Amount: "",
  Scope: TAX_SCOPES[0],
  TaxAccountId: "",
  IsPriceIncluded: false,
};

function TaxesSection({ taxesData, accounts }) {
  const { items, isLoading, error, create, archive } = taxesData;
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeAccounts = accounts.filter((account) => account.IsActive);

  const handleChange = (field) => (event) => {
    const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError(null);

    if (!form.TaxAccountId) {
      setFormError("A tax account is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await create({
        Code: form.Code,
        Name: form.Name,
        AmountType: form.AmountType,
        Amount: form.Amount,
        Scope: form.Scope,
        TaxAccountId: Number(form.TaxAccountId),
        IsPriceIncluded: form.IsPriceIncluded,
      });
      setForm(EMPTY_FORM);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchive = async (id) => {
    setFormError(null);
    try {
      await archive(id);
    } catch (err) {
      setFormError(err.message);
    }
  };

  return (
    <div>
      <h2>Taxes</h2>

      <form onSubmit={handleSubmit} style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "flex-end" }}>
        <div>
          <label style={labelStyle} htmlFor="tax-code">Code</label>
          <input
            id="tax-code"
            value={form.Code}
            onChange={handleChange("Code")}
            required
            maxLength={20}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="tax-name">Name</label>
          <input
            id="tax-name"
            value={form.Name}
            onChange={handleChange("Name")}
            required
            maxLength={100}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="tax-amount-type">Amount Type</label>
          <select id="tax-amount-type" value={form.AmountType} onChange={handleChange("AmountType")} style={inputStyle}>
            {AMOUNT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle} htmlFor="tax-amount">Amount</label>
          <input
            id="tax-amount"
            value={form.Amount}
            onChange={handleChange("Amount")}
            required
            pattern={DECIMAL_PATTERN}
            placeholder="e.g. 15 or 15.0000"
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="tax-scope">Scope</label>
          <select id="tax-scope" value={form.Scope} onChange={handleChange("Scope")} style={inputStyle}>
            {TAX_SCOPES.map((scope) => (
              <option key={scope} value={scope}>
                {scope}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle} htmlFor="tax-account">Tax Account</label>
          <select
            id="tax-account"
            value={form.TaxAccountId}
            onChange={handleChange("TaxAccountId")}
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
        <div style={{ display: "flex", alignItems: "center", gap: "6px", paddingBottom: "8px" }}>
          <input
            id="tax-price-included"
            type="checkbox"
            checked={form.IsPriceIncluded}
            onChange={handleChange("IsPriceIncluded")}
          />
          <label htmlFor="tax-price-included" style={{ fontSize: "13px" }}>
            Price includes tax
          </label>
        </div>
        <button type="submit" disabled={isSubmitting} style={{ padding: "8px 16px" }}>
          {isSubmitting ? "Adding..." : "Add Tax"}
        </button>
      </form>

      {formError && <p style={{ color: "#dc2626" }}>{formError}</p>}
      {error && <p style={{ color: "#dc2626" }}>{error}</p>}
      {isLoading ? (
        <p>Loading taxes...</p>
      ) : (
        <ReferenceDataTable
          columns={[
            { key: "Code", label: "Code" },
            { key: "Name", label: "Name" },
            { key: "AmountType", label: "Amount Type" },
            { key: "Amount", label: "Amount" },
            { key: "Scope", label: "Scope" },
            { key: "IsPriceIncluded", label: "Price Incl.", render: (row) => (row.IsPriceIncluded ? "Yes" : "No") },
            {
              key: "TaxAccount",
              label: "Tax Account",
              render: (row) => (row.TaxAccount ? `${row.TaxAccount.Code} — ${row.TaxAccount.Name}` : "—"),
            },
          ]}
          rows={items}
          onArchive={handleArchive}
          emptyLabel="No taxes yet."
        />
      )}
    </div>
  );
}

export default TaxesSection;
