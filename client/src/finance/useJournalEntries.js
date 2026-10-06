import { useCallback, useEffect, useState } from "react";
import apiClient from "../api/client";

const ENDPOINT = "/finance/journal-entries";

// Deliberately not built on useReferenceData: journal entries have no
// archive action (Posted entries are immutable, Drafts aren't archived),
// and have a "post" action nothing else has, so the shape genuinely
// differs rather than just being CRUD-with-different-field-names.
export function useJournalEntries() {
  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get(ENDPOINT);
      setEntries(data);
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
    setEntries((prev) => [data, ...prev]);
    return data;
  }, []);

  const postEntry = useCallback(async (id) => {
    const { data } = await apiClient.post(`${ENDPOINT}/${id}/post`);
    // Replace with the server's response rather than patching State
    // locally — Reference, TotalDebit/TotalCredit and PostedAt are all
    // assigned server-side inside the posting transaction, and the UI
    // must show exactly what was actually committed, not a guess.
    setEntries((prev) => prev.map((entry) => (entry.Id === id ? data : entry)));
    return data;
  }, []);

  return { entries, isLoading, error, createDraft, postEntry, refetch: fetchAll };
}

export default useJournalEntries;
