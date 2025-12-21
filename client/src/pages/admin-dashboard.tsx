import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { format } from "date-fns";
import { 
  Shield, 
  Flag, 
  CheckCircle, 
  XCircle,
  Eye,
  Clock,
  User,
  MessageSquare,
  RefreshCcw,
  Search,
  Ban,
  CheckCheck,
  FileText,
  Activity,
  Settings,
  ChevronDown,
  Building2,
  TrendingUp,
  Users,
  LayoutDashboard,
  Plus,
  Trash2,
  Edit,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Mail,
  History,
  BookOpen,
  Tag,
  FolderOpen,
  Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import type { PatientReview, ReviewFlag, Hospital, User as UserType } from "@shared/schema";

interface AdminStats {
  hospitals: { total: number; verified: number; pending: number };
  reviews: { total: number; pending: number; flagged: number };
  users: { total: number; admins: number; suspended: number };
  flags: { pending: number; resolved: number };
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
    user: { variant: "outline", icon: <User className="w-3 h-3" /> },
    editor: { variant: "secondary", icon: <Edit className="w-3 h-3" /> },
    moderator: { variant: "default", icon: <Shield className="w-3 h-3" /> },
    super_admin: { variant: "destructive", icon: <Shield className="w-3 h-3" /> },
  };

  const { variant, icon } = config[status] || { variant: "secondary", icon: null };

  return (
    <Badge variant={variant} className="flex items-center gap-1 capitalize">
      {icon}
      {status.replace("_", " ")}
    </Badge>
  );
}

