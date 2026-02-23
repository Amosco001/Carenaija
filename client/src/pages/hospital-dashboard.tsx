import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Hospital, PatientReview, EmployeeReview } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Building2, ShieldCheck, Clock, Phone, Mail, Globe, Star,
  MessageSquare, Settings, Loader2, ChevronRight, AlertCircle,
  CheckCircle, XCircle, Send, Users, Stethoscope, Plus, X
} from "lucide-react";

function ClaimRequestStatus({ status }: { status: string }) {
  if (status === "approved") return <Badge className="bg-green-100 text-green-700 hover:bg-green-100"><CheckCircle className="h-3 w-3 mr-1" /> Approved</Badge>;
  if (status === "rejected") return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Rejected</Badge>;
  return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" /> Pending Review</Badge>;
}

function HospitalManageCard({ hospital }: { hospital: Hospital }) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [phone, setPhone] = useState(hospital.phone || "");
  const [email, setEmail] = useState(hospital.email || "");
  const [website, setWebsite] = useState(hospital.website || "");
  const [operatingHours, setOperatingHours] = useState(hospital.operatingHours || "");
  const [services, setServices] = useState<string[]>(hospital.services || []);
  const [newService, setNewService] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  const { data: patientReviews } = useQuery<PatientReview[]>({
    queryKey: [`/api/hospitals/${hospital.id}/patient-reviews`],
  });

  const { data: employeeReviews } = useQuery<EmployeeReview[]>({
    queryKey: [`/api/hospitals/${hospital.id}/employee-reviews`],
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: any) => {
      const res = await apiRequest("PATCH", `/api/hospitals/${hospital.id}/manage`, updates);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Profile Updated", description: "Hospital profile has been updated successfully." });
      queryClient.invalidateQueries({ queryKey: ["/api/user/claimed-hospitals"] });
      setIsEditing(false);
    },
    onError: () => {
      toast({ title: "Update Failed", description: "Something went wrong. Please try again.", variant: "destructive" });
    },
  });

  const respondMutation = useMutation({
    mutationFn: async (data: { reviewId: number; reviewType: string; responseText: string }) => {
      const res = await apiRequest("POST", `/api/hospitals/${hospital.id}/respond-to-review`, {
        ...data,
        responderName: "Hospital Management",
        responderTitle: "Official Response",
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Response Sent", description: "Your response to the review has been published." });
      queryClient.invalidateQueries({ queryKey: [`/api/hospitals/${hospital.id}/patient-reviews`] });
      queryClient.invalidateQueries({ queryKey: [`/api/hospitals/${hospital.id}/employee-reviews`] });
    },
    onError: () => {
      toast({ title: "Failed", description: "Could not send response. Please try again.", variant: "destructive" });
    },
  });

  const handleSave = () => {
    updateMutation.mutate({ phone, email, website, operatingHours, services });
  };

  const addService = () => {
    if (newService.trim() && !services.includes(newService.trim())) {
      setServices([...services, newService.trim()]);
      setNewService("");
    }
  };

  const removeService = (service: string) => {
    setServices(services.filter(s => s !== service));
  };

  return (
    <Card className="mb-6" data-testid={`card-managed-hospital-${hospital.id}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">{hospital.name}</CardTitle>
              <CardDescription>{hospital.address}, {hospital.state}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hospital.verified && (
              <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                <ShieldCheck className="h-3 w-3 mr-1" /> Verified
              </Badge>
            )}
            <Link href={`/hospital/${hospital.id}`}>
              <Button variant="outline" size="sm" data-testid="button-view-hospital">
                View Public Page <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-50 p-3 rounded-lg text-center">
            <Star className="h-5 w-5 text-yellow-500 mx-auto mb-1" />
            <p className="text-lg font-bold">{(hospital.averageRating ?? 0).toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">Rating</p>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg text-center">
            <MessageSquare className="h-5 w-5 text-blue-500 mx-auto mb-1" />
            <p className="text-lg font-bold">{hospital.totalReviews}</p>
            <p className="text-xs text-muted-foreground">Reviews</p>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg text-center">
            <Stethoscope className="h-5 w-5 text-green-500 mx-auto mb-1" />
            <p className="text-lg font-bold">{hospital.services?.length || 0}</p>
            <p className="text-xs text-muted-foreground">Services</p>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg text-center">
            <Users className="h-5 w-5 text-purple-500 mx-auto mb-1" />
            <p className="text-lg font-bold">{hospital.bedCapacity || "N/A"}</p>
            <p className="text-xs text-muted-foreground">Bed Capacity</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full">
            <TabsTrigger value="overview" className="flex-1" data-testid="tab-overview">
              <Settings className="h-4 w-4 mr-1" /> Profile
            </TabsTrigger>
            <TabsTrigger value="reviews" className="flex-1" data-testid="tab-reviews">
              <MessageSquare className="h-4 w-4 mr-1" /> Reviews ({(patientReviews?.length || 0) + (employeeReviews?.length || 0)})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <div className="space-y-4">
              {!isEditing ? (
                <>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" /> Phone</p>
                      <p className="text-sm">{hospital.phone || "Not set"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" /> Email</p>
                      <p className="text-sm">{hospital.email || "Not set"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground flex items-center gap-1"><Globe className="h-3 w-3" /> Website</p>
                      <p className="text-sm">{hospital.website || "Not set"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> Hours</p>
                      <p className="text-sm">{hospital.operatingHours || "Not set"}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Services</p>
                    <div className="flex flex-wrap gap-1">
                      {hospital.services?.map(s => (
                        <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                      ))}
                      {(!hospital.services || hospital.services.length === 0) && (
                        <p className="text-sm text-muted-foreground">No services listed</p>
                      )}
                    </div>
                  </div>
                  <Button variant="outline" onClick={() => setIsEditing(true)} data-testid="button-edit-profile">
                    <Settings className="h-4 w-4 mr-2" /> Edit Profile
                  </Button>
                </>
              ) : (
                <div className="space-y-4 border rounded-lg p-4">
                  <h4 className="font-semibold">Edit Hospital Information</h4>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+234..." data-testid="input-edit-phone" />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contact@hospital.com" data-testid="input-edit-email" />
                    </div>
                    <div className="space-y-2">
                      <Label>Website</Label>
                      <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://..." data-testid="input-edit-website" />
                    </div>
                    <div className="space-y-2">
                      <Label>Operating Hours</Label>
                      <Input value={operatingHours} onChange={(e) => setOperatingHours(e.target.value)} placeholder="Mon-Fri: 8AM-6PM" data-testid="input-edit-hours" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Services</Label>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {services.map(s => (
                        <Badge key={s} variant="secondary" className="text-xs gap-1">
                          {s}
                          <button onClick={() => removeService(s)} className="ml-1 hover:text-destructive">
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={newService}
                        onChange={(e) => setNewService(e.target.value)}
                        placeholder="Add a service..."
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addService())}
                        data-testid="input-add-service"
                      />
                      <Button type="button" variant="outline" size="sm" onClick={addService} data-testid="button-add-service">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSave} disabled={updateMutation.isPending} data-testid="button-save-profile">
                      {updateMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)} data-testid="button-cancel-edit">
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="mt-4">
            <ReviewsList
              patientReviews={patientReviews || []}
              employeeReviews={employeeReviews || []}
              onRespond={(reviewId, reviewType, text) => respondMutation.mutate({ reviewId, reviewType, responseText: text })}
              isResponding={respondMutation.isPending}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function ReviewsList({
  patientReviews,
  employeeReviews,
  onRespond,
  isResponding,
}: {
  patientReviews: PatientReview[];
  employeeReviews: EmployeeReview[];
  onRespond: (reviewId: number, reviewType: string, text: string) => void;
  isResponding: boolean;
}) {
  const [respondingTo, setRespondingTo] = useState<{ id: number; type: string } | null>(null);
  const [responseText, setResponseText] = useState("");

  const handleRespond = () => {
    if (respondingTo && responseText.trim()) {
      onRespond(respondingTo.id, respondingTo.type, responseText);
      setRespondingTo(null);
      setResponseText("");
    }
  };

  return (
    <div className="space-y-4">
      {patientReviews.length === 0 && employeeReviews.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No reviews yet</p>
        </div>
      )}

      {patientReviews.length > 0 && (
        <>
          <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Patient Reviews</h4>
          {patientReviews.map(review => (
            <Card key={review.id} className="border-l-4 border-l-blue-400" data-testid={`review-patient-${review.id}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium text-sm">{review.overallRating}/5</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {review.visitDate ? `Visited: ${review.visitDate}` : ""}
                      {review.department ? ` | ${review.department}` : ""}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">Patient</Badge>
                </div>
                {review.comment && <p className="text-sm mt-2">{review.comment}</p>}
                <div className="mt-3">
                  {respondingTo?.id === review.id && respondingTo?.type === 'patient' ? (
                    <div className="space-y-2">
                      <Textarea
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                        placeholder="Write your response to this review..."
                        className="text-sm"
                        data-testid="input-review-response"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleRespond} disabled={isResponding || !responseText.trim()} data-testid="button-send-response">
                          <Send className="h-3 w-3 mr-1" /> {isResponding ? "Sending..." : "Send Response"}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => { setRespondingTo(null); setResponseText(""); }}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button size="sm" variant="ghost" className="text-xs" onClick={() => setRespondingTo({ id: review.id, type: 'patient' })} data-testid={`button-respond-patient-${review.id}`}>
                      <MessageSquare className="h-3 w-3 mr-1" /> Respond
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </>
      )}

      {employeeReviews.length > 0 && (
        <>
          <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mt-6">Employee Reviews</h4>
          {employeeReviews.map(review => (
            <Card key={review.id} className="border-l-4 border-l-green-400" data-testid={`review-employee-${review.id}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium text-sm">{review.overallRating}/5</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {review.department ? `Department: ${review.department}` : ""}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">Employee</Badge>
                </div>
                {review.pros && <p className="text-sm mt-2"><strong>Pros:</strong> {review.pros}</p>}
                {review.cons && <p className="text-sm mt-1"><strong>Cons:</strong> {review.cons}</p>}
                <div className="mt-3">
                  {respondingTo?.id === review.id && respondingTo?.type === 'employee' ? (
                    <div className="space-y-2">
                      <Textarea
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                        placeholder="Write your response to this review..."
                        className="text-sm"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleRespond} disabled={isResponding || !responseText.trim()}>
                          <Send className="h-3 w-3 mr-1" /> {isResponding ? "Sending..." : "Send Response"}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => { setRespondingTo(null); setResponseText(""); }}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button size="sm" variant="ghost" className="text-xs" onClick={() => setRespondingTo({ id: review.id, type: 'employee' })} data-testid={`button-respond-employee-${review.id}`}>
                      <MessageSquare className="h-3 w-3 mr-1" /> Respond
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </>
      )}
    </div>
  );
}

export default function HospitalDashboard() {
  const { user } = useAuth();

  const { data: claimedHospitals, isLoading: hospitalsLoading } = useQuery<Hospital[]>({
    queryKey: ["/api/user/claimed-hospitals"],
    enabled: !!user,
  });

  const { data: claimRequests, isLoading: requestsLoading } = useQuery<any[]>({
    queryKey: ["/api/user/claim-requests"],
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Building2 className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Please log in to access your Hospital Dashboard</h2>
        <Link href="/login">
          <Button data-testid="button-login">Log In</Button>
        </Link>
      </div>
    );
  }

  if (hospitalsLoading || requestsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const hasClaimedHospitals = claimedHospitals && claimedHospitals.length > 0;
  const hasClaimRequests = claimRequests && claimRequests.length > 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-gradient-to-r from-primary to-emerald-700 text-white py-10">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 text-emerald-100 text-sm mb-4">
            <Link href="/" className="hover:text-white">Home</Link>
            <span>/</span>
            <span>Hospital Dashboard</span>
          </div>
          <h1 className="text-3xl font-bold mb-2" data-testid="text-dashboard-title">
            <Building2 className="inline h-8 w-8 mr-2" />
            Hospital Dashboard
          </h1>
          <p className="text-emerald-100 text-lg">
            Manage your hospital profiles, update information, and respond to patient reviews.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {hasClaimedHospitals ? (
          <div>
            <h2 className="text-xl font-semibold mb-4">Your Hospitals</h2>
            {claimedHospitals.map(hospital => (
              <HospitalManageCard key={hospital.id} hospital={hospital} />
            ))}
          </div>
        ) : (
          <Card className="mb-6">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Claimed Hospitals Yet</h3>
              <p className="text-muted-foreground mb-4 max-w-md">
                Claim your hospital profile to update information, respond to reviews, and earn the verified badge.
              </p>
              <Link href="/search">
                <Button data-testid="button-find-hospital">
                  Find Your Hospital <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {hasClaimRequests && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Claim Requests</h2>
            <div className="space-y-3">
              {claimRequests.map((request: any) => (
                <Card key={request.id} data-testid={`card-claim-request-${request.id}`}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-medium">{request.hospitalName}</p>
                      <p className="text-xs text-muted-foreground">
                        Submitted {new Date(request.createdAt).toLocaleDateString()} as {request.position}
                      </p>
                    </div>
                    <ClaimRequestStatus status={request.status} />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {!hasClaimedHospitals && !hasClaimRequests && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-4">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">How to claim your hospital</h4>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Search for your hospital on CareNaija</li>
                  <li>Click "Claim This Profile" on the hospital page</li>
                  <li>Fill in your verification details</li>
                  <li>Our team will review and approve within 24-48 hours</li>
                </ol>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
