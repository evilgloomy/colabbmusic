import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ArtistAgentAuthProvider } from "@/contexts/ArtistAgentAuth";
import Index from "./pages/Index";
import MusicPage from "./pages/Music";
import StoryPage from "./pages/Story";
import VideosPage from "./pages/Videos";
import PressPage from "./pages/Press";
import NotFound from "./pages/NotFound";
import ReleasePage from "./pages/ReleasePage";
import StoryDetailPage from "./pages/StoryDetail";
import StorePage from "./pages/Store";
import ProductDetailPage from "./pages/ProductDetail";
import PoliciesPage from "./pages/Policies";
import ChatPage from "./pages/ChatPage";
import AboutColaPage from "./pages/AboutCola";
import LoveVibeVol5 from "./pages/LoveVibeVol5";
import PrivacyPage from "./pages/Privacy";
import TermsPage from "./pages/Terms";
import { useCartSync } from "./hooks/useCartSync";
import { usePageTracking } from "./hooks/usePageTracking";
import { AipfAuthProvider } from "@/aipf/AipfAuthContext";
import AipfHome from "@/aipf/pages/Home";
import AipfAbout from "@/aipf/pages/About";
import AipfDirectory from "@/aipf/pages/Directory";
import AipfPublicProfile from "@/aipf/pages/PublicProfile";
import AipfJoin from "@/aipf/pages/Join";
import AipfApply from "@/aipf/pages/Apply";
import AipfNominate from "@/aipf/pages/Nominate";
import AipfFoundingCohort from "@/aipf/pages/FoundingCohort";
import AipfPrograms from "@/aipf/pages/Programs";
import { Journal as AipfJournalPage, JournalPost as AipfJournalPost } from "@/aipf/pages/Journal";
import AipfContact from "@/aipf/pages/Contact";
import AipfAdminLogin from "@/aipf/pages/AdminLogin";
import AipfAdminOverview from "@/aipf/pages/AdminOverview";
import AipfAdminInterest from "@/aipf/pages/AdminInterest";
import AipfAdminNominations from "@/aipf/pages/AdminNominations";
import { AdminDirectory as AipfAdminDirectory, AdminEntityEditor as AipfAdminEntityEditor } from "@/aipf/pages/AdminDirectory";
import AipfAdminBrokenLinks from "@/aipf/pages/AdminBrokenLinks";
import AipfAdminInvitations from "@/aipf/pages/AdminInvitations";
import { AdminJournal as AipfAdminJournal, AdminJournalEditor as AipfAdminJournalEditor } from "@/aipf/pages/AdminJournal";
import { AdminGuard } from "@/aipf/admin/AdminShell";
import AipfAdminForgotPassword from "@/aipf/pages/AdminForgotPassword";
import AipfAdminResetPassword from "@/aipf/pages/AdminResetPassword";
import AipfClaim from "@/aipf/pages/Claim";
import AipfVerify from "@/aipf/pages/Verify";
import AipfCertificate from "@/aipf/pages/Certificate";
import AipfAdminOnboarding from "@/aipf/pages/AdminOnboarding";
import AipfAdminContact from "@/aipf/pages/AdminContact";
import { lazy, Suspense } from "react";
import { LiveAuthProvider } from "@/live/LiveAuthContext";
import LiveGuard from "@/live/components/LiveGuard";
const LiveLogin = lazy(() => import("@/live/pages/LiveLogin"));
const LiveLobby = lazy(() => import("@/live/pages/LiveLobby"));
const LiveDirect = lazy(() => import("@/live/pages/LiveDirect"));
const LiveRoom = lazy(() => import("@/live/pages/LiveRoom"));
const LiveProducer = lazy(() => import("@/live/pages/LiveProducer"));

const queryClient = new QueryClient();

