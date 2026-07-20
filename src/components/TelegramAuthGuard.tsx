import React from "react";
import { useTelegramAuth } from "../context/TelegramAuthContext";
import { motion } from "motion/react";
import { AlertCircle, RefreshCw } from "lucide-react";

interface TelegramAuthGuardProps {
  children: React.ReactNode;
  setupComponent?: React.ReactNode;
}

export const TelegramAuthGuard: React.FC<TelegramAuthGuardProps> = ({ children, setupComponent }) => {
  const { user, loading, error, verifyAuth, isBackgroundLoading, isInsideTelegram } = useTelegramAuth();

  // Use the state-managed isInsideTelegram to avoid race conditions
  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const queryUserId = params?.get("userId");
  const isMiniApp = isInsideTelegram || !!queryUserId;

  if (error && isMiniApp && !loading && !isBackgroundLoading) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Authentication Failed</h2>
        <p className="text-slate-400 mb-8 max-w-xs">{error}</p>
        <button
          onClick={() => verifyAuth()}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-medium transition-colors"
        >
          <RefreshCw className="w-5 h-5" />
          Retry
        </button>
      </div>
    );
  }

  if (isMiniApp && !user && !loading && !isBackgroundLoading && setupComponent) {
    return <>{setupComponent}</>;
  }

  return <>{children}</>;
};
