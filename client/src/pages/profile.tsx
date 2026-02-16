import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft, User, Mail, MapPin, Loader2, CheckCircle2, Camera
} from "lucide-react";

const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT", "Gombe", "Imo",
  "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa",
  "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba",
  "Yobe", "Zamfara"
];

type ProfileFormData = {
  firstName: string;
  lastName: string;
  location: string;
};

export default function Profile() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(false);

  const form = useForm<ProfileFormData>({
    defaultValues: {
      firstName: "",
      lastName: "",
      location: "",
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        location: user.location || "",
      });
    }
  }, [user, form]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = "/login";
    }
  }, [authLoading, isAuthenticated]);

  const updateProfile = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update profile");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setSaved(true);
      toast({ title: "Profile updated successfully" });
      setTimeout(() => setSaved(false), 3000);
    },
    onError: () => {
      toast({ title: "Failed to update profile", variant: "destructive" });
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    updateProfile.mutate(data);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8" data-testid="page-profile">
      <div className="container mx-auto px-4 max-w-2xl">
        <Link href="/dashboard">
          <span className="text-sm text-slate-500 hover:text-emerald-600 flex items-center gap-1 mb-4">
            <ChevronLeft className="w-4 h-4" /> Back to Dashboard
          </span>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Edit Profile
            </CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6 mb-8">
              <div className="relative">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={user?.profileImageUrl || ""} />
                  <AvatarFallback className="bg-emerald-100 text-emerald-700 text-2xl">
                    {user?.firstName?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute bottom-0 right-0 w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-white cursor-not-allowed opacity-50">
                  <Camera className="w-4 h-4" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold">
                  {user?.firstName ? `${user.firstName} ${user.lastName || ""}` : "Set your name"}
                </h3>
                <p className="text-sm text-slate-500">{user?.email}</p>
                <p className="text-xs text-slate-400 mt-1">Profile photo is managed by your login provider</p>
              </div>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    placeholder="Enter your first name"
                    {...form.register("firstName")}
                    data-testid="input-first-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    placeholder="Enter your last name"
                    {...form.register("lastName")}
                    data-testid="input-last-name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className="pl-10 bg-slate-100"
                  />
                </div>
                <p className="text-xs text-slate-500">Email is managed by your login provider</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location (State)</Label>
                <Select
                  value={form.watch("location")}
                  onValueChange={(value) => form.setValue("location", value)}
                >
                  <SelectTrigger data-testid="select-location">
                    <SelectValue placeholder="Select your state" />
                  </SelectTrigger>
                  <SelectContent>
                    {NIGERIAN_STATES.map(state => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700"
                  disabled={updateProfile.isPending}
                  data-testid="button-save-profile"
                >
                  {updateProfile.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : saved ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Saved!
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
                <Link href="/dashboard">
                  <Button type="button" variant="outline">Cancel</Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-red-600">Account Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 mb-4">
              You can manage your account settings here. To sign out of your account, click the button below.
            </p>
            <button onClick={() => { fetch("/api/auth/logout", { method: "POST", credentials: "include" }).then(() => { window.location.href = "/"; }); }}>
              <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                Sign Out
              </Button>
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
