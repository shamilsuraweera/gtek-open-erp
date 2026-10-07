import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient, { TOKEN_STORAGE_KEY, UNAUTHORIZED_EVENT } from "../api/client";

const AuthContext = createContext(undefined);

function decodeUser(token) {
  try {
    const payload = token.split(".")[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = JSON.parse(atob(base64));
    return { id: json.sub, email: json.email, role: json.role };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [tokenUser, setTokenUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (storedToken) {
      setToken(storedToken);
      setTokenUser(decodeUser(storedToken));
    }
    setIsInitializing(false);
  }, []);

  const login = useCallback((accessToken) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
    setToken(accessToken);
    setTokenUser(decodeUser(accessToken));
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
    setTokenUser(null);
    setProfile(null);
  }, []);

  // The JWT only carries id/email/role. The server-side profile adds the
  // display name and reflects edits made after the token was issued. A failed
  // fetch is deliberately silent: the UI falls back to the token identity.
  useEffect(() => {
    if (!token) {
      return undefined;
    }
    let cancelled = false;
    (async () => {
      try {
        const response = await apiClient.get("/users/me");
        const data = response?.data;
        if (!cancelled && data && typeof data.Email === "string") {
          setProfile(data);
        }
      } catch {
        // keep the token identity
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const applyProfile = useCallback((nextProfile) => setProfile(nextProfile), []);

  const user = useMemo(() => {
    if (!tokenUser) {
      return null;
    }
    return {
      ...tokenUser,
      email: profile?.Email ?? tokenUser.email,
      displayName: profile?.DisplayName || null,
    };
  }, [tokenUser, profile]);

  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
      navigate("/login");
    };

    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
  }, [logout, navigate]);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(token),
      isInitializing,
      login,
      logout,
      applyProfile,
    }),
    [user, token, isInitializing, login, logout, applyProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
