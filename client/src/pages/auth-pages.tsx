import { useAuth } from "@/lib/auth";
import { useLocation, Link } from "wouter";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, LogIn, Shield, Star, MessageSquare } from "lucide-react";

export default function AuthPage() {
  const { user, isLoading, login } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-emerald-50 px-4 py-12">
      <Card className="w-full max-w-md shadow-xl border-slate-100">
        <CardHeader className="text-center space-y-4">
          <Link href="/">
            <span className="font-serif text-3xl font-bold text-primary block cursor-pointer hover:opacity-80 transition-opacity">
              CareNaija
            </span>
          </Link>
          <div>
            <CardTitle className="text-2xl">Welcome to CareNaija</CardTitle>
            <CardDescription className="mt-2">
              Sign in to write reviews, bookmark hospitals, and manage your profile
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3 text-sm text-muted-foreground">
              <Star className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <span>Rate and review hospitals based on your experience</span>
            </div>
            <div className="flex items-start gap-3 text-sm text-muted-foreground">
              <MessageSquare className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <span>Share insights to help other Nigerians find quality healthcare</span>
            </div>
            <div className="flex items-start gap-3 text-sm text-muted-foreground">
              <Shield className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span>Your data is protected with secure authentication</span>
            </div>
          </div>

          <div className="pt-2">
            <Button 
              onClick={login} 
              className="w-full h-12 text-base font-medium"
              size="lg"
              data-testid="button-login"
            >
              <LogIn className="mr-2 h-5 w-5" />
              Sign in with Replit
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            By signing in, you agree to our{" "}
            <Link href="/terms-of-service" className="underline hover:text-primary">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy-policy" className="underline hover:text-primary">
              Privacy Policy
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
