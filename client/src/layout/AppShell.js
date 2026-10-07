import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { findActiveModule } from "./navigation";
import Sidebar from "./Sidebar";
import TopRibbon from "./TopRibbon";
import "./shell.css";

const COLLAPSE_KEY = "gtek_sidebar_collapsed";
const MOBILE_QUERY = "(max-width: 900px)";

function readCollapsed() {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}

function isMobile() {
  return typeof window.matchMedia === "function" && window.matchMedia(MOBILE_QUERY).matches;
}

function AppShell() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);
  const moduleLabel = findActiveModule(location.pathname).label;

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0");
    } catch {
      // preference simply isn't remembered
    }
  }, [collapsed]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.title = `${moduleLabel} · G-TEK ERP`;
  }, [moduleLabel]);

  const handleMenuClick = () => {
    if (isMobile()) {
      setMobileOpen((open) => !open);
    } else {
      setCollapsed((value) => !value);
    }
  };

  return (
    <div className={`shell${collapsed ? " sidebar-collapsed" : ""}`}>
      <Sidebar
        collapsed={collapsed && !mobileOpen}
        mobileOpen={mobileOpen}
        onToggleCollapse={() => setCollapsed((value) => !value)}
        onCloseMobile={() => setMobileOpen(false)}
      />
      {mobileOpen && <div className="scrim" onClick={() => setMobileOpen(false)} aria-hidden="true" />}

      <div className="shell-body">
        <TopRibbon onMenuClick={handleMenuClick} />
        <main className="main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppShell;
