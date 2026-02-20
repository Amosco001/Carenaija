import { useState } from "react";
import { Link, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff, ArrowLeft, CheckCircle } from "lucide-react";

export default function ResetPasswordPage() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const token = params.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex flex-col">
        <header className="border-b bg-white/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 h-16 flex items-center">
            <Link href="/">
              <span className="font-serif text-2xl font-bold text-emerald-600 cursor-pointer hover:opacity-80 transition-opacity" data-testid="logo">
                CareNaija
              </span>
            </Link>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-2" data-testid="text-invalid-heading">Invalid reset link</h1>
              <p className="text-gray-500 text-sm mb-6" data-testid="text-invalid-message">
                This password reset link is invalid or missing. Please request a new one.
              </p>
              <Link href="/forgot-password">
                <Button className="bg-emerald-600 hover:bg-emerald-700" data-testid="button-request-new">
                  Request new reset link
                </Button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Something went wrong");
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex flex-col">
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 h-16 flex items-center">
          <Link href="/">
            <span className="font-serif text-2xl font-bold text-emerald-600 cursor-pointer hover:opacity-80 transition-opacity" data-testid="logo">
              CareNaija
            </span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            {success ? (
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 mb-4">
                  <CheckCircle className="w-7 h-7 text-emerald-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2" data-testid="text-success-heading">
                  Password reset successful
                </h1>
                <p className="text-gray-500 text-sm mb-6" data-testid="text-success-message">
                  Your password has been updated. You can now log in with your new password.
                </p>
                <Link href="/login">
                  <Button className="bg-emerald-600 hover:bg-emerald-700" data-testid="button-go-login">
                    Go to login
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 mb-4">
                    <svg className="w-7 h-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                    </svg>
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-1" data-testid="text-heading">
                    Create new password
                  </h1>
                  <p className="text-gray-500 text-sm">
                    Enter a new password for your account. Make sure it's at least 8 characters.
                  </p>
                </div>

                {error && (
                  <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm" data-testid="text-error">
                    {error}
                  </div>
                )}

                <form className="space-y-5" onSubmit={handleSubmit}>
                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                      New password
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="At least 8 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 pr-10"
                        required
                        minLength={8}
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

                  <div className="space-y-1.5">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                      Confirm new password
                    </Label>
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                      required
                      minLength={8}
                      data-testid="input-confirm-password"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 text-base font-medium bg-emerald-600 hover:bg-emerald-700 transition-colors"
                    disabled={isSubmitting}
                    data-testid="button-submit"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      "Reset password"
                    )}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <Link href="/login" className="text-sm text-emerald-600 hover:text-emerald-700 hover:underline font-medium" data-testid="link-login">
                    <ArrowLeft className="w-3 h-3 inline mr-1" />
                    Back to login
                  </Link>
                </div>
              </>
            )}
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
          </div>
        </div>
      </footer>
    </div>
  );
}
