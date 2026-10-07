import { useCallback, useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Icon from "./Icon";
import ProfileMenu from "./ProfileMenu";
import { useDismiss } from "./useDismiss";
import { findActiveModule, isLinkActive, isTabActive, visibleTabs } from "./navigation";

// A ribbon tab that opens a menu of sub-pages (the "Reports ▾" style link).
// The menu is position:fixed so the horizontally scrollable tab strip on
// small screens can never clip it.
function TabDropdown({ tab, location }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const containerRef = useRef(null);
  const buttonRef = useRef(null);
  const active = isTabActive(tab, location);

  const close = useCallback(() => setOpen(false), []);
  useDismiss(containerRef, open, close);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.search]);

  const toggle = () => {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setCoords({ top: rect.bottom + 2, left: rect.left });
    }
    setOpen((value) => !value);
  };

  return (
    <div className="tab-dropdown" ref={containerRef}>
      <button
        type="button"
        ref={buttonRef}
        className={`ribbon-tab${active ? " active" : ""}`}
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {tab.label}
        <Icon name="chevronDown" size={14} className={`tab-caret${open ? " open" : ""}`} />
      </button>
      {open && (
        <div className="menu" role="menu" style={{ top: coords.top, left: coords.left }}>
          {tab.items.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              role="menuitem"
              className={`menu-item${isLinkActive(item.to, location) ? " active" : ""}`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function TopRibbon({ onMenuClick }) {
  const { user } = useAuth();
  const location = useLocation();
  const module = findActiveModule(location.pathname);
  const tabs = visibleTabs(module, user);

  return (
    <header className="ribbon">
      <div className="ribbon-bar">
        <button type="button" className="icon-btn ribbon-menu" onClick={onMenuClick} aria-label="Toggle navigation">
          <Icon name="menu" />
        </button>

        <div className="ribbon-module">
          <Icon name={module.icon} size={20} />
          <span>{module.label}</span>
        </div>

        {tabs.length > 0 && (
          <nav className="ribbon-tabs" aria-label={`${module.label} sections`}>
            {tabs.map((tab) =>
              tab.items ? (
                <TabDropdown key={tab.label} tab={tab} location={location} />
              ) : (
                <NavLink
                  key={tab.to}
                  to={tab.to}
                  end
                  className={({ isActive }) => `ribbon-tab${isActive ? " active" : ""}`}
                >
                  {tab.label}
                </NavLink>
              ),
            )}
          </nav>
        )}

        <div className="ribbon-spacer" />
        <ProfileMenu />
      </div>

    </header>
  );
}

export default TopRibbon;
