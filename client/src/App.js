import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [apiStatus, setApiStatus] = useState("Checking...");
  const [dbStatus, setDbStatus] = useState("Checking...");
  const [dbValue, setDbValue] = useState(null);

  useEffect(() => {
    const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:3000";

    fetch(`${apiUrl}/`)
      .then((res) => res.text())
      .then(() => setApiStatus("Connected"))
      .catch(() => setApiStatus("Failed"));

    fetch(`${apiUrl}/db-test`)
      .then((res) => res.json())
      .then((data) => {
        setDbStatus("Connected");
        setDbValue(JSON.stringify(data));
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
      <h1>G‑TEK ERP — System Connectivity Check</h1>

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

export default App;
