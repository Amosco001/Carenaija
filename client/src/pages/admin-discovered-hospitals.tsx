import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  RefreshCcw,
  CheckCircle,
  XCircle,
  Building2,
  Globe,
  Clock,
  Play,
  AlertTriangle,
  ExternalLink,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

interface PendingHospital {
  id: number;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  type: string | null;
  ownership: string | null;
  sourceName: string;
  sourceId: string | null;
  sourceUrl: string | null;
  googleRating: number | null;
  googleReviewCount: number | null;
  googleVerified: boolean | null;
  completenessScore: number | null;
  confidenceScore: number | null;
  autoApproved: boolean | null;
  duplicateOfId: number | null;
  duplicateScore: number | null;
  status: string;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  reviewNotes: string | null;
  createdAt: Date | null;
}

interface ScrapingJob {
  id: number;
  source: string;
  targetCity: string | null;
  targetState: string | null;
  jobType: string;
  status: string;
  priority: number;
  scheduledFor: Date | null;
  startedAt: Date | null;
  completedAt: Date | null;
  itemsProcessed: number | null;
  itemsDiscovered: number | null;
  itemsDuplicate: number | null;
  errorMessage: string | null;
  metadata: any;
  createdAt: Date | null;
}

interface PendingStats {
  pending: number;
  approved: number;
  rejected: number;
  duplicate: number;
}

