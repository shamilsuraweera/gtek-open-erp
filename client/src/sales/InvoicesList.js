import { useState } from "react";
import { statusBadgeClass } from "../layout/status";





function InvoicesList({ invoices, isLoading, error, onPost }) {
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
    return <p>Loading invoices...</p>;
  }

  return (
    <div>
      {error && <p className="msg msg-error">{error}</p>}
      {postError && <p className="msg msg-error">{postError}</p>}

      {invoices.length === 0 ? (
        <p className="msg msg-muted">No invoices yet.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Invoice Number</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Total Amount</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice.Id}>
                <td>
                  {invoice.InvoiceNumber ? invoice.InvoiceNumber : <span className="text-faint">(unposted)</span>}
                </td>
                <td>{invoice.Date}</td>
                <td>{invoice.Contact ? invoice.Contact.Name : "—"}</td>
                <td>{invoice.TotalAmount}</td>
                <td>
                  <span className={statusBadgeClass(invoice.Status)}>{invoice.Status}</span>
                </td>
                <td className="cell-actions">
                  {invoice.Status === "Draft" && (
                    <button
                      type="button"
                      onClick={() => handlePost(invoice.Id)}
                      disabled={postingId === invoice.Id}
                      className="btn-sm btn-outline"
                    >
                      {postingId === invoice.Id ? "Posting..." : "Post"}
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

export default InvoicesList;
