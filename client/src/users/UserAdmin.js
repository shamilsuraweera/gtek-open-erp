import { useCallback, useEffect, useState } from "react";
import apiClient from "../api/client";
import { useAuth } from "../context/AuthContext";
import { statusBadgeClass } from "../layout/status";

const ROLES = ["Admin", "User"];

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
    <div>

      <form
        onSubmit={handleCreate}
        aria-label="Create user"
        className="form-row"
      >
        <div>
          <label htmlFor="new-email">Email</label>
          <input
            id="new-email"
            type="email"
            required
            value={form.Email}
            onChange={(e) => setForm({ ...form, Email: e.target.value })}
          />
        </div>
        <div>
          <label htmlFor="new-password">Password</label>
          <input
            id="new-password"
            type="password"
            required
            minLength={8}
            value={form.Password}
            onChange={(e) => setForm({ ...form, Password: e.target.value })}
          />
        </div>
        <div>
          <label htmlFor="new-role">Role</label>
          <select
            id="new-role"
            value={form.Role}
            onChange={(e) => setForm({ ...form, Role: e.target.value })}
          >
            {ROLES.map((role) => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create User"}
        </button>
      </form>

      {error && <p className="msg msg-error">{error}</p>}
      {isLoading && <p>Loading users...</p>}

      {!isLoading && (
        <table className="table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((row) => {
              const isSelf = row.Id === currentUser?.id;
              const isEditing = editing?.id === row.Id;
              return (
                <tr key={row.Id}>
                  <td>{row.Email}</td>
                  <td>{row.Role}</td>
                  <td>
                    <span className={statusBadgeClass(row.IsActive)}>{row.IsActive ? "Active" : "Inactive"}</span>
                  </td>
                  <td>{new Date(row.CreatedAt).toLocaleDateString()}</td>
                  <td>
                    {isEditing ? (
                      <form onSubmit={submitEdit} className="inline-actions">
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
                      <div className="inline-actions">
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