function OverviewTab({ stats }: { stats: AdminStats | undefined }) {
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Hospitals</CardDescription>
            <CardTitle className="text-3xl">{stats?.hospitals.total || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-slate-500">
              <Building2 className="w-4 h-4 mr-1" /> 
              {stats?.hospitals.verified || 0} verified
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Reviews</CardDescription>
            <CardTitle className="text-3xl">{stats?.reviews.total || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-slate-500">
              <MessageSquare className="w-4 h-4 mr-1" /> 
              {stats?.reviews.pending || 0} pending
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Users</CardDescription>
            <CardTitle className="text-3xl">{stats?.users.total || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-slate-500">
              <Users className="w-4 h-4 mr-1" /> 
              {stats?.users.admins || 0} admins
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Flags</CardDescription>
            <CardTitle className="text-3xl text-orange-600">{stats?.flags.pending || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-slate-500">
              <Flag className="w-4 h-4 mr-1" /> 
              {stats?.flags.resolved || 0} resolved
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Link href="/admin?tab=hospitals">
              <Button variant="outline" className="w-full justify-start">
                <Building2 className="w-4 h-4 mr-2" /> Manage Hospitals
              </Button>
            </Link>
            <Link href="/admin?tab=reviews">
              <Button variant="outline" className="w-full justify-start">
                <MessageSquare className="w-4 h-4 mr-2" /> Moderate Reviews
              </Button>
            </Link>
            <Link href="/admin?tab=users">
              <Button variant="outline" className="w-full justify-start">
                <Users className="w-4 h-4 mr-2" /> Manage Users
              </Button>
            </Link>
            <Link href="/admin?tab=content">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="w-4 h-4 mr-2" /> Edit Content
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Spam Detection</span>
              <Badge variant="default" className="bg-emerald-600">Active</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Review Rate Limiting</span>
              <Badge variant="default" className="bg-emerald-600">1/year per hospital</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Email Notifications</span>
              <Badge variant="default" className="bg-emerald-600">Enabled</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function HospitalsTab() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [editHospital, setEditHospital] = useState<Hospital | null>(null);

  const { data: hospitalsData, isLoading } = useQuery<{ data: Hospital[]; total: number; totalPages: number }>({
    queryKey: ["/api/admin/hospitals", page, search],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/hospitals?${params}`, { credentials: "include" });
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/hospitals/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Hospital deleted");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/hospitals"] });
    },
    onError: () => toast.error("Failed to delete hospital"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Hospital> }) => {
      const res = await fetch(`/api/admin/hospitals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Hospital updated");
      setEditHospital(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/hospitals"] });
    },
    onError: () => toast.error("Failed to update hospital"),
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ ids, verified }: { ids: number[]; verified: boolean }) => {
      const res = await fetch("/api/admin/hospitals/bulk-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, verified }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to bulk update");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Hospitals updated");
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/hospitals"] });
    },
    onError: () => toast.error("Bulk update failed"),
  });

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === hospitalsData?.data.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(hospitalsData?.data.map(h => h.id) || []);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search hospitals..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-10"
            data-testid="input-hospital-search"
          />
        </div>
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">{selectedIds.length} selected</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => bulkUpdateMutation.mutate({ ids: selectedIds, verified: true })}
            >
              <CheckCircle className="w-4 h-4 mr-1" /> Verify All
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => bulkUpdateMutation.mutate({ ids: selectedIds, verified: false })}
            >
              <XCircle className="w-4 h-4 mr-1" /> Unverify All
            </Button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <RefreshCcw className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : (
        <>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-3 text-left">
                    <Checkbox 
                      checked={selectedIds.length === hospitalsData?.data.length && hospitalsData?.data.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </th>
                  <th className="p-3 text-left text-sm font-medium">Name</th>
                  <th className="p-3 text-left text-sm font-medium">Location</th>
                  <th className="p-3 text-left text-sm font-medium">Status</th>
                  <th className="p-3 text-left text-sm font-medium">Rating</th>
                  <th className="p-3 text-left text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {hospitalsData?.data.map((hospital) => (
                  <tr key={hospital.id} className="border-t hover:bg-slate-50">
                    <td className="p-3">
                      <Checkbox 
                        checked={selectedIds.includes(hospital.id)}
                        onCheckedChange={() => toggleSelect(hospital.id)}
                      />
                    </td>
                    <td className="p-3">
                      <div className="font-medium">{hospital.name}</div>
                      <div className="text-sm text-slate-500">{hospital.ownership}</div>
                    </td>
                    <td className="p-3 text-sm">
                      {hospital.city || hospital.lga}, {hospital.state}
                    </td>
                    <td className="p-3">
                      <Badge variant={hospital.verified ? "default" : "secondary"}>
                        {hospital.verified ? "Verified" : "Unverified"}
                      </Badge>
                    </td>
                    <td className="p-3 text-sm">
                      {hospital.averageRating?.toFixed(1) || "N/A"} ({hospital.totalReviews || 0})
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditHospital(hospital)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600"
                          onClick={() => {
                            if (confirm("Delete this hospital?")) {
                              deleteMutation.mutate(hospital.id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-500">
              Showing {hospitalsData?.data.length || 0} of {hospitalsData?.total || 0}
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm">Page {page}</span>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= (hospitalsData?.totalPages || 1)}
                onClick={() => setPage(p => p + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </>
      )}

      <Dialog open={!!editHospital} onOpenChange={() => setEditHospital(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Hospital</DialogTitle>
          </DialogHeader>
          {editHospital && (
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              updateMutation.mutate({
                id: editHospital.id,
                data: {
                  name: formData.get("name") as string,
                  address: formData.get("address") as string,
                  city: formData.get("city") as string,
                  state: formData.get("state") as string,
                  phone: formData.get("phone") as string,
                  verified: formData.get("verified") === "on",
                },
              });
            }}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Name</Label>
                  <Input name="name" defaultValue={editHospital.name} />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input name="phone" defaultValue={editHospital.phone || ""} />
                </div>
                <div className="col-span-2">
                  <Label>Address</Label>
                  <Input name="address" defaultValue={editHospital.address} />
                </div>
                <div>
                  <Label>City</Label>
                  <Input name="city" defaultValue={editHospital.city || ""} />
                </div>
                <div>
                  <Label>State</Label>
                  <Input name="state" defaultValue={editHospital.state} />
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <Checkbox name="verified" defaultChecked={editHospital.verified} />
                  <Label>Verified</Label>
                </div>
              </div>
              <DialogFooter className="mt-4">
                <Button type="button" variant="outline" onClick={() => setEditHospital(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function UsersTab() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [suspendUser, setSuspendUser] = useState<UserType | null>(null);
  const [suspendReason, setSuspendReason] = useState("");

  const { data: usersData, isLoading } = useQuery<{ users: UserType[]; total: number }>({
    queryKey: ["/api/admin/users", page, search, roleFilter, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (search) params.set("search", search);
      if (roleFilter !== "all") params.set("role", roleFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`/api/admin/users?${params}`, { credentials: "include" });
      return res.json();
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message);
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Role updated");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const suspendMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
      const res = await fetch(`/api/admin/users/${userId}/suspend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to suspend");
      return res.json();
    },
    onSuccess: () => {
      toast.success("User suspended");
      setSuspendUser(null);
      setSuspendReason("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: () => toast.error("Failed to suspend user"),
  });

  const unsuspendMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/admin/users/${userId}/unsuspend`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to unsuspend");
      return res.json();
    },
    onSuccess: () => {
      toast.success("User unsuspended");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: () => toast.error("Failed to unsuspend user"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message);
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("User deleted");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-10"
            data-testid="input-user-search"
          />
        </div>
        <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1); }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="editor">Editor</SelectItem>
            <SelectItem value="moderator">Moderator</SelectItem>
            <SelectItem value="super_admin">Super Admin</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <RefreshCcw className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-3 text-left text-sm font-medium">User</th>
                <th className="p-3 text-left text-sm font-medium">Role</th>
                <th className="p-3 text-left text-sm font-medium">Status</th>
                <th className="p-3 text-left text-sm font-medium">Joined</th>
                <th className="p-3 text-left text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {usersData?.users.map((user) => (
                <tr key={user.id} className="border-t hover:bg-slate-50">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      {user.profileImageUrl ? (
                        <img src={user.profileImageUrl} className="w-8 h-8 rounded-full" alt="" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                          <User className="w-4 h-4 text-emerald-600" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-slate-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <Select 
                      value={user.role}
                      onValueChange={(role) => updateRoleMutation.mutate({ userId: user.id, role })}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="editor">Editor</SelectItem>
                        <SelectItem value="moderator">Moderator</SelectItem>
                        <SelectItem value="super_admin">Super Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-3">
                    {user.suspendedAt ? (
                      <Badge variant="destructive">Suspended</Badge>
                    ) : (
                      <Badge variant="default" className="bg-emerald-600">Active</Badge>
                    )}
                  </td>
                  <td className="p-3 text-sm text-slate-500">
                    {user.createdAt ? format(new Date(user.createdAt), "MMM d, yyyy") : "N/A"}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      {user.suspendedAt ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => unsuspendMutation.mutate(user.id)}
                        >
                          Unsuspend
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-orange-600"
                          onClick={() => setSuspendUser(user)}
                        >
                          <Ban className="w-4 h-4 mr-1" /> Suspend
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600"
                        onClick={() => {
                          if (confirm("Delete this user? This cannot be undone.")) {
                            deleteMutation.mutate(user.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={!!suspendUser} onOpenChange={() => setSuspendUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend User</DialogTitle>
            <DialogDescription>
              Suspending {suspendUser?.email}. Please provide a reason.
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label>Reason</Label>
            <Textarea
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              placeholder="Enter suspension reason..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendUser(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!suspendReason || suspendMutation.isPending}
              onClick={() => suspendUser && suspendMutation.mutate({
                userId: suspendUser.id,
                reason: suspendReason,
              })}
            >
              Suspend User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ReviewsTab() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const { data: reviews = [], isLoading, refetch } = useQuery<PatientReview[]>({
    queryKey: ["/api/admin/reviews/moderation", statusFilter !== "all" ? statusFilter : undefined],
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
      toast.success("Review updated");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reviews/moderation"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard-stats"] });
    },
    onError: () => toast.error("Failed to update review"),
  });

  const bulkModerateMutation = useMutation({
    mutationFn: async ({ ids, status }: { ids: number[]; status: string }) => {
      const res = await fetch("/api/admin/reviews/bulk-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, status }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to bulk update");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Reviews updated");
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reviews/moderation"] });
    },
    onError: () => toast.error("Bulk update failed"),
  });

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
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
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCcw className="w-4 h-4 mr-1" /> Refresh
          </Button>
        </div>
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">{selectedIds.length} selected</span>
            <Button
              size="sm"
              className="bg-emerald-600"
              onClick={() => bulkModerateMutation.mutate({ ids: selectedIds, status: "approved" })}
            >
              Approve All
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => bulkModerateMutation.mutate({ ids: selectedIds, status: "rejected" })}
            >
              Reject All
            </Button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <RefreshCcw className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : reviews.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="w-12 h-12 text-emerald-500 mb-4" />
            <h3 className="text-lg font-semibold">All caught up!</h3>
            <p className="text-slate-500">No reviews pending moderation.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox 
                      checked={selectedIds.includes(review.id)}
                      onCheckedChange={() => toggleSelect(review.id)}
                    />
                    <div>
                      <CardTitle className="text-base">{review.title || "Untitled Review"}</CardTitle>
                      <CardDescription>
                        By {review.reviewerName} · Hospital #{review.hospitalId} · {format(new Date(review.createdAt!), "MMM d, yyyy")}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={review.moderationStatus} />
                    {review.spamScore > 0 && (
                      <Badge variant={review.spamScore >= 30 ? "destructive" : "secondary"}>
                        Spam: {review.spamScore}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-700 mb-4">{review.reviewText}</p>
                <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                  <span>Rating: {review.rating}/5</span>
                  {review.submittedIp && <span>IP: {review.submittedIp}</span>}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    className="bg-emerald-600"
                    onClick={() => moderateMutation.mutate({ reviewId: review.id, status: "approved" })}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" /> Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => moderateMutation.mutate({ reviewId: review.id, status: "rejected" })}
                  >
                    <XCircle className="w-4 h-4 mr-1" /> Reject
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => moderateMutation.mutate({ reviewId: review.id, status: "hidden" })}
                  >
                    <Ban className="w-4 h-4 mr-1" /> Hide
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ContentTab() {
  const queryClient = useQueryClient();
  const [editContent, setEditContent] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);

  const { data: contents = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/content"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/admin/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Content created");
      setIsCreating(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/content"] });
    },
    onError: () => toast.error("Failed to create content"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await fetch(`/api/admin/content/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Content updated");
      setEditContent(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/content"] });
    },
    onError: () => toast.error("Failed to update content"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/content/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Content deleted");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/content"] });
    },
    onError: () => toast.error("Failed to delete content"),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Site Content</h2>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="w-4 h-4 mr-2" /> Add Content
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <RefreshCcw className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : contents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-12 h-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-semibold">No content yet</h3>
            <p className="text-slate-500 mb-4">Create content for your homepage, about page, or FAQs.</p>
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="w-4 h-4 mr-2" /> Create Content
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {contents.map((content) => (
            <Card key={content.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{content.title}</CardTitle>
                    <CardDescription>Key: {content.key} · v{content.version}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={content.isPublished ? "default" : "secondary"}>
                      {content.isPublished ? "Published" : "Draft"}
                    </Badge>
                    <Button size="sm" variant="ghost" onClick={() => setEditContent(content)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="text-red-600"
                      onClick={() => {
                        if (confirm("Delete this content?")) {
                          deleteMutation.mutate(content.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isCreating || !!editContent} onOpenChange={() => { setIsCreating(false); setEditContent(null); }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{editContent ? "Edit Content" : "Create Content"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const data = {
              key: formData.get("key"),
              title: formData.get("title"),
              content: formData.get("content"),
              contentType: formData.get("contentType"),
              isPublished: formData.get("isPublished") === "on",
            };
            if (editContent) {
              updateMutation.mutate({ id: editContent.id, data });
            } else {
              createMutation.mutate(data);
            }
          }}>
            <div className="space-y-4">
              <div>
                <Label>Key (unique identifier)</Label>
                <Input name="key" defaultValue={editContent?.key || ""} placeholder="e.g., homepage_hero, about_us, faq" required />
              </div>
              <div>
                <Label>Title</Label>
                <Input name="title" defaultValue={editContent?.title || ""} required />
              </div>
              <div>
                <Label>Content Type</Label>
                <Select name="contentType" defaultValue={editContent?.contentType || "html"}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="html">HTML</SelectItem>
                    <SelectItem value="markdown">Markdown</SelectItem>
                    <SelectItem value="text">Plain Text</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Content</Label>
                <Textarea name="content" defaultValue={editContent?.content || ""} rows={10} required />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox name="isPublished" defaultChecked={editContent?.isPublished ?? true} />
                <Label>Published</Label>
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => { setIsCreating(false); setEditContent(null); }}>
                Cancel
              </Button>
              <Button type="submit">
                {editContent ? "Save Changes" : "Create Content"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SettingsTab() {
  const queryClient = useQueryClient();

  const { data: settings = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/settings"],
  });

  const { data: templates = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/email-templates"],
  });

  const updateSettingMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Setting saved");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
    },
    onError: () => toast.error("Failed to save setting"),
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" /> Site Settings
          </CardTitle>
          <CardDescription>Configure your site behavior and features</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <RefreshCcw className="w-6 h-6 animate-spin" />
            </div>
          ) : settings.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No settings configured yet.</p>
          ) : (
            <div className="space-y-4">
              {settings.map((setting) => (
                <div key={setting.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{setting.label}</div>
                    <div className="text-sm text-slate-500">{setting.description}</div>
                  </div>
                  <div className="text-sm">{JSON.stringify(setting.value)}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" /> Email Templates
          </CardTitle>
          <CardDescription>Customize email notifications</CardDescription>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No email templates configured yet.</p>
          ) : (
            <div className="space-y-3">
              {templates.map((template) => (
                <div key={template.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{template.name}</div>
                    <div className="text-sm text-slate-500">{template.key}</div>
                  </div>
                  <Badge variant={template.isActive ? "default" : "secondary"}>
                    {template.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ActivityLogsTab() {
  const { data: logs = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/activity-logs"],
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <History className="w-5 h-5" /> Activity Logs
        </h2>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <RefreshCcw className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : logs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Activity className="w-12 h-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-semibold">No activity yet</h3>
            <p className="text-slate-500">Admin actions will appear here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <div key={log.id} className="flex items-start gap-4 p-4 border rounded-lg">
              <Activity className="w-5 h-5 text-slate-400 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{log.action}</span>
                  <Badge variant="outline">{log.targetType}</Badge>
                </div>
                {log.notes && <p className="text-sm text-slate-600 mt-1">{log.notes}</p>}
                <div className="text-xs text-slate-500 mt-2">
                  {log.createdAt ? format(new Date(log.createdAt), "MMM d, yyyy 'at' h:mm a") : "N/A"}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BlogTab() {
  const queryClient = useQueryClient();
  const [editArticle, setEditArticle] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState("articles");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const articlesUrl = `/api/admin/blog/articles?search=${encodeURIComponent(searchQuery)}&status=${statusFilter}`;
  const { data: articlesData, isLoading } = useQuery<{ articles: any[]; total: number }>({
    queryKey: [articlesUrl],
  });

  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ["/api/blog/categories"],
  });

  const { data: tags = [] } = useQuery<any[]>({
    queryKey: ["/api/blog/tags"],
  });

  const { data: commentsData } = useQuery<{ comments: any[] }>({
    queryKey: ["/api/admin/blog/comments"],
    enabled: activeSubTab === "comments",
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/admin/blog/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Article created");
      setIsCreating(false);
      queryClient.invalidateQueries({ predicate: (query) => Array.isArray(query.queryKey) && query.queryKey.some(k => String(k).includes("/api/admin/blog/articles")) });
    },
    onError: () => toast.error("Failed to create article"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await fetch(`/api/admin/blog/articles/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Article updated");
      setEditArticle(null);
      queryClient.invalidateQueries({ predicate: (query) => Array.isArray(query.queryKey) && query.queryKey.some(k => String(k).includes("/api/admin/blog/articles")) });
    },
    onError: () => toast.error("Failed to update article"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/blog/articles/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Article deleted");
      queryClient.invalidateQueries({ predicate: (query) => Array.isArray(query.queryKey) && query.queryKey.some(k => String(k).includes("/api/admin/blog/articles")) });
    },
    onError: () => toast.error("Failed to delete article"),
  });

  const moderateCommentMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await fetch(`/api/admin/blog/comments/${id}/moderate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to moderate");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Comment moderated");
      queryClient.invalidateQueries({ predicate: (query) => Array.isArray(query.queryKey) && query.queryKey.some(k => String(k).includes("/api/admin/blog/comments")) });
    },
    onError: () => toast.error("Failed to moderate comment"),
  });

  const articles = articlesData?.articles || [];
  const comments = commentsData?.comments || [];

  return (
    <div className="space-y-4">
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="articles" className="flex items-center gap-2" data-testid="tab-blog-articles">
              <BookOpen className="w-4 h-4" /> Articles
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center gap-2" data-testid="tab-blog-categories">
              <FolderOpen className="w-4 h-4" /> Categories ({categories.length})
            </TabsTrigger>
            <TabsTrigger value="tags" className="flex items-center gap-2" data-testid="tab-blog-tags">
              <Tag className="w-4 h-4" /> Tags ({tags.length})
            </TabsTrigger>
            <TabsTrigger value="comments" className="flex items-center gap-2" data-testid="tab-blog-comments">
              <MessageSquare className="w-4 h-4" /> Comments
            </TabsTrigger>
          </TabsList>
          {activeSubTab === "articles" && (
            <Button onClick={() => setIsCreating(true)} data-testid="button-create-article">
              <Plus className="w-4 h-4 mr-2" /> New Article
            </Button>
          )}
        </div>

        <TabsContent value="articles">
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-articles"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40" data-testid="select-status-filter">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <RefreshCcw className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
          ) : articles.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="w-12 h-12 text-slate-300 mb-4" />
                <h3 className="text-lg font-semibold">No articles yet</h3>
                <p className="text-slate-500 mb-4">Create your first blog article to share with readers.</p>
                <Button onClick={() => setIsCreating(true)} data-testid="button-create-first-article">
                  <Plus className="w-4 h-4 mr-2" /> Create Article
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {articles.map((article) => (
                <Card key={article.id} data-testid={`article-card-${article.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{article.title}</CardTitle>
                        <CardDescription className="line-clamp-2">{article.excerpt}</CardDescription>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span>{article.authorName}</span>
                          <span>·</span>
                          <span>{article.readingTimeMinutes} min read</span>
                          <span>·</span>
                          <span>{article.viewCount || 0} views</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={article.status === "published" ? "default" : "secondary"}>
                          {article.status}
                        </Badge>
                        <Link href={`/blog/${article.slug}`}>
                          <Button size="sm" variant="ghost" data-testid={`button-preview-${article.id}`}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button size="sm" variant="ghost" onClick={() => setEditArticle(article)} data-testid={`button-edit-${article.id}`}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600"
                          onClick={() => {
                            if (confirm("Delete this article?")) {
                              deleteMutation.mutate(article.id);
                            }
                          }}
                          data-testid={`button-delete-${article.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>Blog Categories</CardTitle>
              <CardDescription>Organize your articles with categories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {categories.map((cat: any) => (
                  <div key={cat.id} className="flex items-center justify-between p-3 border rounded-lg" data-testid={`category-item-${cat.id}`}>
                    <div>
                      <span className="font-medium">{cat.name}</span>
                      <span className="text-sm text-slate-500 ml-2">/{cat.slug}</span>
                    </div>
                    <Badge variant="outline">{cat.articleCount || 0} articles</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tags">
          <Card>
            <CardHeader>
              <CardTitle>Blog Tags</CardTitle>
              <CardDescription>Tag articles for easy discovery</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag: any) => (
                  <Badge key={tag.id} variant="outline" className="py-2 px-3" data-testid={`tag-item-${tag.id}`}>
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comments">
          <Card>
            <CardHeader>
              <CardTitle>Comment Moderation</CardTitle>
              <CardDescription>Review and moderate blog comments</CardDescription>
            </CardHeader>
            <CardContent>
              {comments.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  No comments to moderate
                </div>
              ) : (
                <div className="space-y-3">
                  {comments.map((comment: any) => (
                    <div key={comment.id} className="p-4 border rounded-lg" data-testid={`comment-item-${comment.id}`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium">{comment.authorName}</span>
                            <StatusBadge status={comment.status} />
                          </div>
                          <p className="text-sm text-slate-600">{comment.content}</p>
                          <p className="text-xs text-slate-500 mt-2">
                            on "{comment.articleTitle}" · {comment.createdAt ? format(new Date(comment.createdAt), "MMM d, yyyy") : "N/A"}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => moderateCommentMutation.mutate({ id: comment.id, status: "approved" })}
                            disabled={comment.status === "approved"}
                            data-testid={`button-approve-comment-${comment.id}`}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600"
                            onClick={() => moderateCommentMutation.mutate({ id: comment.id, status: "rejected" })}
                            disabled={comment.status === "rejected"}
                            data-testid={`button-reject-comment-${comment.id}`}
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isCreating || !!editArticle} onOpenChange={() => { setIsCreating(false); setEditArticle(null); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{editArticle ? "Edit Article" : "Create Article"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const data = {
              title: formData.get("title"),
              slug: formData.get("slug"),
              excerpt: formData.get("excerpt"),
              content: formData.get("content"),
              categoryId: formData.get("categoryId") ? Number(formData.get("categoryId")) : null,
              status: formData.get("status"),
              isFeatured: formData.get("isFeatured") === "on",
              metaTitle: formData.get("metaTitle") || null,
              metaDescription: formData.get("metaDescription") || null,
            };
            if (editArticle) {
              updateMutation.mutate({ id: editArticle.id, data });
            } else {
              createMutation.mutate(data);
            }
          }}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Title</Label>
                  <Input name="title" defaultValue={editArticle?.title || ""} placeholder="Article title" required data-testid="input-article-title" />
                </div>
                <div>
                  <Label>Slug</Label>
                  <Input name="slug" defaultValue={editArticle?.slug || ""} placeholder="article-url-slug" required data-testid="input-article-slug" />
                </div>
              </div>
              <div>
                <Label>Excerpt</Label>
                <Textarea name="excerpt" defaultValue={editArticle?.excerpt || ""} placeholder="Brief summary of the article..." rows={2} data-testid="input-article-excerpt" />
              </div>
              <div>
                <Label>Content (Markdown)</Label>
                <Textarea name="content" defaultValue={editArticle?.content || ""} placeholder="Write your article content in Markdown..." rows={12} className="font-mono text-sm" required data-testid="input-article-content" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Category</Label>
                  <Select name="categoryId" defaultValue={editArticle?.categoryId?.toString() || ""}>
                    <SelectTrigger data-testid="select-article-category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat: any) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select name="status" defaultValue={editArticle?.status || "draft"}>
                    <SelectTrigger data-testid="select-article-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox name="isFeatured" defaultChecked={editArticle?.isFeatured || false} data-testid="checkbox-featured" />
                    Featured Article
                  </Label>
                </div>
              </div>
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">SEO Settings</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Meta Title</Label>
                    <Input name="metaTitle" defaultValue={editArticle?.metaTitle || ""} placeholder="SEO title" data-testid="input-meta-title" />
                  </div>
                  <div>
                    <Label>Meta Description</Label>
                    <Input name="metaDescription" defaultValue={editArticle?.metaDescription || ""} placeholder="SEO description" data-testid="input-meta-description" />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => { setIsCreating(false); setEditArticle(null); }} data-testid="button-cancel-article">
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save-article">
                <Send className="w-4 h-4 mr-2" />
                {editArticle ? "Update Article" : "Create Article"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  const { data: stats } = useQuery<AdminStats>({
    queryKey: ["/api/admin/dashboard-stats"],
    enabled: !!user,
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
                <p className="text-sm text-slate-500">Manage hospitals, reviews, users, and content</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="capitalize">{user.role || 'admin'}</Badge>
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
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="hospitals" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Hospitals
            </TabsTrigger>
            <TabsTrigger value="reviews" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Reviews
              {(stats?.reviews.pending || 0) > 0 && (
                <Badge variant="destructive" className="ml-1">{stats?.reviews.pending}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="blog" className="flex items-center gap-2" data-testid="tab-blog">
              <BookOpen className="w-4 h-4" />
              Blog
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Content
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Activity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab stats={stats} />
          </TabsContent>

          <TabsContent value="hospitals">
            <HospitalsTab />
          </TabsContent>

          <TabsContent value="reviews">
            <ReviewsTab />
          </TabsContent>

          <TabsContent value="users">
            <UsersTab />
          </TabsContent>

          <TabsContent value="blog">
            <BlogTab />
          </TabsContent>

          <TabsContent value="content">
            <ContentTab />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsTab />
          </TabsContent>

          <TabsContent value="logs">
            <ActivityLogsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
