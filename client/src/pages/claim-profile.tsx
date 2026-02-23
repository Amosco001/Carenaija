import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Hospital } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Building2, ShieldCheck, Mail, Phone, FileText, Loader2 } from "lucide-react";

const claimSchema = z.object({
  fullName: z.string().min(3, "Full name is required"),
  position: z.string().min(2, "Job title is required"),
  email: z.string().email("Please use a valid work email"),
  phone: z.string().min(10, "Valid phone number is required"),
  additionalInfo: z.string().optional(),
  agreeTerms: z.boolean().refine(val => val === true, "You must agree to the terms"),
});

export default function ClaimProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: hospital, isLoading, error } = useQuery<Hospital>({
    queryKey: [`/api/hospitals/${id}`],
    enabled: !!id,
  });

  const claimMutation = useMutation({
    mutationFn: async (data: z.infer<typeof claimSchema>) => {
      const res = await apiRequest("POST", `/api/hospitals/${id}/claim-requests`, {
        fullName: data.fullName,
        position: data.position,
        email: data.email,
        phone: data.phone,
        additionalInfo: data.additionalInfo || null,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Claim Request Submitted",
        description: "We will verify your details and contact you within 24-48 hours.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/claim-requests"] });
      setLocation("/dashboard");
    },
    onError: () => {
      toast({
        title: "Submission Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const form = useForm<z.infer<typeof claimSchema>>({
    resolver: zodResolver(claimSchema),
    defaultValues: {
      fullName: "",
      position: "",
      email: "",
      phone: "",
      additionalInfo: "",
      agreeTerms: false,
    },
  });

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <ShieldCheck className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Please log in to claim a hospital profile</h2>
        <Link href="/login">
          <Button>Log In</Button>
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !hospital) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Building2 className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Hospital not found</h2>
        <Link href="/search">
          <Button variant="outline">Search Hospitals</Button>
        </Link>
      </div>
    );
  }

  const onSubmit = (data: z.infer<typeof claimSchema>) => {
    claimMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="mb-8">
          <Link href="/search">
            <span className="text-sm text-slate-500 hover:text-primary mb-2 block" data-testid="link-back">&larr; Back to Search</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-full text-blue-600">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-serif font-bold text-slate-900" data-testid="text-claim-title">Claim this Profile</h1>
              <p className="text-slate-600">Manage <strong>{hospital.name}</strong> to update info and reply to reviews.</p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-[1fr_300px] gap-8">
          <Card className="shadow-sm border-slate-200">
            <CardHeader>
              <CardTitle>Verification Details</CardTitle>
              <CardDescription>
                To prevent fraud, we need to verify that you are an authorized representative of this healthcare facility.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input id="fullName" placeholder="e.g. Dr. Ada Obi" {...form.register("fullName")} data-testid="input-fullname" />
                    {form.formState.errors.fullName && <p className="text-xs text-red-500">{form.formState.errors.fullName.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="position">Job Title / Position</Label>
                    <Input id="position" placeholder="e.g. Medical Director" {...form.register("position")} data-testid="input-position" />
                    {form.formState.errors.position && <p className="text-xs text-red-500">{form.formState.errors.position.message}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Work Email</Label>
                  <Input id="email" type="email" inputMode="email" autoComplete="email" placeholder={`name@${hospital.website ? hospital.website.replace('https://', '').replace('http://', '').replace('www.', '').split('/')[0] : 'hospital.com'}`} {...form.register("email")} data-testid="input-email" />
                  <p className="text-xs text-slate-500">Please use an official email address if available.</p>
                  {form.formState.errors.email && <p className="text-xs text-red-500">{form.formState.errors.email.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="+234..." {...form.register("phone")} data-testid="input-phone" />
                  {form.formState.errors.phone && <p className="text-xs text-red-500">{form.formState.errors.phone.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="additionalInfo">Additional Information (Optional)</Label>
                  <Textarea id="additionalInfo" placeholder="Any additional details that can help verify your role..." {...form.register("additionalInfo")} data-testid="input-additional-info" />
                </div>

                <div className="flex items-start space-x-2 pt-2">
                  <Checkbox
                    id="terms"
                    onCheckedChange={(checked) => form.setValue("agreeTerms", checked as boolean)}
                    data-testid="checkbox-terms"
                  />
                  <Label htmlFor="terms" className="text-sm font-normal text-slate-600 leading-tight">
                    I certify that I am an authorized representative of this facility and have the authority to manage its public profile. I agree to the Terms of Service.
                  </Label>
                </div>
                {form.formState.errors.agreeTerms && <p className="text-xs text-red-500">{form.formState.errors.agreeTerms.message}</p>}

                <Button type="submit" size="lg" className="w-full" disabled={claimMutation.isPending} data-testid="button-submit-claim">
                  {claimMutation.isPending ? "Submitting..." : "Submit Claim Request"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-4">Why claim your profile?</h3>
              <ul className="space-y-4">
                <li className="flex gap-3 text-sm text-slate-600">
                  <div className="bg-green-100 p-1.5 rounded-full text-green-700 h-fit">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <span><strong>Get the Verified Badge</strong> to build trust with patients.</span>
                </li>
                <li className="flex gap-3 text-sm text-slate-600">
                  <div className="bg-blue-100 p-1.5 rounded-full text-blue-700 h-fit">
                    <Mail className="w-4 h-4" />
                  </div>
                  <span><strong>Respond to reviews</strong> and engage with patient feedback.</span>
                </li>
                <li className="flex gap-3 text-sm text-slate-600">
                  <div className="bg-orange-100 p-1.5 rounded-full text-orange-700 h-fit">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <span><strong>Update hospital info</strong> like hours, services, and contact details.</span>
                </li>
              </ul>
            </div>

            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold text-sm mb-2">Hospital to claim:</h4>
                <p className="text-sm font-medium">{hospital.name}</p>
                <p className="text-xs text-muted-foreground">{hospital.address}, {hospital.state}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
