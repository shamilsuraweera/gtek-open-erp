import { useEffect, useState } from "react";
import apiClient from "../api/client";
import { useAuth } from "../context/AuthContext";

function Dashboard() {
  const [apiStatus, setApiStatus] = useState("Checking...");
  const [dbStatus, setDbStatus] = useState("Checking...");
  const [dbValue, setDbValue] = useState(null);
  const { user, logout } = useAuth();

  useEffect(() => {
    apiClient
      .get("/")
      .then(() => setApiStatus("Connected"))
      .catch(() => setApiStatus("Failed"));

    apiClient
      .get("/db-test")
      .then((res) => {
        setDbStatus("Connected");
        setDbValue(JSON.stringify(res.data));
      })
      .catch(() => setDbStatus("Failed"));
  }, []);

  const statusStyle = (status) => ({
    padding: "8px 14px",
    borderRadius: "6px",
    fontWeight: "bold",
    color: "white",
    background: status === "Connected" ? "#16a34a" : "#dc2626",
    display: "inline-block",
    minWidth: "120px",
    textAlign: "center",
  });

  return (
    <div style={{ fontFamily: "sans-serif", padding: "40px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>G‑TEK ERP — System Connectivity Check</h1>
        <button onClick={logout} style={{ padding: "8px 16px" }}>
          Log out{user?.email ? ` (${user.email})` : ""}
        </button>
      </div>

      <div style={{ marginTop: "20px" }}>
        <h3>Backend API Status</h3>
        <div style={statusStyle(apiStatus)}>{apiStatus}</div>
      </div>

      <div style={{ marginTop: "20px" }}>
        <h3>Database Status</h3>
        <div style={statusStyle(dbStatus)}>{dbStatus}</div>
      </div>

      {dbValue && (
        <div style={{ marginTop: "20px" }}>
          <h3>Database Response</h3>
          <pre
            style={{
              background: "#f3f4f6",
              padding: "12px",
              borderRadius: "6px",
            }}
          >
            {dbValue}
          </pre>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
