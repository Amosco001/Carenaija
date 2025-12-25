import { useAuth } from "@/lib/auth";
import { useLocation, Link } from "wouter";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";

export default function AuthPage() {
  const { user, isLoading, login, getReturnUrl, clearReturnUrl } = useAuth();
  const [, setLocation] = useLocation();
  const [isSignUp, setIsSignUp] = useState(false);

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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const handleSocialLogin = () => {
    login();
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/">
            <span className="font-serif text-2xl font-bold text-emerald-600 cursor-pointer hover:opacity-80 transition-opacity" data-testid="logo">
              CareNaija
            </span>
          </Link>
          <nav className="flex items-center gap-4">
            {!isSignUp ? (
              <>
                <span className="text-sm text-gray-600 hidden sm:inline">Don't have an account?</span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsSignUp(true)}
                  data-testid="switch-to-signup"
                >
                  Sign up
                </Button>
              </>
            ) : (
              <>
                <span className="text-sm text-gray-600 hidden sm:inline">Already have an account?</span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsSignUp(false)}
                  data-testid="switch-to-login"
                >
                  Log in
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-md">
        <div className="space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2" data-testid="auth-heading">
              {isSignUp ? "Create your account" : "Welcome back"}
            </h1>
            <p className="text-gray-600">
              {isSignUp 
                ? "Join Nigeria's trusted hospital review community" 
                : "Log in to continue to CareNaija"}
            </p>
          </div>

          <div className="space-y-4">
            <Button
              variant="outline"
              className="w-full h-12 text-base font-medium border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-colors"
              onClick={handleSocialLogin}
              data-testid="button-continue-replit"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 5.5C7 4.67157 7.67157 4 8.5 4H15.5C16.3284 4 17 4.67157 17 5.5V12H8.5C7.67157 12 7 11.3284 7 10.5V5.5Z" fill="#F26207"/>
                <path d="M17 12H25.5C26.3284 12 27 12.6716 27 13.5V18.5C27 19.3284 26.3284 20 25.5 20H17V12Z" fill="#F26207"/>
                <path d="M7 21.5C7 20.6716 7.67157 20 8.5 20H17V28H8.5C7.67157 28 7 27.3284 7 26.5V21.5Z" fill="#F26207"/>
              </svg>
              Continue with Replit
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-gray-500">or</span>
              </div>
            </div>

            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSocialLogin(); }}>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="h-12 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                  data-testid="input-email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  className="h-12 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                  data-testid="input-password"
                />
              </div>

              {!isSignUp && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="remember" data-testid="checkbox-remember" />
                    <Label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer">
                      Remember me
                    </Label>
                  </div>
                  <Link href="/forgot-password" className="text-sm text-emerald-600 hover:text-emerald-700 hover:underline">
                    Forgot password?
                  </Link>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 text-base font-medium bg-emerald-600 hover:bg-emerald-700"
                data-testid="button-submit"
              >
                {isSignUp ? "Sign up" : "Log in"}
              </Button>
            </form>

            <p className="text-xs text-center text-gray-500 leading-relaxed">
              By clicking Continue with Replit or {isSignUp ? "Sign up" : "Log in"}, you agree to the{" "}
              <Link href="/terms-of-service" className="text-emerald-600 hover:underline">
                Terms of Use
              </Link>{" "}
              and{" "}
              <Link href="/privacy-policy" className="text-emerald-600 hover:underline">
                Privacy Policy
              </Link>
              . We'll keep you logged in.
            </p>
          </div>

          <div className="text-center pt-4">
            {isSignUp ? (
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <button 
                  onClick={() => setIsSignUp(false)} 
                  className="text-emerald-600 hover:text-emerald-700 hover:underline font-medium"
                  data-testid="link-to-login"
                >
                  Log in.
                </button>
              </p>
            ) : (
              <p className="text-sm text-gray-600">
                Don't have an account?{" "}
                <button 
                  onClick={() => setIsSignUp(true)} 
                  className="text-emerald-600 hover:text-emerald-700 hover:underline font-medium"
                  data-testid="link-to-signup"
                >
                  Sign up.
                </button>
              </p>
            )}
          </div>
        </div>
      </main>

      <footer className="border-t mt-auto">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-500">
            <Link href="/" className="hover:text-gray-700">
              © 2025 CareNaija
            </Link>
            <span className="hidden sm:inline">·</span>
            <Link href="/help" className="hover:text-gray-700">
              Help
            </Link>
            <span className="hidden sm:inline">·</span>
            <Link href="/privacy-policy" className="hover:text-gray-700">
              Privacy Policy
            </Link>
            <span className="hidden sm:inline">·</span>
            <Link href="/terms-of-service" className="hover:text-gray-700">
              Terms of Use
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
