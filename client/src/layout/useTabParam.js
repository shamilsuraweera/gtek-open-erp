import { useSearchParams } from "react-router-dom";

// Keeps a page's sub-tab in the URL (?tab=...) so the top ribbon's dropdown
// links, in-page tabs, browser back/forward and reloads all agree.
export function useTabParam(keys, fallback) {
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get("tab");
  const activeTab = keys.includes(requested) ? requested : fallback;

  const setActiveTab = (key) => setSearchParams({ tab: key }, { replace: true });

  return [activeTab, setActiveTab];
}
