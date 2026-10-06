import { useState } from "react";
import { useReferenceData } from "./useReferenceData";
import AccountsSection from "./sections/AccountsSection";
import JournalsSection from "./sections/JournalsSection";
import TaxesSection from "./sections/TaxesSection";

const TABS = [
  { key: "accounts", label: "Accounts" },
  { key: "journals", label: "Journals" },
  { key: "taxes", label: "Taxes" },
];

function FinanceSettings() {
  const [activeTab, setActiveTab] = useState("accounts");

  // Accounts is the one reference-data type the other two depend on, as the
  // source for their "Default Account" / "Tax Account" pickers — so its
  // state is lifted here and shared as a single instance. Journals and
  // Taxes each keep their own independent useReferenceData instance below,
  // since nothing else reads their data: creating or archiving a Journal
  // can never affect Taxes' list, or vice versa.
  const accountsData = useReferenceData("/finance/accounts");
  const journalsData = useReferenceData("/finance/journals");
  const taxesData = useReferenceData("/finance/taxes");

  const tabButtonStyle = (tabKey) => ({
    padding: "8px 16px",
    border: "none",
    borderBottom: activeTab === tabKey ? "2px solid #2563eb" : "2px solid transparent",
    background: "transparent",
    fontWeight: activeTab === tabKey ? "bold" : "normal",
    color: activeTab === tabKey ? "#111827" : "#6b7280",
    cursor: "pointer",
  });

  return (
    <div>
      <h1>Finance Settings</h1>

      <div style={{ display: "flex", gap: "4px", borderBottom: "1px solid #e5e7eb" }}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            style={tabButtonStyle(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ marginTop: "20px" }}>
        {activeTab === "accounts" && <AccountsSection accountsData={accountsData} />}
        {activeTab === "journals" && (
          <JournalsSection journalsData={journalsData} accounts={accountsData.items} />
        )}
        {activeTab === "taxes" && <TaxesSection taxesData={taxesData} accounts={accountsData.items} />}
      </div>
    </div>
  );
}

export default FinanceSettings;
