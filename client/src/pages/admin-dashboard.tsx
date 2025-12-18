import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { format } from "date-fns";
import { 
  Shield, 
  Flag, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Eye,
  Clock,
  User,
  MessageSquare,
  ChevronRight,
  RefreshCcw,
  Search,
  Filter,
  Ban,
  CheckCheck,
  FileText,
  Activity,
  Settings,
  ChevronDown,
  Building2,
  Globe,
  MapPin,
  Phone,
  ExternalLink,
  Copy,
  Star,
  Sparkles,
  TrendingUp,
  Image
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import type { PatientReview, ReviewFlag } from "@shared/schema";

interface AdminStats {
  pendingReviews: number;
  pendingFlags: number;
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
    pending: { variant: "secondary", icon: <Clock className="w-3 h-3" /> },
    approved: { variant: "default", icon: <CheckCircle className="w-3 h-3" /> },
    rejected: { variant: "destructive", icon: <XCircle className="w-3 h-3" /> },
    hidden: { variant: "outline", icon: <Ban className="w-3 h-3" /> },
    flagged: { variant: "destructive", icon: <Flag className="w-3 h-3" /> },
    under_review: { variant: "secondary", icon: <Eye className="w-3 h-3" /> },
    resolved: { variant: "default", icon: <CheckCheck className="w-3 h-3" /> },
    dismissed: { variant: "outline", icon: <XCircle className="w-3 h-3" /> },
    actioned: { variant: "default", icon: <CheckCircle className="w-3 h-3" /> },
  };

  const { variant, icon } = config[status] || { variant: "secondary", icon: null };

  return (
    <Badge variant={variant} className="flex items-center gap-1 capitalize">
      {icon}
      {status.replace("_", " ")}
    </Badge>
  );
}

function VerificationBadge({ review }: { review: PatientReview }) {
  return (
    <div className="flex items-center gap-2">
      {review.verifiedVisit && (
        <Badge variant="default" className="bg-emerald-500 text-xs">
          <CheckCircle className="w-3 h-3 mr-1" /> Verified Visit
        </Badge>
      )}
      {review.spamScore > 0 && (
        <Badge variant={review.spamScore >= 30 ? "destructive" : "secondary"} className="text-xs">
          Spam: {review.spamScore}
        </Badge>
      )}
    </div>
  );
}

