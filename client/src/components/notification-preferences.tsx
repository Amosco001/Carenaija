import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Bell, CheckCircle2, Loader2, Phone, RotateCw } from "lucide-react";

type Preferences = { reviewThankYouEmail: boolean; reviewThankYouSms: boolean };

export function NotificationPreferences({
  phoneNumber,
  phoneVerified,
  onPhoneVerified,
}: {
  phoneNumber: string;
  phoneVerified: boolean;
  onPhoneVerified: () => Promise<void>;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [number, setNumber] = useState(phoneNumber);
  const [otp, setOtp] = useState("");
  const [verificationStarted, setVerificationStarted] = useState(false);
  const [smsRequested, setSmsRequested] = useState(false);

  useEffect(() => setNumber(phoneNumber), [phoneNumber]);

  const preferencesQuery = useQuery<Preferences>({
    queryKey: ["/api/notifications/preferences"],
    queryFn: async () => {
      const response = await fetch("/api/notifications/preferences", { credentials: "include" });
      if (!response.ok) throw new Error("Unable to load notification preferences");
      return response.json();
    },
  });
  const current = preferencesQuery.data || { reviewThankYouEmail: true, reviewThankYouSms: false };

  const savePreferences = useMutation({
    mutationFn: async (preferences: Preferences) => {
      const response = await apiRequest("PUT", "/api/notifications/preferences", preferences);
      return response.json() as Promise<Preferences>;
    },
    onSuccess: (preferences) => {
      queryClient.setQueryData(["/api/notifications/preferences"], preferences);
      toast({ title: "Notification preferences saved" });
      setSmsRequested(false);
    },
    onError: (error: Error) => toast({ title: "Could not save preferences", description: error.message, variant: "destructive" }),
  });

  const sendCode = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/send-phone-verification", { phoneNumber: number.trim() });
      return response.json();
    },
    onSuccess: () => {
      setVerificationStarted(true);
      toast({ title: "Verification code sent", description: "Enter the code sent to your phone." });
    },
    onError: (error: Error) => toast({ title: "Could not send verification code", description: error.message, variant: "destructive" }),
  });

  const verifyCode = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/verify-phone", { otp: otp.trim() });
      return response.json();
    },
    onSuccess: async () => {
      await onPhoneVerified();
      setVerificationStarted(false);
      setOtp("");
      toast({ title: "Phone verified", description: "Your number can now receive review thank-you messages." });
      if (smsRequested) {
        savePreferences.mutate({ reviewThankYouEmail: current.reviewThankYouEmail, reviewThankYouSms: true });
      }
    },
    onError: (error: Error) => toast({ title: "Phone verification failed", description: error.message, variant: "destructive" }),
  });

  const changeSmsPreference = (enabled: boolean) => {
    if (enabled && !phoneVerified) {
      setSmsRequested(true);
      setVerificationStarted(false);
      return;
    }
    savePreferences.mutate({ reviewThankYouEmail: current.reviewThankYouEmail, reviewThankYouSms: enabled });
  };

  return (
    <Card className="mt-6" data-testid="notification-preferences">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" /> Review thank-you notifications</CardTitle>
        <CardDescription>Choose how to receive a thank-you when your review is approved. Messages include an optional WhatsApp sharing link, whatever your rating.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {preferencesQuery.isLoading ? (
          <div className="space-y-3"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
        ) : preferencesQuery.isError ? (
          <div className="flex items-center justify-between gap-3 text-sm text-slate-600">
            <span>Notification preferences could not be loaded.</span>
            <Button type="button" size="sm" variant="outline" onClick={() => preferencesQuery.refetch()}><RotateCw className="h-4 w-4 mr-2" />Retry</Button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-4">
              <div><Label htmlFor="review-thanks-email" className="font-medium">Email</Label><p className="text-sm text-slate-500">Review thank-you messages by email</p></div>
              <Switch id="review-thanks-email" checked={current.reviewThankYouEmail} disabled={savePreferences.isPending} onCheckedChange={(checked) => savePreferences.mutate({ ...current, reviewThankYouEmail: checked })} aria-label="Email review thank-you messages" />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div><Label htmlFor="review-thanks-sms" className="font-medium">Text message</Label><p className="text-sm text-slate-500">{phoneVerified ? `Verified number: ${phoneNumber}` : "Verify a phone number to enable SMS"}</p></div>
              <Switch id="review-thanks-sms" checked={phoneVerified && current.reviewThankYouSms} disabled={savePreferences.isPending} onCheckedChange={changeSmsPreference} aria-label="Text message review thank-you notifications" />
            </div>
            {(smsRequested || !phoneVerified) && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <Phone className="h-4 w-4 mt-0.5 text-emerald-700" />
                  <div><p className="text-sm font-medium text-slate-800">Verify your phone for SMS</p><p className="text-xs text-slate-500">A one-time code will be sent to this number.</p></div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="verification-phone">Phone number</Label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input id="verification-phone" type="tel" autoComplete="tel" value={number} onChange={(event) => setNumber(event.target.value)} placeholder="+234 800 000 0000" />
                    <Button type="button" variant="outline" disabled={!number.trim() || sendCode.isPending} onClick={() => sendCode.mutate()}>
                      {sendCode.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}Send code
                    </Button>
                  </div>
                </div>
                {verificationStarted && (
                  <div className="space-y-2">
                    <Label htmlFor="verification-otp">Verification code</Label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Input id="verification-otp" inputMode="numeric" autoComplete="one-time-code" value={otp} onChange={(event) => setOtp(event.target.value)} placeholder="Enter code" />
                      <Button type="button" disabled={!otp.trim() || verifyCode.isPending} onClick={() => verifyCode.mutate()}>
                        {verifyCode.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}Verify
                      </Button>
                    </div>
                  </div>
                )}
                {smsRequested && <p className="text-xs text-slate-600">By verifying, you agree to receive review approval thank-you texts at this number. SMS will be enabled after verification. You can turn it off here at any time.</p>}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}