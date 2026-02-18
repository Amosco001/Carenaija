import { useState, useMemo } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/lib/auth";
import { useHospital } from "@/hooks/useHospital";
import { getHospitalUrl } from "@shared/schema";
import { useHospitals, useCreatePatientReview, useCreateEmployeeReview } from "@/hooks/useHospitals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StarRating } from "@/components/star-rating";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { 
  ChevronLeft, Star, Upload, X, Check, Building2, Calendar, 
  Camera, Loader2, CheckCircle2, AlertCircle, ThumbsUp, ThumbsDown,
  Stethoscope, Clock, Sparkles, Users, Building, ChevronsUpDown, Briefcase
} from "lucide-react";
import { cn } from "@/lib/utils";

const SPECIALTIES = [
  "General Medicine",
  "Emergency",
  "Cardiology",
  "Orthopedics",
  "Pediatrics",
  "Maternity/Obstetrics",
  "Surgery",
  "Neurology",
  "Ophthalmology",
  "Dental",
  "Radiology",
  "Laboratory",
  "Pharmacy",
  "Other",
];

const patientReviewSchema = z.object({
  hospitalId: z.number().min(1, "Please select a hospital"),
  reviewerName: z.string().min(2, "Name is required"),
  reviewerRole: z.enum(["Patient", "Family Member", "Visitor"], {
    required_error: "Please select your role",
  }),
  isAnonymous: z.boolean().default(false),
  title: z.string().min(5, "Title must be at least 5 characters").max(100, "Title cannot exceed 100 characters"),
  reviewText: z.string().min(50, "Review must be at least 50 characters").max(1000, "Review cannot exceed 1000 characters"),
  rating: z.number().min(1, "Overall rating is required").max(5),
  cleanliness: z.number().min(0).max(5).optional(),
  staffAttitude: z.number().min(0).max(5).optional(),
  waitTime: z.string().optional(),
  facilities: z.number().min(0).max(5).optional(),
  visitDate: z.string().optional(),
  specialty: z.string().optional(),
  verifiedVisit: z.boolean().default(false),
  wouldRecommend: z.boolean(),
});

const employeeReviewSchema = z.object({
  hospitalId: z.number().min(1, "Please select a hospital"),
  reviewerName: z.string().min(2, "Name is required"),
  isAnonymous: z.boolean().default(false),
  position: z.string().min(2, "Job title is required"),
  employmentStatus: z.enum(["Current", "Former"]),
  title: z.string().min(5, "Title must be at least 5 characters").max(100),
  reviewText: z.string().min(50, "Review must be at least 50 characters").max(1000),
  rating: z.number().min(1, "Overall rating is required").max(5),
  workLifeBalance: z.number().min(0).max(5).optional(),
  compensation: z.number().min(0).max(5).optional(),
  management: z.number().min(0).max(5).optional(),
  careerGrowth: z.number().min(0).max(5).optional(),
  pros: z.string().min(10, "Please list at least one pro"),
  cons: z.string().min(10, "Please list at least one con"),
  wouldRecommend: z.boolean(),
});

type PatientFormData = z.infer<typeof patientReviewSchema>;
type EmployeeFormData = z.infer<typeof employeeReviewSchema>;

