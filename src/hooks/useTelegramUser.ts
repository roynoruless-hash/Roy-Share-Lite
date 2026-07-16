import { useState, useEffect, useCallback } from "react";
import { useTelegramAuth } from "../context/TelegramAuthContext";

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
  const auth = useTelegramAuth();
  const [localUser, setLocalUser] = useState<TelegramUser | null>(null);
  const [localLoading, setLocalLoading] = useState<boolean>(true);
  const [localError, setLocalError] = useState<string | null>(null);

  const fetchFallbackUser = useCallback(async () => {
    // If we are already authenticated via the global context, use it
    if (auth.user) {
      setLocalUser({
        telegramId: String(auth.user.id || auth.user.telegramId),
        username: auth.user.username || "no_username",
        firstName: auth.user.firstName || "User",
        lastName: auth.user.lastName || "",
        photoUrl: auth.user.photoUrl || "",
        mobile: auth.user.mobile || auth.user.phone || "",
        isVerified: !!auth.user.phoneVerifiedInMiniApp || !!auth.user.phone || !!auth.user.mobile || true
      });
      setLocalLoading(false);
      setLocalError(null);
      return;
    }

    setLocalLoading(true);
    setLocalError(null);

    const token = localStorage.getItem("rs_session_token");
    const fingerprint = getFingerprint();
    const tg = (window as any).Telegram?.WebApp;
    const initData = tg?.initData || "";

    const params = new URLSearchParams(window.location.search);
    const queryUserId = params.get("userId") || params.get("tg_id") || params.get("tgId");

    try {
      // 1. Try checking URL parameters first (very common in browser deep links / redirects)
      if (queryUserId) {
        console.log("[useTelegramUser] Query parameter user ID found:", queryUserId);
        const res = await fetch(`/api/user/profile/${queryUserId}`);
        const data = await res.json();
        if (data.success && data.user) {
          console.log("[useTelegramUser] Successfully retrieved fallback profile for ID:", queryUserId);
          setLocalUser({
            telegramId: String(data.user.id),
            username: data.user.username,
            firstName: data.user.firstName || "User",
            photoUrl: data.user.photoUrl,
            mobile: data.user.mobile,
            isVerified: !!data.user.phoneVerifiedInMiniApp || !!data.user.phone || !!data.user.mobile || true
          });
          setLocalLoading(false);
          return;
        }
      }

      // 2. Try checking existing legacy session token
      if (token) {
        console.log("[useTelegramUser] Checking existing rs_session_token...");
        const res = await fetch("/api/auth/check-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, fingerprint })
        });
        const data = await res.json();
        if (data.success && data.user) {
          console.log("[useTelegramUser] Valid session verified via check-session");
          setLocalUser(data.user);
          setLocalLoading(false);
          return;
        } else {
          localStorage.removeItem("rs_session_token");
        }
      }

      // 3. If there is Telegram WebApp with initData, but context has not finished or failed, we can try verifying it directly as a safeguard
      if (initData) {
        console.log("[useTelegramUser] Telegram WebApp initData found, verifying directly...");
        const res = await fetch("/api/auth/telegram-verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ initData })
        });
        const data = await res.json();
        if (data.success && data.user) {
          console.log("[useTelegramUser] Successfully verified directly via telegram-verify");
          setLocalUser({
            telegramId: String(data.user.id),
            username: data.user.username,
            firstName: data.user.firstName || "User",
            photoUrl: data.user.photoUrl,
            mobile: data.user.mobile,
            isVerified: !!data.user.phoneVerifiedInMiniApp || !!data.user.phone || !!data.user.mobile || true
          });
          setLocalLoading(false);
          return;
        }
      }

      setLocalUser(null);
    } catch (err: any) {
      console.error("[useTelegramUser] Fallback verification error:", err);
      setLocalError(err.message || "Authentication check failed");
    } finally {
      setLocalLoading(false);
    }
  }, [auth.user]);

  useEffect(() => {
    fetchFallbackUser();
  }, [fetchFallbackUser]);

  // Combine global auth state and local fallback state
  const resolvedUser = auth.user ? {
    telegramId: String(auth.user.id || auth.user.telegramId),
    username: auth.user.username || "no_username",
    firstName: auth.user.firstName || "User",
    lastName: auth.user.lastName || "",
    photoUrl: auth.user.photoUrl || "",
    mobile: auth.user.mobile || auth.user.phone || "",
    isVerified: !!auth.user.phoneVerifiedInMiniApp || !!auth.user.phone || !!auth.user.mobile || true
  } : localUser;

  const resolvedLoading = auth.user ? false : (auth.loading && localLoading);
  const resolvedError = auth.user ? null : (auth.error || localError);

  return {
    user: resolvedUser,
    loading: resolvedLoading,
    error: resolvedError,
    isAuthenticated: !!resolvedUser,
    refresh: async () => {
      await auth.verifyAuth();
      await fetchFallbackUser();
    }
  };
}
