import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { Layout } from "@/components/layout";
import NotFound from "@/pages/not-found";

// Pages
import Home from "@/pages/home";
import SearchPage from "@/pages/search";
import HospitalDetails from "@/pages/hospital-details";
import AuthPage from "@/pages/auth-pages";
import WriteReview from "@/pages/write-review";
import SuggestHospital from "@/pages/suggest-hospital";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/search" component={SearchPage} />
        <Route path="/hospital/:id" component={HospitalDetails} />
        <Route path="/login" component={AuthPage} />
        <Route path="/register" component={AuthPage} />
        <Route path="/write-review/:type/:id" component={WriteReview} />
        <Route path="/suggest-hospital" component={SuggestHospital} />
        <Route path="/admin">
          <div className="container mx-auto py-20 text-center">
            <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>
            <p className="text-muted-foreground">Mock Admin Dashboard - Functionality would go here.</p>
          </div>
        </Route>
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
