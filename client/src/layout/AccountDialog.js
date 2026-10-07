import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import apiClient from "../api/client";
import { useAuth } from "../context/AuthContext";
import { Avatar, getDisplayName } from "../layout/ProfileMenu";
import "./profile.css";

const EMPTY_PASSWORDS = { CurrentPassword: "", NewPassword: "", Confirm: "" };

function Profile() {
  const { user, applyProfile } = useAuth();
  const location = useLocation();

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
    if (location.hash === "#password") {
      document.getElementById("password")?.scrollIntoView?.({ behavior: "smooth", block: "start" });
    }
  }, [location.hash]);

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

  return (
    <div className="profile-page">

      <div className="profile-grid">
        <section className="card profile-summary" aria-label="Account summary">
          <Avatar user={previewUser} size={72} />
          <h2>{getDisplayName(previewUser)}</h2>
          <p className="card-sub">{form.Email}</p>
          <span className="badge badge-neutral">{user?.role}</span>
          {createdAt && (
            <p className="profile-since">Member since {new Date(createdAt).toLocaleDateString()}</p>
          )}
        </section>

        <div className="profile-forms">
          <form className="card" onSubmit={handleProfileSubmit} aria-label="Edit profile">
            <h2 className="card-title">Personal details</h2>
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
              <div>
                <label htmlFor="profile-role">Role</label>
                <input id="profile-role" value={user?.role ?? ""} disabled readOnly />
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

          <form className="card" id="password" onSubmit={handlePasswordSubmit} aria-label="Change password">
            <h2 className="card-title">Change password</h2>
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
    </div>
  );
}

export default Profile;
