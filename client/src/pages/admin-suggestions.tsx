import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import type { HospitalSuggestion } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  CheckCircle,
  XCircle,
  Clock,
  Building2,
  MapPin,
  User,
  Loader2,
  Lightbulb,
  Phone,
  Mail,
  Info,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
  "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu",
  "FCT", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi",
  "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun",
  "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
];

export default function AdminSuggestionsTab() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<HospitalSuggestion | null>(null);
  const [approveForm, setApproveForm] = useState({
    name: "",
    address: "",
    lga: "",
    state: "",
    city: "",
    ownership: "",
    phone: "",
    email: "",
    website: "",
    bedCapacity: "",
    operatingHours: "",
    services: "",
    facilities: "",
    verified: false,
  });

  const { data: suggestions = [], isLoading } = useQuery<HospitalSuggestion[]>({
    queryKey: ["/api/admin/hospital-suggestions"],
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("POST", `/api/admin/hospital-suggestions/${id}/approve`, data);
      return res.json();
    },
    onSuccess: (hospital) => {
      toast({
        title: "Hospital Created",
        description: `"${hospital.name}" has been added to the database.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/hospital-suggestions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hospitals"] });
      setApproveDialogOpen(false);
      setSelectedSuggestion(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to approve suggestion. Please try again.",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PATCH", `/api/admin/hospital-suggestions/${id}`, { status: "rejected" });
      return res.json();
    },
    onSuccess: (updated) => {
      toast({
        title: "Suggestion Rejected",
        description: `"${updated.name}" has been rejected.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/hospital-suggestions"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reject suggestion.",
        variant: "destructive",
      });
    },
  });

  const openApproveDialog = (suggestion: HospitalSuggestion) => {
    setSelectedSuggestion(suggestion);
    setApproveForm({
      name: suggestion.name,
      address: suggestion.address,
      lga: suggestion.lga,
      state: suggestion.state,
      city: "",
      ownership: suggestion.ownership,
      phone: suggestion.phone || "",
      email: suggestion.email || "",
      website: "",
      bedCapacity: suggestion.bedCapacity?.toString() || "",
      operatingHours: suggestion.operatingHours || "",
      services: suggestion.services?.join(", ") || "",
      facilities: "",
      verified: false,
    });
    setApproveDialogOpen(true);
  };

  const handleApprove = () => {
    if (!selectedSuggestion) return;
    const data: any = {
      name: approveForm.name,
      address: approveForm.address,
      lga: approveForm.lga,
      state: approveForm.state,
      ownership: approveForm.ownership,
    };
    if (approveForm.city) data.city = approveForm.city;
    if (approveForm.phone) data.phone = approveForm.phone;
    if (approveForm.email) data.email = approveForm.email;
    if (approveForm.website) data.website = approveForm.website;
    if (approveForm.bedCapacity) data.bedCapacity = parseInt(approveForm.bedCapacity);
    if (approveForm.operatingHours) data.operatingHours = approveForm.operatingHours;
    if (approveForm.services) {
      data.services = approveForm.services.split(",").map((s: string) => s.trim()).filter(Boolean);
    }
    if (approveForm.facilities) {
      data.facilities = approveForm.facilities.split(",").map((s: string) => s.trim()).filter(Boolean);
    }
    data.verified = approveForm.verified;

    approveMutation.mutate({ id: selectedSuggestion.id, data });
  };

  const filteredSuggestions = suggestions.filter(s => filter === "all" || s.status === filter);
  const pendingCount = suggestions.filter(s => s.status === "pending").length;
  const approvedCount = suggestions.filter(s => s.status === "approved").length;
  const rejectedCount = suggestions.filter(s => s.status === "rejected").length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="border-amber-300 text-amber-700 bg-amber-50"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case "approved":
        return <Badge className="bg-emerald-100 text-emerald-700"><CheckCircle className="w-3 h-3 mr-1" /> Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900" data-testid="text-suggestions-title">Hospital Suggestions</h2>
          <p className="text-sm text-slate-600 mt-1">Review and approve hospitals suggested by users</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1">{pendingCount} pending</Badge>
          <Badge className="bg-emerald-100 text-emerald-700 px-3 py-1">{approvedCount} approved</Badge>
          <Badge variant="secondary" className="px-3 py-1">{rejectedCount} rejected</Badge>
        </div>
      </div>

      <div className="flex gap-2">
        {(["all", "pending", "approved", "rejected"] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
            className={filter === f ? "bg-emerald-600 hover:bg-emerald-700" : ""}
            data-testid={`button-filter-${f}`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === "pending" && pendingCount > 0 && (
              <Badge variant="destructive" className="ml-1.5 h-5 px-1.5 text-[10px]">{pendingCount}</Badge>
            )}
          </Button>
        ))}
      </div>

      {filteredSuggestions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Lightbulb className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">No {filter === "all" ? "" : filter} suggestions found</p>
            <p className="text-sm text-slate-500 mt-1">
              {filter === "pending" ? "All caught up! No pending suggestions to review." : "Try changing the filter to see other suggestions."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredSuggestions.map((suggestion) => (
            <Card key={suggestion.id} className="hover:shadow-sm transition-shadow" data-testid={`card-suggestion-${suggestion.id}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="font-semibold text-slate-900 text-lg">{suggestion.name}</h3>
                      {getStatusBadge(suggestion.status)}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>{suggestion.address}, {suggestion.lga}, {suggestion.state}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>{suggestion.ownership}</span>
                      </div>
                      {suggestion.phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>{suggestion.phone}</span>
                        </div>
                      )}
                      {suggestion.email && (
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>{suggestion.email}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <User className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>Suggested by: {suggestion.suggestedBy}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>{suggestion.createdAt ? format(new Date(suggestion.createdAt), "MMM d, yyyy") : "Unknown date"}</span>
                      </div>
                    </div>

                    {suggestion.additionalInfo && (
                      <div className="mt-3 flex items-start gap-1.5 text-sm">
                        <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        <p className="text-slate-600 italic">"{suggestion.additionalInfo}"</p>
                      </div>
                    )}

                    {suggestion.services && suggestion.services.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {suggestion.services.map((service, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{service}</Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {suggestion.status === "pending" && (
                    <div className="flex flex-col gap-2 shrink-0">
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => openApproveDialog(suggestion)}
                        data-testid={`button-approve-${suggestion.id}`}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => rejectMutation.mutate(suggestion.id)}
                        disabled={rejectMutation.isPending}
                        data-testid={`button-reject-${suggestion.id}`}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Approve & Create Hospital</DialogTitle>
            <DialogDescription>
              Review and complete the hospital details before adding it to the database. Fields are pre-filled from the suggestion.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="approve-name">Hospital Name *</Label>
              <Input
                id="approve-name"
                value={approveForm.name}
                onChange={(e) => setApproveForm(f => ({ ...f, name: e.target.value }))}
                data-testid="input-approve-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="approve-ownership">Ownership Type *</Label>
              <Select
                value={approveForm.ownership}
                onValueChange={(val) => setApproveForm(f => ({ ...f, ownership: val }))}
              >
                <SelectTrigger id="approve-ownership" data-testid="select-approve-ownership">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Public">Public</SelectItem>
                  <SelectItem value="Private">Private</SelectItem>
                  <SelectItem value="Teaching">Teaching</SelectItem>
                  <SelectItem value="Federal">Federal</SelectItem>
                  <SelectItem value="Specialist">Specialist</SelectItem>
                  <SelectItem value="Faith-Based">Faith-Based</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="approve-address">Address *</Label>
              <Input
                id="approve-address"
                value={approveForm.address}
                onChange={(e) => setApproveForm(f => ({ ...f, address: e.target.value }))}
                data-testid="input-approve-address"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="approve-lga">LGA *</Label>
              <Input
                id="approve-lga"
                value={approveForm.lga}
                onChange={(e) => setApproveForm(f => ({ ...f, lga: e.target.value }))}
                data-testid="input-approve-lga"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="approve-state">State *</Label>
              <Select
                value={approveForm.state}
                onValueChange={(val) => setApproveForm(f => ({ ...f, state: val }))}
              >
                <SelectTrigger id="approve-state" data-testid="select-approve-state">
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {NIGERIAN_STATES.map((state) => (
                    <SelectItem key={state} value={state}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="approve-city">City</Label>
              <Input
                id="approve-city"
                value={approveForm.city}
                onChange={(e) => setApproveForm(f => ({ ...f, city: e.target.value }))}
                placeholder="e.g. Ikeja, Surulere"
                data-testid="input-approve-city"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="approve-phone">Phone</Label>
              <Input
                id="approve-phone"
                value={approveForm.phone}
                onChange={(e) => setApproveForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="e.g. 08012345678"
                data-testid="input-approve-phone"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="approve-email">Email</Label>
              <Input
                id="approve-email"
                type="email"
                value={approveForm.email}
                onChange={(e) => setApproveForm(f => ({ ...f, email: e.target.value }))}
                data-testid="input-approve-email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="approve-website">Website</Label>
              <Input
                id="approve-website"
                value={approveForm.website}
                onChange={(e) => setApproveForm(f => ({ ...f, website: e.target.value }))}
                placeholder="https://..."
                data-testid="input-approve-website"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="approve-bed-capacity">Bed Capacity</Label>
              <Input
                id="approve-bed-capacity"
                type="number"
                value={approveForm.bedCapacity}
                onChange={(e) => setApproveForm(f => ({ ...f, bedCapacity: e.target.value }))}
                data-testid="input-approve-bed-capacity"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="approve-hours">Operating Hours</Label>
              <Input
                id="approve-hours"
                value={approveForm.operatingHours}
                onChange={(e) => setApproveForm(f => ({ ...f, operatingHours: e.target.value }))}
                placeholder="e.g. 24/7 or Mon-Fri 8am-6pm"
                data-testid="input-approve-hours"
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="approve-services">Services (comma-separated)</Label>
              <Textarea
                id="approve-services"
                value={approveForm.services}
                onChange={(e) => setApproveForm(f => ({ ...f, services: e.target.value }))}
                placeholder="e.g. General Surgery, Pediatrics, Obstetrics, Cardiology"
                rows={2}
                data-testid="textarea-approve-services"
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="approve-facilities">Facilities (comma-separated)</Label>
              <Textarea
                id="approve-facilities"
                value={approveForm.facilities}
                onChange={(e) => setApproveForm(f => ({ ...f, facilities: e.target.value }))}
                placeholder="e.g. ICU, X-Ray, Laboratory, Pharmacy, Ambulance"
                rows={2}
                data-testid="textarea-approve-facilities"
              />
            </div>

            <div className="md:col-span-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="approve-verified"
                checked={approveForm.verified}
                onChange={(e) => setApproveForm(f => ({ ...f, verified: e.target.checked }))}
                className="rounded border-slate-300"
                data-testid="checkbox-approve-verified"
              />
              <Label htmlFor="approve-verified" className="cursor-pointer">Mark as verified hospital</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)} data-testid="button-cancel-approve">
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={handleApprove}
              disabled={!approveForm.name || !approveForm.address || !approveForm.lga || !approveForm.state || !approveForm.ownership || approveMutation.isPending}
              data-testid="button-confirm-approve"
            >
              {approveMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Creating...</>
              ) : (
                <><CheckCircle className="w-4 h-4 mr-1" /> Approve & Create Hospital</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
