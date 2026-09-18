import { useState } from "react";
import TrialBalance from "./reports/TrialBalance";
import GeneralLedger from "./reports/GeneralLedger";

const TABS = [
  { key: "trial-balance", label: "Trial Balance" },
  { key: "general-ledger", label: "General Ledger" },
];

function Reports() {
  const [activeTab, setActiveTab] = useState("trial-balance");

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
      <h1>Financial Reports</h1>

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
        {activeTab === "trial-balance" && <TrialBalance />}
        {activeTab === "general-ledger" && <GeneralLedger />}
      </div>
    </div>
  );
}

export default Reports;
