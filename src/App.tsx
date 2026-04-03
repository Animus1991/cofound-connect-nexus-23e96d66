import React, { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { TenantProvider } from "@/contexts/TenantContext";
import { useTenant } from "@/contexts/TenantContext";
import { isGlobalPlatformHost } from "@/lib/domainResolver";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Loader2 } from "lucide-react";

const ChatWidget = lazy(() => import("@/components/ChatWidget"));

// ── Lazy-loaded pages ───────────────────────────────────────
// Group 1: Public/Auth pages (loaded together)
const LandingPage = lazy(() => import("./pages/LandingPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const SignupPage = lazy(() => import("./pages/SignupPage"));
const DemoPage = lazy(() => import("./pages/DemoPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const PricingPage = lazy(() => import("./pages/PricingPage"));
const OAuthCallbackPage = lazy(() => import("./pages/OAuthCallbackPage"));
const SsoCallbackPage = lazy(() => import("./pages/SsoCallbackPage"));
const TenantLandingPage = lazy(() => import("./pages/TenantLandingPage"));
const DomainNotFoundPage = lazy(() => import("./pages/DomainNotFoundPage"));
const PublicProfilePage = lazy(() => import("./pages/PublicProfilePage"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Group 2: Core app pages (most frequently used)
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const DiscoverPage = lazy(() => import("./pages/DiscoverPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));
const OnboardingPage = lazy(() => import("./pages/OnboardingPage"));

// Group 3: Social/Network pages
const NetworkPage = lazy(() => import("./pages/NetworkPage"));
const MessagesPage = lazy(() => import("./pages/MessagesPage"));
const MatchesPage = lazy(() => import("./pages/MatchesPage"));
const MatchDetailPage = lazy(() => import("./pages/MatchDetailPage"));
const SavedProfilesPage = lazy(() => import("./pages/SavedProfilesPage"));

// Group 4: Content pages
const OpportunitiesPage = lazy(() => import("./pages/OpportunitiesPage"));
const MentorsPage = lazy(() => import("./pages/MentorsPage"));
const MentorDetailPage = lazy(() => import("./pages/MentorDetailPage"));
const CommunitiesPage = lazy(() => import("./pages/CommunitiesPage"));
const CommunityDetailPage = lazy(() => import("./pages/CommunityDetailPage"));
const PostDetailPage = lazy(() => import("./pages/PostDetailPage"));
const LearningPage = lazy(() => import("./pages/LearningPage"));
const MilestonesPage = lazy(() => import("./pages/MilestonesPage"));

// Group 5: Business pages
const StartupPage = lazy(() => import("./pages/StartupPage"));
const BillingPage = lazy(() => import("./pages/BillingPage"));
const OrganizationsPage = lazy(() => import("./pages/OrganizationsPage"));
const OrganizationDetailPage = lazy(() => import("./pages/OrganizationDetailPage"));
const AdminDashboardPage = lazy(() => import("./pages/AdminDashboardPage"));

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

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/demo" element={<DemoPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
        <Route path="/t/:slug" element={<TenantLandingPage />} />
        <Route path="/sso/callback" element={<SsoCallbackPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/profile/:id" element={<PublicProfilePage />} />
        
        {/* Protected routes */}
        <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/discover" element={<ProtectedRoute><DiscoverPage /></ProtectedRoute>} />
        <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
        <Route path="/network" element={<ProtectedRoute><NetworkPage /></ProtectedRoute>} />
        <Route path="/opportunities" element={<ProtectedRoute><OpportunitiesPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/learning" element={<ProtectedRoute><LearningPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="/mentors" element={<ProtectedRoute><MentorsPage /></ProtectedRoute>} />
        <Route path="/mentors/:id" element={<ProtectedRoute><MentorDetailPage /></ProtectedRoute>} />
        <Route path="/communities" element={<ProtectedRoute><CommunitiesPage /></ProtectedRoute>} />
        <Route path="/communities/:id" element={<ProtectedRoute><CommunityDetailPage /></ProtectedRoute>} />
        <Route path="/communities/:id/posts/:postId" element={<ProtectedRoute><PostDetailPage /></ProtectedRoute>} />
        <Route path="/milestones" element={<ProtectedRoute><MilestonesPage /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><AdminDashboardPage /></ProtectedRoute>} />
        <Route path="/startup" element={<ProtectedRoute><StartupPage /></ProtectedRoute>} />
        <Route path="/matches" element={<ProtectedRoute><MatchesPage /></ProtectedRoute>} />
        <Route path="/matches/:userId" element={<ProtectedRoute><MatchDetailPage /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
        <Route path="/organizations" element={<ProtectedRoute><OrganizationsPage /></ProtectedRoute>} />
        <Route path="/organizations/:id" element={<ProtectedRoute><OrganizationDetailPage /></ProtectedRoute>} />
        <Route path="/saved" element={<ProtectedRoute><SavedProfilesPage /></ProtectedRoute>} />
        <Route path="/billing" element={<ProtectedRoute><BillingPage /></ProtectedRoute>} />
        
        <Route path="*" element={<NotFound />} />
      </Routes>
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
              <AppRoutes />
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
