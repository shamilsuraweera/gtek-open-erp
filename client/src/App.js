import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AppShell from "./layout/AppShell";
import Login from "./pages/Login";
import Dashboard from "./dashboard/Dashboard";
import FinanceSettings from "./finance/FinanceSettings";
import JournalEntries from "./finance/JournalEntries";
import Reports from "./finance/Reports";
import ProductCategories from "./inventory/ProductCategories";
import Products from "./inventory/Products";
import Contacts from "./contacts/Contacts";
import Invoices from "./sales/Invoices";
import VendorBills from "./purchasing/VendorBills";
import UserAdmin from "./users/UserAdmin";
import Profile from "./settings/Profile";
import BankStatements from "./banking/BankStatements";
import ReconciliationDashboard from "./banking/ReconciliationDashboard";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Every authenticated page renders inside the shell (sidebar + top ribbon). */}
          <Route
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Dashboard />} />

            <Route path="/sales" element={<Invoices />} />
            <Route path="/purchasing" element={<VendorBills />} />
            <Route path="/contacts" element={<Contacts />} />

            <Route path="/inventory">
              <Route index element={<Navigate to="products" replace />} />
              <Route path="products" element={<Products />} />
              <Route path="product-categories" element={<ProductCategories />} />
            </Route>

            <Route path="/finance">
              <Route index element={<Navigate to="journal-entries" replace />} />
              <Route path="journal-entries" element={<JournalEntries />} />
              <Route path="reports" element={<Reports />} />
              <Route path="settings" element={<FinanceSettings />} />
            </Route>

            <Route path="/banking">
              <Route index element={<Navigate to="statements" replace />} />
              <Route path="statements" element={<BankStatements />} />
              <Route path="reconcile" element={<ReconciliationDashboard />} />
            </Route>

            <Route path="/settings">
              <Route index element={<Navigate to="profile" replace />} />
              <Route path="profile" element={<Profile />} />
              <Route
                path="users"
                element={
                  <ProtectedRoute requiredRole="Admin">
                    <UserAdmin />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Legacy URL kept working for bookmarks. */}
            <Route path="/admin/users" element={<Navigate to="/settings/users" replace />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
