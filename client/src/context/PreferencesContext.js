import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

// UI preferences are stored per browser (localStorage); they are not synced
// to the server.
export const PREFS_KEY = "gtek_prefs";

export const CURRENCIES = [
  { code: "USD", label: "US Dollar", symbol: "$" },
  { code: "EUR", label: "Euro", symbol: "€" },
  { code: "GBP", label: "Pound Sterling", symbol: "£" },
  { code: "LKR", label: "Sri Lankan Rupee", symbol: "Rs " },
];

export const DEFAULT_PREFS = { theme: "system", density: "comfortable", currency: "USD" };

const noop = () => {};
const PreferencesContext = createContext({
  prefs: DEFAULT_PREFS,
  resolvedTheme: "light",
  currencySymbol: "$",
  setPref: noop,
  resetPrefs: noop,
});

function readPrefs() {
  try {
    return { ...DEFAULT_PREFS, ...JSON.parse(localStorage.getItem(PREFS_KEY) || "{}") };
  } catch {
    return DEFAULT_PREFS;
  }
}

function systemPrefersDark() {
  return typeof window.matchMedia === "function" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function PreferencesProvider({ children }) {
  const [prefs, setPrefs] = useState(readPrefs);
  const [systemDark, setSystemDark] = useState(systemPrefersDark);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") {
      return undefined;
    }
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (event) => setSystemDark(event.matches);
    query.addEventListener?.("change", onChange);
    return () => query.removeEventListener?.("change", onChange);
  }, []);

  const resolvedTheme = prefs.theme === "system" ? (systemDark ? "dark" : "light") : prefs.theme;

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", resolvedTheme);
    document.documentElement.setAttribute("data-density", prefs.density);
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch {
      // preference simply isn't remembered
    }
  }, [resolvedTheme, prefs]);

  const setPref = useCallback((key, value) => setPrefs((current) => ({ ...current, [key]: value })), []);
  const resetPrefs = useCallback(() => setPrefs(DEFAULT_PREFS), []);

  const value = useMemo(() => {
    const currency = CURRENCIES.find((item) => item.code === prefs.currency) || CURRENCIES[0];
    return { prefs, resolvedTheme, currencySymbol: currency.symbol, setPref, resetPrefs };
  }, [prefs, resolvedTheme, setPref, resetPrefs]);

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  return useContext(PreferencesContext);
}
