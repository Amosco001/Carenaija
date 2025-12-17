import { useEffect } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { getHospital } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Building2, ShieldCheck, Mail, Phone, FileText } from "lucide-react";
import NotFound from "@/pages/not-found";

const claimSchema = z.object({
  fullName: z.string().min(3, "Full name is required"),
  jobTitle: z.string().min(2, "Job title is required"),
  workEmail: z.string().email("Please use a valid work email"),
  phone: z.string().min(10, "Valid phone number is required"),
  verificationFile: z.any().optional(), // In a real app this would be file validation
  agreeTerms: z.boolean().refine(val => val === true, "You must agree to the terms"),
});

export default function ClaimProfile() {
  const { id } = useParams();
  const hospital = getHospital(id || "");
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  if (!hospital) return <NotFound />;

  const form = useForm<z.infer<typeof claimSchema>>({
    resolver: zodResolver(claimSchema),
    defaultValues: {
      agreeTerms: false
    }
  });

  const onSubmit = async (data: z.infer<typeof claimSchema>) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log("Claim Data:", data);
    
    toast({
      title: "Claim Request Submitted",
      description: "We will verify your documents and contact you within 24-48 hours.",
    });
    
    setLocation(`/hospital/${id}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="mb-8">
           <Link href={`/hospital/${hospital.id}`}>
            <a className="text-sm text-slate-500 hover:text-primary mb-2 block">&larr; Back to {hospital.name}</a>
          </Link>
          <div className="flex items-center gap-3">
             <div className="p-3 bg-blue-100 rounded-full text-blue-600">
               <ShieldCheck className="w-8 h-8" />
             </div>
             <div>
               <h1 className="text-3xl font-serif font-bold text-slate-900">Claim this Profile</h1>
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
                    <Input id="fullName" placeholder="e.g. Dr. Ada Obi" {...form.register("fullName")} />
                    {form.formState.errors.fullName && <p className="text-xs text-red-500">{form.formState.errors.fullName.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="jobTitle">Job Title</Label>
                    <Input id="jobTitle" placeholder="e.g. Medical Director" {...form.register("jobTitle")} />
                    {form.formState.errors.jobTitle && <p className="text-xs text-red-500">{form.formState.errors.jobTitle.message}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="workEmail">Work Email</Label>
                  <Input id="workEmail" type="email" inputMode="email" autoComplete="email" placeholder={`name@${hospital.website ? hospital.website.replace('https://', '').replace('www.', '').split('/')[0] : 'hospital.com'}`} {...form.register("workEmail")} />
                  <p className="text-xs text-slate-500">Please use an official email address if available.</p>
                  {form.formState.errors.workEmail && <p className="text-xs text-red-500">{form.formState.errors.workEmail.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="+234..." {...form.register("phone")} />
                  {form.formState.errors.phone && <p className="text-xs text-red-500">{form.formState.errors.phone.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="verification">Upload Verification Document</Label>
                  <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center hover:bg-slate-50 transition-colors cursor-pointer">
                    <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-600 font-medium">Click to upload ID or Official Letterhead</p>
                    <p className="text-xs text-slate-400 mt-1">PDF, JPG or PNG (Max 5MB)</p>
                  </div>
                </div>

                <div className="flex items-start space-x-2 pt-2">
                   <Checkbox 
                      id="terms" 
                      onCheckedChange={(checked) => form.setValue("agreeTerms", checked as boolean)}
                    />
                    <Label htmlFor="terms" className="text-sm font-normal text-slate-600 leading-tight">
                      I certify that I am an authorized representative of this facility and have the authority to manage its public profile. I agree to the Terms of Service.
                    </Label>
                </div>
                {form.formState.errors.agreeTerms && <p className="text-xs text-red-500">{form.formState.errors.agreeTerms.message}</p>}

                <Button type="submit" size="lg" className="w-full" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Submitting..." : "Submit Claim Request"}
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
                  <span><strong>Update hospital info</strong> like hours, services, and photos.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
