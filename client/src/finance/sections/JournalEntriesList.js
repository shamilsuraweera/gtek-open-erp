import { useState } from "react";
import { statusBadgeClass } from "../../layout/status";





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
      {error && <p className="msg msg-error">{error}</p>}
      {postError && <p className="msg msg-error">{postError}</p>}

      {entries.length === 0 ? (
        <p className="msg msg-muted">No journal entries yet.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Reference</th>
              <th>Date</th>
              <th>Journal</th>
              <th>Total Debit</th>
              <th>Total Credit</th>
              <th>State</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.Id}>
                <td>
                  {entry.Reference ? entry.Reference : <span className="text-faint">(unposted)</span>}
                </td>
                <td>{entry.EntryDate}</td>
                <td>{entry.Journal ? `${entry.Journal.Code} — ${entry.Journal.Name}` : "—"}</td>
                <td>{entry.TotalDebit}</td>
                <td>{entry.TotalCredit}</td>
                <td>
                  <span className={statusBadgeClass(entry.State)}>{entry.State}</span>
                </td>
                <td className="cell-actions">
                  {entry.State === "Draft" && (
                    <button
                      type="button"
                      onClick={() => handlePost(entry.Id)}
                      disabled={postingId === entry.Id}
                      className="btn-sm btn-outline"
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
