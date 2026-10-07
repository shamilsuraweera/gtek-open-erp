import { useTabParam } from "../layout/useTabParam";
import TrialBalance from "./reports/TrialBalance";
import GeneralLedger from "./reports/GeneralLedger";

const TABS = [
  { key: "trial-balance", label: "Trial Balance" },
  { key: "general-ledger", label: "General Ledger" },
];

function Reports() {
  const [activeTab] = useTabParam(TABS.map((tab) => tab.key), "trial-balance");

  return (
    <div>


      <div className="subtab-panel">
        {activeTab === "trial-balance" && <TrialBalance />}
        {activeTab === "general-ledger" && <GeneralLedger />}
      </div>
    </div>
  );
}

export default Reports;
