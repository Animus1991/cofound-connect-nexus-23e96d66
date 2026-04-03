import React, { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { TenantProvider } from "@/contexts/TenantContext";
import { useTenant } from "@/contexts/TenantContext";
import { isGlobalPlatformHost } from "@/lib/domainResolver";
import { AnimatePresence } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Loader2 } from "lucide-react";

const ChatWidget = lazy(() => import("@/components/ChatWidget"));

// ── Lazy-loaded pages (code splitting) ───────────────────────
const LandingPage = lazy(() => import("./pages/LandingPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const SignupPage = lazy(() => import("./pages/SignupPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const DiscoverPage = lazy(() => import("./pages/DiscoverPage"));
const MessagesPage = lazy(() => import("./pages/MessagesPage"));
const OpportunitiesPage = lazy(() => import("./pages/OpportunitiesPage"));
const NetworkPage = lazy(() => import("./pages/NetworkPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const LearningPage = lazy(() => import("./pages/LearningPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const OnboardingPage = lazy(() => import("./pages/OnboardingPage"));
const MentorsPage = lazy(() => import("./pages/MentorsPage"));
const CommunitiesPage = lazy(() => import("./pages/CommunitiesPage"));
const CommunityDetailPage = lazy(() => import("./pages/CommunityDetailPage"));
const MilestonesPage = lazy(() => import("./pages/MilestonesPage"));
const AdminDashboardPage = lazy(() => import("./pages/AdminDashboardPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const DemoPage = lazy(() => import("./pages/DemoPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const OAuthCallbackPage = lazy(() => import("./pages/OAuthCallbackPage"));
const StartupPage = lazy(() => import("./pages/StartupPage"));
const MatchesPage = lazy(() => import("./pages/MatchesPage"));
const PublicProfilePage = lazy(() => import("./pages/PublicProfilePage"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));
const MatchDetailPage = lazy(() => import("./pages/MatchDetailPage"));
const MentorDetailPage = lazy(() => import("./pages/MentorDetailPage"));
const PostDetailPage = lazy(() => import("./pages/PostDetailPage"));
const OrganizationsPage = lazy(() => import("./pages/OrganizationsPage"));
const OrganizationDetailPage = lazy(() => import("./pages/OrganizationDetailPage"));
const SavedProfilesPage = lazy(() => import("./pages/SavedProfilesPage"));
const TenantLandingPage = lazy(() => import("./pages/TenantLandingPage"));
const SsoCallbackPage = lazy(() => import("./pages/SsoCallbackPage"));
const PricingPage = lazy(() => import("./pages/PricingPage"));
const BillingPage = lazy(() => import("./pages/BillingPage"));
const DomainNotFoundPage = lazy(() => import("./pages/DomainNotFoundPage"));

function PageLoader() {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

/**
 * DomainBootstrap — wraps the router when we are NOT on the global platform host.
 * If the domain-resolution result indicates no tenant was found, show DomainNotFoundPage.
 * If we're still loading, show the spinner.
 */
function DomainBootstrap({ children }: { children: React.ReactNode }) {
  const { isLoading, domainResolution } = useTenant();

  // On global platform host (localhost / cofounderbay.com root): pass through
  if (isGlobalPlatformHost()) return <>{children}</>;

  if (isLoading) return <PageLoader />;

  // Domain resolved but no tenant found → show DomainNotFoundPage
  const notFound =
    domainResolution !== null &&
    !domainResolution.resolved &&
    "reason" in domainResolution &&
    domainResolution.reason !== "no-domain";
  if (notFound) {
    return (
      <Suspense fallback={<PageLoader />}>
        <DomainNotFoundPage />
      </Suspense>
    );
  }

  return <>{children}</>;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      gcTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: 1,
      retryDelay: 1000,
    },
  },
});

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <Suspense fallback={<PageLoader />}>
    <AnimatePresence mode="popLayout" initial={false}>
      <Routes location={location} key={location.pathname}>
        {/* Public routes */}
        <Route path="/" element={<PageTransition><LandingPage /></PageTransition>} />
        <Route path="/login" element={<PageTransition><LoginPage /></PageTransition>} />
        <Route path="/signup" element={<PageTransition><SignupPage /></PageTransition>} />
        <Route path="/demo" element={<PageTransition><DemoPage /></PageTransition>} />
        <Route path="/forgot-password" element={<PageTransition><ForgotPasswordPage /></PageTransition>} />
        <Route path="/reset-password" element={<PageTransition><ResetPasswordPage /></PageTransition>} />
        <Route path="/privacy" element={<PageTransition><PrivacyPage /></PageTransition>} />
        <Route path="/terms" element={<PageTransition><TermsPage /></PageTransition>} />
        <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
        <Route path="/t/:slug" element={<TenantLandingPage />} />
        <Route path="/sso/callback" element={<SsoCallbackPage />} />
        <Route path="/pricing" element={<PageTransition><PricingPage /></PageTransition>} />
        <Route path="/profile/:id" element={<PageTransition><PublicProfilePage /></PageTransition>} />
        
        {/* Protected routes */}
        <Route path="/onboarding" element={<ProtectedRoute><PageTransition><OnboardingPage /></PageTransition></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><PageTransition><DashboardPage /></PageTransition></ProtectedRoute>} />
        <Route path="/discover" element={<ProtectedRoute><PageTransition><DiscoverPage /></PageTransition></ProtectedRoute>} />
        <Route path="/messages" element={<ProtectedRoute><PageTransition><MessagesPage /></PageTransition></ProtectedRoute>} />
        <Route path="/network" element={<ProtectedRoute><PageTransition><NetworkPage /></PageTransition></ProtectedRoute>} />
        <Route path="/opportunities" element={<ProtectedRoute><PageTransition><OpportunitiesPage /></PageTransition></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><PageTransition><ProfilePage /></PageTransition></ProtectedRoute>} />
        <Route path="/learning" element={<ProtectedRoute><PageTransition><LearningPage /></PageTransition></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><PageTransition><SettingsPage /></PageTransition></ProtectedRoute>} />
        <Route path="/mentors" element={<ProtectedRoute><PageTransition><MentorsPage /></PageTransition></ProtectedRoute>} />
        <Route path="/mentors/:id" element={<ProtectedRoute><PageTransition><MentorDetailPage /></PageTransition></ProtectedRoute>} />
        <Route path="/communities" element={<ProtectedRoute><PageTransition><CommunitiesPage /></PageTransition></ProtectedRoute>} />
        <Route path="/communities/:id" element={<ProtectedRoute><PageTransition><CommunityDetailPage /></PageTransition></ProtectedRoute>} />
        <Route path="/communities/:id/posts/:postId" element={<ProtectedRoute><PageTransition><PostDetailPage /></PageTransition></ProtectedRoute>} />
        <Route path="/milestones" element={<ProtectedRoute><PageTransition><MilestonesPage /></PageTransition></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><PageTransition><AdminDashboardPage /></PageTransition></ProtectedRoute>} />
        <Route path="/startup" element={<ProtectedRoute><PageTransition><StartupPage /></PageTransition></ProtectedRoute>} />
        <Route path="/matches" element={<ProtectedRoute><PageTransition><MatchesPage /></PageTransition></ProtectedRoute>} />
        <Route path="/matches/:userId" element={<ProtectedRoute><PageTransition><MatchDetailPage /></PageTransition></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><PageTransition><NotificationsPage /></PageTransition></ProtectedRoute>} />
        <Route path="/organizations" element={<ProtectedRoute><PageTransition><OrganizationsPage /></PageTransition></ProtectedRoute>} />
        <Route path="/organizations/:id" element={<ProtectedRoute><PageTransition><OrganizationDetailPage /></PageTransition></ProtectedRoute>} />
        <Route path="/saved" element={<ProtectedRoute><PageTransition><SavedProfilesPage /></PageTransition></ProtectedRoute>} />
        <Route path="/billing" element={<ProtectedRoute><PageTransition><BillingPage /></PageTransition></ProtectedRoute>} />
        
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
    </Suspense>
  );
}

const App = () => (
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <TenantProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <DomainBootstrap>
              <AnimatedRoutes />
              <Suspense fallback={null}>
                <ChatWidget />
              </Suspense>
            </DomainBootstrap>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
      </TenantProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
