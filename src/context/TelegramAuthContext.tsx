import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, TelegramAuthResponse } from "../types";
import { API_BASE } from "../config/api";
import { db } from "../lib/firebase";
import { doc, onSnapshot, setDoc } from "firebase/firestore";

interface TelegramAuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  startParam: string | null;
  initData: string | null;
  isInsideTelegram: boolean;
  tg: any | null;
  verifyAuth: () => Promise<void>;
  completeProfile: (details: Partial<User>) => Promise<void>;
  waitForTelegramParams: (timeoutSeconds?: number) => Promise<boolean>;
  isBackgroundLoading: boolean;
}

const TelegramAuthContext = createContext<TelegramAuthContextType | undefined>(undefined);

const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeoutMs = 8000) => {
  const controller = new AbortController();
  const id = setTimeout(() => {
    console.warn(`[TelegramAuthContext] Fetch request to ${url} timed out after ${timeoutMs}ms. Aborting...`);
    controller.abort();
  }, timeoutMs);
  try {
    console.log(`[TelegramAuthContext] [API Request] Sending fetch request to: ${url}`, {
      method: options.method || "GET",
      headers: options.headers,
      body: options.body ? (String(options.body).length > 500 ? `${String(options.body).slice(0, 500)}...` : options.body) : undefined
    });
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    console.log(`[TelegramAuthContext] [API Response] Received response from ${url}. Status: ${response.status}, OK: ${response.ok}`);
    return response;
  } catch (err: any) {
    clearTimeout(id);
    if (err.name === 'AbortError') {
      console.error(`[TelegramAuthContext] [API Timeout] Request to ${url} was aborted because it exceeded ${timeoutMs}ms`);
      throw new Error(`Request to ${url} timed out after ${timeoutMs / 1000} seconds`);
    }
    console.error(`[TelegramAuthContext] [API Error] Request to ${url} failed with error:`, err);
    throw err;
  }
};

