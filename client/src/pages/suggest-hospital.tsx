import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useLocation } from "wouter";
import { Loader2, CheckCircle2 } from "lucide-react";

const suggestSchema = z.object({
  name: z.string().min(3, "Hospital name is required"),
  state: z.string().min(2, "State is required"),
  city: z.string().min(2, "City is required"),
  address: z.string().optional(),
  type: z.enum(["Public", "Private", "Teaching", "Specialist", "Federal"]),
  description: z.string().optional(),
});

export default function SuggestHospital() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [, setLocation] = useLocation();

  const form = useForm<z.infer<typeof suggestSchema>>({
    resolver: zodResolver(suggestSchema),
  });

  const onSubmit = async (data: z.infer<typeof suggestSchema>) => {
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log("Submitted suggestion:", data);
    setIsSubmitting(false);
    setIsSuccess(true);
    toast({
      title: "Suggestion Received",
      description: "Thanks! We'll review your suggestion and add it to our list shortly.",
    });
  };

  if (isSuccess) {
    return (
      <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center text-center">
        <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="text-3xl font-serif font-bold text-slate-900 mb-4">Thank You!</h1>
        <p className="text-slate-600 max-w-md mb-8">
          Your contribution helps us build the most comprehensive healthcare directory in Nigeria. We will verify the details and list the hospital soon.
        </p>
        <div className="flex gap-4">
          <Button onClick={() => setIsSuccess(false)} variant="outline">Suggest Another</Button>
          <Button onClick={() => setLocation("/search")}>Back to Search</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <Link href="/search">
        <a className="text-sm text-muted-foreground hover:text-primary mb-6 block">
          &larr; Back to Search
        </a>
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-2xl">Suggest a Hospital</CardTitle>
          <CardDescription>
            Help us expand our list. If you know a hospital or clinic that isn't listed, please add it here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Hospital Name *</Label>
              <Input id="name" placeholder="e.g. Lagos City Clinic" {...form.register("name")} />
              {form.formState.errors.name && (
                <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Input id="state" placeholder="e.g. Lagos" {...form.register("state")} />
                {form.formState.errors.state && (
                  <p className="text-xs text-red-500">{form.formState.errors.state.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input id="city" placeholder="e.g. Ikeja" {...form.register("city")} />
                {form.formState.errors.city && (
                  <p className="text-xs text-red-500">{form.formState.errors.city.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address (Optional)</Label>
              <Input id="address" placeholder="e.g. 123 Health Way" {...form.register("address")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Hospital Type *</Label>
              <Select onValueChange={(val) => form.setValue("type", val as any)} defaultValue={form.getValues("type")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Public">Public / General</SelectItem>
                  <SelectItem value="Private">Private</SelectItem>
                  <SelectItem value="Teaching">Teaching</SelectItem>
                  <SelectItem value="Specialist">Specialist</SelectItem>
                  <SelectItem value="Federal">Federal</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.type && (
                <p className="text-xs text-red-500">{form.formState.errors.type.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Short Description / Known Specialties</Label>
              <Textarea 
                id="description" 
                placeholder="What is this hospital known for? e.g. Maternity, Orthopedics..." 
                {...form.register("description")} 
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
                </>
              ) : (
                "Submit Suggestion"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
