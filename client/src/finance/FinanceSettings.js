import { useTabParam } from "../layout/useTabParam";
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
  const [activeTab] = useTabParam(TABS.map((tab) => tab.key), "accounts");

  // Accounts is the one reference-data type the other two depend on, as the
  // source for their "Default Account" / "Tax Account" pickers — so its
  // state is lifted here and shared as a single instance. Journals and
  // Taxes each keep their own independent useReferenceData instance below,
  // since nothing else reads their data: creating or archiving a Journal
  // can never affect Taxes' list, or vice versa.
  const accountsData = useReferenceData("/finance/accounts");
  const journalsData = useReferenceData("/finance/journals");
  const taxesData = useReferenceData("/finance/taxes");

  return (
    <div>


      <div className="subtab-panel">
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
