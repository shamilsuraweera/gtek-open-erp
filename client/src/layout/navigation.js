// Single source of truth for the sidebar, the top ribbon and the breadcrumb.
//
// A module has a `basePath` (used to detect which module the current URL
// belongs to) and `tabs` shown in the top ribbon. A tab is either a plain
// link (`to`) or a dropdown (`items`, each with its own `to`). Anything with
// `role` is hidden from users without that role (UI-level gating only; the
// API enforces the same rule).

export const MODULES = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: "home",
    basePath: "/",
    exact: true,
    tabs: [],
  },
  {
    key: "sales",
    label: "Sales",
    icon: "sales",
    basePath: "/sales",
    tabs: [{ label: "Invoices", to: "/sales" }],
  },
  {
    key: "purchasing",
    label: "Purchasing",
    icon: "purchasing",
    basePath: "/purchasing",
    tabs: [{ label: "Vendor Bills", to: "/purchasing" }],
  },
  {
    key: "inventory",
    label: "Inventory",
    icon: "inventory",
    basePath: "/inventory",
    tabs: [
      { label: "Products", to: "/inventory/products" },
      { label: "Product Categories", to: "/inventory/product-categories" },
    ],
  },
  {
    key: "contacts",
    label: "Contacts",
    icon: "contacts",
    basePath: "/contacts",
    tabs: [{ label: "Contacts", to: "/contacts" }],
  },
  {
    key: "finance",
    label: "Finance",
    icon: "finance",
    basePath: "/finance",
    tabs: [
      { label: "Journal Entries", to: "/finance/journal-entries" },
      {
        label: "Reports",
        match: "/finance/reports",
        items: [
          { label: "Trial Balance", to: "/finance/reports?tab=trial-balance" },
          { label: "General Ledger", to: "/finance/reports?tab=general-ledger" },
        ],
      },
      {
        label: "Configuration",
        match: "/finance/settings",
        items: [
          { label: "Chart of Accounts", to: "/finance/settings?tab=accounts" },
          { label: "Journals", to: "/finance/settings?tab=journals" },
          { label: "Taxes", to: "/finance/settings?tab=taxes" },
        ],
      },
    ],
  },
  {
    key: "banking",
    label: "Banking",
    icon: "banking",
    basePath: "/banking",
    tabs: [
      { label: "Statements", to: "/banking/statements" },
      { label: "Reconciliation", to: "/banking/reconcile" },
    ],
  },
];

// System-wide settings live in their own sidebar group.
export const SETTINGS_MODULE = {
  key: "settings",
  label: "Settings",
  icon: "settings",
  basePath: "/settings",
  tabs: [
    { label: "General", to: "/settings/general" },
    { label: "Security / Users", to: "/settings/users", role: "Admin" },
  ],
};

export const ALL_MODULES = [...MODULES, SETTINGS_MODULE];

// Tab each ?tab= page falls back to when the URL has none.
const DEFAULT_TABS = {
  "/finance/reports": "trial-balance",
  "/finance/settings": "accounts",
};

export function visibleTabs(module, user) {
  return module.tabs.filter((tab) => !tab.role || tab.role === user?.role);
}

export function findActiveModule(pathname) {
  return (
    ALL_MODULES.find((module) =>
      module.exact
        ? pathname === module.basePath
        : pathname === module.basePath || pathname.startsWith(`${module.basePath}/`),
    ) || MODULES[0]
  );
}

function splitTarget(to) {
  const [path, query = ""] = to.split("?");
  return { path, query };
}

// A link is active when its path matches and, if it names a ?tab=, that tab
// is the current one (falling back to the page's default tab).
export function isLinkActive(to, location) {
  const { path, query } = splitTarget(to);
  if (location.pathname !== path) {
    return false;
  }
  if (!query) {
    return true;
  }
  const wanted = new URLSearchParams(query).get("tab");
  const current = new URLSearchParams(location.search).get("tab") || DEFAULT_TABS[path];
  return wanted === current;
}

export function isTabActive(tab, location) {
  return tab.items ? location.pathname === tab.match : isLinkActive(tab.to, location);
}
