import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useDashboard } from "./useDashboard";

// Display-only formatting (never further arithmetic on the result), so
// parsing through a JS Number here is safe — this is not one of the
// money.js exact-decimal computation paths.
function formatCurrency(value) {
  const number = Number(value ?? 0);
  const sign = number < 0 ? "-" : "";
  const formatted = Math.abs(number).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${sign}$${formatted}`;
}

const pageStyle = { fontFamily: "sans-serif", padding: "40px", background: "#f9fafb", minHeight: "100vh" };
const navLinkStyle = { color: "#2563eb", textDecoration: "none", fontSize: "14px", fontWeight: 500 };
const cardStyle = {
  background: "white",
  borderRadius: "12px",
  padding: "24px",
  boxShadow: "0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)",
  border: "1px solid #e5e7eb",
};
const metricLabelStyle = {
  fontSize: "13px",
  color: "#6b7280",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};
const metricValueStyle = { fontSize: "32px", fontWeight: 700, color: "#111827", marginTop: "8px" };
const panelStyle = { ...cardStyle, padding: "20px" };
const thStyle = {
  textAlign: "left",
  padding: "8px 10px",
  borderBottom: "2px solid #e5e7eb",
  fontSize: "12px",
  color: "#6b7280",
  textTransform: "uppercase",
};
const tdStyle = { padding: "8px 10px", borderBottom: "1px solid #f3f4f6", fontSize: "14px" };
const statusBadgeStyle = (status) => ({
  padding: "3px 10px",
  borderRadius: "999px",
  fontSize: "11px",
  fontWeight: "bold",
  color: "white",
  background: status === "Posted" ? "#16a34a" : status === "Cancelled" ? "#dc2626" : "#6b7280",
});

const NAV_LINKS = [
  { to: "/finance", label: "Finance" },
  { to: "/inventory", label: "Inventory" },
  { to: "/contacts", label: "Contacts" },
  { to: "/sales", label: "Sales" },
  { to: "/purchasing", label: "Purchasing" },
  { to: "/banking", label: "Banking" },
];

function Dashboard() {
  const { user, logout } = useAuth();
  const { metrics, recentInvoices, recentVendorBills, isLoading, error } = useDashboard();

  return (
    <div style={pageStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ margin: 0 }}>G‑TEK ERP</h1>
          <p style={{ margin: "4px 0 0", color: "#6b7280" }}>Command Center</p>
        </div>
        <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
          {NAV_LINKS.map((link) => (
            <Link key={link.to} to={link.to} style={navLinkStyle}>
              {link.label} →
            </Link>
          ))}
          <button onClick={logout} style={{ padding: "8px 16px" }}>
            Log out{user?.email ? ` (${user.email})` : ""}
          </button>
        </div>
      </div>

      {error && <p style={{ color: "#dc2626" }}>{error}</p>}
      {isLoading && <p>Loading dashboard...</p>}

      {!isLoading && metrics && (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "20px",
              marginBottom: "32px",
            }}
          >
            <div style={cardStyle}>
              <div style={metricLabelStyle}>Revenue This Month</div>
              <div style={{ ...metricValueStyle, color: "#16a34a" }}>
                {formatCurrency(metrics.revenueThisMonth)}
              </div>
            </div>
            <div style={cardStyle}>
              <div style={metricLabelStyle}>Unpaid AR</div>
              <div style={metricValueStyle}>{formatCurrency(metrics.unpaidAR)}</div>
            </div>
            <div style={cardStyle}>
              <div style={metricLabelStyle}>Unpaid AP</div>
              <div style={{ ...metricValueStyle, color: "#dc2626" }}>{formatCurrency(metrics.unpaidAP)}</div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div style={panelStyle}>
              <h3 style={{ marginTop: 0 }}>Recent Sales</h3>
              {recentInvoices.length === 0 ? (
                <p style={{ color: "#6b7280" }}>No recent invoices.</p>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Number</th>
                      <th style={thStyle}>Customer</th>
                      <th style={thStyle}>Amount</th>
                      <th style={thStyle}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentInvoices.map((invoice) => (
                      <tr key={invoice.Id}>
                        <td style={tdStyle}>{invoice.InvoiceNumber || "(unposted)"}</td>
                        <td style={tdStyle}>{invoice.Contact ? invoice.Contact.Name : "—"}</td>
                        <td style={tdStyle}>{formatCurrency(invoice.TotalAmount)}</td>
                        <td style={tdStyle}>
                          <span style={statusBadgeStyle(invoice.Status)}>{invoice.Status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div style={panelStyle}>
              <h3 style={{ marginTop: 0 }}>Recent Purchases</h3>
              {recentVendorBills.length === 0 ? (
                <p style={{ color: "#6b7280" }}>No recent vendor bills.</p>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Number</th>
                      <th style={thStyle}>Vendor</th>
                      <th style={thStyle}>Amount</th>
                      <th style={thStyle}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentVendorBills.map((bill) => (
                      <tr key={bill.Id}>
                        <td style={tdStyle}>{bill.BillNumber || "(unposted)"}</td>
                        <td style={tdStyle}>{bill.Contact ? bill.Contact.Name : "—"}</td>
                        <td style={tdStyle}>{formatCurrency(bill.TotalAmount)}</td>
                        <td style={tdStyle}>
                          <span style={statusBadgeStyle(bill.Status)}>{bill.Status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;
