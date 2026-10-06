import { Link, NavLink, Outlet } from "react-router-dom";

const navLinkStyle = ({ isActive }) => ({
  padding: "10px 16px",
  textDecoration: "none",
  color: isActive ? "#111827" : "#6b7280",
  fontWeight: isActive ? "bold" : "normal",
  borderBottom: isActive ? "2px solid #2563eb" : "2px solid transparent",
});

function BankingLayout() {
  return (
    <div style={{ fontFamily: "sans-serif" }}>
      <div
        style={{
          padding: "20px 40px 0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1 style={{ margin: 0 }}>G‑TEK ERP — Banking</h1>
        <Link to="/" style={{ color: "#2563eb" }}>
          ← Dashboard
        </Link>
      </div>

      <nav
        style={{
          display: "flex",
          gap: "8px",
          padding: "16px 40px 0",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <NavLink to="/banking/statements" style={navLinkStyle}>
          Statements
        </NavLink>
        <NavLink to="/banking/reconcile" style={navLinkStyle}>
          Reconciliation
        </NavLink>
      </nav>

      <div style={{ padding: "24px 40px" }}>
        <Outlet />
      </div>
    </div>
  );
}

export default BankingLayout;
