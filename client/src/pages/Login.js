import { useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../api/client";
import { useAuth } from "../context/AuthContext";
import "./login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const { data } = await apiClient.post("/auth/login", { email, password });
      login(data.access_token);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth">
      <aside className="auth-brand" aria-hidden="true">
        <div className="auth-brand-inner">
          <span className="brand-mark brand-mark-lg">G</span>
          <h2>G-TEK ERP</h2>
          <p>Finance, sales, purchasing, inventory and banking — one workspace for the whole business.</p>
          <ul>
            <li>Double-entry accounting with exact decimal maths</li>
            <li>Invoices, vendor bills and bank reconciliation</li>
            <li>Role-based access for your whole team</li>
          </ul>
        </div>
      </aside>

      <main className="auth-panel">
        <form className="auth-card" onSubmit={handleSubmit}>
          <h1>Sign in</h1>
          <p className="auth-sub">Welcome back. Enter your credentials to continue.</p>

          <div className="auth-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          {error && (
            <div role="alert" className="msg msg-error">
              {error}
            </div>
          )}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </main>
    </div>
  );
}

export default Login;
