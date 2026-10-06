import { useCallback, useEffect, useState } from "react";
import apiClient from "../api/client";

// One instance of this hook = one independent slice of state (items,
// loading, error) for exactly one endpoint. Accounts, Journals, and Taxes
// each get their own instance with no shared state between them — see
// FinanceSettings.js for how (and why) Accounts' instance is lifted and
// shared as a picker source, while Journals/Taxes keep private instances.
export function useReferenceData(endpoint) {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get(endpoint);
      setItems(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const create = useCallback(
    async (payload) => {
      const { data } = await apiClient.post(endpoint, payload);
      setItems((prev) => [...prev, data]);
      return data;
    },
    [endpoint],
  );

  const archive = useCallback(
    async (id) => {
      await apiClient.delete(`${endpoint}/${id}`);
      setItems((prev) => prev.filter((item) => item.Id !== id));
    },
    [endpoint],
  );

  return { items, isLoading, error, create, archive, refetch: fetchAll };
}

export default useReferenceData;
