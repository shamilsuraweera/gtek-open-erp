import { useState } from "react";
import ReferenceDataTable from "../components/ReferenceDataTable";

const JOURNAL_TYPES = ["Sales", "Purchase", "Bank", "Cash", "General"];

const EMPTY_FORM = {
  Code: "",
  Name: "",
  Type: JOURNAL_TYPES[0],
  DefaultAccountId: "",
  SequencePrefix: "",
};

function JournalsSection({ journalsData, accounts }) {
  const { items, isLoading, error, create, archive } = journalsData;
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeAccounts = accounts.filter((account) => account.IsActive);

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
        DefaultAccountId: form.DefaultAccountId ? Number(form.DefaultAccountId) : undefined,
        SequencePrefix: form.SequencePrefix || undefined,
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
          <label htmlFor="journal-code">Code</label>
          <input
            id="journal-code"
            value={form.Code}
            onChange={handleChange("Code")}
            required
            maxLength={10}
          />
        </div>
        <div>
          <label htmlFor="journal-name">Name</label>
          <input
            id="journal-name"
            value={form.Name}
            onChange={handleChange("Name")}
            required
            maxLength={100}
          />
        </div>
        <div>
          <label htmlFor="journal-type">Type</label>
          <select id="journal-type" value={form.Type} onChange={handleChange("Type")}>
            {JOURNAL_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="journal-default-account">Default Account (optional)</label>
          <select
            id="journal-default-account"
            value={form.DefaultAccountId}
            onChange={handleChange("DefaultAccountId")}
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
          <label htmlFor="journal-prefix">Sequence Prefix (optional)</label>
          <input
            id="journal-prefix"
            value={form.SequencePrefix}
            onChange={handleChange("SequencePrefix")}
            maxLength={20}
            placeholder="e.g. INV/"
          />
        </div>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Adding..." : "Add Journal"}
        </button>
      </form>

      {formError && <p className="msg msg-error">{formError}</p>}
      {error && <p className="msg msg-error">{error}</p>}
      {isLoading ? (
        <p>Loading journals...</p>
      ) : (
        <ReferenceDataTable
          columns={[
            { key: "Code", label: "Code" },
            { key: "Name", label: "Name" },
            { key: "Type", label: "Type" },
            { key: "SequencePrefix", label: "Prefix" },
            { key: "NextSequenceNumber", label: "Next #" },
            {
              key: "DefaultAccount",
              label: "Default Account",
              render: (row) =>
                row.DefaultAccount ? `${row.DefaultAccount.Code} — ${row.DefaultAccount.Name}` : "—",
            },
          ]}
          rows={items}
          onArchive={handleArchive}
          emptyLabel="No journals yet."
        />
      )}
    </div>
  );
}

export default JournalsSection;