export default function WriteReview() {
  const { type, id } = useParams<{ type: "patient" | "employee"; id: string }>();
  const hospitalId = id ? parseInt(id) : 0;
  const { data: hospital } = useHospital(id || "");
  const { data: allHospitals = [] } = useHospitals();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [step, setStep] = useState(1);
  const [showPreview, setShowPreview] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [hospitalOpen, setHospitalOpen] = useState(false);
  const [selectedHospitalId, setSelectedHospitalId] = useState(hospitalId);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const createPatientReview = useCreatePatientReview(selectedHospitalId);
  const createEmployeeReview = useCreateEmployeeReview(selectedHospitalId);

  const selectedHospital = useMemo(() => 
    allHospitals.find(h => h.id === selectedHospitalId) || hospital,
    [allHospitals, selectedHospitalId, hospital]
  );

  const totalSteps = type === "patient" ? 4 : 3;
  const progress = (step / totalSteps) * 100;

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Please Log In</h2>
            <p className="text-slate-600 mb-4">You need to be logged in to write a review.</p>
            <Link href="/login">
              <Button className="bg-emerald-600 hover:bg-emerald-700">Go to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Review Submitted!</h2>
            <p className="text-slate-600 mb-6">
              Thank you for sharing your experience. Your review helps others make informed healthcare decisions.
            </p>
            <div className="space-y-3">
              <Link href={selectedHospital ? getHospitalUrl(selectedHospital) : `/hospital/${selectedHospitalId}`}>
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700" data-testid="button-view-review">
                  View Your Review
                </Button>
              </Link>
              <Link href="/search">
                <Button variant="outline" className="w-full">
                  Find More Hospitals
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const PatientForm = () => {
    const form = useForm<PatientFormData>({
      resolver: zodResolver(patientReviewSchema),
      defaultValues: {
        hospitalId: selectedHospitalId,
        reviewerName: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.email?.split("@")[0] || "",
        reviewerRole: "Patient",
        isAnonymous: false,
        rating: 0,
        cleanliness: 0,
        staffAttitude: 0,
        facilities: 0,
        verifiedVisit: false,
        wouldRecommend: true,
        title: "",
        reviewText: "",
      },
      mode: "onChange",
    });

    const watchedValues = form.watch();
    const reviewTextLength = watchedValues.reviewText?.length || 0;

    const onSubmit = async (data: PatientFormData) => {
      try {
        await createPatientReview.mutateAsync({
          ...data,
          hospitalId: selectedHospitalId,
        });
        setSubmitSuccess(true);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to submit review. Please try again.",
          variant: "destructive",
        });
      }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;
      
      const newImages: string[] = [];
      Array.from(files).slice(0, 5 - uploadedImages.length).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            setUploadedImages(prev => [...prev, e.target!.result as string].slice(0, 5));
          }
        };
        reader.readAsDataURL(file);
      });
    };

    const removeImage = (index: number) => {
      setUploadedImages(prev => prev.filter((_, i) => i !== index));
    };

    const canProceed = () => {
      switch (step) {
        case 1:
          return selectedHospitalId > 0 && watchedValues.reviewerRole;
        case 2:
          return watchedValues.rating >= 1;
        case 3:
          return watchedValues.title?.length >= 5 && reviewTextLength >= 50;
        case 4:
          return true;
        default:
          return false;
      }
    };

    const renderStep = () => {
      switch (step) {
        case 1:
          return (
            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-base font-semibold">Select Hospital</Label>
                <Popover open={hospitalOpen} onOpenChange={setHospitalOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={hospitalOpen}
                      className="w-full justify-between h-12"
                      data-testid="select-hospital"
                    >
                      {selectedHospital ? (
                        <span className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-emerald-600" />
                          {selectedHospital.name}
                        </span>
                      ) : (
                        "Search for a hospital..."
                      )}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search hospitals..." />
                      <CommandList>
                        <CommandEmpty>No hospital found.</CommandEmpty>
                        <CommandGroup>
                          {allHospitals.slice(0, 50).map((h) => (
                            <CommandItem
                              key={h.id}
                              value={h.name}
                              onSelect={() => {
                                setSelectedHospitalId(h.id);
                                form.setValue("hospitalId", h.id);
                                setHospitalOpen(false);
                              }}
                            >
                              <Check
                                className={cn("mr-2 h-4 w-4", selectedHospitalId === h.id ? "opacity-100" : "opacity-0")}
                              />
                              <div>
                                <div className="font-medium">{h.name}</div>
                                <div className="text-xs text-slate-500">{h.lga}, {h.state}</div>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {form.formState.errors.hospitalId && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {form.formState.errors.hospitalId.message}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Your Name</Label>
                  <div className="flex items-center gap-2">
                    <Controller
                      control={form.control}
                      name="isAnonymous"
                      render={({ field }) => (
                        <Switch
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked);
                            if (checked) {
                              form.setValue("reviewerName", "Anonymous");
                            } else {
                              form.setValue("reviewerName", user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.email?.split("@")[0] || "");
                            }
                          }}
                          data-testid="switch-anonymous"
                        />
                      )}
                    />
                    <Label className="text-sm text-slate-600 cursor-pointer">Post anonymously</Label>
                  </div>
                </div>
                {!watchedValues.isAnonymous ? (
                  <Input
                    placeholder="Enter your name"
                    {...form.register("reviewerName")}
                    data-testid="input-name"
                  />
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-slate-100 rounded-lg text-slate-500 text-sm">
                    <Users className="w-4 h-4" />
                    Your review will be posted as "Anonymous"
                  </div>
                )}
                {form.formState.errors.reviewerName && (
                  <p className="text-xs text-red-500">{form.formState.errors.reviewerName.message}</p>
                )}
              </div>

              <div className="space-y-3">
                <Label className="text-base font-semibold">I am writing this review as a:</Label>
                <Controller
                  control={form.control}
                  name="reviewerRole"
                  render={({ field }) => (
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid grid-cols-1 gap-3"
                    >
                      {[
                        { value: "Patient", label: "Patient", desc: "I received care here" },
                        { value: "Family Member", label: "Family Member", desc: "I accompanied a patient" },
                        { value: "Visitor", label: "Visitor", desc: "I visited someone" },
                      ].map(role => (
                        <label
                          key={role.value}
                          className={cn(
                            "flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all",
                            field.value === role.value ? "border-emerald-500 bg-emerald-50" : "border-slate-200 hover:border-slate-300"
                          )}
                        >
                          <RadioGroupItem value={role.value} id={`role-${role.value}`} />
                          <div>
                            <div className="font-medium">{role.label}</div>
                            <div className="text-sm text-slate-500">{role.desc}</div>
                          </div>
                        </label>
                      ))}
                    </RadioGroup>
                  )}
                />
              </div>
            </div>
          );

        case 2:
          return (
            <div className="space-y-6">
              <div className="space-y-4">
                <Label className="text-base font-semibold">Overall Rating *</Label>
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
                  <Controller
                    control={form.control}
                    name="rating"
                    render={({ field }) => (
                      <StarRating
                        rating={field.value}
                        readonly={false}
                        onChange={field.onChange}
                        size={40}
                      />
                    )}
                  />
                  <span className="text-2xl font-bold text-slate-900">
                    {watchedValues.rating > 0 ? watchedValues.rating.toFixed(0) : "-"}/5
                  </span>
                </div>
                {form.formState.errors.rating && (
                  <p className="text-xs text-red-500">{form.formState.errors.rating.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { name: "cleanliness" as const, label: "Cleanliness", icon: Sparkles },
                  { name: "staffAttitude" as const, label: "Staff Friendliness", icon: Users },
                  { name: "facilities" as const, label: "Facilities", icon: Building },
                ].map(category => (
                  <div key={category.name} className="space-y-2 p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <category.icon className="w-4 h-4" />
                      {category.label}
                    </div>
                    <Controller
                      control={form.control}
                      name={category.name}
                      render={({ field }) => (
                        <StarRating
                          rating={field.value || 0}
                          readonly={false}
                          onChange={field.onChange}
                          size={24}
                        />
                      )}
                    />
                  </div>
                ))}
                <div className="space-y-2 p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <Clock className="w-4 h-4" />
                    Wait Time
                  </div>
                  <Select onValueChange={(v) => form.setValue("waitTime", v)}>
                    <SelectTrigger data-testid="select-wait-time">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Less than 15 min">Less than 15 min</SelectItem>
                      <SelectItem value="15-30 min">15-30 min</SelectItem>
                      <SelectItem value="30-60 min">30-60 min</SelectItem>
                      <SelectItem value="1-2 hours">1-2 hours</SelectItem>
                      <SelectItem value="More than 2 hours">More than 2 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          );

        case 3:
          return (
            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-base font-semibold">Review Title *</Label>
                <Input
                  placeholder="Summarize your experience in a few words"
                  maxLength={100}
                  {...form.register("title")}
                  data-testid="input-title"
                />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>{form.formState.errors.title?.message || "A catchy title helps others find your review"}</span>
                  <span className={watchedValues.title?.length > 90 ? "text-amber-500" : ""}>
                    {watchedValues.title?.length || 0}/100
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-base font-semibold">Your Review *</Label>
                <Textarea
                  placeholder="Share the details of your experience. What was good? What could be improved?"
                  className="min-h-[180px]"
                  maxLength={1000}
                  {...form.register("reviewText")}
                  data-testid="textarea-review"
                />
                <div className="flex justify-between text-xs">
                  <span className={reviewTextLength < 50 ? "text-red-500" : "text-slate-500"}>
                    {reviewTextLength < 50 ? `${50 - reviewTextLength} more characters needed` : "Great! Your review is detailed enough"}
                  </span>
                  <span className={reviewTextLength > 900 ? "text-amber-500" : "text-slate-500"}>
                    {reviewTextLength}/1000
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Visit Date (Optional)</Label>
                  <Input
                    type="date"
                    max={new Date().toISOString().split("T")[0]}
                    {...form.register("visitDate")}
                    data-testid="input-visit-date"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Department/Specialty</Label>
                  <Select onValueChange={(v) => form.setValue("specialty", v)}>
                    <SelectTrigger data-testid="select-specialty">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {SPECIALTIES.map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          );

        case 4:
          return (
            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-base font-semibold">Upload Photos (Optional)</Label>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-emerald-400 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                    id="photo-upload"
                    disabled={uploadedImages.length >= 5}
                  />
                  <label htmlFor="photo-upload" className="cursor-pointer">
                    <Camera className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-600">Click to upload photos</p>
                    <p className="text-xs text-slate-400 mt-1">Max 5 images, JPG or PNG</p>
                  </label>
                </div>
                {uploadedImages.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {uploadedImages.map((img, i) => (
                      <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden group">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                        >
                          <X className="w-5 h-5 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
                  <Controller
                    control={form.control}
                    name="verifiedVisit"
                    render={({ field }) => (
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        id="verified-visit"
                        data-testid="checkbox-verified"
                      />
                    )}
                  />
                  <label htmlFor="verified-visit" className="cursor-pointer">
                    <div className="font-medium text-slate-900">I confirm this is a genuine visit</div>
                    <div className="text-sm text-slate-500">I actually visited this hospital and my review is based on real experience</div>
                  </label>
                </div>

                <div className="p-4 bg-slate-50 rounded-lg">
                  <Label className="text-base font-semibold mb-4 block">Would you recommend this hospital?</Label>
                  <Controller
                    control={form.control}
                    name="wouldRecommend"
                    render={({ field }) => (
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => field.onChange(true)}
                          className={cn(
                            "flex-1 flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all",
                            field.value === true ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 hover:border-slate-300"
                          )}
                          data-testid="button-recommend-yes"
                        >
                          <ThumbsUp className="w-5 h-5" />
                          <span className="font-medium">Yes</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => field.onChange(false)}
                          className={cn(
                            "flex-1 flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all",
                            field.value === false ? "border-red-500 bg-red-50 text-red-700" : "border-slate-200 hover:border-slate-300"
                          )}
                          data-testid="button-recommend-no"
                        >
                          <ThumbsDown className="w-5 h-5" />
                          <span className="font-medium">No</span>
                        </button>
                      </div>
                    )}
                  />
                </div>
              </div>
            </div>
          );
      }
    };

    const renderPreview = () => (
      <div className="space-y-6">
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <h3 className="font-semibold text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" /> Review Preview
          </h3>
          <p className="text-sm text-emerald-700 mt-1">Review your submission before posting</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <span className="font-semibold text-emerald-700">
                  {watchedValues.reviewerName?.charAt(0).toUpperCase() || "A"}
                </span>
              </div>
              <div className="flex-1">
                <div className="font-semibold">{watchedValues.reviewerName || "Anonymous"}</div>
                <div className="text-sm text-slate-500">{watchedValues.reviewerRole}</div>
              </div>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star key={i} className={cn("w-5 h-5", i < watchedValues.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300")} />
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-lg">{watchedValues.title || "No title"}</h4>
              <p className="text-slate-600 mt-2">{watchedValues.reviewText || "No review text"}</p>
            </div>

            {uploadedImages.length > 0 && (
              <div className="flex gap-2">
                {uploadedImages.map((img, i) => (
                  <img key={i} src={img} alt="" className="w-16 h-16 rounded object-cover" />
                ))}
              </div>
            )}

            <div className="flex items-center gap-4 text-sm text-slate-500 pt-2 border-t">
              <span className="flex items-center gap-1">
                <Building2 className="w-4 h-4" />
                {selectedHospital?.name}
              </span>
              {watchedValues.visitDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(watchedValues.visitDate).toLocaleDateString()}
                </span>
              )}
              {watchedValues.wouldRecommend ? (
                <span className="text-emerald-600 flex items-center gap-1">
                  <ThumbsUp className="w-4 h-4" /> Recommends
                </span>
              ) : (
                <span className="text-red-600 flex items-center gap-1">
                  <ThumbsDown className="w-4 h-4" /> Doesn't recommend
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );

    return (
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {showPreview ? renderPreview() : renderStep()}

        <div className="flex gap-3 mt-8">
          {step > 1 && !showPreview && (
            <Button type="button" variant="outline" onClick={() => setStep(s => s - 1)} className="flex-1">
              Back
            </Button>
          )}
          {showPreview && (
            <Button type="button" variant="outline" onClick={() => setShowPreview(false)} className="flex-1">
              Edit Review
            </Button>
          )}
          
          {!showPreview && step < totalSteps && (
            <Button
              type="button"
              onClick={() => setStep(s => s + 1)}
              disabled={!canProceed()}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              data-testid="button-next"
            >
              Continue
            </Button>
          )}
          
          {!showPreview && step === totalSteps && (
            <Button
              type="button"
              onClick={() => setShowPreview(true)}
              disabled={!canProceed()}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              data-testid="button-preview"
            >
              Preview Review
            </Button>
          )}

          {showPreview && (
            <Button
              type="submit"
              disabled={createPatientReview.isPending}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              data-testid="button-submit"
            >
              {createPatientReview.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Review"
              )}
            </Button>
          )}
        </div>
      </form>
    );
  };

  const EmployeeForm = () => {
    const form = useForm<EmployeeFormData>({
      resolver: zodResolver(employeeReviewSchema),
      defaultValues: {
        hospitalId: selectedHospitalId,
        reviewerName: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.email?.split("@")[0] || "",
        isAnonymous: true,
        employmentStatus: "Current",
        rating: 0,
        workLifeBalance: 0,
        compensation: 0,
        management: 0,
        careerGrowth: 0,
        wouldRecommend: true,
        title: "",
        reviewText: "",
        pros: "",
        cons: "",
        position: "",
      },
      mode: "onChange",
    });

    const watchedValues = form.watch();

    const onSubmit = async (data: EmployeeFormData) => {
      try {
        await createEmployeeReview.mutateAsync({
          ...data,
          hospitalId: selectedHospitalId,
        });
        setSubmitSuccess(true);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to submit review. Please try again.",
          variant: "destructive",
        });
      }
    };

    return (
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">Your Name</Label>
            <div className="flex items-center gap-2">
              <Controller
                control={form.control}
                name="isAnonymous"
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={(checked) => {
                      field.onChange(checked);
                      if (checked) {
                        form.setValue("reviewerName", "Anonymous");
                      } else {
                        form.setValue("reviewerName", user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.email?.split("@")[0] || "");
                      }
                    }}
                    data-testid="switch-anonymous-employee"
                  />
                )}
              />
              <Label className="text-sm text-slate-600 cursor-pointer">Post anonymously</Label>
            </div>
          </div>
          {!watchedValues.isAnonymous ? (
            <Input
              placeholder="Enter your name"
              {...form.register("reviewerName")}
              data-testid="input-name-employee"
            />
          ) : (
            <div className="flex items-center gap-2 p-3 bg-slate-100 rounded-lg text-slate-500 text-sm">
              <Users className="w-4 h-4" />
              Your review will be posted as "Anonymous"
            </div>
          )}
        </div>

        <div className="grid gap-4">
          <div className="space-y-2">
            <Label>Job Title *</Label>
            <Input placeholder="e.g. Nurse, Doctor, Registrar" {...form.register("position")} />
            {form.formState.errors.position && (
              <p className="text-xs text-red-500">{form.formState.errors.position.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Employment Status</Label>
            <Controller
              control={form.control}
              name="employmentStatus"
              render={({ field }) => (
                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <RadioGroupItem value="Current" />
                    Current Employee
                  </label>
                  <label className="flex items-center gap-2">
                    <RadioGroupItem value="Former" />
                    Former Employee
                  </label>
                </RadioGroup>
              )}
            />
          </div>
        </div>

        <div className="space-y-4">
          <Label className="text-base font-semibold">Overall Rating *</Label>
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
            <Controller
              control={form.control}
              name="rating"
              render={({ field }) => (
                <StarRating rating={field.value} readonly={false} onChange={field.onChange} size={36} />
              )}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Review Title *</Label>
          <Input placeholder="Sum up your experience" maxLength={100} {...form.register("title")} />
        </div>

        <div className="space-y-2">
          <Label>Your Review *</Label>
          <Textarea placeholder="Describe your experience working here..." className="min-h-[120px]" {...form.register("reviewText")} />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Pros *</Label>
            <Textarea placeholder="What's great about working here?" {...form.register("pros")} />
          </div>
          <div className="space-y-2">
            <Label>Cons *</Label>
            <Textarea placeholder="What could be improved?" {...form.register("cons")} />
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
          <Controller
            control={form.control}
            name="wouldRecommend"
            render={({ field }) => (
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            )}
          />
          <Label>I would recommend working here to a friend</Label>
        </div>

        <Button type="submit" className="w-full h-12 bg-emerald-600 hover:bg-emerald-700" disabled={createEmployeeReview.isPending}>
          {createEmployeeReview.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit Employee Review"
          )}
        </Button>
      </form>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8" data-testid="page-write-review">
      <div className="container mx-auto px-4 max-w-2xl">
        <Link href={selectedHospital ? getHospitalUrl(selectedHospital) : "/search"}>
          <span className="text-sm text-slate-500 hover:text-emerald-600 flex items-center gap-1 mb-4">
            <ChevronLeft className="w-4 h-4" />
            {selectedHospital ? `Back to ${selectedHospital.name}` : "Back to search"}
          </span>
        </Link>

        <Card className="shadow-lg border-slate-200">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3 mb-2">
              {type === "patient" ? (
                <Stethoscope className="w-6 h-6 text-emerald-600" />
              ) : (
                <Briefcase className="w-6 h-6 text-emerald-600" />
              )}
              <CardTitle className="text-xl">
                Write a {type === "patient" ? "Patient" : "Employee"} Review
              </CardTitle>
            </div>
            {selectedHospital && (
              <CardDescription className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                {selectedHospital.name}
              </CardDescription>
            )}
          </CardHeader>

          {type === "patient" && !showPreview && (
            <div className="px-6 pb-4">
              <div className="flex items-center gap-2 mb-2">
                {[1, 2, 3, 4].map(s => (
                  <div
                    key={s}
                    className={cn(
                      "flex-1 h-2 rounded-full transition-colors",
                      s <= step ? "bg-emerald-500" : "bg-slate-200"
                    )}
                  />
                ))}
              </div>
              <p className="text-xs text-slate-500">
                Step {step} of {totalSteps}: {
                  step === 1 ? "Basic Info" :
                  step === 2 ? "Ratings" :
                  step === 3 ? "Your Review" :
                  "Final Details"
                }
              </p>
            </div>
          )}

          <CardContent>
            {type === "patient" ? <PatientForm /> : <EmployeeForm />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