export default function DiscoveredHospitalsTab() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [rejectDialog, setRejectDialog] = useState<PendingHospital | null>(null);
  const [duplicateDialog, setDuplicateDialog] = useState<PendingHospital | null>(null);
  const [rejectNotes, setRejectNotes] = useState("");
  const [duplicateNotes, setDuplicateNotes] = useState("");
  const [scraperDialogOpen, setScraperDialogOpen] = useState(false);
  const [scraperSource, setScraperSource] = useState("all");
  const [scraperCities, setScraperCities] = useState("");
  const [scraperRadius, setScraperRadius] = useState("5000");

  const { data: stats } = useQuery<PendingStats>({
    queryKey: ["/api/admin/pending-hospitals/stats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/pending-hospitals/stats", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
  });

  const { data: hospitals, isLoading: hospitalsLoading } = useQuery<PendingHospital[]>({
    queryKey: ["/api/admin/pending-hospitals", statusFilter],
    queryFn: async () => {
      const res = await fetch(`/api/admin/pending-hospitals?status=${statusFilter}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch hospitals");
      return res.json();
    },
  });

  const { data: scrapingJobs, isLoading: jobsLoading } = useQuery<ScrapingJob[]>({
    queryKey: ["/api/admin/scraping-jobs"],
    queryFn: async () => {
      const res = await fetch("/api/admin/scraping-jobs", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch scraping jobs");
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
      toast.success("Hospital approved successfully");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-hospitals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-hospitals/stats"] });
    },
    onError: () => toast.error("Failed to approve hospital"),
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: number; notes: string }) => {
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
      setRejectDialog(null);
      setRejectNotes("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-hospitals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-hospitals/stats"] });
    },
    onError: () => toast.error("Failed to reject hospital"),
  });

  const duplicateMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: number; notes: string }) => {
      const res = await fetch(`/api/admin/pending-hospitals/${id}/duplicate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to mark as duplicate");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Hospital marked as duplicate");
      setDuplicateDialog(null);
      setDuplicateNotes("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-hospitals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-hospitals/stats"] });
    },
    onError: () => toast.error("Failed to mark as duplicate"),
  });

  const runScraperMutation = useMutation({
    mutationFn: async (params: { source: string; cities?: string[]; radius?: number }) => {
      const res = await fetch("/api/admin/scraping/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to start scraper");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Scraper started successfully");
      setScraperDialogOpen(false);
      setScraperSource("all");
      setScraperCities("");
      setScraperRadius("5000");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/scraping-jobs"] });
    },
    onError: () => toast.error("Failed to start scraper"),
  });

  const filteredHospitals = hospitals?.filter((h) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      h.name.toLowerCase().includes(term) ||
      h.city?.toLowerCase().includes(term) ||
      h.state?.toLowerCase().includes(term) ||
      h.address?.toLowerCase().includes(term)
    );
  });

  const handleRunScraper = () => {
    const cities = scraperCities
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);
    runScraperMutation.mutate({
      source: scraperSource,
      ...(cities.length > 0 && { cities }),
      radius: parseInt(scraperRadius) || 5000,
    });
  };

  const getJobStatusBadge = (status: string) => {
    const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
      pending: { variant: "secondary", icon: <Clock className="w-3 h-3" /> },
      running: { variant: "default", icon: <RefreshCcw className="w-3 h-3 animate-spin" /> },
      completed: { variant: "default", icon: <CheckCircle className="w-3 h-3" /> },
      failed: { variant: "destructive", icon: <XCircle className="w-3 h-3" /> },
    };
    const { variant, icon } = config[status] || { variant: "secondary" as const, icon: null };
    return (
      <Badge variant={variant} className="flex items-center gap-1 capitalize" data-testid={`badge-job-status-${status}`}>
        {icon}
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-4 gap-4">
        <Card data-testid="card-stat-pending">
          <CardHeader className="pb-2">
            <CardDescription>Pending Review</CardDescription>
            <CardTitle className="text-3xl text-orange-600" data-testid="text-stat-pending">
              {stats?.pending || 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-slate-500">
              <Clock className="w-4 h-4 mr-1" /> Awaiting review
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-stat-approved">
          <CardHeader className="pb-2">
            <CardDescription>Approved</CardDescription>
            <CardTitle className="text-3xl text-emerald-600" data-testid="text-stat-approved">
              {stats?.approved || 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-slate-500">
              <CheckCircle className="w-4 h-4 mr-1" /> Added to directory
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-stat-rejected">
          <CardHeader className="pb-2">
            <CardDescription>Rejected</CardDescription>
            <CardTitle className="text-3xl text-red-600" data-testid="text-stat-rejected">
              {stats?.rejected || 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-slate-500">
              <XCircle className="w-4 h-4 mr-1" /> Not suitable
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-stat-duplicate">
          <CardHeader className="pb-2">
            <CardDescription>Duplicates</CardDescription>
            <CardTitle className="text-3xl text-slate-600" data-testid="text-stat-duplicate">
              {stats?.duplicate || 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-slate-500">
              <AlertTriangle className="w-4 h-4 mr-1" /> Already exists
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search discovered hospitals..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            data-testid="input-search-discovered"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40" data-testid="select-status-filter">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="duplicate">Duplicate</SelectItem>
          </SelectContent>
        </Select>

        <Dialog open={scraperDialogOpen} onOpenChange={setScraperDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-run-scraper">
              <Play className="w-4 h-4 mr-2" /> Run Scraper
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Run Hospital Scraper</DialogTitle>
              <DialogDescription>
                Configure and run the hospital discovery scraper to find new hospitals.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Source</Label>
                <Select value={scraperSource} onValueChange={setScraperSource}>
                  <SelectTrigger data-testid="select-scraper-source">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    <SelectItem value="google_places">Google Places</SelectItem>
                    <SelectItem value="ng_health_directory">NG Health Directory</SelectItem>
                    <SelectItem value="hmo_directory">HMO Directory</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Cities (comma-separated, optional)</Label>
                <Input
                  placeholder="Lagos, Abuja, Port Harcourt"
                  value={scraperCities}
                  onChange={(e) => setScraperCities(e.target.value)}
                  data-testid="input-scraper-cities"
                />
              </div>
              <div>
                <Label>Radius (meters)</Label>
                <Input
                  type="number"
                  value={scraperRadius}
                  onChange={(e) => setScraperRadius(e.target.value)}
                  data-testid="input-scraper-radius"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setScraperDialogOpen(false)} data-testid="button-cancel-scraper">
                Cancel
              </Button>
              <Button
                onClick={handleRunScraper}
                disabled={runScraperMutation.isPending}
                data-testid="button-start-scraper"
              >
                {runScraperMutation.isPending ? (
                  <RefreshCcw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 mr-2" />
                )}
                Start Scraping
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {hospitalsLoading ? (
        <div className="flex justify-center py-12" data-testid="loading-hospitals">
          <RefreshCcw className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : filteredHospitals && filteredHospitals.length > 0 ? (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-3 text-left text-sm font-medium">Hospital</th>
                <th className="p-3 text-left text-sm font-medium">Location</th>
                <th className="p-3 text-left text-sm font-medium">Type</th>
                <th className="p-3 text-left text-sm font-medium">Source</th>
                <th className="p-3 text-left text-sm font-medium">Completeness</th>
                <th className="p-3 text-left text-sm font-medium">Confidence</th>
                <th className="p-3 text-left text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredHospitals.map((hospital) => (
                <tr key={hospital.id} className="border-t hover:bg-slate-50" data-testid={`row-hospital-${hospital.id}`}>
                  <td className="p-3">
                    <div className="font-medium" data-testid={`text-hospital-name-${hospital.id}`}>{hospital.name}</div>
                    <div className="text-sm text-slate-500">{hospital.address}</div>
                    <div className="flex items-center gap-1 mt-1">
                      {hospital.autoApproved && (
                        <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700" data-testid={`badge-auto-approved-${hospital.id}`}>
                          Auto-approved
                        </Badge>
                      )}
                      {hospital.duplicateScore != null && hospital.duplicateScore > 0 && (
                        <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700" data-testid={`badge-duplicate-score-${hospital.id}`}>
                          Dup: {Math.round(hospital.duplicateScore * 100)}%
                        </Badge>
                      )}
                      {hospital.website && (
                        <a href={hospital.website} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-3 h-3 text-slate-400 hover:text-emerald-600" />
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="p-3 text-sm">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {hospital.city || "—"}, {hospital.state || "—"}
                    </div>
                  </td>
                  <td className="p-3">
                    <Badge variant="outline" className="capitalize" data-testid={`badge-type-${hospital.id}`}>
                      {hospital.type || "Unknown"}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1 text-sm">
                      <Globe className="w-3 h-3 text-slate-400" />
                      <span className="capitalize" data-testid={`text-source-${hospital.id}`}>
                        {hospital.sourceName.replace(/_/g, " ")}
                      </span>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="w-24">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span>{hospital.completenessScore != null ? Math.round(hospital.completenessScore) : 0}%</span>
                      </div>
                      <Progress
                        value={hospital.completenessScore ?? 0}
                        className="h-2"
                        data-testid={`progress-completeness-${hospital.id}`}
                      />
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="w-24">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span>{hospital.confidenceScore != null ? Math.round(hospital.confidenceScore) : 0}%</span>
                      </div>
                      <Progress
                        value={hospital.confidenceScore ?? 0}
                        className="h-2"
                        data-testid={`progress-confidence-${hospital.id}`}
                      />
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      {statusFilter === "pending" && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            onClick={() => approveMutation.mutate(hospital.id)}
                            disabled={approveMutation.isPending}
                            data-testid={`button-approve-${hospital.id}`}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => setRejectDialog(hospital)}
                            data-testid={`button-reject-${hospital.id}`}
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                            onClick={() => setDuplicateDialog(hospital)}
                            data-testid={`button-duplicate-${hospital.id}`}
                          >
                            <AlertTriangle className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Card data-testid="empty-hospitals">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Building2 className="w-12 h-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-600">No hospitals found</h3>
            <p className="text-sm text-slate-400 mt-1">
              {statusFilter === "pending"
                ? "No pending hospitals to review. Run the scraper to discover new hospitals."
                : `No ${statusFilter} hospitals found.`}
            </p>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!rejectDialog} onOpenChange={() => { setRejectDialog(null); setRejectNotes(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Hospital</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting "{rejectDialog?.name}".
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label>Notes</Label>
            <Textarea
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              placeholder="Reason for rejection..."
              data-testid="input-reject-notes"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectDialog(null); setRejectNotes(""); }} data-testid="button-cancel-reject">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => rejectDialog && rejectMutation.mutate({ id: rejectDialog.id, notes: rejectNotes })}
              disabled={rejectMutation.isPending}
              data-testid="button-confirm-reject"
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!duplicateDialog} onOpenChange={() => { setDuplicateDialog(null); setDuplicateNotes(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as Duplicate</DialogTitle>
            <DialogDescription>
              Mark "{duplicateDialog?.name}" as a duplicate of an existing hospital.
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label>Notes</Label>
            <Textarea
              value={duplicateNotes}
              onChange={(e) => setDuplicateNotes(e.target.value)}
              placeholder="Notes about the duplicate..."
              data-testid="input-duplicate-notes"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDuplicateDialog(null); setDuplicateNotes(""); }} data-testid="button-cancel-duplicate">
              Cancel
            </Button>
            <Button
              onClick={() => duplicateDialog && duplicateMutation.mutate({ id: duplicateDialog.id, notes: duplicateNotes })}
              disabled={duplicateMutation.isPending}
              data-testid="button-confirm-duplicate"
            >
              Mark Duplicate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card data-testid="card-scraping-jobs">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCcw className="w-5 h-5" /> Scraping Jobs
          </CardTitle>
          <CardDescription>Recent hospital discovery jobs and their status</CardDescription>
        </CardHeader>
        <CardContent>
          {jobsLoading ? (
            <div className="flex justify-center py-8" data-testid="loading-jobs">
              <RefreshCcw className="w-6 h-6 animate-spin text-emerald-600" />
            </div>
          ) : scrapingJobs && scrapingJobs.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="p-3 text-left text-sm font-medium">Source</th>
                    <th className="p-3 text-left text-sm font-medium">Target</th>
                    <th className="p-3 text-left text-sm font-medium">Status</th>
                    <th className="p-3 text-left text-sm font-medium">Discovered</th>
                    <th className="p-3 text-left text-sm font-medium">Duplicates</th>
                    <th className="p-3 text-left text-sm font-medium">Errors</th>
                    <th className="p-3 text-left text-sm font-medium">Started</th>
                  </tr>
                </thead>
                <tbody>
                  {scrapingJobs.map((job) => (
                    <tr key={job.id} className="border-t hover:bg-slate-50" data-testid={`row-job-${job.id}`}>
                      <td className="p-3">
                        <span className="capitalize text-sm" data-testid={`text-job-source-${job.id}`}>
                          {job.source.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="p-3 text-sm text-slate-600">
                        {job.targetCity || job.targetState || "All"}
                      </td>
                      <td className="p-3">{getJobStatusBadge(job.status)}</td>
                      <td className="p-3 text-sm" data-testid={`text-job-discovered-${job.id}`}>
                        {job.itemsDiscovered ?? 0}
                      </td>
                      <td className="p-3 text-sm" data-testid={`text-job-duplicates-${job.id}`}>
                        {job.itemsDuplicate ?? 0}
                      </td>
                      <td className="p-3">
                        {job.errorMessage ? (
                          <span className="text-sm text-red-600 truncate max-w-[200px] block" title={job.errorMessage} data-testid={`text-job-error-${job.id}`}>
                            {job.errorMessage}
                          </span>
                        ) : (
                          <span className="text-sm text-slate-400">—</span>
                        )}
                      </td>
                      <td className="p-3 text-sm text-slate-500">
                        {job.startedAt
                          ? new Date(job.startedAt).toLocaleDateString()
                          : job.createdAt
                            ? new Date(job.createdAt).toLocaleDateString()
                            : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center" data-testid="empty-jobs">
              <Clock className="w-10 h-10 text-slate-300 mb-3" />
              <p className="text-sm text-slate-500">No scraping jobs yet. Click "Run Scraper" to start discovering hospitals.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
