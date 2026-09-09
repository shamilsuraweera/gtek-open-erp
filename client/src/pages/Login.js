import { useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../api/client";
import { useAuth } from "../context/AuthContext";

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
    <div style={{ fontFamily: "sans-serif", padding: "40px", maxWidth: "360px", margin: "0 auto" }}>
      <h1>G‑TEK ERP — Sign In</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "16px" }}>
          <label htmlFor="email" style={{ display: "block", marginBottom: "4px" }}>
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
          />
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label htmlFor="password" style={{ display: "block", marginBottom: "4px" }}>
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
          />
        </div>

        {error && (
          <div role="alert" style={{ color: "#dc2626", marginBottom: "16px" }}>
            {error}
          </div>
        )}

        <button type="submit" disabled={isSubmitting} style={{ width: "100%", padding: "10px 16px" }}>
          {isSubmitting ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}

export default Login;
