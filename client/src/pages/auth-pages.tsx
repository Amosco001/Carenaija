import { useAuth } from "@/lib/auth";
import { useLocation, Link } from "wouter";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, LogIn, Shield, Star, MessageSquare, UserPlus } from "lucide-react";

export default function AuthPage() {
  const { user, isLoading, login, getReturnUrl, clearReturnUrl } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<string>("login");

  useEffect(() => {
    if (user) {
      const returnUrl = getReturnUrl();
      if (returnUrl) {
        clearReturnUrl();
        setLocation(returnUrl);
      } else {
        setLocation("/");
      }
    }
  }, [user, setLocation, getReturnUrl, clearReturnUrl]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleLogin = () => {
    login();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-emerald-50 px-4 py-12">
      <Card className="w-full max-w-md shadow-xl border-slate-100">
        <CardHeader className="text-center space-y-4 pb-2">
          <Link href="/">
            <span className="font-serif text-3xl font-bold text-primary block cursor-pointer hover:opacity-80 transition-opacity">
              CareNaija
            </span>
          </Link>
          <div>
            <CardTitle className="text-2xl">Welcome to CareNaija</CardTitle>
            <CardDescription className="mt-2">
              Nigeria's trusted hospital review platform
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger 
                value="login" 
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                data-testid="tab-login"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Login
              </TabsTrigger>
              <TabsTrigger 
                value="signup"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                data-testid="tab-signup"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Sign Up
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground text-center">
                Sign in to your CareNaija account
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3 text-sm text-muted-foreground">
                  <Star className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <span>Rate and review hospitals</span>
                </div>
                <div className="flex items-start gap-3 text-sm text-muted-foreground">
                  <MessageSquare className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <span>Share your healthcare experiences</span>
                </div>
              </div>
              <Button 
                onClick={handleLogin} 
                className="w-full h-12 text-base font-medium"
                size="lg"
                data-testid="button-login"
              >
                <LogIn className="mr-2 h-5 w-5" />
                Sign in with Replit
              </Button>
            </TabsContent>
            
            <TabsContent value="signup" className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground text-center">
                Create a new CareNaija account
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span>Secure authentication with Replit</span>
                </div>
                <div className="flex items-start gap-3 text-sm text-muted-foreground">
                  <Star className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <span>Earn badges for your contributions</span>
                </div>
              </div>
              <Button 
                onClick={handleLogin} 
                className="w-full h-12 text-base font-medium"
                size="lg"
                data-testid="button-signup"
              >
                <UserPlus className="mr-2 h-5 w-5" />
                Sign up with Replit
              </Button>
            </TabsContent>
          </Tabs>

          <p className="text-xs text-center text-muted-foreground pt-2">
            By continuing, you agree to our{" "}
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