const AppInner = () => {
  useCartSync();
  usePageTracking();
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/music" element={<MusicPage />} />
      <Route path="/release/:id" element={<ReleasePage />} />
      <Route path="/story" element={<StoryPage />} />
      <Route path="/story/:id" element={<StoryDetailPage />} />
      <Route path="/videos" element={<VideosPage />} />
      <Route path="/store" element={<StorePage />} />
      <Route path="/product/:handle" element={<ProductDetailPage />} />
      <Route path="/press" element={<PressPage />} />
      <Route path="/chat" element={<ChatPage />} />
      <Route path="/about-cola" element={<AboutColaPage />} />
      <Route path="/policies" element={<PoliciesPage />} />
      <Route path="/lovevibevol5" element={<LoveVibeVol5 />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/terms" element={<TermsPage />} />

      {/* AI People Foundation */}
      <Route path="/aipf" element={<AipfHome />} />
      <Route path="/aipf/about" element={<AipfAbout />} />
      <Route path="/aipf/directory" element={<AipfDirectory />} />
      <Route path="/aipf/directory/:slug" element={<AipfPublicProfile />} />
      <Route path="/aipf/join" element={<AipfJoin />} />
      <Route path="/aipf/apply" element={<AipfApply />} />
      <Route path="/aipf/register-interest" element={<Navigate to="/aipf/apply" replace />} />
      <Route path="/aipf/nominate" element={<AipfNominate />} />
      <Route path="/aipf/claim" element={<AipfClaim />} />
      <Route path="/aipf/verify" element={<AipfVerify />} />
      <Route path="/aipf/verify/:memberNumber" element={<AipfVerify />} />
      <Route path="/aipf/certificate/:slug" element={<AipfCertificate />} />
      <Route path="/aipf/founding-cohort-2026" element={<AipfFoundingCohort />} />
      <Route path="/aipf/programs" element={<AipfPrograms />} />
      <Route path="/aipf/journal" element={<AipfJournalPage />} />
      <Route path="/aipf/journal/:slug" element={<AipfJournalPost />} />
      <Route path="/aipf/contact" element={<AipfContact />} />
      <Route path="/aipf/admin/login" element={<AipfAdminLogin />} />
      <Route path="/aipf/admin/forgot-password" element={<AipfAdminForgotPassword />} />
      <Route path="/aipf/admin/reset-password" element={<AipfAdminResetPassword />} />
      <Route path="/aipf/admin" element={<AdminGuard><AipfAdminOverview /></AdminGuard>} />
      <Route path="/aipf/admin/interest" element={<AdminGuard><AipfAdminInterest /></AdminGuard>} />
      <Route path="/aipf/admin/nominations" element={<AdminGuard><AipfAdminNominations /></AdminGuard>} />
      <Route path="/aipf/admin/directory" element={<AdminGuard><AipfAdminDirectory /></AdminGuard>} />
      <Route path="/aipf/admin/directory/:id" element={<AdminGuard><AipfAdminEntityEditor /></AdminGuard>} />
      <Route path="/aipf/admin/broken-links" element={<AdminGuard><AipfAdminBrokenLinks /></AdminGuard>} />
      <Route path="/aipf/admin/invitations" element={<AdminGuard><AipfAdminInvitations /></AdminGuard>} />
      <Route path="/aipf/admin/onboarding" element={<AdminGuard><AipfAdminOnboarding /></AdminGuard>} />
      <Route path="/aipf/admin/contact" element={<AdminGuard><AipfAdminContact /></AdminGuard>} />
      <Route path="/aipf/admin/journal" element={<AdminGuard><AipfAdminJournal /></AdminGuard>} />
      <Route path="/aipf/admin/journal/:id" element={<AdminGuard><AipfAdminJournalEditor /></AdminGuard>} />

      {/* Cola Live — private, unlisted */}
      <Route
        path="/live/*"
        element={
          <LiveAuthProvider>
            <Suspense fallback={null}>
              <Routes>
                <Route path="login" element={<LiveLogin />} />
                <Route path="" element={<LiveGuard><LiveDirect /></LiveGuard>} />
                <Route path="sessions" element={<LiveGuard><LiveLobby /></LiveGuard>} />
                <Route path="session/:sessionId" element={<LiveGuard><LiveRoom /></LiveGuard>} />
                <Route path="producer/:sessionId" element={<LiveGuard staffOnly><LiveProducer /></LiveGuard>} />
                <Route path="*" element={<Navigate to="/live" replace />} />
              </Routes>
            </Suspense>
          </LiveAuthProvider>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AipfAuthProvider>
        <ArtistAgentAuthProvider>
          <BrowserRouter>
            <AppInner />
          </BrowserRouter>
        </ArtistAgentAuthProvider>
      </AipfAuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
