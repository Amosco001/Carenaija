import { useState } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/lib/auth";
import { getHospital } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StarRating } from "@/components/star-rating";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import NotFound from "@/pages/not-found";

const patientReviewSchema = z.object({
  reviewerRole: z.enum(["Patient", "Family Member", "Visitor"], {
    required_error: "Please select your role",
  }),
  rating: z.number().min(1, "Rating is required"),
  title: z.string().min(5, "Title must be at least 5 characters"),
  comment: z.string().min(20, "Please provide more detail in your review"),
  tags: z.array(z.string()).optional(),
});

const employeeReviewSchema = z.object({
  jobTitle: z.string().min(2, "Job title is required"),
  salaryMin: z.string().transform(val => parseInt(val, 10)),
  salaryMax: z.string().transform(val => parseInt(val, 10)),
  rating: z.number().min(1, "Rating is required"),
  pros: z.string().min(10, "Please list at least one pro"),
  cons: z.string().min(10, "Please list at least one con"),
  recommends: z.boolean(),
});

export default function WriteReview() {
  const { type, id } = useParams<{ type: "patient" | "employee"; id: string }>();
  const hospital = getHospital(id || "");
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if not logged in (simplified protection)
  if (!user) {
    // In a real app, redirect to login with callback
    // For now, just show message
    return (
      <div className="container mx-auto py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">Please Log In</h2>
        <p className="mb-4">You need to be logged in to write a review.</p>
        <Link href="/login">
          <Button>Go to Login</Button>
        </Link>
      </div>
    );
  }

  if (!hospital) return <NotFound />;

  const PatientForm = () => {
    const form = useForm<z.infer<typeof patientReviewSchema>>({
      resolver: zodResolver(patientReviewSchema),
      defaultValues: {
        reviewerRole: "Patient",
        rating: 0,
        tags: []
      }
    });

    const onSubmit = async (data: z.infer<typeof patientReviewSchema>) => {
      setIsSubmitting(true);
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API
      console.log("Patient Review Data:", data);
      toast({ title: "Review Submitted", description: "Thank you for sharing your experience!" });
      setIsSubmitting(false);
      setLocation(`/hospital/${id}`);
    };

    const tags = ["Maternity", "Emergency", "Surgery", "Cleanliness", "Wait Times", "Billing", "Pediatrics"];

    return (
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
        <div className="space-y-3 bg-slate-50 p-4 rounded-lg border">
          <Label className="text-base font-semibold">I am writing this review as a:</Label>
          <Controller
            control={form.control}
            name="reviewerRole"
            render={({ field }) => (
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value}
                className="flex flex-col space-y-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Patient" id="role-patient" />
                  <Label htmlFor="role-patient" className="font-normal cursor-pointer">Patient (I received care here)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Family Member" id="role-family" />
                  <Label htmlFor="role-family" className="font-normal cursor-pointer">Family Member (I accompanied a patient)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Visitor" id="role-visitor" />
                  <Label htmlFor="role-visitor" className="font-normal cursor-pointer">Visitor</Label>
                </div>
              </RadioGroup>
            )}
          />
          {form.formState.errors.reviewerRole && (
            <p className="text-xs text-red-500">{form.formState.errors.reviewerRole.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Overall Rating</Label>
          <Controller
            control={form.control}
            name="rating"
            render={({ field }) => (
              <StarRating 
                rating={field.value} 
                readonly={false} 
                onChange={field.onChange} 
                size={32}
              />
            )}
          />
          {form.formState.errors.rating && (
            <p className="text-xs text-red-500">{form.formState.errors.rating.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">Review Title</Label>
          <Input id="title" placeholder="Summarize your experience" {...form.register("title")} />
          {form.formState.errors.title && (
            <p className="text-xs text-red-500">{form.formState.errors.title.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="comment">Your Review</Label>
          <Textarea 
            id="comment" 
            placeholder="Tell us about the care, facilities, and staff..." 
            className="min-h-[150px]"
            {...form.register("comment")} 
          />
          {form.formState.errors.comment && (
            <p className="text-xs text-red-500">{form.formState.errors.comment.message}</p>
          )}
        </div>

        <div className="space-y-3">
          <Label>What was this visit for? (Select relevant tags)</Label>
          <div className="flex flex-wrap gap-3">
            {tags.map(tag => (
              <Controller
                key={tag}
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <div className="flex items-center space-x-2 bg-slate-50 border px-3 py-2 rounded-md">
                    <Checkbox 
                      id={tag} 
                      checked={field.value?.includes(tag)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          field.onChange([...(field.value || []), tag]);
                        } else {
                          field.onChange((field.value || []).filter((t) => t !== tag));
                        }
                      }}
                    />
                    <Label htmlFor={tag} className="font-normal cursor-pointer">{tag}</Label>
                  </div>
                )}
              />
            ))}
          </div>
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit Review"}
        </Button>
      </form>
    );
  };

  const EmployeeForm = () => {
     const form = useForm<z.infer<typeof employeeReviewSchema>>({
      resolver: zodResolver(employeeReviewSchema),
      defaultValues: {
        recommends: true,
        rating: 0
      }
    });

    const onSubmit = async (data: z.infer<typeof employeeReviewSchema>) => {
      setIsSubmitting(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log("Employee Review Data:", data);
      toast({ title: "Review Submitted", description: "Your anonymous review has been posted." });
      setIsSubmitting(false);
      setLocation(`/hospital/${id}`);
    };

    return (
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
           <div className="space-y-2">
            <Label htmlFor="jobTitle">Job Title</Label>
            <Input id="jobTitle" placeholder="e.g. Nurse, Registrar" {...form.register("jobTitle")} />
             {form.formState.errors.jobTitle && (
              <p className="text-xs text-red-500">{form.formState.errors.jobTitle.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Overall Rating</Label>
             <Controller
              control={form.control}
              name="rating"
              render={({ field }) => (
                <StarRating 
                  rating={field.value} 
                  readonly={false} 
                  onChange={field.onChange} 
                  size={24}
                />
              )}
            />
            {form.formState.errors.rating && (
              <p className="text-xs text-red-500">{form.formState.errors.rating.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="salaryMin">Monthly Salary Min (₦)</Label>
            <Input id="salaryMin" type="number" placeholder="100000" {...form.register("salaryMin")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="salaryMax">Monthly Salary Max (₦)</Label>
            <Input id="salaryMax" type="number" placeholder="150000" {...form.register("salaryMax")} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="pros">Pros</Label>
          <Textarea id="pros" placeholder="What are the best parts of working here?" {...form.register("pros")} />
           {form.formState.errors.pros && (
            <p className="text-xs text-red-500">{form.formState.errors.pros.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="cons">Cons</Label>
          <Textarea id="cons" placeholder="What are the challenges?" {...form.register("cons")} />
           {form.formState.errors.cons && (
            <p className="text-xs text-red-500">{form.formState.errors.cons.message}</p>
          )}
        </div>

        <div className="flex items-center space-x-2 border p-4 rounded-lg bg-slate-50">
          <Controller
            control={form.control}
            name="recommends"
            render={({ field }) => (
              <Switch 
                checked={field.value}
                onCheckedChange={field.onChange}
                id="recommends"
              />
            )}
          />
          <Label htmlFor="recommends" className="font-medium">I would recommend working here to a friend</Label>
        </div>

        <div className="bg-yellow-50 text-yellow-800 p-4 rounded-md text-sm">
          <strong>Note:</strong> Your review is anonymous. We will never display your name with an employee review.
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit Employee Review"}
        </Button>
      </form>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <Link href={`/hospital/${id}`}>
          <a className="text-sm text-muted-foreground hover:text-primary mb-4 block">
            &larr; Back to {hospital.name}
          </a>
        </Link>
        
        <Card className="shadow-lg border-slate-200">
          <CardHeader>
            <CardTitle className="font-serif text-2xl">
              Write a {type === 'patient' ? 'Patient' : 'Employee'} Review
            </CardTitle>
            <CardDescription>
              For <strong>{hospital.name}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {type === 'patient' ? <PatientForm /> : <EmployeeForm />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