function ReviewCard({ review, onModerate }: { review: PatientReview; onModerate: (reviewId: number, status: string, notes?: string) => void }) {
  const [showDetails, setShowDetails] = useState(false);
  const [notes, setNotes] = useState("");

  return (
    <Card className="mb-4" data-testid={`card-review-${review.id}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{review.title || "Untitled Review"}</CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <User className="w-3 h-3" /> {review.reviewerName}
              <span className="text-slate-400">|</span>
              Hospital #{review.hospitalId}
              <span className="text-slate-400">|</span>
              {format(new Date(review.createdAt!), "MMM d, yyyy")}
            </CardDescription>
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusBadge status={review.moderationStatus} />
            <VerificationBadge review={review} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-4 text-sm">
            <span className="font-medium">Rating: {review.rating}/5</span>
            {review.submittedIp && (
              <span className="text-slate-500">IP: {review.submittedIp}</span>
            )}
          </div>

          <p className="text-sm text-slate-700 line-clamp-3">{review.reviewText}</p>

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs"
          >
            {showDetails ? "Hide Details" : "Show Details"}
            <ChevronDown className={`w-3 h-3 ml-1 transition-transform ${showDetails ? "rotate-180" : ""}`} />
          </Button>

          {showDetails && (
            <div className="p-3 bg-slate-50 rounded-lg space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>Cleanliness: {review.cleanliness || "N/A"}</div>
                <div>Staff Attitude: {review.staffAttitude || "N/A"}</div>
                <div>Facilities: {review.facilities || "N/A"}</div>
                <div>Wait Time: {review.waitTime || "N/A"}</div>
              </div>
              {review.visitDate && (
                <div>Visit Date: {format(new Date(review.visitDate), "MMM d, yyyy")}</div>
              )}
              {review.proofAttachmentUrl && (
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <a href={review.proofAttachmentUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    View Proof ({review.proofType})
                  </a>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 pt-2 border-t">
            <Textarea 
              placeholder="Admin notes (optional)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-16 text-sm"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button 
              size="sm" 
              variant="default"
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => onModerate(review.id, "approved", notes)}
              data-testid={`button-approve-${review.id}`}
            >
              <CheckCircle className="w-4 h-4 mr-1" /> Approve
            </Button>
            <Button 
              size="sm" 
              variant="destructive"
              onClick={() => onModerate(review.id, "rejected", notes)}
              data-testid={`button-reject-${review.id}`}
            >
              <XCircle className="w-4 h-4 mr-1" /> Reject
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onModerate(review.id, "hidden", notes)}
              data-testid={`button-hide-${review.id}`}
            >
              <Ban className="w-4 h-4 mr-1" /> Hide
            </Button>
            <Button 
              size="sm" 
              variant="secondary"
              onClick={() => onModerate(review.id, "under_review", notes)}
            >
              <Eye className="w-4 h-4 mr-1" /> Mark for Review
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FlagCard({ flag, onResolve }: { flag: ReviewFlag; onResolve: (flagId: number, status: string, resolution: string) => void }) {
  const [resolution, setResolution] = useState("");

  const reasonLabels: Record<string, { color: string; label: string }> = {
    spam: { color: "bg-orange-100 text-orange-700", label: "Spam" },
    fake: { color: "bg-red-100 text-red-700", label: "Fake Review" },
    inappropriate: { color: "bg-purple-100 text-purple-700", label: "Inappropriate" },
    offensive: { color: "bg-red-100 text-red-700", label: "Offensive" },
    misleading: { color: "bg-yellow-100 text-yellow-700", label: "Misleading" },
    duplicate: { color: "bg-blue-100 text-blue-700", label: "Duplicate" },
    other: { color: "bg-slate-100 text-slate-700", label: "Other" },
  };

  const { color, label } = reasonLabels[flag.reason] || reasonLabels.other;

  return (
    <Card className="mb-4" data-testid={`card-flag-${flag.id}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Flag className="w-4 h-4 text-red-500" />
              Review #{flag.reviewId} Reported
            </CardTitle>
            <CardDescription>
              Reported on {format(new Date(flag.createdAt!), "MMM d, yyyy 'at' h:mm a")}
            </CardDescription>
          </div>
          <StatusBadge status={flag.status} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Reason:</span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${color}`}>{label}</span>
          </div>

          {flag.details && (
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-700">{flag.details}</p>
            </div>
          )}

          {flag.status === "pending" && (
            <>
              <div className="flex items-center gap-2 pt-2 border-t">
                <Textarea 
                  placeholder="Resolution notes..."
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  className="h-16 text-sm"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button 
                  size="sm" 
                  variant="default"
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => onResolve(flag.id, "actioned", resolution)}
                >
                  <CheckCircle className="w-4 h-4 mr-1" /> Take Action
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => onResolve(flag.id, "dismissed", resolution)}
                >
                  <XCircle className="w-4 h-4 mr-1" /> Dismiss
                </Button>
                <Button 
                  size="sm" 
                  variant="secondary"
                  onClick={() => onResolve(flag.id, "resolved", resolution)}
                >
                  <CheckCheck className="w-4 h-4 mr-1" /> Mark Resolved
                </Button>
              </div>
            </>
          )}

          {flag.resolution && (
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm font-medium text-green-700">Resolution:</p>
              <p className="text-sm text-green-600">{flag.resolution}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("reviews");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: stats } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    enabled: !!user,
  });

  const { data: reviews = [], isLoading: reviewsLoading, refetch: refetchReviews } = useQuery<PatientReview[]>({
    queryKey: ["/api/admin/reviews/moderation", statusFilter !== "all" ? statusFilter : undefined],
    enabled: !!user && activeTab === "reviews",
  });

  const { data: flags = [], isLoading: flagsLoading, refetch: refetchFlags } = useQuery<ReviewFlag[]>({
    queryKey: ["/api/admin/flags", statusFilter !== "all" ? statusFilter : undefined],
    enabled: !!user && activeTab === "flags",
  });

  const moderateMutation = useMutation({
    mutationFn: async ({ reviewId, status, notes }: { reviewId: number; status: string; notes?: string }) => {
      const res = await fetch(`/api/admin/reviews/${reviewId}/moderation`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, notes }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to moderate review");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Review moderation updated");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reviews/moderation"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
    onError: () => {
      toast.error("Failed to update review");
    },
  });

  const resolveFlagMutation = useMutation({
    mutationFn: async ({ flagId, status, resolution }: { flagId: number; status: string; resolution: string }) => {
      const res = await fetch(`/api/admin/flags/${flagId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, resolution }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to resolve flag");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Flag resolved");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/flags"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
    onError: () => {
      toast.error("Failed to resolve flag");
    },
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCcw className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Shield className="w-16 h-16 text-slate-300" />
        <h1 className="text-2xl font-bold text-slate-900">Admin Access Required</h1>
        <p className="text-slate-500">Please log in to access the admin dashboard.</p>
        <Link href="/">
          <Button>Return Home</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50" data-testid="page-admin-dashboard">
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-emerald-600" />
              <div>
                <h1 className="text-xl font-bold text-slate-900">Admin Dashboard</h1>
                <p className="text-sm text-slate-500">Review moderation & content management</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="outline" size="sm">
                  Back to Site
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pending Reviews</CardDescription>
              <CardTitle className="text-3xl">{stats?.pendingReviews || 0}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-slate-500">
                <Clock className="w-4 h-4 mr-1" /> Awaiting moderation
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pending Flags</CardDescription>
              <CardTitle className="text-3xl">{stats?.pendingFlags || 0}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-slate-500">
                <Flag className="w-4 h-4 mr-1" /> User reports
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Spam Detection</CardDescription>
              <CardTitle className="text-3xl text-emerald-600">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-slate-500">
                <Activity className="w-4 h-4 mr-1" /> Auto-filtering enabled
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Review Limits</CardDescription>
              <CardTitle className="text-3xl text-emerald-600">1/year</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-slate-500">
                <User className="w-4 h-4 mr-1" /> Per hospital per user
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="reviews" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Reviews
                {(stats?.pendingReviews || 0) > 0 && (
                  <Badge variant="destructive" className="ml-1">{stats?.pendingReviews}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="flags" className="flex items-center gap-2">
                <Flag className="w-4 h-4" />
                Flags
                {(stats?.pendingFlags || 0) > 0 && (
                  <Badge variant="destructive" className="ml-1">{stats?.pendingFlags}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="keywords" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Spam Keywords
              </TabsTrigger>
              <TabsTrigger value="discovered" className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Discovered Hospitals
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="flagged">Flagged</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => {
                  refetchReviews();
                  refetchFlags();
                }}
              >
                <RefreshCcw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <TabsContent value="reviews">
            {reviewsLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCcw className="w-8 h-8 animate-spin text-emerald-600" />
              </div>
            ) : reviews.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle className="w-12 h-12 text-emerald-500 mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900">All caught up!</h3>
                  <p className="text-slate-500">No reviews pending moderation.</p>
                </CardContent>
              </Card>
            ) : (
              <div>
                {reviews.map((review) => (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    onModerate={(reviewId, status, notes) => 
                      moderateMutation.mutate({ reviewId, status, notes })
                    }
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="flags">
            {flagsLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCcw className="w-8 h-8 animate-spin text-emerald-600" />
              </div>
            ) : flags.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle className="w-12 h-12 text-emerald-500 mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900">No flags!</h3>
                  <p className="text-slate-500">No user reports pending review.</p>
                </CardContent>
              </Card>
            ) : (
              <div>
                {flags.map((flag) => (
                  <FlagCard
                    key={flag.id}
                    flag={flag}
                    onResolve={(flagId, status, resolution) =>
                      resolveFlagMutation.mutate({ flagId, status, resolution })
                    }
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="keywords">
            <SpamKeywordsManager />
          </TabsContent>

          <TabsContent value="discovered">
            <DiscoveredHospitalsManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function SpamKeywordsManager() {
  const queryClient = useQueryClient();
  const [newPhrase, setNewPhrase] = useState("");
  const [newWeight, setNewWeight] = useState("10");
  const [newCategory, setNewCategory] = useState("general");

  const { data: keywords = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/spam-keywords"],
  });

  const addKeywordMutation = useMutation({
    mutationFn: async (data: { phrase: string; weight: number; category: string }) => {
      const res = await fetch("/api/admin/spam-keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to add keyword");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Keyword added");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/spam-keywords"] });
      setNewPhrase("");
      setNewWeight("10");
    },
    onError: () => {
      toast.error("Failed to add keyword");
    },
  });

  const toggleKeywordMutation = useMutation({
    mutationFn: async ({ id, active }: { id: number; active: boolean }) => {
      const res = await fetch(`/api/admin/spam-keywords/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to toggle keyword");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/spam-keywords"] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCcw className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add Spam Keyword</CardTitle>
          <CardDescription>Add phrases to detect and filter spam reviews automatically.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-slate-700">Phrase</label>
              <Input
                value={newPhrase}
                onChange={(e) => setNewPhrase(e.target.value)}
                placeholder="e.g., 'buy now', 'click here'"
              />
            </div>
            <div className="w-24">
              <label className="text-sm font-medium text-slate-700">Weight</label>
              <Input
                type="number"
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                min="1"
                max="100"
              />
            </div>
            <div className="w-40">
              <label className="text-sm font-medium text-slate-700">Category</label>
              <Select value={newCategory} onValueChange={setNewCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="promotional">Promotional</SelectItem>
                  <SelectItem value="links">Links</SelectItem>
                  <SelectItem value="scam">Scam</SelectItem>
                  <SelectItem value="profanity">Profanity</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => addKeywordMutation.mutate({
                phrase: newPhrase,
                weight: parseInt(newWeight),
                category: newCategory,
              })}
              disabled={!newPhrase.trim()}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Add Keyword
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Keywords</CardTitle>
          <CardDescription>Keywords currently used for spam detection. Higher weight = more spam-like.</CardDescription>
        </CardHeader>
        <CardContent>
          {keywords.length === 0 ? (
            <p className="text-slate-500 text-center py-4">No keywords configured. Default keywords will be used.</p>
          ) : (
            <div className="space-y-2">
              {(keywords as any[]).map((keyword) => (
                <div 
                  key={keyword.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${keyword.active ? "bg-slate-50" : "bg-slate-100 opacity-60"}`}
                >
                  <div className="flex items-center gap-4">
                    <code className="px-2 py-1 bg-white rounded text-sm font-mono">{keyword.phrase}</code>
                    <Badge variant="outline">{keyword.category}</Badge>
                    <span className="text-sm text-slate-500">Weight: {keyword.weight}</span>
                  </div>
                  <Button
                    variant={keyword.active ? "destructive" : "default"}
                    size="sm"
                    onClick={() => toggleKeywordMutation.mutate({ id: keyword.id, active: !keyword.active })}
                  >
                    {keyword.active ? "Disable" : "Enable"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface PendingHospital {
  id: number;
  name: string;
  address: string | null;
  city: string | null;
  lga: string | null;
  state: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  type: string | null;
  ownership: string | null;
  latitude: number | null;
  longitude: number | null;
  sourceName: string;
  sourceUrl: string | null;
  googleRating: number | null;
  googleReviewCount: number | null;
  googlePhotos: string[] | null;
  googleVerified: boolean | null;
  completenessScore: number | null;
  confidenceScore: number | null;
  autoApproved: boolean | null;
  duplicateScore: number | null;
  duplicateOfId: number | null;
  status: string;
  createdAt: string;
}

function DiscoveredHospitalsManager() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("pending");

  const { data: hospitals = [], isLoading, refetch } = useQuery<PendingHospital[]>({
    queryKey: ["/api/admin/pending-hospitals", statusFilter],
    queryFn: async () => {
      const res = await fetch(`/api/admin/pending-hospitals?status=${statusFilter}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch pending hospitals");
      return res.json();
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/admin/pending-hospitals/stats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/pending-hospitals/stats", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/pending-hospitals/${id}/approve`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to approve");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Hospital approved and added to database");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-hospitals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-hospitals/stats"] });
    },
    onError: () => {
      toast.error("Failed to approve hospital");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: number; notes?: string }) => {
      const res = await fetch(`/api/admin/pending-hospitals/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to reject");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Hospital rejected");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-hospitals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-hospitals/stats"] });
    },
    onError: () => {
      toast.error("Failed to reject hospital");
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/pending-hospitals/${id}/duplicate`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to mark as duplicate");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Marked as duplicate");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-hospitals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-hospitals/stats"] });
    },
  });

  const getSourceBadgeColor = (source: string) => {
    const colors: Record<string, string> = {
      google_places: "bg-blue-100 text-blue-800",
      ng_health_directory: "bg-green-100 text-green-800",
      hmo_directory: "bg-purple-100 text-purple-800",
    };
    return colors[source] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md" onClick={() => setStatusFilter("pending")}>
          <CardContent className="pt-4 pb-3 text-center">
            <div className="text-2xl font-bold text-orange-600">{stats?.pending || 0}</div>
            <div className="text-xs text-slate-500">Pending Review</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md" onClick={() => setStatusFilter("approved")}>
          <CardContent className="pt-4 pb-3 text-center">
            <div className="text-2xl font-bold text-emerald-600">{stats?.approved || 0}</div>
            <div className="text-xs text-slate-500">Approved</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md" onClick={() => setStatusFilter("rejected")}>
          <CardContent className="pt-4 pb-3 text-center">
            <div className="text-2xl font-bold text-red-600">{stats?.rejected || 0}</div>
            <div className="text-xs text-slate-500">Rejected</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md" onClick={() => setStatusFilter("duplicate")}>
          <CardContent className="pt-4 pb-3 text-center">
            <div className="text-2xl font-bold text-slate-600">{stats?.duplicate || 0}</div>
            <div className="text-xs text-slate-500">Duplicates</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold capitalize">{statusFilter} Hospitals ({hospitals.length})</h3>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCcw className="w-4 h-4 mr-1" /> Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCcw className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : hospitals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="w-12 h-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900">No {statusFilter} hospitals</h3>
            <p className="text-slate-500">Run the scraper to discover new hospitals.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {hospitals.map((hospital) => (
            <Card key={hospital.id} className={`hover:shadow-md transition-shadow ${hospital.autoApproved ? 'border-l-4 border-l-emerald-500' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h4 className="font-semibold text-slate-900 truncate">{hospital.name}</h4>
                      <Badge className={`text-xs ${getSourceBadgeColor(hospital.sourceName)}`}>
                        {hospital.sourceName.replace("_", " ")}
                      </Badge>
                      {hospital.googleVerified && (
                        <Badge className="text-xs bg-blue-100 text-blue-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                      {hospital.autoApproved && (
                        <Badge className="text-xs bg-emerald-100 text-emerald-800">
                          <Sparkles className="w-3 h-3 mr-1" />
                          Auto-approved
                        </Badge>
                      )}
                      {hospital.duplicateScore && hospital.duplicateScore > 0.5 && (
                        <Badge variant="destructive" className="text-xs">
                          {Math.round(hospital.duplicateScore * 100)}% match
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-4 mt-2 text-sm">
                      {hospital.googleRating && (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">{hospital.googleRating.toFixed(1)}</span>
                          {hospital.googleReviewCount && (
                            <span className="text-slate-500">({hospital.googleReviewCount} reviews)</span>
                          )}
                        </div>
                      )}
                      {hospital.googlePhotos && hospital.googlePhotos.length > 0 && (
                        <div className="flex items-center gap-1 text-slate-500">
                          <Image className="w-3 h-3" />
                          <span>{hospital.googlePhotos.length} photos</span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-slate-600 mt-2">
                      {hospital.address && (
                        <div className="flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{hospital.address}</span>
                        </div>
                      )}
                      {hospital.state && (
                        <div className="flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          {hospital.city && `${hospital.city}, `}{hospital.state}
                        </div>
                      )}
                      {hospital.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {hospital.phone}
                        </div>
                      )}
                      {hospital.website && (
                        <a 
                          href={hospital.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-600 hover:underline truncate"
                        >
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{hospital.website}</span>
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mt-3 pt-2 border-t">
                      {hospital.completenessScore !== null && (
                        <div className="flex items-center gap-1">
                          <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${hospital.completenessScore >= 70 ? 'bg-emerald-500' : hospital.completenessScore >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                              style={{ width: `${hospital.completenessScore}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-500">{hospital.completenessScore}% complete</span>
                        </div>
                      )}
                      {hospital.confidenceScore !== null && (
                        <div className="flex items-center gap-1">
                          <TrendingUp className={`w-3 h-3 ${hospital.confidenceScore >= 70 ? 'text-emerald-500' : 'text-slate-400'}`} />
                          <span className="text-xs text-slate-500">{hospital.confidenceScore}% confidence</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                      <span>ID: {hospital.id}</span>
                      <span>|</span>
                      <span>Added: {format(new Date(hospital.createdAt), "MMM d, yyyy")}</span>
                      {hospital.type && (
                        <>
                          <span>|</span>
                          <span className="capitalize">{hospital.type}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {statusFilter === "pending" && (
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => approveMutation.mutate(hospital.id)}
                        disabled={approveMutation.isPending}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => rejectMutation.mutate({ id: hospital.id })}
                        disabled={rejectMutation.isPending}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                      {hospital.duplicateScore && hospital.duplicateScore > 0.5 && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => duplicateMutation.mutate(hospital.id)}
                          disabled={duplicateMutation.isPending}
                        >
                          <Copy className="w-4 h-4 mr-1" />
                          Duplicate
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
