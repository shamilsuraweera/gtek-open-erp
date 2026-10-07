import { useState } from "react";
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
    <div>

      <div className="toolbar">
        {view === "list" ? (
          <button type="button" className="btn-primary" onClick={() => setView("create")}>
            + New Vendor Bill
          </button>
        ) : (
          <button type="button" onClick={() => setView("list")}>
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
