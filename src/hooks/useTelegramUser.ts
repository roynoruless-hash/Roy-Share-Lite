import { useState, useEffect, useCallback } from "react";

interface TelegramUser {
  telegramId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  photoUrl?: string;
  mobile?: string;
  isVerified: boolean;
}

interface UseTelegramUserReturn {
  user: TelegramUser | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  refresh: () => Promise<void>;
}

const getFingerprint = () => {
  const data = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset()
  ].join("|");
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
};

export function useTelegramUser(): UseTelegramUserReturn {
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    const token = localStorage.getItem("rs_session_token");
    const fingerprint = getFingerprint();
    const tg = (window as any).Telegram?.WebApp;
    const initData = tg?.initData || "";

    try {
      // 1. Try checking existing session
      if (token) {
        const res = await fetch("/api/auth/check-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, fingerprint })
        });
        const data = await res.json();
        if (data.success && data.user) {
          setUser(data.user);
          setLoading(false);
          return;
        } else {
          localStorage.removeItem("rs_session_token");
        }
      }

      // 2. If in Telegram but no session, we could try other methods if they exist
      // For now, we rely on the session token
    } catch (err: any) {
      console.error("[useTelegramUser] Error:", err);
      setError(err.message || "Authentication check failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    refresh: fetchUser
  };
}
