import { useState } from "react";
// Reused directly from Finance rather than duplicated: both hook and table
// are fully generic (parametrized by endpoint / columns config only, no
// Finance-specific logic), so there's nothing domain-specific to copy.
import { useReferenceData } from "../finance/useReferenceData";
import ReferenceDataTable from "../finance/components/ReferenceDataTable";

const inputStyle = { padding: "8px", boxSizing: "border-box" };
const labelStyle = { display: "block", fontSize: "13px", marginBottom: "4px", color: "#374151" };

const EMPTY_FORM = { Name: "", Description: "", IncomeAccountId: "", ExpenseAccountId: "" };

function ProductCategories() {
  const categoriesData = useReferenceData("/inventory/product-categories");
  const accountsData = useReferenceData("/finance/accounts");

  const { items, isLoading, error, create, archive } = categoriesData;
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeAccounts = accountsData.items.filter((account) => account.IsActive);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError(null);
    setIsSubmitting(true);
    try {
      await create({
        Name: form.Name,
        Description: form.Description || undefined,
        IncomeAccountId: form.IncomeAccountId ? Number(form.IncomeAccountId) : undefined,
        ExpenseAccountId: form.ExpenseAccountId ? Number(form.ExpenseAccountId) : undefined,
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
      <h2>Product Categories</h2>

      <form onSubmit={handleSubmit} style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "flex-end" }}>
        <div>
          <label style={labelStyle} htmlFor="category-name">
            Name
          </label>
          <input
            id="category-name"
            value={form.Name}
            onChange={handleChange("Name")}
            required
            maxLength={200}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="category-description">
            Description (optional)
          </label>
          <input
            id="category-description"
            value={form.Description}
            onChange={handleChange("Description")}
            maxLength={500}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="category-income-account">
            Income Account (optional)
          </label>
          <select
            id="category-income-account"
            value={form.IncomeAccountId}
            onChange={handleChange("IncomeAccountId")}
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
          <label style={labelStyle} htmlFor="category-expense-account">
            Expense Account (optional)
          </label>
          <select
            id="category-expense-account"
            value={form.ExpenseAccountId}
            onChange={handleChange("ExpenseAccountId")}
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
          {isSubmitting ? "Adding..." : "Add Category"}
        </button>
      </form>

      {formError && <p style={{ color: "#dc2626" }}>{formError}</p>}
      {error && <p style={{ color: "#dc2626" }}>{error}</p>}
      {isLoading ? (
        <p>Loading categories...</p>
      ) : (
        <ReferenceDataTable
          columns={[
            { key: "Name", label: "Name" },
            {
              key: "IncomeAccount",
              label: "Income Account",
              render: (row) => (row.IncomeAccount ? `${row.IncomeAccount.Code} — ${row.IncomeAccount.Name}` : "—"),
            },
            {
              key: "ExpenseAccount",
              label: "Expense Account",
              render: (row) =>
                row.ExpenseAccount ? `${row.ExpenseAccount.Code} — ${row.ExpenseAccount.Name}` : "—",
            },
          ]}
          rows={items}
          onArchive={handleArchive}
          emptyLabel="No product categories yet."
        />
      )}
    </div>
  );
}

export default ProductCategories;
