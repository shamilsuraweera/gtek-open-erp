import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import apiClient from "../api/client";
import { useAuth } from "../context/AuthContext";

const ROLES = ["Admin", "User"];
const inputStyle = { padding: "8px", boxSizing: "border-box" };
const labelStyle = { display: "block", fontSize: "13px", marginBottom: "4px", color: "#374151" };
const thStyle = { textAlign: "left", padding: "8px", borderBottom: "2px solid #e5e7eb", fontSize: "13px" };
const tdStyle = { padding: "8px", borderBottom: "1px solid #f3f4f6", fontSize: "14px" };
const badgeStyle = (active) => ({
  padding: "3px 10px",
  borderRadius: "999px",
  fontSize: "11px",
  fontWeight: "bold",
  color: "white",
  background: active ? "#16a34a" : "#6b7280",
});
const EMPTY_FORM = { Email: "", Password: "", Role: "User" };

function UserAdmin() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // { id, type: "password" | "role", value }
  const [editing, setEditing] = useState(null);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await apiClient.get("/users");
      setUsers(response.data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const run = async (action) => {
    setError(null);
    try {
      await action();
      await fetchUsers();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    const ok = await run(() => apiClient.post("/users", form));
    if (ok) setForm(EMPTY_FORM);
    setIsSubmitting(false);
  };

  const startEdit = (target, type) =>
    setEditing({ id: target.Id, type, value: type === "role" ? target.Role : "" });

  const submitEdit = async (event) => {
    event.preventDefault();
    const { id, type, value } = editing;
    const ok = await run(() =>
      type === "role"
        ? apiClient.patch(`/users/${id}/role`, { Role: value })
        : apiClient.patch(`/users/${id}/password`, { Password: value }),
    );
    if (ok) setEditing(null);
  };

  const handleDeactivate = (target) => run(() => apiClient.delete(`/users/${target.Id}`));

  return (
    <div style={{ fontFamily: "sans-serif", padding: "40px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ margin: 0 }}>Security / Users</h1>
        <Link to="/" style={{ color: "#2563eb" }}>
          ← Dashboard
        </Link>
      </div>

      <form
        onSubmit={handleCreate}
        aria-label="Create user"
        style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "flex-end", margin: "24px 0" }}
      >
        <div>
          <label htmlFor="new-email" style={labelStyle}>Email</label>
          <input
            id="new-email"
            type="email"
            required
            value={form.Email}
            onChange={(e) => setForm({ ...form, Email: e.target.value })}
            style={inputStyle}
          />
        </div>
        <div>
          <label htmlFor="new-password" style={labelStyle}>Password</label>
          <input
            id="new-password"
            type="password"
            required
            minLength={8}
            value={form.Password}
            onChange={(e) => setForm({ ...form, Password: e.target.value })}
            style={inputStyle}
          />
        </div>
        <div>
          <label htmlFor="new-role" style={labelStyle}>Role</label>
          <select
            id="new-role"
            value={form.Role}
            onChange={(e) => setForm({ ...form, Role: e.target.value })}
            style={inputStyle}
          >
            {ROLES.map((role) => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>
        <button type="submit" disabled={isSubmitting} style={{ padding: "8px 16px" }}>
          {isSubmitting ? "Creating..." : "Create User"}
        </button>
      </form>

      {error && <p style={{ color: "#dc2626" }}>{error}</p>}
      {isLoading && <p>Loading users...</p>}

      {!isLoading && (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={thStyle}>Email</th>
              <th style={thStyle}>Role</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Created</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((row) => {
              const isSelf = row.Id === currentUser?.id;
              const isEditing = editing?.id === row.Id;
              return (
                <tr key={row.Id}>
                  <td style={tdStyle}>{row.Email}</td>
                  <td style={tdStyle}>{row.Role}</td>
                  <td style={tdStyle}>
                    <span style={badgeStyle(row.IsActive)}>{row.IsActive ? "Active" : "Inactive"}</span>
                  </td>
                  <td style={tdStyle}>{new Date(row.CreatedAt).toLocaleDateString()}</td>
                  <td style={tdStyle}>
                    {isEditing ? (
                      <form onSubmit={submitEdit} style={{ display: "flex", gap: "6px" }}>
                        {editing.type === "role" ? (
                          <select
                            aria-label="New role"
                            value={editing.value}
                            onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                          >
                            {ROLES.map((role) => (
                              <option key={role} value={role}>{role}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            aria-label="New password"
                            type="password"
                            required
                            minLength={8}
                            placeholder="New password"
                            value={editing.value}
                            onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                          />
                        )}
                        <button type="submit">Save</button>
                        <button type="button" onClick={() => setEditing(null)}>Cancel</button>
                      </form>
                    ) : (
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button onClick={() => startEdit(row, "password")}>Reset Password</button>
                        <button onClick={() => startEdit(row, "role")} disabled={isSelf}>Change Role</button>
                        <button onClick={() => handleDeactivate(row)} disabled={isSelf || !row.IsActive}>
                          Deactivate
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default UserAdmin;
