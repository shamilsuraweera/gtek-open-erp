import { useState } from "react";
import { statusBadgeClass } from "../layout/status";





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
      {error && <p className="msg msg-error">{error}</p>}
      {postError && <p className="msg msg-error">{postError}</p>}

      {bills.length === 0 ? (
        <p className="msg msg-muted">No vendor bills yet.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Bill Number</th>
              <th>Date</th>
              <th>Vendor</th>
              <th>Total Amount</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {bills.map((bill) => (
              <tr key={bill.Id}>
                <td>
                  {bill.BillNumber ? bill.BillNumber : <span className="text-faint">(unposted)</span>}
                </td>
                <td>{bill.Date}</td>
                <td>{bill.Contact ? bill.Contact.Name : "—"}</td>
                <td>{bill.TotalAmount}</td>
                <td>
                  <span className={statusBadgeClass(bill.Status)}>{bill.Status}</span>
                </td>
                <td className="cell-actions">
                  {bill.Status === "Draft" && (
                    <button
                      type="button"
                      onClick={() => handlePost(bill.Id)}
                      disabled={postingId === bill.Id}
                      className="btn-sm btn-outline"
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
