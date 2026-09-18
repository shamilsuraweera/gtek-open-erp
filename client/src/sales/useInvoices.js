import { useCallback, useEffect, useState } from "react";
import apiClient from "../api/client";

const ENDPOINT = "/sales/invoices";

// Same shape as Finance's useJournalEntries, and for the same reason: no
// archive action (Posted invoices are immutable, Drafts aren't archived),
// plus a "post" action nothing generic like useReferenceData has.
export function useInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get(ENDPOINT);
      setInvoices(data);
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
    setInvoices((prev) => [data, ...prev]);
    return data;
  }, []);

  const postInvoice = useCallback(async (id) => {
    const { data } = await apiClient.post(`${ENDPOINT}/${id}/post`);
    // Replace with the server's response rather than patching state
    // locally — InvoiceNumber and Status are assigned inside the posting
    // transaction, and the UI must show exactly what was committed.
    setInvoices((prev) => prev.map((invoice) => (invoice.Id === id ? data : invoice)));
    return data;
  }, []);

  return { invoices, isLoading, error, createDraft, postInvoice, refetch: fetchAll };
}

export default useInvoices;
