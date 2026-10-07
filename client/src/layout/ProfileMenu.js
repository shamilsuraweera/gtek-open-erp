import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Icon from "./Icon";
import { useDismiss } from "./useDismiss";

export function getDisplayName(user) {
  if (!user) {
    return "";
  }
  return user.displayName || (user.email ? user.email.split("@")[0] : "User");
}

export function getInitials(user) {
  const name = getDisplayName(user).trim();
  if (!name) {
    return "?";
  }
  const parts = name.split(/[\s._-]+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts[1][0] : name.slice(0, 2);
  return letters.toUpperCase();
}

export function Avatar({ user, size = 34 }) {
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }} aria-hidden="true">
      {getInitials(user)}
    </span>
  );
}

function ProfileMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [right, setRight] = useState(16);
  const containerRef = useRef(null);
  const buttonRef = useRef(null);

  const close = useCallback(() => setOpen(false), []);
  useDismiss(containerRef, open, close);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.search]);

  const toggle = () => {
    if (!open && buttonRef.current) {
      setRight(Math.max(8, window.innerWidth - buttonRef.current.getBoundingClientRect().right));
    }
    setOpen((value) => !value);
  };

  const handleLogout = () => {
    setOpen(false);
    logout();
    navigate("/login", { replace: true });
  };

  if (!user) {
    return null;
  }

  return (
    <div className="profile" ref={containerRef}>
      <button
        type="button"
        ref={buttonRef}
        className="profile-trigger"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
      >
        <Avatar user={user} />
        <span className="profile-trigger-text">
          <span className="profile-name">{getDisplayName(user)}</span>
          <span className="profile-role">{user.role}</span>
        </span>
        <Icon name="chevronDown" size={16} className="profile-caret" />
      </button>

      {open && (
        <div className="menu menu-profile" role="menu" style={{ right }}>
          <div className="menu-header">
            <Avatar user={user} size={44} />
            <div className="menu-header-text">
              <strong>{getDisplayName(user)}</strong>
              <span>{user.email}</span>
              <span className="badge badge-neutral">{user.role}</span>
            </div>
          </div>
          <Link role="menuitem" className="menu-item" to="/settings/profile">
            <Icon name="user" size={18} />
            Edit profile
          </Link>
          <Link role="menuitem" className="menu-item" to="/settings/profile#password">
            <Icon name="lock" size={18} />
            Change password
          </Link>
          <div className="menu-divider" role="separator" />
          <button type="button" role="menuitem" className="menu-item menu-item-danger" onClick={handleLogout}>
            <Icon name="logout" size={18} />
            Log out
          </button>
        </div>
      )}
    </div>
  );
}

export default ProfileMenu;
