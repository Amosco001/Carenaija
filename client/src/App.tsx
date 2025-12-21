import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { ComparisonProvider } from "@/lib/comparison-context";
import { Layout } from "@/components/layout";
import { CompareBar } from "@/components/compare-bar";
import NotFound from "@/pages/not-found";

// Pages
import Home from "@/pages/home";
import SearchPage from "@/pages/search";
import HospitalDetails from "@/pages/hospital-details";
import WriteReview from "@/pages/write-review";
import SuggestHospital from "@/pages/suggest-hospital";
import ClaimProfile from "@/pages/claim-profile";
import Guidelines from "@/pages/guidelines";
import TrustSafety from "@/pages/trust-safety";
import About from "@/pages/about";
import Support from "@/pages/support";
import PrivacyPolicy from "@/pages/privacy-policy";
import TermsOfService from "@/pages/terms-of-service";
import Dashboard from "@/pages/dashboard";
import Profile from "@/pages/profile";
import AdminDashboard from "@/pages/admin-dashboard";
import AnalyticsDashboard from "@/pages/analytics-dashboard";
import ComparePage from "@/pages/compare";
import BlogPage from "@/pages/blog";
import BlogArticlePage from "@/pages/blog-article";
import HelpCenter from "@/pages/help-center";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/search" component={SearchPage} />
        <Route path="/hospital/:id" component={HospitalDetails} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/profile" component={Profile} />
        <Route path="/write-review/:type/:id" component={WriteReview} />
        <Route path="/suggest-hospital" component={SuggestHospital} />
        <Route path="/claim-profile/:id" component={ClaimProfile} />
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/analytics" component={AnalyticsDashboard} />
        <Route path="/compare" component={ComparePage} />
        <Route path="/blog" component={BlogPage} />
        <Route path="/blog/:slug" component={BlogArticlePage} />
        <Route path="/help" component={HelpCenter} />
        <Route path="/guidelines" component={Guidelines} />
        <Route path="/trust-safety" component={TrustSafety} />
        <Route path="/about" component={About} />
        <Route path="/support" component={Support} />
        <Route path="/privacy-policy" component={PrivacyPolicy} />
        <Route path="/terms-of-service" component={TermsOfService} />
        <Route component={NotFound} />
      </Switch>
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
