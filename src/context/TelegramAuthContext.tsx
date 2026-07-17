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
  showAd: (type: 'Reward' | 'Interstitial' | 'Task' | string) => Promise<void>;
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
    console.log("[TelegramAuthContext] verifyAuth execution started");
    
    // Prevent concurrent duplicate executions of verifyAuth
    if (isVerifyingRef.current) {
      console.log("[TelegramAuthContext] verifyAuth is already in progress. Skipping duplicate execution to prevent race conditions.");
      return;
    }
    isVerifyingRef.current = true;

    // Wait for TG to be ready
    const tgReady = await waitForTelegramParams(4);
    const currentTg = (window as any).Telegram?.WebApp;
    
    if (currentTg) {
      setTg(currentTg);
      console.log("[TelegramAuthContext] WebApp detailed metadata - version:", currentTg.version, "platform:", currentTg.platform, "colorScheme:", currentTg.colorScheme);
    }

    const params = new URLSearchParams(window.location.search);
    const queryUserId = params.get("userId");
    console.log("[TelegramAuthContext] [STEP 3] Checked query parameters. queryUserId:", queryUserId);

    // If no Telegram object AND no queryUserId in query param, we are not in a Mini App context
    if (!currentTg && !queryUserId) {
      console.log("[TelegramAuthContext] Early return: No Telegram WebApp object found and no queryUserId parameter found. App is not running inside Telegram Mini App context.");
      setLoading(false);
      isVerifyingRef.current = false;
      return;
    }

    const currentInitData = currentTg?.initData;
    setInitData(currentInitData || null);
    setIsInsideTelegram(!!(currentTg && (currentInitData || currentTg.platform)));
    console.log("[TelegramAuthContext] [STEP 2] Check initData availability. initData exists:", !!currentInitData, "initData length:", currentInitData ? currentInitData.length : 0);

    // Fallback: If we have queryUserId but no initData, use the direct user retrieval API
    if (!currentInitData && queryUserId) {
      console.log("[TelegramAuthContext] Fallback scenario: queryUserId is available but initData is missing. Triggering direct user profile retrieval flow.");
      setLoading(true);
      setError(null);
      try {
        const profileUrl = `${API_BASE}/api/user/profile/${queryUserId}`;
        const response = await fetchWithTimeout(profileUrl);
        const data = await response.json();
        console.log("[TelegramAuthContext] Fallback user profile JSON response parsed:", { success: data.success, hasUser: !!data.user });
        
        if (data.success && data.user) {
          console.log("[TelegramAuthContext] Fallback profile retrieval succeeded. Authenticated user ID:", data.user.id);
          setUser(data.user);
        } else {
          throw new Error(data.error || "User not found in database");
        }
      } catch (err: any) {
        console.error("[TelegramAuthContext] Fallback profile retrieval flow failed:", err);
        setError(err.message || "Failed to load user profile");
      } finally {
        console.log("[TelegramAuthContext] Fallback profile retrieval flow finished. Setting loading to false.");
        setLoading(false);
        isVerifyingRef.current = false;
      }
      return;
    }

    // If no initData and no queryUserId, skipping verification
    if (!currentInitData) {
      console.log("[TelegramAuthContext] Early return: initData is empty and queryUserId is missing. Skipping verification.");
      setLoading(false);
      isVerifyingRef.current = false;
      return;
    }

    console.log("[TelegramAuthContext] Standard Telegram Mini App authentication flow starting with initData...");
    setLoading(true);
    setError(null);
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const sp = currentTg?.initDataUnsafe?.start_param || urlParams.get("tgWebAppStartParam") || urlParams.get("startapp") || urlParams.get("start_param") || "";
      setStartParam(sp);

      const verifyUrl = `${API_BASE}/api/auth/telegram-verify`;
      const response = await fetchWithTimeout(verifyUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData: currentInitData, startParam: sp }),
      });

      const data: TelegramAuthResponse = await response.json();
      console.log("[TelegramAuthContext] Standard Telegram verification JSON response parsed:", { success: data.success, hasUser: !!data.user });

      if (data.success && data.user) {
        console.log("[TelegramAuthContext] Standard verification succeeded. Authenticated user ID:", data.user.id);
        setUser(data.user);
      } else {
        throw new Error(data.error || "Authentication failed");
      }
    } catch (err: any) {
      console.error("[TelegramAuthContext] Standard verification flow failed with error:", err);
      setError(err.message || "Failed to authenticate with Telegram");
    } finally {
      console.log("[TelegramAuthContext] Standard verification flow finished. Setting loading to false.");
      setLoading(false);
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

  const showAd = async (type: 'Reward' | 'Interstitial' | 'Task' | string): Promise<void> => {
    const diagDocRef = doc(db, "settings", "adsgram_diagnostics");
    const logs: string[] = [];
    const timestamp = new Date().toISOString();
    
    // Helper to log steps
    const logStep = async (stepName: string, updates: Record<string, any> = {}) => {
      const stepTime = new Date().toISOString();
      const logMsg = `[${stepTime}] ${stepName}`;
      logs.push(logMsg);
      console.log(`[Adsgram Diagnostics] ${stepName}`, updates);
      
      try {
        await setDoc(diagDocRef, {
          userId: user?.id || "Unknown",
          telegramId: user?.telegramId || "Unknown",
          timestamp: stepTime,
          logs,
          ...updates
        }, { merge: true });
      } catch (err) {
        console.error("[Adsgram Diagnostics] Failed to write diagnostics to Firestore:", err);
      }
    };

    console.log(`[Adsgram Shared] Starting Ad flow for type: ${type}`);

    try {
      // Step 1: Detect environment
      const currentTg = (window as any).Telegram?.WebApp;
      const isInsideMiniApp = !!(currentTg?.initData || currentTg?.platform);
      
      await logStep("Telegram WebApp detected check", {
        telegramWebAppDetected: isInsideMiniApp ? "YES" : "NO",
        sdkInitialized: "Pending",
        appId: "",
        blockId: "",
        adRequestStarted: "No",
        adLoaded: "No",
        adCompleted: "No",
        adFailed: "No",
        failureReason: ""
      });

      if (!isInsideMiniApp) {
        const errorMsg = "Telegram WebApp is not available. Please open this app inside Telegram Mini App.";
        await logStep("Ad failed: Not inside Telegram Mini App", {
          adFailed: "YES",
          failureReason: errorMsg
        });
        throw new Error("NOT_IN_TELEGRAM");
      }

      // Step 2: Ensure Telegram is ready and expanded
      if (currentTg) {
        try {
          currentTg.ready();
          currentTg.expand();
        } catch (e: any) {
          console.error("[Adsgram Shared] Error in Telegram ready/expand:", e);
        }
      }

      // Step 3: Get user details and check initData
      let hasInitData = !!currentTg?.initData;
      let userId = currentTg?.initDataUnsafe?.user?.id || user?.telegramId || user?.id;

      if (!hasInitData) {
        console.log("[Adsgram Shared] initData missing, attempting retry loop...");
        let attempts = 0;
        while (attempts < 20 && !(window as any).Telegram?.WebApp?.initData) {
          await new Promise(r => setTimeout(r, 500));
          attempts++;
        }
        hasInitData = !!(window as any).Telegram?.WebApp?.initData;
        userId = (window as any).Telegram?.WebApp?.initDataUnsafe?.user?.id || userId;
      }

      if (!hasInitData) {
        const errorMsg = "Cannot load Adsgram: Not inside Telegram environment or missing initData.";
        await logStep("Ad failed: Missing initData", {
          adFailed: "YES",
          failureReason: errorMsg
        });
        throw new Error("NOT_IN_TELEGRAM");
      }

      // Step 4: Load Config and verify App ID & Block ID
      const { loadAdsgramSDK, getAdsgramConfig } = await import("../lib/adsManager");
      const config = await getAdsgramConfig(type);
      
      if (!config || !config.blockId || !config.appId) {
        const errorMsg = `AdsGram configuration missing or incomplete for type: ${type} (App ID: ${config?.appId || "None"}, Block ID: ${config?.blockId || "None"})`;
        await logStep("Ad failed: Missing configuration", {
          appId: config?.appId || "None",
          blockId: config?.blockId || "None",
          adFailed: "YES",
          failureReason: errorMsg
        });
        throw new Error(errorMsg);
      }

      await logStep("App ID and Block ID loaded successfully", {
        appId: config.appId,
        blockId: config.blockId
      });

      // Step 5: Load Adsgram SDK script
      let adsgram;
      try {
        adsgram = await loadAdsgramSDK();
        await logStep("SDK initialized", {
          sdkInitialized: "YES"
        });
      } catch (sdkError: any) {
        const errorMsg = sdkError?.message || String(sdkError);
        await logStep("Ad failed: SDK load error", {
          sdkInitialized: "FAILED",
          adFailed: "YES",
          failureReason: errorMsg
        });
        throw new Error(`Adsgram SDK failed to load: ${errorMsg}`);
      }

      // Step 6: Initialize ad controller and request ad
      const adController = adsgram.init({ blockId: config.blockId });
      if (!adController) {
        const errorMsg = "Failed to initialize ad controller (init returned null/undefined).";
        await logStep("Ad failed: Controller init failed", {
          adFailed: "YES",
          failureReason: errorMsg
        });
        throw new Error(errorMsg);
      }

      await logStep("Ad request started", {
        adRequestStarted: "YES"
      });

      // Step 7: Show ad with 10-second loading timeout
      let loadTimeout: any;
      let isAdStarted = false;

      const adShowPromise = new Promise<void>((resolve, reject) => {
        // Start 10-second timeout
        loadTimeout = setTimeout(async () => {
          if (!isAdStarted) {
            const errorMsg = "Verification ad failed to load within 10 seconds. Please check your connection and try again.";
            await logStep("Ad failed: Loading timeout", {
              adFailed: "YES",
              failureReason: errorMsg
            });
            reject(new Error("TIMEOUT"));
          }
        }, 10000);

        // Listen for ad start to clear timeout
        if (typeof adController.addEventListener === 'function') {
          adController.addEventListener('Start', async () => {
            isAdStarted = true;
            clearTimeout(loadTimeout);
            await logStep("Ad loaded", {
              adLoaded: "YES"
            });
          });

          adController.addEventListener('error', (err: any) => {
            isAdStarted = true; // prevent timeout trigger
            clearTimeout(loadTimeout);
            reject(err);
          });

          adController.addEventListener('close', () => {
            isAdStarted = true; // prevent timeout trigger
            clearTimeout(loadTimeout);
          });
        }

        // Call show() which returns a promise
        adController.show()
          .then(async (result: any) => {
            clearTimeout(loadTimeout);
            if (result && result.done) {
              await logStep("Ad completed", {
                adCompleted: "YES"
              });
              resolve();
            } else {
              const errorMsg = result?.description || "User closed the ad before completion.";
              await logStep("Ad failed: Skipped/Closed", {
                adFailed: "YES",
                failureReason: errorMsg
              });
              reject(new Error("AD_SKIPPED"));
            }
          })
          .catch(async (err: any) => {
            clearTimeout(loadTimeout);
            const errStr = typeof err === "object" ? (err?.message || err?.description || JSON.stringify(err)) : String(err);
            await logStep("Ad failed: Playback error", {
              adFailed: "YES",
              failureReason: errStr
            });
            reject(new Error(errStr));
          });
      });

      await adShowPromise;

    } catch (err: any) {
      const errStr = err?.message || String(err);
      console.error("[Adsgram Diagnostics] Exact failure reason:", errStr);
      throw err;
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
        showAd,
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
