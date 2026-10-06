import { useCallback, useEffect, useState } from "react";
import apiClient from "../api/client";

const ENDPOINT = "/banking/bank-statements";

// Simpler than useInvoices/useVendorBills: bank statements have no "post"
// action of their own (they're just the raw input the reconciliation
// engine matches against), so this is just fetch + create.
export function useBankStatements() {
  const [statements, setStatements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get(ENDPOINT);
      setStatements(data);
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
    setStatements((prev) => [data, ...prev]);
    return data;
  }, []);

  return { statements, isLoading, error, createDraft, refetch: fetchAll };
}

export default useBankStatements;
