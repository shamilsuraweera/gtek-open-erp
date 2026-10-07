import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import apiClient from "../api/client";
import { useAuth } from "../context/AuthContext";
import { usePreferences } from "../context/PreferencesContext";
import Icon from "./Icon";
import { Avatar, getDisplayName } from "./userDisplay";
import "./account.css";

const EMPTY_PASSWORDS = { CurrentPassword: "", NewPassword: "", Confirm: "" };

const THEMES = [
  { value: "light", label: "Light", hint: "Bright and clean" },
  { value: "dark", label: "Dark", hint: "Easy on the eyes" },
  { value: "system", label: "System", hint: "Match this device" },
];

// Popup for the signed-in user's own details, preferences and password.
function AccountDialog({ onClose }) {
  const { user, applyProfile } = useAuth();
  const { prefs, setPref } = usePreferences();
  const dialogRef = useRef(null);

  const [form, setForm] = useState({ DisplayName: user?.displayName ?? "", Email: user?.email ?? "" });
  const [createdAt, setCreatedAt] = useState(null);
  const [profileError, setProfileError] = useState(null);
  const [profileSaved, setProfileSaved] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [passwords, setPasswords] = useState(EMPTY_PASSWORDS);
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await apiClient.get("/users/me");
        const data = response?.data;
        if (!cancelled && data && typeof data.Email === "string") {
          setForm({ DisplayName: data.DisplayName ?? "", Email: data.Email });
          setCreatedAt(data.CreatedAt ?? null);
        }
      } catch {
        // the form keeps the identity already known from the token
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setProfileError(null);
    setProfileSaved(false);
    setIsSavingProfile(true);
    try {
      const { data } = await apiClient.patch("/users/me", {
        DisplayName: form.DisplayName.trim(),
        Email: form.Email.trim(),
      });
      applyProfile(data);
      setProfileSaved(true);
    } catch (err) {
      setProfileError(err.message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setPasswordError(null);
    setPasswordSaved(false);

    if (passwords.NewPassword !== passwords.Confirm) {
      setPasswordError("The new passwords do not match.");
      return;
    }

    setIsSavingPassword(true);
    try {
      await apiClient.patch("/users/me/password", {
        CurrentPassword: passwords.CurrentPassword,
        NewPassword: passwords.NewPassword,
      });
      setPasswords(EMPTY_PASSWORDS);
      setPasswordSaved(true);
    } catch (err) {
      setPasswordError(err.message);
    } finally {
      setIsSavingPassword(false);
    }
  };

  const previewUser = { ...user, displayName: form.DisplayName.trim() || null, email: form.Email };

  return createPortal(
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="account-title" tabIndex={-1} ref={dialogRef}>
        <div className="modal-head">
          <Avatar user={previewUser} size={48} />
          <div className="modal-head-text">
            <h2 id="account-title">{getDisplayName(previewUser)}</h2>
            <p>
              {user?.role}
              {createdAt ? ` · Member since ${new Date(createdAt).toLocaleDateString()}` : ""}
            </p>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="close" />
          </button>
        </div>

        <div className="modal-body">
          <section className="modal-section" aria-label="Preferences">
            <h3>Appearance</h3>
            <p className="card-sub">Applies to this browser only.</p>
            <div className="choice-group" role="radiogroup" aria-label="Theme">
              {THEMES.map((theme) => (
                <button
                  key={theme.value}
                  type="button"
                  role="radio"
                  aria-checked={prefs.theme === theme.value}
                  className={`choice${prefs.theme === theme.value ? " selected" : ""}`}
                  onClick={() => setPref("theme", theme.value)}
                >
                  <strong>{theme.label}</strong>
                  <span>{theme.hint}</span>
                </button>
              ))}
            </div>
          </section>

          <form className="modal-section" onSubmit={handleProfileSubmit} aria-label="Edit profile">
            <h3>Personal details</h3>
            <p className="card-sub">This is how you appear across G-TEK ERP.</p>
            <div className="stack">
              <div>
                <label htmlFor="profile-display-name">Display name</label>
                <input
                  id="profile-display-name"
                  value={form.DisplayName}
                  maxLength={100}
                  placeholder="e.g. Ada Perera"
                  onChange={(event) => setForm({ ...form, DisplayName: event.target.value })}
                />
              </div>
              <div>
                <label htmlFor="profile-email">Email</label>
                <input
                  id="profile-email"
                  type="email"
                  required
                  maxLength={255}
                  value={form.Email}
                  onChange={(event) => setForm({ ...form, Email: event.target.value })}
                />
              </div>
            </div>

            {profileError && <p className="msg msg-error">{profileError}</p>}
            {profileSaved && (
              <p className="msg msg-success" role="status">
                Profile updated.
              </p>
            )}
            <div className="form-actions">
              <button type="submit" disabled={isSavingProfile}>
                {isSavingProfile ? "Saving..." : "Save changes"}
              </button>
            </div>
          </form>

          <form className="modal-section" onSubmit={handlePasswordSubmit} aria-label="Change password">
            <h3>Change password</h3>
            <p className="card-sub">Use at least 8 characters. You stay signed in on this device.</p>
            <div className="stack">
              <div>
                <label htmlFor="current-password">Current password</label>
                <input
                  id="current-password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={passwords.CurrentPassword}
                  onChange={(event) => setPasswords({ ...passwords, CurrentPassword: event.target.value })}
                />
              </div>
              <div>
                <label htmlFor="new-password-own">New password</label>
                <input
                  id="new-password-own"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={passwords.NewPassword}
                  onChange={(event) => setPasswords({ ...passwords, NewPassword: event.target.value })}
                />
              </div>
              <div>
                <label htmlFor="confirm-password">Confirm new password</label>
                <input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={passwords.Confirm}
                  onChange={(event) => setPasswords({ ...passwords, Confirm: event.target.value })}
                />
              </div>
            </div>

            {passwordError && <p className="msg msg-error">{passwordError}</p>}
            {passwordSaved && (
              <p className="msg msg-success" role="status">
                Password changed.
              </p>
            )}
            <div className="form-actions">
              <button type="submit" disabled={isSavingPassword}>
                {isSavingPassword ? "Updating..." : "Update password"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default AccountDialog;
