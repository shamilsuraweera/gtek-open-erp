import { useState } from "react";
import { useInvoices } from "./useInvoices";
import InvoicesList from "./InvoicesList";
import InvoiceForm from "./InvoiceForm";

function Invoices() {
  const [view, setView] = useState("list");
  const { invoices, isLoading, error, createDraft, postInvoice } = useInvoices();

  const handleCreateDraft = async (payload) => {
    await createDraft(payload);
    setView("list");
  };

  return (
    <div>

      <div className="toolbar">
        {view === "list" ? (
          <button type="button" className="btn-primary" onClick={() => setView("create")}>
            + New Invoice
          </button>
        ) : (
          <button type="button" onClick={() => setView("list")}>
            ← Back to List
          </button>
        )}
      </div>

      {view === "list" ? (
        <InvoicesList invoices={invoices} isLoading={isLoading} error={error} onPost={postInvoice} />
      ) : (
        <InvoiceForm onSubmit={handleCreateDraft} onCancel={() => setView("list")} />
      )}
    </div>
  );
}

export default Invoices;
