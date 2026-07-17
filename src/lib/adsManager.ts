/**
 * Adsgram Reusable Ads Manager Utility
 * Supports retrieving separate configurations for Reward, Interstitial, and Task ads.
 */

export interface AdsgramTypeConfig {
  appId: string;
  blockId: string;
  lastSaved?: string;
  lastTested?: string;
  lastTestResult?: "Success" | "Failed" | string;
}

export interface AdsgramSettings {
  reward: AdsgramTypeConfig;
  interstitial: AdsgramTypeConfig;
  task: AdsgramTypeConfig;
  adsgramAppId?: string; // Backwards compatibility fallback
  adsgramBlockId?: string; // Backwards compatibility fallback
  updatedAt?: string;
}

/**
 * Loads the Adsgram SDK script if not already present in the window scope.
 * Uses the correct CDN: https://sad.adsgram.ai/js/sad.min.js
 */
export function loadAdsgramSDK(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Window is not defined (SSR environment)"));
      return;
    }

    if ((window as any).Adsgram) {
      resolve((window as any).Adsgram);
      return;
    }

    // Check if the script is already added
    const existingScript = document.getElementById("adsgram-sdk-script");
    if (existingScript) {
      // Script exists but Adsgram object is not yet populated. Poll or wait.
      let attempts = 0;
      const interval = setInterval(() => {
        if ((window as any).Adsgram) {
          clearInterval(interval);
          resolve((window as any).Adsgram);
        } else if (attempts > 30) {
          clearInterval(interval);
          reject(new Error("Adsgram object not loaded after script injection."));
        }
        attempts++;
      }, 100);
      return;
    }

    const script = document.createElement("script");
    script.id = "adsgram-sdk-script";
    script.src = "https://sad.adsgram.ai/js/sad.min.js";
    script.async = true;
    
    script.onload = () => {
      if ((window as any).Adsgram) {
        resolve((window as any).Adsgram);
      } else {
        reject(new Error("Adsgram loaded but Adsgram object not found on window."));
      }
    };

    script.onerror = () => {
      reject(new Error("Failed to load Adsgram SDK script from CDN."));
    };

    document.head.appendChild(script);
  });
}

/**
 * Public function to retrieve the App ID and Block ID for a specific ad type.
 * Ensures future compatibility where any page can request 'Reward', 'Interstitial', or 'Task'.
 */
export async function getAdsgramConfig(type: 'Reward' | 'Interstitial' | 'Task' | string): Promise<{ appId: string; blockId: string }> {
  try {
    const res = await fetch("/api/adsgram-settings");
    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}`);
    }
    const data = await res.json();
    if (data.success && data.settings) {
      const settings = data.settings;
      const normalizedType = type.toLowerCase() as 'reward' | 'interstitial' | 'task';
      
      if (settings[normalizedType] && settings[normalizedType].blockId) {
        return {
          appId: settings[normalizedType].appId || "",
          blockId: settings[normalizedType].blockId || ""
        };
      }

      // Fallbacks if type-specific config is missing
      if (normalizedType === 'reward') {
        return {
          appId: settings.adsgramAppId || "",
          blockId: settings.adsgramBlockId || ""
        };
      }
    }
    // Final safe fallback if no settings configured
    return { appId: "", blockId: "" };
  } catch (e) {
    console.error(`[AdsManager] Error fetching Adsgram config for "${type}":`, e);
    return { appId: "", blockId: "" };
  }
}

/**
 * Checks if the SDK is currently loaded.
 */
export function isAdsgramSDKLoaded(): boolean {
  return typeof window !== "undefined" && !!(window as any).Adsgram;
}
