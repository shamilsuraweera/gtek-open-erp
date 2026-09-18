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

const stateBadgeStyle = (state) => ({
  padding: "4px 10px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: "bold",
  color: "white",
  background: state === "Posted" ? "#16a34a" : "#6b7280",
});

function JournalEntriesList({ entries, isLoading, error, onPost }) {
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
    return <p>Loading journal entries...</p>;
  }

  return (
    <div>
      {error && <p style={{ color: "#dc2626" }}>{error}</p>}
      {postError && <p style={{ color: "#dc2626" }}>{postError}</p>}

      {entries.length === 0 ? (
        <p style={{ color: "#6b7280" }}>No journal entries yet.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "12px" }}>
          <thead>
            <tr>
              <th style={thStyle}>Reference</th>
              <th style={thStyle}>Date</th>
              <th style={thStyle}>Journal</th>
              <th style={thStyle}>Total Debit</th>
              <th style={thStyle}>Total Credit</th>
              <th style={thStyle}>State</th>
              <th style={thStyle} />
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.Id}>
                <td style={tdStyle}>
                  {entry.Reference ? entry.Reference : <span style={{ color: "#9ca3af" }}>(unposted)</span>}
                </td>
                <td style={tdStyle}>{entry.EntryDate}</td>
                <td style={tdStyle}>{entry.Journal ? `${entry.Journal.Code} — ${entry.Journal.Name}` : "—"}</td>
                <td style={tdStyle}>{entry.TotalDebit}</td>
                <td style={tdStyle}>{entry.TotalCredit}</td>
                <td style={tdStyle}>
                  <span style={stateBadgeStyle(entry.State)}>{entry.State}</span>
                </td>
                <td style={{ ...tdStyle, textAlign: "right" }}>
                  {entry.State === "Draft" && (
                    <button
                      type="button"
                      onClick={() => handlePost(entry.Id)}
                      disabled={postingId === entry.Id}
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
                      {postingId === entry.Id ? "Posting..." : "Post"}
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

export default JournalEntriesList;
