import { useState } from "react";
import { Link } from "react-router-dom";
import { useVendorBills } from "./useVendorBills";
import VendorBillsList from "./VendorBillsList";
import VendorBillForm from "./VendorBillForm";

function VendorBills() {
  const [view, setView] = useState("list");
  const { bills, isLoading, error, createDraft, postBill } = useVendorBills();

  const handleCreateDraft = async (payload) => {
    await createDraft(payload);
    setView("list");
  };

  return (
    <div style={{ fontFamily: "sans-serif", padding: "40px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ margin: 0 }}>Purchasing — Vendor Bills</h1>
        <Link to="/" style={{ color: "#2563eb" }}>
          ← Dashboard
        </Link>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
        {view === "list" ? (
          <button type="button" onClick={() => setView("create")} style={{ padding: "8px 16px" }}>
            + New Vendor Bill
          </button>
        ) : (
          <button type="button" onClick={() => setView("list")} style={{ padding: "8px 16px" }}>
            ← Back to List
          </button>
        )}
      </div>

      {view === "list" ? (
        <VendorBillsList bills={bills} isLoading={isLoading} error={error} onPost={postBill} />
      ) : (
        <VendorBillForm onSubmit={handleCreateDraft} onCancel={() => setView("list")} />
      )}
    </div>
  );
}

export default VendorBills;