export const TelegramAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startParam, setStartParam] = useState<string | null>(null);
  const [initData, setInitData] = useState<string | null>(null);
  const [tg, setTg] = useState<any>(null);
  const [isInsideTelegram, setIsInsideTelegram] = useState<boolean>(false);
  const [isBackgroundLoading, setIsBackgroundLoading] = useState<boolean>(false);
  const isVerifyingRef = React.useRef(false);

  const waitForTelegramParams = async (timeoutSeconds = 5): Promise<boolean> => {
    console.log(`[TelegramAuthContext] Starting wait for Telegram parameters (timeout: ${timeoutSeconds}s)...`);
    const startTime = Date.now();
    const timeoutMs = timeoutSeconds * 1000;

    return new Promise((resolve) => {
      const check = () => {
        const currentTg = (window as any).Telegram?.WebApp;
        const currentInitData = currentTg?.initData;
        const currentPlatform = currentTg?.platform;

        // Logs for debugging
        console.log("[TelegramAuthContext] Polling check:", {
          hasTg: !!currentTg,
          hasInitData: !!currentInitData,
          platform: currentPlatform,
          elapsed: Date.now() - startTime
        });

        if (currentTg && (currentInitData || currentPlatform)) {
          console.log("[TelegramAuthContext] Telegram parameters found!");
          setTg(currentTg);
          setInitData(currentInitData || null);
          setIsInsideTelegram(true);
          try {
            currentTg.ready();
            currentTg.expand();
          } catch (e) {
            console.error("[TelegramAuthContext] Error calling ready/expand:", e);
          }
          resolve(true);
          return;
        }

        if (Date.now() - startTime > timeoutMs) {
          console.warn("[TelegramAuthContext] Timed out waiting for Telegram parameters.");
          resolve(false);
          return;
        }

        setTimeout(check, 200);
      };
      check();
    });
  };

  const verifyAuth = async () => {
    const startTime = Date.now();
    console.log("[TelegramAuthContext] [PERFORMANCE] verifyAuth execution started at:", new Date(startTime).toISOString());
    
    // Prevent concurrent duplicate executions of verifyAuth
    if (isVerifyingRef.current) {
      console.log("[TelegramAuthContext] verifyAuth is already in progress. Skipping duplicate execution.");
      return;
    }
    isVerifyingRef.current = true;

    // Helper to check if we are in a Telegram environment
    const isTgEnv = () => {
      const searchParams = new URLSearchParams(window.location.search);
      const hasTgParams = searchParams.has("tgWebAppData") || searchParams.has("tgWebAppVersion") || searchParams.has("tgWebAppStartParam") || searchParams.has("userId");
      const hasTgHash = window.location.hash.includes("tgWebAppData");
      const isAppPath = window.location.pathname.startsWith("/app") || window.location.pathname === "/app";
      const hasTgObject = !!(window as any).Telegram?.WebApp?.initData;
      return hasTgParams || hasTgHash || isAppPath || hasTgObject;
    };

    const inTg = isTgEnv();
    console.log("[TelegramAuthContext] [PERFORMANCE] isTgEnv evaluated in", Date.now() - startTime, "ms. Value:", inTg);

    // Timeout release mechanism: if verification takes > 5 seconds, let the app render in background.
    let isReleased = false;
    const releaseTimeout = setTimeout(() => {
      if (isVerifyingRef.current) {
        console.warn(`[TelegramAuthContext] [PERFORMANCE WARNING] Authentication has taken > 5000ms. Elapsed: ${Date.now() - startTime}ms. Releasing loading block so first screen can render, and continuing auth in background.`);
        isReleased = true;
        setLoading(false);
        setIsBackgroundLoading(true);
      }
    }, 5000);

    try {
      // 1. Wait for TG WebApp SDK to be ready
      const tgReadyStart = Date.now();
      const tgReady = await waitForTelegramParams(inTg ? 4 : 0.1);
      const tgReadyDuration = Date.now() - tgReadyStart;
      console.log(`[TelegramAuthContext] [PERFORMANCE] waitForTelegramParams resolved in ${tgReadyDuration}ms. Success: ${tgReady}`);

      const currentTg = (window as any).Telegram?.WebApp;
      if (currentTg) {
        setTg(currentTg);
        console.log("[TelegramAuthContext] WebApp detailed metadata - version:", currentTg.version, "platform:", currentTg.platform);
      }

      const params = new URLSearchParams(window.location.search);
      const queryUserId = params.get("userId");
      console.log("[TelegramAuthContext] [STEP 3] Checked query parameters. queryUserId:", queryUserId);

      // If no Telegram object AND no queryUserId in query param, we are not in a Mini App context
      if (!currentTg && !queryUserId) {
        console.log("[TelegramAuthContext] Early return: Not inside Telegram Mini App context. Elapsed:", Date.now() - startTime, "ms");
        clearTimeout(releaseTimeout);
        setLoading(false);
        setIsBackgroundLoading(false);
        isVerifyingRef.current = false;
        return;
      }

      const currentInitData = currentTg?.initData;
      setInitData(currentInitData || null);
      setIsInsideTelegram(!!(currentTg && (currentInitData || currentTg.platform)));
      console.log("[TelegramAuthContext] [STEP 2] Check initData availability. initData exists:", !!currentInitData, "initData length:", currentInitData ? currentInitData.length : 0);

      // Fallback scenarios:
      if (!currentInitData && queryUserId) {
        console.log("[TelegramAuthContext] Fallback scenario: queryUserId available, initData missing. Fetching user profile directly.");
        const fallbackStart = Date.now();
        const profileUrl = `${API_BASE}/api/user/profile/${queryUserId}`;
        const response = await fetchWithTimeout(profileUrl, {}, 5000);
        const data = await response.json();
        console.log(`[TelegramAuthContext] [PERFORMANCE] Fallback API resolved in ${Date.now() - fallbackStart}ms. Success: ${data.success}`);

        if (data.success && data.user) {
          setUser(data.user);
        } else {
          throw new Error(data.error || "User not found in database");
        }
        
        clearTimeout(releaseTimeout);
        setLoading(false);
        setIsBackgroundLoading(false);
        isVerifyingRef.current = false;
        return;
      }

      // If no initData and no queryUserId, skipping verification
      if (!currentInitData) {
        console.warn("[TelegramAuthContext] Early return: initData is empty. Skipping verification. Elapsed:", Date.now() - startTime, "ms");
        clearTimeout(releaseTimeout);
        setLoading(false);
        setIsBackgroundLoading(false);
        isVerifyingRef.current = false;
        return;
      }

      // Standard verification flow
      console.log("[TelegramAuthContext] Standard Telegram verification starting...");
      const verifyStart = Date.now();
      const urlParams = new URLSearchParams(window.location.search);
      const sp = currentTg?.initDataUnsafe?.start_param || urlParams.get("tgWebAppStartParam") || urlParams.get("startapp") || urlParams.get("start_param") || "";
      setStartParam(sp);

      const verifyUrl = `${API_BASE}/api/auth/telegram-verify`;
      
      // We will perform retry logic if it fails or times out
      let attempts = 0;
      let authenticated = false;
      let lastError: any = null;

      while (attempts < 3 && !authenticated) {
        attempts++;
        try {
          console.log(`[TelegramAuthContext] Sending verification request (Attempt ${attempts}/3)...`);
          const response = await fetchWithTimeout(verifyUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ initData: currentInitData, startParam: sp }),
          }, 4000); // 4s timeout per request

          const data: TelegramAuthResponse = await response.json();
          console.log(`[TelegramAuthContext] [PERFORMANCE] Verification attempt ${attempts} resolved in ${Date.now() - verifyStart}ms. Success: ${data.success}`);

          if (data.success && data.user) {
            setUser(data.user);
            authenticated = true;
          } else {
            throw new Error(data.error || "Authentication failed");
          }
        } catch (err: any) {
          lastError = err;
          console.error(`[TelegramAuthContext] Verification attempt ${attempts} failed:`, err.message || err);
          if (attempts < 3) {
            await new Promise(r => setTimeout(r, 1000)); // wait 1s before retry
          }
        }
      }

      if (!authenticated) {
        throw lastError || new Error("Failed to authenticate after retries");
      }

    } catch (err: any) {
      console.error("[TelegramAuthContext] [PERFORMANCE ERROR] Complete verification flow failed. Total elapsed:", Date.now() - startTime, "ms. Error:", err);
      // Only set error if we haven't already released the UI (to avoid overwriting fallback state with an intrusive error page)
      if (!isReleased) {
        setError(err.message || "Failed to authenticate with Telegram");
      }
    } finally {
      clearTimeout(releaseTimeout);
      console.log(`[TelegramAuthContext] [PERFORMANCE] verifyAuth finally complete. Total duration: ${Date.now() - startTime}ms. Released UI state: ${isReleased}`);
      setLoading(false);
      setIsBackgroundLoading(false);
      isVerifyingRef.current = false;
    }
  };

  const completeProfile = async (details: Partial<User>) => {
    if (!user) {
      console.error("[TelegramAuthContext] completeProfile was called but no active authenticated user session exists");
      return;
    }
    console.log("[TelegramAuthContext] completeProfile flow initiated. User ID:", user.id, "Details:", details);
    setLoading(true);
    try {
      const response = await fetchWithTimeout(`${API_BASE}/api/user/complete-profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, details }),
      });

      const data = await response.json();
      console.log("[TelegramAuthContext] completeProfile JSON response parsed:", { success: data.success, hasUser: !!data.user });
      
      if (data.success && data.user) {
        console.log("[TelegramAuthContext] Profile successfully completed and updated in state. User ID:", data.user.id);
        setUser(data.user);
      } else {
        throw new Error(data.error || "Failed to complete profile");
      }
    } catch (err: any) {
      console.error("[TelegramAuthContext] completeProfile flow failed:", err);
      setError(err.message);
      throw err;
    } finally {
      console.log("[TelegramAuthContext] completeProfile flow completed. Setting loading to false.");
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    console.log("[TelegramAuthContext] [Mount] Provider mounted. Starting 10-second authentication guard timeout.");
    
    // 10s timeout for auth
    const authTimeout = setTimeout(() => {
      if (active) {
        console.error("[TelegramAuthContext] Auth process timed out after 10s. Forcing safety termination.");
        setError("Authentication timed out. Please refresh.");
        setLoading(false);
      }
    }, 10000);

    verifyAuth().finally(() => {
      console.log("[TelegramAuthContext] [Mount] verifyAuth finally handler reached. Safety clearing guard timer.");
      active = false;
      clearTimeout(authTimeout);
    });

    return () => {
      console.log("[TelegramAuthContext] [Unmount] Provider unmounted. Cleaning up guard timer.");
      active = false;
      clearTimeout(authTimeout);
    };
  }, []);

  useEffect(() => {
    if (!user || !user.id) return;

    const userDocRef = doc(db, "users", String(user.id));
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const updatedData = docSnap.data();
        setUser((prevUser) => {
          if (!prevUser) return null;
          return {
            ...prevUser,
            ...updatedData,
            id: prevUser.id
          } as User;
        });
      }
    }, (err) => {
      console.error("[TelegramAuthContext] Real-time user listener error:", err);
    });

    return () => unsubscribe();
  }, [user?.id]);

  return (
    <TelegramAuthContext.Provider
      value={{
        user,
        loading,
        error,
        isAuthenticated: !!user,
        startParam,
        initData,
        isInsideTelegram,
        tg,
        verifyAuth,
        completeProfile,
        waitForTelegramParams,
        isBackgroundLoading,
      }}
    >
      {children}
    </TelegramAuthContext.Provider>
  );
};

export const useTelegramAuth = () => {
  const context = useContext(TelegramAuthContext);
  if (context === undefined) {
    throw new Error("useTelegramAuth must be used within a TelegramAuthProvider");
  }
  return context;
};
