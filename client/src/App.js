import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import FinanceLayout from "./finance/FinanceLayout";
import FinanceSettings from "./finance/FinanceSettings";
import JournalEntries from "./finance/JournalEntries";
import Reports from "./finance/Reports";
import InventoryLayout from "./inventory/InventoryLayout";
import ProductCategories from "./inventory/ProductCategories";
import Products from "./inventory/Products";
import Contacts from "./contacts/Contacts";
import Invoices from "./sales/Invoices";
import VendorBills from "./purchasing/VendorBills";
import BankingLayout from "./banking/BankingLayout";
import BankStatements from "./banking/BankStatements";
import ReconciliationDashboard from "./banking/ReconciliationDashboard";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/finance"
            element={
              <ProtectedRoute>
                <FinanceLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="settings" replace />} />
            <Route path="settings" element={<FinanceSettings />} />
            <Route path="journal-entries" element={<JournalEntries />} />
            <Route path="reports" element={<Reports />} />
          </Route>
          <Route
            path="/inventory"
            element={
              <ProtectedRoute>
                <InventoryLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="product-categories" replace />} />
            <Route path="product-categories" element={<ProductCategories />} />
            <Route path="products" element={<Products />} />
          </Route>
          <Route
            path="/contacts"
            element={
              <ProtectedRoute>
                <Contacts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sales"
            element={
              <ProtectedRoute>
                <Invoices />
              </ProtectedRoute>
            }
          />
          <Route
            path="/purchasing"
            element={
              <ProtectedRoute>
                <VendorBills />
              </ProtectedRoute>
            }
          />
          <Route
            path="/banking"
            element={
              <ProtectedRoute>
                <BankingLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="statements" replace />} />
            <Route path="statements" element={<BankStatements />} />
            <Route path="reconcile" element={<ReconciliationDashboard />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
