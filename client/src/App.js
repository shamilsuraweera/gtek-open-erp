import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import FinanceLayout from "./finance/FinanceLayout";
import FinanceSettings from "./finance/FinanceSettings";
import JournalEntries from "./finance/JournalEntries";
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
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
