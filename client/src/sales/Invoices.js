import { useState } from "react";
import { Link } from "react-router-dom";
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
    <div style={{ fontFamily: "sans-serif", padding: "40px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ margin: 0 }}>Sales — Invoices</h1>
        <Link to="/" style={{ color: "#2563eb" }}>
          ← Dashboard
        </Link>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
        {view === "list" ? (
          <button type="button" onClick={() => setView("create")} style={{ padding: "8px 16px" }}>
            + New Invoice
          </button>
        ) : (
          <button type="button" onClick={() => setView("list")} style={{ padding: "8px 16px" }}>
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
