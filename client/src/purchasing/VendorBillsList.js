import { useState } from "react";

const thStyle = {
  textAlign: "left",
  padding: "8px 12px",
  borderBottom: "2px solid #e5e7eb",
  fontSize: "13px",
  color: "#6b7280",
  textTransform: "uppercase",
};

const tdStyle = {
  padding: "8px 12px",
  borderBottom: "1px solid #f3f4f6",
};

const stateBadgeStyle = (status) => ({
  padding: "4px 10px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: "bold",
  color: "white",
  background: status === "Posted" ? "#16a34a" : status === "Cancelled" ? "#dc2626" : "#6b7280",
});

function VendorBillsList({ bills, isLoading, error, onPost }) {
  const [postingId, setPostingId] = useState(null);
  const [postError, setPostError] = useState(null);

  const handlePost = async (id) => {
    setPostError(null);
    setPostingId(id);
    try {
      await onPost(id);
    } catch (err) {
      setPostError(err.message);
    } finally {
      setPostingId(null);
    }
  };

  if (isLoading) {
    return <p>Loading vendor bills...</p>;
  }

  return (
    <div>
      {error && <p style={{ color: "#dc2626" }}>{error}</p>}
      {postError && <p style={{ color: "#dc2626" }}>{postError}</p>}

      {bills.length === 0 ? (
        <p style={{ color: "#6b7280" }}>No vendor bills yet.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "12px" }}>
          <thead>
            <tr>
              <th style={thStyle}>Bill Number</th>
              <th style={thStyle}>Date</th>
              <th style={thStyle}>Vendor</th>
              <th style={thStyle}>Total Amount</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle} />
            </tr>
          </thead>
          <tbody>
            {bills.map((bill) => (
              <tr key={bill.Id}>
                <td style={tdStyle}>
                  {bill.BillNumber ? bill.BillNumber : <span style={{ color: "#9ca3af" }}>(unposted)</span>}
                </td>
                <td style={tdStyle}>{bill.Date}</td>
                <td style={tdStyle}>{bill.Contact ? bill.Contact.Name : "—"}</td>
                <td style={tdStyle}>{bill.TotalAmount}</td>
                <td style={tdStyle}>
                  <span style={stateBadgeStyle(bill.Status)}>{bill.Status}</span>
                </td>
                <td style={{ ...tdStyle, textAlign: "right" }}>
                  {bill.Status === "Draft" && (
                    <button
                      type="button"
                      onClick={() => handlePost(bill.Id)}
                      disabled={postingId === bill.Id}
                      style={{
                        padding: "4px 10px",
                        fontSize: "13px",
                        color: "#2563eb",
                        border: "1px solid #2563eb",
                        borderRadius: "4px",
                        background: "white",
                        cursor: "pointer",
                      }}
                    >
                      {postingId === bill.Id ? "Posting..." : "Post"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default VendorBillsList;
