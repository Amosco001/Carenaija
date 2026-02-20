import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
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
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/">
            <span className="font-serif text-2xl font-bold text-emerald-600 cursor-pointer hover:opacity-80 transition-opacity" data-testid="logo">
              CareNaija
            </span>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="sm" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50" data-testid="link-back-login">
              Back to login
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            {success ? (
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 mb-4">
                  <Mail className="w-7 h-7 text-emerald-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2" data-testid="text-success-heading">
                  Check your email
                </h1>
                <p className="text-gray-500 text-sm mb-6" data-testid="text-success-message">
                  If an account with <strong>{email}</strong> exists, we've sent password reset instructions to that address. Please check your inbox and spam folder.
                </p>
                <Link href="/login">
                  <Button className="bg-emerald-600 hover:bg-emerald-700" data-testid="button-back-login">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to login
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 mb-4">
                    <svg className="w-7 h-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
                    </svg>
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-1" data-testid="text-heading">
                    Forgot your password?
                  </h1>
                  <p className="text-gray-500 text-sm">
                    Enter your email address and we'll send you instructions to reset your password.
                  </p>
                </div>

                {error && (
                  <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm" data-testid="text-error">
                    {error}
                  </div>
                )}

                <form className="space-y-5" onSubmit={handleSubmit}>
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

                  <Button
                    type="submit"
                    className="w-full h-11 text-base font-medium bg-emerald-600 hover:bg-emerald-700 transition-colors"
                    disabled={isSubmitting}
                    data-testid="button-submit"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      "Send reset instructions"
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
