import { useAuth } from "@/lib/auth";
import { useLocation, Link } from "wouter";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { SEOHead } from "@/components/seo-head";

export default function AuthPage() {
  const { user, isLoading, login, register, getReturnUrl, clearReturnUrl } = useAuth();
  const [, setLocation] = useLocation();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      let result;
      if (isSignUp) {
        result = await register({ email, password, firstName, lastName });
      } else {
        result = await login(email, password);
      }

      if (!result.success) {
        setError(result.message || "Something went wrong");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchMode = () => {
    setIsSignUp(!isSignUp);
    setError("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex flex-col">
      <SEOHead
        title={isSignUp ? "Create Account" : "Sign In"}
        description="Sign in or create your CareNaija account to write hospital reviews and access personalised features."
        noIndex={true}
      />
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/">
            <span className="font-serif text-2xl font-bold text-emerald-600 cursor-pointer hover:opacity-80 transition-opacity" data-testid="logo">
              CareNaija
            </span>
          </Link>
          <nav className="flex items-center gap-3">
            <span className="text-sm text-gray-600 hidden sm:inline">
              {isSignUp ? "Already have an account?" : "New here?"}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={switchMode}
              className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              data-testid={isSignUp ? "switch-to-login" : "switch-to-signup"}
            >
              {isSignUp ? "Log in" : "Sign up"}
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 mb-4">
                <svg className="w-7 h-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1" data-testid="auth-heading">
                {isSignUp ? "Create your account" : "Welcome back"}
              </h1>
              <p className="text-gray-500 text-sm">
                {isSignUp
                  ? "Join Nigeria's trusted hospital review community"
                  : "Log in to continue to CareNaija"}
              </p>
            </div>

            {error && (
              <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm" data-testid="auth-error">
                {error}
              </div>
            )}

            <form className="space-y-5" onSubmit={handleSubmit}>
              {isSignUp && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                      First name
                    </Label>
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="e.g. Adaeze"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                      required
                      data-testid="input-firstname"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                      Last name
                    </Label>
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="e.g. Okafor"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                      required
                      data-testid="input-lastname"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                  required
                  data-testid="input-email"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={isSignUp ? "At least 8 characters" : "Enter your password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 pr-10"
                    required
                    minLength={isSignUp ? 8 : undefined}
                    data-testid="input-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    data-testid="toggle-password"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {!isSignUp && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="remember" data-testid="checkbox-remember" />
                    <Label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer">
                      Remember me
                    </Label>
                  </div>
                  <Link href="/forgot-password" className="text-sm text-emerald-600 hover:text-emerald-700 hover:underline font-medium" data-testid="link-forgot-password">
                    Forgot password?
                  </Link>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-11 text-base font-medium bg-emerald-600 hover:bg-emerald-700 transition-colors"
                disabled={isSubmitting}
                data-testid="button-submit"
              >
                {isSubmitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  isSignUp ? "Create account" : "Log in"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              {isSignUp ? (
                <p className="text-sm text-gray-600">
                  Already have an account?{" "}
                  <button
                    onClick={switchMode}
                    className="text-emerald-600 hover:text-emerald-700 hover:underline font-medium"
                    data-testid="link-to-login"
                  >
                    Log in
                  </button>
                </p>
              ) : (
                <p className="text-sm text-gray-600">
                  Don't have an account?{" "}
                  <button
                    onClick={switchMode}
                    className="text-emerald-600 hover:text-emerald-700 hover:underline font-medium"
                    data-testid="link-to-signup"
                  >
                    Sign up for free
                  </button>
                </p>
              )}
            </div>

            <p className="mt-6 text-xs text-center text-gray-400 leading-relaxed">
              By continuing, you agree to our{" "}
              <Link href="/terms-of-service" className="text-emerald-600 hover:underline">
                Terms of Use
              </Link>{" "}
              and{" "}
              <Link href="/privacy-policy" className="text-emerald-600 hover:underline">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t bg-white/80">
        <div className="container mx-auto px-4 py-5">
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-400">
            <Link href="/" className="hover:text-gray-600">
              CareNaija {new Date().getFullYear()}
            </Link>
            <span className="hidden sm:inline">·</span>
            <Link href="/help" className="hover:text-gray-600">
              Help
            </Link>
            <span className="hidden sm:inline">·</span>
            <Link href="/privacy-policy" className="hover:text-gray-600">
              Privacy
            </Link>
            <span className="hidden sm:inline">·</span>
            <Link href="/terms-of-service" className="hover:text-gray-600">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
