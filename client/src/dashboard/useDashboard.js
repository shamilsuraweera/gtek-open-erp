import { useCallback, useEffect, useState } from "react";
import apiClient from "../api/client";

export function useDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [recentVendorBills, setRecentVendorBills] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [metricsRes, activityRes] = await Promise.all([
        apiClient.get("/dashboard/metrics"),
        apiClient.get("/dashboard/recent-activity"),
      ]);
      setMetrics(metricsRes.data);
      setRecentInvoices(activityRes.data.recentInvoices);
      setRecentVendorBills(activityRes.data.recentVendorBills);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { metrics, recentInvoices, recentVendorBills, isLoading, error, refetch: fetchAll };
}

export default useDashboard;
