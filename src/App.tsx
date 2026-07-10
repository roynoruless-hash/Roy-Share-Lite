/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, lazy, Suspense } from "react";
import { API_BASE } from "./config/api";
import AnimatedBackground from "./components/AnimatedBackground";
import Hero from "./components/Hero";
import Stats from "./components/Stats";
import Features from "./components/Features";
import HowItWorks from "./components/HowItWorks";
import WhyChooseUs from "./components/WhyChooseUs";
import FAQ from "./components/FAQ";
import SupportCommunity from "./components/SupportCommunity";
import CTA from "./components/CTA";
import Footer from "./components/Footer";
import AdminLogin from "./components/AdminLogin";
import MultiPageEngine from "./components/MultiPageEngine";

const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const DailyBonusPage = lazy(() => import("./pages/DailyBonusPage"));
const EarnRewardsPage = lazy(() => import("./pages/EarnRewardsPage"));
const RewardTasksPage = lazy(() => import("./pages/RewardTasksPage"));
const VerifyWithdrawalPage = lazy(() => import("./pages/VerifyWithdrawalPage"));
const CustomerSupportPage = lazy(() => import("./pages/CustomerSupportPage"));
const DriveUploadPage = lazy(() => import("./pages/DriveUploadPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicyPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const CookiePolicyPage = lazy(() => import("./pages/CookiePolicyPage"));
const DisclaimerPage = lazy(() => import("./pages/DisclaimerPage"));
const DMCAPage = lazy(() => import("./pages/DMCAPage"));
const CopyrightPolicyPage = lazy(() => import("./pages/CopyrightPolicyPage"));
const AcceptableUsePolicyPage = lazy(() => import("./pages/AcceptableUsePolicyPage"));
const HelpCenterPage = lazy(() => import("./pages/HelpCenterPage"));
const SystemStatusPage = lazy(() => import("./pages/SystemStatusPage"));
const RoadmapPage = lazy(() => import("./pages/RoadmapPage"));
const ChangelogPage = lazy(() => import("./pages/ChangelogPage"));
const GoogleDriveFeaturePage = lazy(() => import("./pages/GoogleDriveFeaturePage"));
const TelegramIntegrationPage = lazy(() => import("./pages/TelegramIntegrationPage"));
const SmartLinkFeaturePage = lazy(() => import("./pages/SmartLinkFeaturePage"));
const RewardEarningsPage = lazy(() => import("./pages/RewardEarningsPage"));
const RealTimeAnalyticsPage = lazy(() => import("./pages/RealTimeAnalyticsPage"));
const ReferralProgramPage = lazy(() => import("./pages/ReferralProgramPage"));
const EnterpriseSecurityPage = lazy(() => import("./pages/EnterpriseSecurityPage"));
const FastGlobalDeliveryPage = lazy(() => import("./pages/FastGlobalDeliveryPage"));
const ReferralLandingPage = lazy(() => import("./pages/ReferralLandingPage"));

import MoreMenu from "./components/MoreMenu";

import { TelegramAuthProvider } from "./context/TelegramAuthContext";
import { TelegramAuthGuard } from "./components/TelegramAuthGuard";
import { ProfileSetup } from "./components/ProfileSetup";
import { MiniAppHome } from "./pages/MiniAppHome";

const ADMIN_AUTH_ENABLED = false;

export default function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [, setDummyState] = useState(false);

  useEffect(() => {
    // Initialize Telegram WebApp
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
    }

    const handleLocationChange = () => {
      setDummyState(prev => !prev);
    };
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('pushstate', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('pushstate', handleLocationChange);
    };
  }, []);

  useEffect(() => {
    fetch(`${API_BASE}/api/system-settings`)
      .then(res => res.json())
      .then(() => {
        setLoadingConfig(false);
      })
      .catch(err => {
        console.error(err);
        setLoadingConfig(false);
      });
  }, []);

  const renderContent = () => {
    if (loadingConfig) {
      return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }

    // PRIORITIZE Referral Landing Page routing for ALL /ref requests
    if (window.location.pathname.startsWith("/ref") || window.location.pathname === "/ref") {
      return <ReferralLandingPage />;
    }

    // Check if we are in Telegram Mini App context
    const searchParams = new URLSearchParams(window.location.search);
    const hasTgParams = searchParams.has("tgWebAppData") || searchParams.has("tgWebAppVersion") || searchParams.has("userId") || searchParams.has("tgWebAppStartParam");
    const isTelegram = !!(window as any).Telegram?.WebApp?.initData || hasTgParams || /Telegram/i.test(navigator.userAgent);
    const isReferralPath = window.location.pathname === "/referral";

    if (isTelegram || isReferralPath) {
      return (
        <TelegramAuthGuard>
          <MiniAppHome />
        </TelegramAuthGuard>
      );
    }

    // Fallback for non-Telegram (Web Browser)
    if (window.location.pathname === "/dashboard/admin") {
      return <AdminDashboard />;
    }

    const params = new URLSearchParams(window.location.search);
    // ... existing link redirection logic omitted for brevity
    const redirectParam = params.get("redirect") || params.get("url") || params.get("id") || params.get("alias") || params.get("linkId") || params.get("gpl_token");

    const tg = (window as any).Telegram?.WebApp;
    const startParam = tg?.initDataUnsafe?.start_param || params.get("tgWebAppStartParam") || params.get("startapp") || params.get("start_param");
    console.log("[App.tsx] Final Resolved startParam:", startParam);

    let detectedLinkId: string | null = null;
    let detectedType: "shortener" | "download" | null = null;

    // Check pathname matches first
    const pathLinkMatch = window.location.pathname.match(/^\/lnk\/([a-zA-Z0-9_-]+)/) || 
                          window.location.pathname.match(/^\/link\/([a-zA-Z0-9_-]+)/) ||
                          window.location.pathname.match(/^\/s\/([a-zA-Z0-9_-]+)/);

    const pathDownloadMatch = window.location.pathname.match(/^\/download\/([a-zA-Z0-9_-]+)/);

    if (pathLinkMatch) {
      detectedLinkId = pathLinkMatch[1];
      detectedType = "shortener";
      console.log("[App.tsx] Detected link ID from pathname:", detectedLinkId);
    } else if (pathDownloadMatch) {
      detectedLinkId = pathDownloadMatch[1];
      detectedType = "download";
      console.log("[App.tsx] Detected download ID from pathname:", detectedLinkId);
    }

    // 3. Fallback/Override from query parameters
    if (!detectedLinkId && redirectParam) {
      console.log("[App.tsx] Found redirect/id/url query parameter:", redirectParam);
      const decodedParam = decodeURIComponent(redirectParam);
      console.log("[App.tsx] Decoded redirect parameter:", decodedParam);

      try {
        if (decodedParam.startsWith("http://") || decodedParam.startsWith("https://")) {
          const parsedUrl = new URL(decodedParam);
          console.log("[App.tsx] Parsed full URL from query parameter:", parsedUrl.href);
          const qPathMatch = parsedUrl.pathname.match(/^\/lnk\/([a-zA-Z0-9_-]+)/) || 
                             parsedUrl.pathname.match(/^\/link\/([a-zA-Z0-9_-]+)/) ||
                             parsedUrl.pathname.match(/^\/s\/([a-zA-Z0-9_-]+)/);
          const qDownloadMatch = parsedUrl.pathname.match(/^\/download\/([a-zA-Z0-9_-]+)/);
          
          if (qPathMatch) {
            detectedLinkId = qPathMatch[1];
            detectedType = "shortener";
          } else if (qDownloadMatch) {
            detectedLinkId = qDownloadMatch[1];
            detectedType = "download";
          }
        } else if (decodedParam.startsWith("/lnk/") || decodedParam.startsWith("/link/") || decodedParam.startsWith("/s/")) {
          const cleanParam = decodedParam.replace(/^\//, "");
          const parts = cleanParam.split("/");
          if (parts.length >= 2) {
            detectedLinkId = parts[1];
            detectedType = "shortener";
          }
        } else if (decodedParam.startsWith("/download/")) {
          const cleanParam = decodedParam.replace(/^\//, "");
          const parts = cleanParam.split("/");
          if (parts.length >= 2) {
            detectedLinkId = parts[1];
            detectedType = "download";
          }
        } else if (/^[a-zA-Z0-9_-]+$/.test(decodedParam)) {
          detectedLinkId = decodedParam;
          detectedType = "shortener";
        }
      } catch (e) {
        console.error("[App.tsx] Error parsing decoded redirectParam:", e);
      }
    }

    if (detectedLinkId && detectedType) {
      console.log(`[App.tsx] Directing to MultiPageEngine: type=${detectedType}, id=${detectedLinkId}`);
      return <MultiPageEngine type={detectedType} id={detectedLinkId} />;
    }


    if (window.location.pathname === "/daily-bonus") {
      return <DailyBonusPage />;
    }

    if (window.location.pathname === "/earn-rewards") {
      return <EarnRewardsPage />;
    }

    if (window.location.pathname === "/reward-tasks") {
      return <RewardTasksPage />;
    }

    const verifyMatch = window.location.pathname.match(/^\/verify-withdrawal\/([a-zA-Z0-9_-]+)/);
    if (verifyMatch) {
      const userId = verifyMatch[1];
      return <VerifyWithdrawalPage userId={userId} />;
    }

    if (window.location.pathname === "/support" || window.location.pathname === "/customer-support") {
      return <CustomerSupportPage />;
    }

    if (window.location.pathname === "/drive-upload") {
      return <DriveUploadPage />;
    }

    if (window.location.pathname === "/about") {
      return <AboutPage />;
    }

    if (window.location.pathname === "/contact") {
      return <ContactPage />;
    }

    if (window.location.pathname === "/privacy" || window.location.pathname === "/privacy-policy") {
      return <PrivacyPolicyPage />;
    }

    if (window.location.pathname === "/terms" || window.location.pathname === "/terms-conditions") {
      return <TermsPage />;
    }

    if (window.location.pathname === "/cookie-policy") {
      return <CookiePolicyPage />;
    }

    if (window.location.pathname === "/disclaimer") {
      return <DisclaimerPage />;
    }

    if (window.location.pathname === "/dmca" || window.location.pathname === "/dmca-policy") {
      return <DMCAPage />;
    }

    if (window.location.pathname === "/copyright" || window.location.pathname === "/copyright-policy") {
      return <CopyrightPolicyPage />;
    }

    if (window.location.pathname === "/acceptable-use" || window.location.pathname === "/acceptable-use-policy") {
      return <AcceptableUsePolicyPage />;
    }

    if (window.location.pathname === "/help" || window.location.pathname === "/help-center") {
      return <HelpCenterPage />;
    }

    if (window.location.pathname === "/status" || window.location.pathname === "/system-status") {
      return <SystemStatusPage />;
    }

    if (window.location.pathname === "/roadmap") {
      return <RoadmapPage />;
    }

    if (window.location.pathname === "/changelog") {
      return <ChangelogPage />;
    }

    if (window.location.pathname === "/features/google-drive") {
      return <GoogleDriveFeaturePage />;
    }

    if (window.location.pathname === "/features/telegram-bot") {
      return <TelegramIntegrationPage />;
    }

    if (window.location.pathname === "/features/smart-links") {
      return <SmartLinkFeaturePage />;
    }

    if (window.location.pathname === "/features/reward-earnings") {
      return <RewardEarningsPage />;
    }

    if (window.location.pathname === "/features/analytics") {
      return <RealTimeAnalyticsPage />;
    }

    if (window.location.pathname === "/features/referral") {
      return <ReferralProgramPage />;
    }

    if (window.location.pathname === "/features/security") {
      return <EnterpriseSecurityPage />;
    }

    if (window.location.pathname === "/features/delivery") {
      return <FastGlobalDeliveryPage />;
    }

    if (window.location.pathname === "/dashboard") {
      return <DashboardPage />;
    }

    return (
      <main className="min-h-screen">
        <AnimatedBackground />
        <Hero onTriggerAdmin={() => ADMIN_AUTH_ENABLED ? setIsModalOpen(true) : window.location.href = '/dashboard/admin'} />
        <Stats />
        <Features />
        <HowItWorks />
        <WhyChooseUs />
        <FAQ featuredOnly={true} />
        <SupportCommunity featuredOnly={true} />
        <CTA />
        <Footer />
        {ADMIN_AUTH_ENABLED && <AdminLogin isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />}
      </main>
    );
  };

  return (
    <TelegramAuthProvider>
      <MoreMenu />
      <Suspense fallback={
        <div className="min-h-screen bg-[#020617] flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }>
        {renderContent()}
      </Suspense>
    </TelegramAuthProvider>
  );
}

