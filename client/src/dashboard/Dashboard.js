import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Icon from "../layout/Icon";
import { MODULES } from "../layout/navigation";
import { getDisplayName } from "../layout/ProfileMenu";
import { statusBadgeClass } from "../layout/status";
import { useDashboard } from "./useDashboard";
import "./dashboard.css";

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

const APP_TILES = MODULES.filter((module) => module.key !== "dashboard");

function RecentTable({ title, viewAllTo, columns, rows, emptyLabel }) {
  return (
    <section className="card dash-panel">
      <div className="dash-panel-head">
        <h2 className="card-title">{title}</h2>
        <Link to={viewAllTo} className="dash-link">
          View all <Icon name="arrowRight" size={14} />
        </Link>
      </div>
      {rows.length === 0 ? (
        <p className="msg msg-muted">{emptyLabel}</p>
      ) : (
        <table className="table table-flat">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.number || <span className="text-faint">(unposted)</span>}</td>
                <td>{row.party}</td>
                <td className="num">{formatCurrency(row.amount)}</td>
                <td>
                  <span className={statusBadgeClass(row.status)}>{row.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function Dashboard() {
  const { user } = useAuth();
  const { metrics, recentInvoices, recentVendorBills, isLoading, error } = useDashboard();

  return (
    <div className="dashboard">
      <div className="page-head dash-head">
        <div>
          <h1>Welcome back, {getDisplayName(user)}</h1>
          <p className="dash-sub">Command Center — a live view of sales, purchasing and cash position.</p>
        </div>
        <div className="dash-actions">
          <Link to="/sales" className="btn-link btn-link-primary">
            <Icon name="plus" size={16} /> New invoice
          </Link>
          <Link to="/purchasing" className="btn-link">
            <Icon name="plus" size={16} /> New vendor bill
          </Link>
        </div>
      </div>

      {error && <p className="msg msg-error">{error}</p>}
      {isLoading && <p className="msg msg-muted">Loading dashboard...</p>}

      {!isLoading && metrics && (
        <>
          <div className="kpi-grid">
            <div className="card kpi kpi-success">
              <span className="kpi-icon">
                <Icon name="sales" size={22} />
              </span>
              <div>
                <div className="kpi-label">Revenue This Month</div>
                <div className="kpi-value">{formatCurrency(metrics.revenueThisMonth)}</div>
              </div>
            </div>
            <div className="card kpi kpi-primary">
              <span className="kpi-icon">
                <Icon name="finance" size={22} />
              </span>
              <div>
                <div className="kpi-label">Unpaid AR</div>
                <div className="kpi-value">{formatCurrency(metrics.unpaidAR)}</div>
              </div>
            </div>
            <div className="card kpi kpi-danger">
              <span className="kpi-icon">
                <Icon name="purchasing" size={22} />
              </span>
              <div>
                <div className="kpi-label">Unpaid AP</div>
                <div className="kpi-value">{formatCurrency(metrics.unpaidAP)}</div>
              </div>
            </div>
          </div>

          <div className="dash-panels">
            <RecentTable
              title="Recent Sales"
              viewAllTo="/sales"
              columns={["Number", "Customer", "Amount", "Status"]}
              emptyLabel="No recent invoices."
              rows={recentInvoices.map((invoice) => ({
                id: invoice.Id,
                number: invoice.InvoiceNumber,
                party: invoice.Contact ? invoice.Contact.Name : "—",
                amount: invoice.TotalAmount,
                status: invoice.Status,
              }))}
            />
            <RecentTable
              title="Recent Purchases"
              viewAllTo="/purchasing"
              columns={["Number", "Vendor", "Amount", "Status"]}
              emptyLabel="No recent vendor bills."
              rows={recentVendorBills.map((bill) => ({
                id: bill.Id,
                number: bill.BillNumber,
                party: bill.Contact ? bill.Contact.Name : "—",
                amount: bill.TotalAmount,
                status: bill.Status,
              }))}
            />
          </div>
        </>
      )}

      <h2 className="dash-section">Apps</h2>
      <div className="app-grid">
        {APP_TILES.map((module) => (
          <Link key={module.key} to={module.basePath} className="app-tile">
            <span className="app-tile-icon">
              <Icon name={module.icon} size={24} />
            </span>
            <span className="app-tile-label">{module.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
