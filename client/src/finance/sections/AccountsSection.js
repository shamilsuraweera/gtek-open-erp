import { useState } from "react";
import ReferenceDataTable from "../components/ReferenceDataTable";

const ACCOUNT_TYPES = ["Asset", "Liability", "Equity", "Income", "Expense"];

const EMPTY_FORM = { Code: "", Name: "", Type: ACCOUNT_TYPES[0], ParentId: "" };

function AccountsSection({ accountsData }) {
  const { items, isLoading, error, create, archive } = accountsData;
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeAccounts = items.filter((account) => account.IsActive);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError(null);
    setIsSubmitting(true);
    try {
      await create({
        Code: form.Code,
        Name: form.Name,
        Type: form.Type,
        ParentId: form.ParentId ? Number(form.ParentId) : undefined,
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
      <form onSubmit={handleSubmit} className="form-row">
        <div>
          <label htmlFor="account-code">Code</label>
          <input
            id="account-code"
            value={form.Code}
            onChange={handleChange("Code")}
            required
            maxLength={20}
          />
        </div>
        <div>
          <label htmlFor="account-name">Name</label>
          <input
            id="account-name"
            value={form.Name}
            onChange={handleChange("Name")}
            required
            maxLength={200}
          />
        </div>
        <div>
          <label htmlFor="account-type">Type</label>
          <select id="account-type" value={form.Type} onChange={handleChange("Type")}>
            {ACCOUNT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="account-parent">Parent (optional)</label>
          <select
            id="account-parent"
            value={form.ParentId}
            onChange={handleChange("ParentId")}
          >
            <option value="">— none —</option>
            {activeAccounts.map((account) => (
              <option key={account.Id} value={account.Id}>
                {account.Code} — {account.Name}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Adding..." : "Add Account"}
        </button>
      </form>

      {formError && <p className="msg msg-error">{formError}</p>}
      {error && <p className="msg msg-error">{error}</p>}
      {isLoading ? (
        <p>Loading accounts...</p>
      ) : (
        <ReferenceDataTable
          columns={[
            { key: "Code", label: "Code" },
            { key: "Name", label: "Name" },
            { key: "Type", label: "Type" },
            {
              key: "Parent",
              label: "Parent",
              render: (row) => (row.Parent ? `${row.Parent.Code} — ${row.Parent.Name}` : "—"),
            },
          ]}
          rows={items}
          onArchive={handleArchive}
          emptyLabel="No accounts yet."
        />
      )}
    </div>
  );
}

export default AccountsSection;
