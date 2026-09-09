import axios from "axios";

export const TOKEN_STORAGE_KEY = "gtek_token";
export const UNAUTHORIZED_EVENT = "gtek_unauthorized";

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:3000",
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response } = error;

    if (response?.status === 401) {
      window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
      return Promise.reject(error);
    }

    // Unpack the backend's standardized error shape:
    // { statusCode, message, error, timestamp, path }
    const data = response?.data;
    const message = Array.isArray(data?.message)
      ? data.message.join(", ")
      : data?.message || error.message || "An unexpected error occurred";

    error.statusCode = data?.statusCode ?? response?.status;
    error.message = message;
    error.errorType = data?.error;

    return Promise.reject(error);
  },
);

export default apiClient;
