import { useState } from "react";
import { Link } from "react-router-dom";
// Reused directly from Finance rather than duplicated: both hook and table
// are fully generic (parametrized by endpoint / columns config only), same
// as how the Inventory module already reuses them.
import { useReferenceData } from "../finance/useReferenceData";
import ReferenceDataTable from "../finance/components/ReferenceDataTable";

const inputStyle = { padding: "8px", boxSizing: "border-box" };
const labelStyle = { display: "block", fontSize: "13px", marginBottom: "4px", color: "#374151" };
const checkboxLabelStyle = { display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", paddingBottom: "8px" };

const EMPTY_FORM = {
  Name: "",
  Email: "",
  Phone: "",
  IsCustomer: true,
  IsVendor: false,
  AccountsReceivableId: "",
  AccountsPayableId: "",
};

function Contacts() {
  const contactsData = useReferenceData("/contacts");
  const accountsData = useReferenceData("/finance/accounts");

  const { items, isLoading, error, create, archive } = contactsData;
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeAccounts = accountsData.items.filter((account) => account.IsActive);

  const handleChange = (field) => (event) => {
    const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError(null);
    setIsSubmitting(true);
    try {
      await create({
        Name: form.Name,
        Email: form.Email || undefined,
        Phone: form.Phone || undefined,
        IsCustomer: form.IsCustomer,
        IsVendor: form.IsVendor,
        AccountsReceivableId: form.AccountsReceivableId ? Number(form.AccountsReceivableId) : undefined,
        AccountsPayableId: form.AccountsPayableId ? Number(form.AccountsPayableId) : undefined,
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
    <div style={{ fontFamily: "sans-serif", padding: "40px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ margin: 0 }}>Contacts</h1>
        <Link to="/" style={{ color: "#2563eb" }}>
          ← Dashboard
        </Link>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "flex-end" }}>
        <div>
          <label style={labelStyle} htmlFor="contact-name">
            Name
          </label>
          <input
            id="contact-name"
            value={form.Name}
            onChange={handleChange("Name")}
            required
            maxLength={200}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="contact-email">
            Email (optional)
          </label>
          <input
            id="contact-email"
            type="email"
            value={form.Email}
            onChange={handleChange("Email")}
            maxLength={255}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="contact-phone">
            Phone (optional)
          </label>
          <input
            id="contact-phone"
            value={form.Phone}
            onChange={handleChange("Phone")}
            maxLength={50}
            style={inputStyle}
          />
        </div>
        <label style={checkboxLabelStyle} htmlFor="contact-is-customer">
          <input
            id="contact-is-customer"
            type="checkbox"
            checked={form.IsCustomer}
            onChange={handleChange("IsCustomer")}
          />
          Customer
        </label>
        <label style={checkboxLabelStyle} htmlFor="contact-is-vendor">
          <input id="contact-is-vendor" type="checkbox" checked={form.IsVendor} onChange={handleChange("IsVendor")} />
          Vendor
        </label>
        <div>
          <label style={labelStyle} htmlFor="contact-ar-account">
            AR Account (optional)
          </label>
          <select
            id="contact-ar-account"
            value={form.AccountsReceivableId}
            onChange={handleChange("AccountsReceivableId")}
            style={inputStyle}
          >
            <option value="">— none —</option>
            {activeAccounts.map((account) => (
              <option key={account.Id} value={account.Id}>
                {account.Code} — {account.Name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle} htmlFor="contact-ap-account">
            AP Account (optional)
          </label>
          <select
            id="contact-ap-account"
            value={form.AccountsPayableId}
            onChange={handleChange("AccountsPayableId")}
            style={inputStyle}
          >
            <option value="">— none —</option>
            {activeAccounts.map((account) => (
              <option key={account.Id} value={account.Id}>
                {account.Code} — {account.Name}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" disabled={isSubmitting} style={{ padding: "8px 16px" }}>
          {isSubmitting ? "Adding..." : "Add Contact"}
        </button>
      </form>

      {formError && <p style={{ color: "#dc2626" }}>{formError}</p>}
      {error && <p style={{ color: "#dc2626" }}>{error}</p>}
      {isLoading ? (
        <p>Loading contacts...</p>
      ) : (
        <ReferenceDataTable
          columns={[
            { key: "Name", label: "Name" },
            { key: "Email", label: "Email", render: (row) => row.Email || "—" },
            { key: "Phone", label: "Phone", render: (row) => row.Phone || "—" },
            { key: "IsCustomer", label: "Customer", render: (row) => (row.IsCustomer ? "Yes" : "No") },
            { key: "IsVendor", label: "Vendor", render: (row) => (row.IsVendor ? "Yes" : "No") },
            {
              key: "AccountsReceivable",
              label: "AR Account",
              render: (row) => (row.AccountsReceivable ? row.AccountsReceivable.Name : "—"),
            },
            {
              key: "AccountsPayable",
              label: "AP Account",
              render: (row) => (row.AccountsPayable ? row.AccountsPayable.Name : "—"),
            },
          ]}
          rows={items}
          onArchive={handleArchive}
          emptyLabel="No contacts yet."
        />
      )}
    </div>
  );
}

export default Contacts;
