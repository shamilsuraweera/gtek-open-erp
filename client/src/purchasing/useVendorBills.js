import { useCallback, useEffect, useState } from "react";
import apiClient from "../api/client";

const ENDPOINT = "/purchasing/vendor-bills";

// Structural mirror of Sales' useInvoices: no archive action (Posted bills
// are immutable, Drafts aren't archived), plus a "post" action nothing
// generic like useReferenceData has.
export function useVendorBills() {
  const [bills, setBills] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get(ENDPOINT);
      setBills(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const createDraft = useCallback(async (payload) => {
    const { data } = await apiClient.post(ENDPOINT, payload);
    // Newest first, matching the backend's `order: { Id: 'DESC' }`.
    setBills((prev) => [data, ...prev]);
    return data;
  }, []);

  const postBill = useCallback(async (id) => {
    const { data } = await apiClient.post(`${ENDPOINT}/${id}/post`);
    // Replace with the server's response rather than patching state
    // locally — BillNumber and Status are assigned inside the posting
    // transaction, and the UI must show exactly what was committed.
    setBills((prev) => prev.map((bill) => (bill.Id === id ? data : bill)));
    return data;
  }, []);

  return { bills, isLoading, error, createDraft, postBill, refetch: fetchAll };
}

export default useVendorBills;
