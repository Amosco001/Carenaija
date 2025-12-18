import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Flag, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface ReportReviewModalProps {
  reviewId: number;
  reviewType?: "patient" | "employee";
  trigger?: React.ReactNode;
}

const REPORT_REASONS = [
  { value: "spam", label: "Spam or advertising", description: "Contains promotional content or links" },
  { value: "fake", label: "Fake review", description: "Not a genuine patient/employee experience" },
  { value: "inappropriate", label: "Inappropriate content", description: "Contains irrelevant or off-topic content" },
  { value: "offensive", label: "Offensive language", description: "Contains hate speech or personal attacks" },
  { value: "misleading", label: "Misleading information", description: "Contains false or inaccurate claims" },
  { value: "duplicate", label: "Duplicate review", description: "Same review posted multiple times" },
  { value: "other", label: "Other", description: "Another reason not listed above" },
];

export function ReportReviewModal({ reviewId, reviewType = "patient", trigger }: ReportReviewModalProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");

  const reportMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/reviews/${reviewId}/flag`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, details, reviewType }),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to report review");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Report submitted", {
        description: "Thank you for helping keep CareNaija safe. We'll review this report shortly.",
      });
      setOpen(false);
      setReason("");
      setDetails("");
    },
    onError: (error: Error) => {
      toast.error("Failed to submit report", {
        description: error.message,
      });
    },
  });

  const handleSubmit = () => {
    if (!reason) {
      toast.error("Please select a reason for reporting");
      return;
    }
    reportMutation.mutate();
  };

  if (!user) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="ghost" size="sm" className="text-slate-500 hover:text-red-600">
              <Flag className="w-4 h-4 mr-1" /> Report
            </Button>
          )}
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Login Required</DialogTitle>
            <DialogDescription>
              You need to be logged in to report a review. Please login and try again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-slate-500 hover:text-red-600"
            data-testid={`button-report-${reviewId}`}
          >
            <Flag className="w-4 h-4 mr-1" /> Report
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Report This Review
          </DialogTitle>
          <DialogDescription>
            Help us maintain the quality and authenticity of reviews on CareNaija.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label className="text-sm font-medium mb-3 block">Why are you reporting this review?</Label>
            <RadioGroup value={reason} onValueChange={setReason} className="space-y-2">
              {REPORT_REASONS.map((r) => (
                <div 
                  key={r.value}
                  className={`flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    reason === r.value ? "border-emerald-500 bg-emerald-50" : "border-slate-200 hover:border-slate-300"
                  }`}
                  onClick={() => setReason(r.value)}
                >
                  <RadioGroupItem value={r.value} id={r.value} className="mt-0.5" />
                  <div>
                    <Label htmlFor={r.value} className="font-medium cursor-pointer">{r.label}</Label>
                    <p className="text-xs text-slate-500">{r.description}</p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label htmlFor="details" className="text-sm font-medium mb-2 block">
              Additional details (optional)
            </Label>
            <Textarea
              id="details"
              placeholder="Provide any additional context that might help our review team..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="h-20"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!reason || reportMutation.isPending}
            className="bg-red-600 hover:bg-red-700"
          >
            {reportMutation.isPending ? "Submitting..." : "Submit Report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
