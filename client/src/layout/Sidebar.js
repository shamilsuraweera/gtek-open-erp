import { NavLink } from "react-router-dom";
import Icon from "./Icon";
import { MODULES, SETTINGS_MODULE } from "./navigation";

function Sidebar({ collapsed, mobileOpen, onToggleCollapse, onCloseMobile }) {
  const linkClass = ({ isActive }) => (isActive ? "nav-item active" : "nav-item");

  return (
    <aside className={`sidebar${collapsed ? " is-collapsed" : ""}${mobileOpen ? " is-open" : ""}`} aria-label="Primary">
      <div className="sidebar-brand">
        <span className="brand-mark" aria-hidden="true">
          G
        </span>
        <span className="brand-text">
          G-TEK <span>ERP</span>
        </span>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Apps</div>
        {MODULES.map((module) => (
          <NavLink
            key={module.key}
            to={module.basePath}
            end={Boolean(module.exact)}
            className={linkClass}
            title={collapsed ? module.label : undefined}
            aria-label={module.label}
            onClick={onCloseMobile}
          >
            <Icon name={module.icon} />
            <span className="nav-label">{module.label}</span>
          </NavLink>
        ))}

        <div className="nav-section-label">System</div>
        <NavLink
          to={SETTINGS_MODULE.basePath}
          className={linkClass}
          title={collapsed ? SETTINGS_MODULE.label : undefined}
          aria-label={SETTINGS_MODULE.label}
          onClick={onCloseMobile}
        >
          <Icon name={SETTINGS_MODULE.icon} />
          <span className="nav-label">{SETTINGS_MODULE.label}</span>
        </NavLink>
      </nav>

      <button
        type="button"
        className="sidebar-collapse"
        onClick={onToggleCollapse}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <Icon name={collapsed ? "chevronRight" : "chevronLeft"} size={18} />
        <span className="nav-label">Collapse</span>
      </button>
    </aside>
  );
}

export default Sidebar;
