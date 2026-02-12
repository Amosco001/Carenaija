import { Switch, Route } from "wouter";
import { lazy, Suspense } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { ComparisonProvider } from "@/lib/comparison-context";
import { Layout } from "@/components/layout";
import { CompareBar } from "@/components/compare-bar";
import { Loader2 } from "lucide-react";
import NotFound from "@/pages/not-found";

// Critical pages (eagerly loaded)
import Home from "@/pages/home";
import SearchPage from "@/pages/search";
import HospitalDetails from "@/pages/hospital-details";

// Lazy-loaded pages (code splitting for performance)
const WriteReview = lazy(() => import("@/pages/write-review"));
const SuggestHospital = lazy(() => import("@/pages/suggest-hospital"));
const ClaimProfile = lazy(() => import("@/pages/claim-profile"));
const Guidelines = lazy(() => import("@/pages/guidelines"));
const TrustSafety = lazy(() => import("@/pages/trust-safety"));
const About = lazy(() => import("@/pages/about"));
const Support = lazy(() => import("@/pages/support"));
const PrivacyPolicy = lazy(() => import("@/pages/privacy-policy"));
const TermsOfService = lazy(() => import("@/pages/terms-of-service"));
const Dashboard = lazy(() => import("@/pages/dashboard"));
const Profile = lazy(() => import("@/pages/profile"));
const AdminDashboard = lazy(() => import("@/pages/admin-dashboard"));
const AnalyticsDashboard = lazy(() => import("@/pages/analytics-dashboard"));
const ComparePage = lazy(() => import("@/pages/compare"));
const BlogPage = lazy(() => import("@/pages/blog"));
const BlogArticlePage = lazy(() => import("@/pages/blog-article"));
const HelpCenter = lazy(() => import("@/pages/help-center"));
const Leaderboard = lazy(() => import("@/pages/leaderboard"));
const HealthHub = lazy(() => import("@/pages/health-hub"));
const HealthArticlePage = lazy(() => import("@/pages/health-article"));
const HealthCategoryPage = lazy(() => import("@/pages/health-category"));
const HealthDiseasesPage = lazy(() => import("@/pages/health-diseases"));
const HealthDiseasePage = lazy(() => import("@/pages/health-disease"));
const AuthPage = lazy(() => import("@/pages/auth-pages"));
const CityHospitalsPage = lazy(() => import("@/pages/city-hospitals"));
const SpecialtyPage = lazy(() => import("@/pages/specialty"));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
    </div>
  );
}

function Router() {
  return (
    <Layout>
      <Suspense fallback={<PageLoader />}>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/login" component={AuthPage} />
          <Route path="/search" component={SearchPage} />
          <Route path="/hospitals/:state/:slug" component={HospitalDetails} />
          <Route path="/hospitals/:state/:slug/reviews" component={HospitalDetails} />
          <Route path="/hospital/:id" component={HospitalDetails} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/profile" component={Profile} />
          <Route path="/write-review/:type/:id" component={WriteReview} />
          <Route path="/suggest-hospital" component={SuggestHospital} />
          <Route path="/claim-profile/:id" component={ClaimProfile} />
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/admin/analytics" component={AnalyticsDashboard} />
          <Route path="/compare" component={ComparePage} />
          <Route path="/specialties/:slug" component={SpecialtyPage} />
          <Route path="/guides" component={BlogPage} />
          <Route path="/guides/:slug" component={BlogArticlePage} />
          <Route path="/blog" component={BlogPage} />
          <Route path="/blog/:slug" component={BlogArticlePage} />
          <Route path="/health" component={HealthHub} />
          <Route path="/health/article/:slug" component={HealthArticlePage} />
          <Route path="/health/category/:slug" component={HealthCategoryPage} />
          <Route path="/health/diseases" component={HealthDiseasesPage} />
          <Route path="/health/disease/:slug" component={HealthDiseasePage} />
          <Route path="/help" component={HelpCenter} />
          <Route path="/leaderboard" component={Leaderboard} />
          <Route path="/guidelines" component={Guidelines} />
          <Route path="/trust-safety" component={TrustSafety} />
          <Route path="/about" component={About} />
          <Route path="/support" component={Support} />
          <Route path="/privacy-policy" component={PrivacyPolicy} />
          <Route path="/terms-of-service" component={TermsOfService} />
          <Route path="/hospitals/:city" component={CityHospitalsPage} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ComparisonProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
            <CompareBar />
          </TooltipProvider>
        </ComparisonProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
