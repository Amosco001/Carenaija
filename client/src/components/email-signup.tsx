import { useState } from "react";
import { Bell, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const NIGERIAN_STATES = [
  "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno",
  "Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT (Abuja)","Gombe",
  "Imo","Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos",
  "Nasarawa","Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto",
  "Taraba","Yobe","Zamfara",
];

export function EmailSignup() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !state) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/email-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, state }),
      });
      if (res.ok) {
        setStatus("success");
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data.message || "Something went wrong. Please try again.");
        setStatus("error");
      }
    } catch {
      setErrorMsg("Network error. Please try again.");
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="flex flex-col items-center gap-3 py-2" data-testid="email-signup-success">
        <CheckCircle className="w-10 h-10 text-emerald-600" />
        <p className="font-semibold text-slate-900">You're on the list!</p>
        <p className="text-sm text-slate-500 text-center">
          We'll notify you when new hospitals are added in {state}.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3" data-testid="form-email-signup">
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="flex-1 h-11"
          data-testid="input-signup-email"
          aria-label="Email address"
        />
        <Select value={state} onValueChange={setState} required>
          <SelectTrigger className="w-full sm:w-[180px] h-11" data-testid="select-signup-state">
            <SelectValue placeholder="Your state" />
          </SelectTrigger>
          <SelectContent>
            {NIGERIAN_STATES.map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="submit"
          disabled={status === "loading" || !email || !state}
          className="h-11 bg-emerald-600 hover:bg-emerald-700 whitespace-nowrap"
          data-testid="button-signup-submit"
        >
          {status === "loading" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Notify me"
          )}
        </Button>
      </div>
      {status === "error" && (
        <p className="text-sm text-red-600" role="alert">{errorMsg}</p>
      )}
      <p className="text-xs text-slate-400">
        No spam — only when new hospitals are added in your state. Unsubscribe any time.
      </p>
    </form>
  );
}

export function EmailSignupBanner() {
  return (
    <section className="py-12 bg-slate-50 border-t border-slate-100">
      <div className="container px-4 mx-auto max-w-2xl text-center">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
            <Bell className="w-6 h-6 text-emerald-600" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">
          Get notified when new hospitals are added
        </h2>
        <p className="text-slate-500 text-sm mb-6">
          We add new hospitals across Nigeria every week. Select your state and we'll send you a summary.
        </p>
        <EmailSignup />
      </div>
    </section>
  );
}
