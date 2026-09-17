import { useEffect, useState } from "react";
import apiClient from "../api/client";

// Read-only report fetch, distinct from useReferenceData: reports aren't
// reference data (no create/archive), and the fetch target itself can
// change (General Ledger's URL depends on the selected account). Passing
// a falsy url clears the data and fetches nothing — used for "no account
// selected yet". The isCurrent guard prevents a slow, stale request from
// clobbering the display after the user has already switched accounts.
export function useReport(url) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(Boolean(url));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!url) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    let isCurrent = true;
    setIsLoading(true);
    setError(null);

    apiClient
      .get(url)
      .then((res) => {
        if (isCurrent) {
          setData(res.data);
        }
      })
      .catch((err) => {
        if (isCurrent) {
          setError(err.message);
        }
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [url]);

  return { data, isLoading, error };
}

export default useReport;
