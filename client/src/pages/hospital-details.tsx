import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "wouter";
import { useHospital, useHospitalBySlug } from "@/hooks/useHospital";
import { useHospitals, usePatientReviews, useHospitalComments, useCreateHospitalComment, useDeleteHospitalComment } from "@/hooks/useHospitals";
import { getHospitalUrl } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/seo-head";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  MapPin, Phone, Globe, ShieldCheck, Clock, Bed, Stethoscope, Briefcase, 
  Navigation, ExternalLink, Loader2, Star, ChevronRight, Share2, 
  Facebook, Twitter, Linkedin, Mail, Copy, Check, Heart, Thermometer,
  Pill, Microscope, Ambulance, Building2, Users, Calendar, ThumbsUp,
  Home, ChevronLeft, ImageIcon, MessageSquarePlus
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import NotFound from "@/pages/not-found";
import { Breadcrumb } from "@/components/breadcrumb";
import { getHospitalImage, hospitalImages } from "@/lib/hospital-images";
import { SwipeGallery } from "@/components/swipe-gallery";
import { ClickToCall, ClickToCallIcon } from "@/components/click-to-call";
import { ReportReviewModal } from "@/components/report-review-modal";
import { ProfileStrength } from "@/components/profile-strength";
import { useHospitalPhysicians } from "@/hooks/usePhysicians";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";


const FACILITY_ICONS: Record<string, any> = {
  "Emergency": Ambulance,
  "ICU": Heart,
  "Laboratory": Microscope,
  "Pharmacy": Pill,
  "Radiology": Thermometer,
  "default": Building2,
};

export default function HospitalDetails() {
  const params = useParams();
  const slug = params.slug || params.id || "";
  const isSlug = isNaN(parseInt(slug));
  const { data: hospitalBySlug, isLoading: slugLoading, error: slugError } = useHospitalBySlug(isSlug ? slug : "");
  const { data: hospitalById, isLoading: idLoading, error: idError } = useHospital(!isSlug ? slug : "");
  const hospital = isSlug ? hospitalBySlug : hospitalById;
  const isLoading = isSlug ? slugLoading : idLoading;
  const error = isSlug ? slugError : idError;
  const hospitalId = hospital?.id || 0;
  const { data: allHospitals = [] } = useHospitals();
  const { data: patientReviews = [], isLoading: reviewsLoading } = usePatientReviews(hospitalId);
  const { data: comments = [], isLoading: commentsLoading } = useHospitalComments(hospitalId);
  const { data: hospitalPhysicians = [] } = useHospitalPhysicians(hospitalId);
  const createComment = useCreateHospitalComment(hospitalId);
  const deleteComment = useDeleteHospitalComment(hospitalId);
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [reviewSort, setReviewSort] = useState("recent");
  const [selectedImage, setSelectedImage] = useState(0);
  const [copied, setCopied] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentAnonymous, setCommentAnonymous] = useState(false);
  const [commentRecommends, setCommentRecommends] = useState<boolean | null>(null);

  useEffect(() => {
    if (hospital) {
      document.title = `${hospital.name} - CareNaija`;
    }
  }, [hospital]);

  const sortedReviews = useMemo(() => {
    const reviews = [...patientReviews];
    switch (reviewSort) {
      case "helpful":
        return reviews.sort((a, b) => (b.helpfulCount || 0) - (a.helpfulCount || 0));
      case "highest":
        return reviews.sort((a, b) => b.rating - a.rating);
      case "lowest":
        return reviews.sort((a, b) => a.rating - b.rating);
      case "recent":
      default:
        return reviews.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    }
  }, [patientReviews, reviewSort]);

  const relatedHospitals = useMemo(() => {
    if (!hospital) return [];
    return allHospitals
      .filter(h => h.id !== hospital.id && h.state === hospital.state)
      .slice(0, 4);
  }, [allHospitals, hospital]);

  const ratingBreakdown = useMemo(() => {
    if (patientReviews.length === 0) return null;
    const breakdown = {
      cleanliness: 0,
      staffAttitude: 0,
      facilities: 0,
      waitTime: 0,
      overall: 0,
    };
    let count = { cleanliness: 0, staffAttitude: 0, facilities: 0 };
    
    patientReviews.forEach(r => {
      breakdown.overall += r.rating;
      if (r.cleanliness) { breakdown.cleanliness += r.cleanliness; count.cleanliness++; }
      if (r.staffAttitude) { breakdown.staffAttitude += r.staffAttitude; count.staffAttitude++; }
      if (r.facilities) { breakdown.facilities += r.facilities; count.facilities++; }
    });
    
    return {
      overall: breakdown.overall / patientReviews.length,
      cleanliness: count.cleanliness ? breakdown.cleanliness / count.cleanliness : 0,
      staffAttitude: count.staffAttitude ? breakdown.staffAttitude / count.staffAttitude : 0,
      facilities: count.facilities ? breakdown.facilities / count.facilities : 0,
    };
  }, [patientReviews]);

  const getRatingStars = (rating: number, size = "w-5 h-5") => (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className={`${size} ${i < Math.round(rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`} />
      ))}
    </div>
  );

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const text = `Check out ${hospital?.name} on CareNaija`;
    
    const urls: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`,
      email: `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(url)}`,
    };
    
    if (platform === "copy") {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      window.open(urls[platform], "_blank", "width=600,height=400");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (error || !hospital) return <NotFound />;

  const googleMapsUrl = hospital.latitude && hospital.longitude
    ? `https://www.google.com/maps?q=${hospital.latitude},${hospital.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hospital.name + ", " + hospital.address)}`;

  const googleMapsEmbedUrl = hospital.latitude && hospital.longitude
    ? `https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d3000!2d${hospital.longitude}!3d${hospital.latitude}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2sng!4v1`
    : null;

  const primaryImage = getHospitalImage(hospital);
  const galleryImages = [
    primaryImage,
    hospitalImages[(hospitalId + 1) % hospitalImages.length],
    hospitalImages[(hospitalId + 2) % hospitalImages.length],
  ];

  const canonicalUrl = `https://www.carenaija.com${getHospitalUrl(hospital)}`;
  
  const schemaData = {
    "@context": "https://schema.org",
    "@type": ["Hospital", "MedicalOrganization"],
    "@id": canonicalUrl,
    "name": hospital.name,
    "description": `${hospital.name} is a ${hospital.ownership.toLowerCase()} healthcare facility in ${hospital.lga}, ${hospital.state}, Nigeria offering ${hospital.services.slice(0, 3).join(", ")} services.`,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": hospital.address,
      "addressLocality": hospital.lga,
      "addressRegion": hospital.state,
      "addressCountry": "NG"
    },
    "url": canonicalUrl,
    ...(hospital.phone && { "telephone": hospital.phone }),
    ...(hospital.email && { "email": hospital.email }),
    ...(hospital.website && { "sameAs": [hospital.website] }),
    ...(hospital.latitude && hospital.longitude && {
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": hospital.latitude,
        "longitude": hospital.longitude
      }
    }),
    "openingHours": hospital.operatingHours === "24/7" ? "Mo-Su 00:00-24:00" : undefined,
    "medicalSpecialty": hospital.services,
    "numberOfBeds": hospital.bedCapacity || undefined,
    "isAcceptingNewPatients": true,
    ...(((hospital.totalReviews || 0) > 0 || patientReviews.length > 0) && {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": (hospital.averageRating || ratingBreakdown?.overall || 0).toFixed(1),
        "bestRating": "5",
        "worstRating": "1",
        "ratingCount": hospital.totalReviews || patientReviews.length,
        "reviewCount": patientReviews.length
      }
    }),
    "priceRange": hospital.ownership === "Government" ? "$" : "$$"
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.carenaija.com/" },
      { "@type": "ListItem", "position": 2, "name": "Hospitals", "item": "https://www.carenaija.com/search" },
      { "@type": "ListItem", "position": 3, "name": hospital.state, "item": `https://www.carenaija.com/search?location=${encodeURIComponent(hospital.state)}` },
      { "@type": "ListItem", "position": 4, "name": hospital.name, "item": canonicalUrl }
    ]
  };

  const seoDescription = `${hospital.name} in ${hospital.lga}, ${hospital.state}, Nigeria. ${hospital.services.slice(0, 3).join(", ")} services. Read ${patientReviews.length} patient reviews, ratings, operating hours, and contact information.`;

  const hospitalFaqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": `Where is ${hospital.name} located?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `${hospital.name} is located at ${hospital.address} in ${hospital.lga}, ${hospital.state}, Nigeria.${hospital.phone ? ` You can contact them at ${hospital.phone}.` : ""}`
        }
      },
      {
        "@type": "Question",
        "name": `What services does ${hospital.name} offer?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": hospital.services?.length > 0
            ? `${hospital.name} offers ${hospital.services.join(", ")}.`
            : `Contact ${hospital.name} directly for details about their services and specialties.`
        }
      },
      {
        "@type": "Question",
        "name": `What are the operating hours of ${hospital.name}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": hospital.operatingHours
            ? `${hospital.name} operates ${hospital.operatingHours}.`
            : `${hospital.name} operates 24 hours a day, 7 days a week.`
        }
      },
      {
        "@type": "Question",
        "name": `Is ${hospital.name} a private or public hospital?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `${hospital.name} is a ${hospital.ownership?.toLowerCase()} hospital in ${hospital.lga}, ${hospital.state}.`
        }
      },
      {
        "@type": "Question",
        "name": `How do patients rate ${hospital.name}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": (hospital.totalReviews || 0) > 0
            ? `${hospital.name} has received ${hospital.totalReviews} patient reviews with an average rating of ${(hospital.averageRating || 0).toFixed(1)} out of 5 stars on CareNaija.`
            : `${hospital.name} has not yet received patient reviews on CareNaija.`
        }
      },
      {
        "@type": "Question",
        "name": `Does ${hospital.name} accept NHIS or HMO?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": hospital.acceptedHmos && hospital.acceptedHmos.length > 0
            ? `${hospital.name} accepts the following health insurance and HMO plans: ${hospital.acceptedHmos.join(", ")}. Contact the hospital directly to confirm your specific plan coverage.`
            : `Contact ${hospital.name} directly to confirm which HMO and health insurance plans they accept.`
        }
      }
    ]
  };

  return (
    <>
      <SEOHead 
        title={`${hospital.name} - Reviews & Ratings in ${hospital.state}`}
        description={seoDescription}
        keywords={`${hospital.name} reviews, ${hospital.name} ratings, hospital ${hospital.state}, ${hospital.services.slice(0, 3).join(", ")}, hospital reviews Nigeria, ${hospital.lga} hospitals`}
        canonicalUrl={canonicalUrl}
        ogType="place"
        ogImage={galleryImages[0]}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(hospitalFaqSchema) }}
      />
      
      <article className="bg-slate-50 min-h-screen pb-16" itemScope itemType="https://schema.org/Hospital" data-testid="page-hospital-details">
        <Breadcrumb items={[
          { label: "Find Hospitals in Nigeria", href: "/search" },
          { label: `Hospitals in ${hospital.state}`, href: `/hospitals/${hospital.state.toLowerCase().replace(/\s+/g, '-')}` },
          { label: hospital.name },
        ]} />

        {/* Hero Section */}
        <header className="bg-white border-b">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Photo Gallery - Mobile Swipe, Desktop Click */}
              <div className="lg:w-2/5">
                {/* Mobile: Swipe Gallery */}
                <div className="lg:hidden relative">
                  <SwipeGallery 
                    images={galleryImages} 
                    alt={hospital.name}
                    className="aspect-[4/3]"
                  />
                  {hospital.verified && (
                    <div className="absolute top-3 left-3 bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-lg z-10">
                      <ShieldCheck className="w-4 h-4" /> Verified
                    </div>
                  )}
                </div>
                {/* Desktop: Click Gallery */}
                <div className="hidden lg:block relative rounded-xl overflow-hidden aspect-[4/3] bg-slate-100">
                  <img
                    src={galleryImages[selectedImage]}
                    alt={`${hospital.name} - ${hospital.ownership} healthcare facility in ${hospital.lga}, ${hospital.state} Nigeria`}
                    className="w-full h-full object-cover"
                    itemProp="image"
                  />
                  {hospital.verified && (
                    <div className="absolute top-3 left-3 bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-lg">
                      <ShieldCheck className="w-4 h-4" /> Verified
                    </div>
                  )}
                  <div className="absolute bottom-3 left-3 right-3 flex gap-2">
                    {galleryImages.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedImage(i)}
                        className={`w-16 h-12 rounded-lg overflow-hidden border-2 transition-all touch-target ${selectedImage === i ? "border-emerald-500 ring-2 ring-emerald-500/50" : "border-white/50 opacity-80 hover:opacity-100"}`}
                        data-testid={`button-gallery-${i}`}
                      >
                        <img src={img} alt={`${hospital.name} gallery photo ${i + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                    <button className="w-16 h-12 rounded-lg bg-black/50 text-white flex items-center justify-center text-xs font-medium">
                      <ImageIcon className="w-4 h-4 mr-1" /> +3
                    </button>
                  </div>
                </div>
              </div>

              {/* Hospital Info */}
              <div className="lg:w-3/5 flex flex-col">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">{hospital.ownership}</Badge>
                      <span className="text-sm text-slate-500 flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        {hospital.lga}, {hospital.state}
                      </span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-1" itemProp="name" data-testid="text-hospital-name">
                      {hospital.name} Reviews & Ratings
                    </h1>
                    <p className="text-slate-600" itemProp="address">{hospital.address}, {hospital.state} Nigeria</p>
                    {hospital.updatedAt && (
                      <p className="text-xs text-slate-400 mt-2 flex items-center gap-1" data-testid="text-last-updated">
                        <Calendar className="w-3 h-3" />
                        Last updated: {new Date(hospital.updatedAt).toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" })}
                      </p>
                    )}
                  </div>
                  
                  {/* Share Button */}
                  <Dialog open={shareOpen} onOpenChange={setShareOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="icon" className="shrink-0" data-testid="button-share">
                        <Share2 className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Share this hospital</DialogTitle>
                      </DialogHeader>
                      <div className="grid grid-cols-2 gap-3 mt-4">
                        <Button variant="outline" onClick={() => handleShare("facebook")} className="gap-2">
                          <Facebook className="w-4 h-4 text-blue-600" /> Facebook
                        </Button>
                        <Button variant="outline" onClick={() => handleShare("twitter")} className="gap-2">
                          <Twitter className="w-4 h-4 text-sky-500" /> Twitter
                        </Button>
                        <Button variant="outline" onClick={() => handleShare("linkedin")} className="gap-2">
                          <Linkedin className="w-4 h-4 text-blue-700" /> LinkedIn
                        </Button>
                        <Button variant="outline" onClick={() => handleShare("email")} className="gap-2">
                          <Mail className="w-4 h-4 text-slate-600" /> Email
                        </Button>
                        <Button variant="outline" onClick={() => handleShare("copy")} className="gap-2 col-span-2">
                          {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                          {copied ? "Copied!" : "Copy Link"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Rating Summary */}
                <div className="flex items-center gap-4 mb-4 p-4 bg-slate-50 rounded-xl">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-slate-900">{(hospital.averageRating || 0).toFixed(1)}</div>
                    <div className="flex justify-center mt-1">{getRatingStars(hospital.averageRating || 0, "w-4 h-4")}</div>
                    <div className="text-xs text-slate-500 mt-1">{hospital.totalReviews || patientReviews.length} reviews</div>
                  </div>
                  <Separator orientation="vertical" className="h-16" />
                  <div className="flex-1 space-y-2">
                    {[5, 4, 3, 2, 1].map(star => {
                      const count = patientReviews.filter(r => Math.round(r.rating) === star).length;
                      const percent = patientReviews.length ? (count / patientReviews.length) * 100 : 0;
                      return (
                        <div key={star} className="flex items-center gap-2 text-sm">
                          <span className="w-3 text-slate-500">{star}</span>
                          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                          <Progress value={percent} className="h-2 flex-1" />
                          <span className="w-8 text-right text-slate-500 text-xs">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-slate-50 p-3 rounded-lg text-center">
                    <Bed className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                    <div className="font-bold text-slate-900">{hospital.bedCapacity || "N/A"}</div>
                    <div className="text-xs text-slate-500">Beds</div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg text-center">
                    <Clock className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                    <div className="font-bold text-slate-900 text-sm">{hospital.operatingHours || "24/7"}</div>
                    <div className="text-xs text-slate-500">Hours</div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg text-center">
                    <Stethoscope className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                    <div className="font-bold text-slate-900">{hospital.services?.length || 0}</div>
                    <div className="text-xs text-slate-500">Services</div>
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="flex gap-3 mt-auto">
                  <Link href={`/write-review/patient/${hospital.id}`} className="flex-1">
                    <Button className="w-full gap-2 h-12 bg-emerald-600 hover:bg-emerald-700 text-base font-semibold" data-testid="button-write-review">
                      <Star className="w-5 h-5" /> Write a Review
                    </Button>
                  </Link>
                  <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
                    <Button variant="outline" className="w-full gap-2 h-12 text-base" data-testid="button-directions">
                      <Navigation className="w-5 h-5" /> Get Directions
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Review Incentive Banner for low-review hospitals */}
        {(hospital.totalReviews || 0) <= 3 && (
          <div className="container mx-auto px-4 pt-6">
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-xl p-5 text-white flex flex-col sm:flex-row items-center justify-between gap-4" data-testid="review-incentive-banner">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <MessageSquarePlus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">
                    {(hospital.totalReviews || 0) === 0
                      ? "Be the first to review this hospital!"
                      : `Only ${hospital.totalReviews} review${hospital.totalReviews === 1 ? "" : "s"} — help others by adding yours`}
                  </h3>
                  <p className="text-emerald-100 text-sm">
                    Your review helps thousands of Nigerians find quality healthcare. Takes just 2 minutes.
                  </p>
                </div>
              </div>
              <Link href={`/write-review/patient/${hospital.id}`}>
                <Button size="lg" className="bg-white text-emerald-700 hover:bg-emerald-50 font-semibold whitespace-nowrap gap-2" data-testid="button-banner-review">
                  <Star className="w-5 h-5" /> Write a Review
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-[1fr_350px] gap-8">
            {/* Left Column */}
            <div className="space-y-8">
              {/* Rating Breakdown */}
              {ratingBreakdown && (
                <section className="bg-white rounded-xl border p-6">
                  <h2 className="text-xl font-bold text-slate-900 mb-4">Rating Breakdown</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {[
                      { label: "Overall", value: ratingBreakdown.overall, icon: Star },
                      { label: "Cleanliness", value: ratingBreakdown.cleanliness, icon: Thermometer },
                      { label: "Staff Attitude", value: ratingBreakdown.staffAttitude, icon: Users },
                      { label: "Facilities", value: ratingBreakdown.facilities, icon: Building2 },
                    ].map(item => (
                      <div key={item.label} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                        <item.icon className="w-5 h-5 text-emerald-600" />
                        <div className="flex-1">
                          <div className="text-sm text-slate-600">{item.label}</div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{item.value.toFixed(1)}</span>
                            {getRatingStars(item.value, "w-3 h-3")}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Specialties & Services */}
              <section className="bg-white rounded-xl border p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Specialties & Services at {hospital.name}</h2>
                <div className="flex flex-wrap gap-2">
                  {hospital.services?.map((service: string) => (
                    <Link key={service} href={`/search?q=${encodeURIComponent(service)}&location=${encodeURIComponent(hospital.state)}`}>
                      <Badge variant="secondary" className="px-3 py-1.5 text-sm bg-emerald-50 text-emerald-700 hover:bg-emerald-100 cursor-pointer" data-testid={`link-specialty-${service.toLowerCase().replace(/\s+/g, '-')}`}>
                        {service}
                      </Badge>
                    </Link>
                  ))}
                  {(!hospital.services || hospital.services.length === 0) && (
                    <p className="text-slate-500 italic">No services listed yet.</p>
                  )}
                </div>
                {hospital.services?.length > 0 && (
                  <p className="text-sm text-slate-500 mt-3">
                    Click a specialty to find other <Link href={`/search?q=${encodeURIComponent(hospital.services[0])}`} className="text-emerald-600 hover:underline">{hospital.services[0]} hospitals in Nigeria</Link>
                  </p>
                )}
              </section>

              {/* Facilities & Amenities */}
              <section className="bg-white rounded-xl border p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Facilities & Amenities</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {(hospital.facilities?.length ? hospital.facilities : ["Emergency", "Laboratory", "Pharmacy", "Radiology", "ICU"]).map((facility: string) => {
                    const Icon = FACILITY_ICONS[facility] || FACILITY_ICONS.default;
                    return (
                      <div key={facility} className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                        <Icon className="w-5 h-5 text-emerald-600" />
                        <span className="text-sm text-slate-700">{facility}</span>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* About This Hospital */}
              <section className="bg-white rounded-xl border p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">About {hospital.name}</h2>
                <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-3">
                  <p>
                    {hospital.name} is a {hospital.ownership?.toLowerCase()} healthcare facility located at {hospital.address} in {hospital.lga}, {hospital.state}, Nigeria.
                    {hospital.services?.length > 0 && ` The hospital offers a range of medical services including ${hospital.services.slice(0, 5).join(", ")}${hospital.services.length > 5 ? ` and ${hospital.services.length - 5} more specialties` : ""}.`}
                  </p>
                  <p>
                    {hospital.bedCapacity ? `With a capacity of ${hospital.bedCapacity} beds, ${hospital.name}` : hospital.name} serves patients in {hospital.lga} and surrounding areas of {hospital.state}.
                    {hospital.operatingHours ? ` The facility operates ${hospital.operatingHours}.` : " The facility operates 24 hours a day, 7 days a week."}
                    {hospital.verified && " This hospital has been verified by CareNaija to ensure accurate and up-to-date information."}
                  </p>
                  <p>
                    {(hospital.totalReviews || 0) > 0
                      ? `Based on ${hospital.totalReviews} patient reviews, ${hospital.name} has an average rating of ${(hospital.averageRating || 0).toFixed(1)} out of 5 stars. Patients in ${hospital.state} have shared their experiences with care quality, staff attitude, and facilities at this hospital.`
                      : `${hospital.name} is listed on CareNaija to help patients in ${hospital.state} find quality healthcare. Be the first to share your experience by writing a review.`
                    }
                  </p>
                </div>
              </section>

              {/* Hospital FAQs */}
              <section className="bg-white rounded-xl border p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Frequently Asked Questions about {hospital.name}</h2>
                <div className="space-y-4">
                  <details className="group border-b pb-4">
                    <summary className="flex items-center justify-between cursor-pointer font-medium text-slate-900 hover:text-emerald-700">
                      Where is {hospital.name} located?
                      <ChevronRight className="w-4 h-4 transition-transform group-open:rotate-90" />
                    </summary>
                    <p className="mt-2 text-sm text-slate-600">
                      {hospital.name} is located at {hospital.address} in {hospital.lga}, {hospital.state}, Nigeria.
                      {hospital.phone && ` You can contact them at ${hospital.phone}.`}
                    </p>
                  </details>

                  <details className="group border-b pb-4">
                    <summary className="flex items-center justify-between cursor-pointer font-medium text-slate-900 hover:text-emerald-700">
                      What services does {hospital.name} offer?
                      <ChevronRight className="w-4 h-4 transition-transform group-open:rotate-90" />
                    </summary>
                    <p className="mt-2 text-sm text-slate-600">
                      {hospital.services?.length > 0
                        ? `${hospital.name} offers ${hospital.services.join(", ")}. Contact the hospital directly for a complete list of services and specialties.`
                        : `Contact ${hospital.name} directly for details about their services and specialties.`
                      }
                    </p>
                  </details>

                  <details className="group border-b pb-4">
                    <summary className="flex items-center justify-between cursor-pointer font-medium text-slate-900 hover:text-emerald-700">
                      What are the operating hours of {hospital.name}?
                      <ChevronRight className="w-4 h-4 transition-transform group-open:rotate-90" />
                    </summary>
                    <p className="mt-2 text-sm text-slate-600">
                      {hospital.operatingHours
                        ? `${hospital.name} operates ${hospital.operatingHours}.`
                        : `${hospital.name} operates 24 hours a day, 7 days a week. Contact the hospital to confirm current operating hours.`
                      }
                    </p>
                  </details>

                  <details className="group border-b pb-4">
                    <summary className="flex items-center justify-between cursor-pointer font-medium text-slate-900 hover:text-emerald-700">
                      Is {hospital.name} a private or public hospital?
                      <ChevronRight className="w-4 h-4 transition-transform group-open:rotate-90" />
                    </summary>
                    <p className="mt-2 text-sm text-slate-600">
                      {hospital.name} is a {hospital.ownership?.toLowerCase()} hospital in {hospital.lga}, {hospital.state}.
                      {hospital.ownership === "Government" ? " As a public hospital, it typically accepts NHIS and government health insurance schemes." : " As a private hospital, it may accept various HMO plans and private insurance."}
                    </p>
                  </details>

                  <details className="group pb-4">
                    <summary className="flex items-center justify-between cursor-pointer font-medium text-slate-900 hover:text-emerald-700">
                      How do patients rate {hospital.name}?
                      <ChevronRight className="w-4 h-4 transition-transform group-open:rotate-90" />
                    </summary>
                    <p className="mt-2 text-sm text-slate-600">
                      {(hospital.totalReviews || 0) > 0
                        ? `${hospital.name} has received ${hospital.totalReviews} patient reviews with an average rating of ${(hospital.averageRating || 0).toFixed(1)} out of 5 stars on CareNaija. Read detailed reviews from patients who have visited this hospital.`
                        : `${hospital.name} has not yet received patient reviews on CareNaija. Be the first to share your experience and help other patients in ${hospital.state}.`
                      }
                    </p>
                  </details>
                </div>
              </section>

              {/* Map */}
              {googleMapsEmbedUrl && (
                <section className="bg-white rounded-xl border overflow-hidden">
                  <div className="p-6 pb-0">
                    <h2 className="text-xl font-bold text-slate-900 mb-4">Location</h2>
                  </div>
                  <iframe
                    src={googleMapsEmbedUrl}
                    width="100%"
                    height="300"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title={`Map of ${hospital.name}`}
                  />
                  <div className="p-4 flex justify-between items-center bg-slate-50">
                    <span className="text-sm text-slate-600">{hospital.address}</span>
                    <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-emerald-600 hover:underline flex items-center gap-1">
                      Open in Maps <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </section>
              )}

              {/* Reviews Section */}
              <section className="bg-white rounded-xl border p-6">
                <Tabs defaultValue="patients" className="w-full">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <TabsList>
                      <TabsTrigger value="patients" data-testid="tab-patient-reviews">Patient Reviews</TabsTrigger>
                      <TabsTrigger value="employees" data-testid="tab-employee-reviews">Employee Reviews</TabsTrigger>
                    </TabsList>
                    
                    <Select value={reviewSort} onValueChange={setReviewSort}>
                      <SelectTrigger className="w-[160px]" data-testid="select-review-sort">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="recent">Most Recent</SelectItem>
                        <SelectItem value="helpful">Most Helpful</SelectItem>
                        <SelectItem value="highest">Highest Rating</SelectItem>
                        <SelectItem value="lowest">Lowest Rating</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <TabsContent value="patients" className="space-y-4 mt-0">
                    {reviewsLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                      </div>
                    ) : sortedReviews.length > 0 ? (
                      sortedReviews.map(review => (
                        <div key={review.id} className="border-b border-slate-100 pb-4 last:border-0" data-testid={`review-${review.id}`}>
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                              <span className="text-emerald-700 font-semibold">
                                {review.isAnonymous ? "A" : (review.reviewerName?.charAt(0).toUpperCase() || "A")}
                              </span>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-semibold text-slate-900">{review.isAnonymous ? "Anonymous" : (review.reviewerName || "Anonymous")}</span>
                                <span className="text-xs text-slate-500">{review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ""}</span>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                {getRatingStars(review.rating, "w-4 h-4")}
                                {review.verifiedVisit && (
                                  <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-200">
                                    <ShieldCheck className="w-3 h-3 mr-1" /> Verified Visit
                                  </Badge>
                                )}
                              </div>
                              {review.title && <p className="font-medium text-slate-900 mt-2">{review.title}</p>}
                              <p className="text-slate-600 mt-2 text-sm">{review.reviewText}</p>
                              <div className="flex items-center gap-4 mt-3">
                                <button className="text-xs text-slate-500 hover:text-emerald-600 flex items-center gap-1">
                                  <ThumbsUp className="w-3 h-3" /> Helpful ({review.helpfulCount || 0})
                                </button>
                                <ReportReviewModal reviewId={review.id} reviewType="patient" />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-10 bg-gradient-to-br from-emerald-50 to-slate-50 rounded-xl border-2 border-dashed border-emerald-200" data-testid="empty-patient-reviews">
                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <MessageSquarePlus className="w-8 h-8 text-emerald-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Be the First to Review!</h3>
                        <p className="text-slate-600 max-w-md mx-auto mb-2">
                          No one has reviewed {hospital.name} yet. Your experience could help thousands of Nigerians make better healthcare decisions.
                        </p>
                        <p className="text-sm text-emerald-600 font-medium mb-5">It only takes 2 minutes</p>
                        <Link href={`/write-review/patient/${hospital.id}`}>
                          <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-base px-8 h-12 gap-2" data-testid="button-first-patient-review">
                            <Star className="w-5 h-5" /> Write the First Review
                          </Button>
                        </Link>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="employees" className="space-y-6 mt-0">
                    <div className="text-center py-10 bg-gradient-to-br from-blue-50 to-slate-50 rounded-xl border-2 border-dashed border-blue-200" data-testid="empty-employee-reviews">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Briefcase className="w-8 h-8 text-blue-600" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">Work Here? Share Your Experience!</h3>
                      <p className="text-slate-600 max-w-md mx-auto mb-2">
                        Help other healthcare professionals by sharing what it's like to work at {hospital.name}. Your review is anonymous by default.
                      </p>
                      <p className="text-sm text-blue-600 font-medium mb-5">100% anonymous reviews</p>
                      <Link href={`/write-review/employee/${hospital.id}`}>
                        <Button size="lg" variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50 text-base px-8 h-12 gap-2" data-testid="button-first-employee-review">
                          <Briefcase className="w-5 h-5" /> Write Employee Review
                        </Button>
                      </Link>
                    </div>
                  </TabsContent>
                </Tabs>
              </section>

              {/* Physicians at this Hospital */}
              {hospitalPhysicians.length > 0 && (
                <section className="bg-white rounded-xl border p-6" data-testid="section-physicians">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <Stethoscope className="h-5 w-5 text-emerald-600" />
                      Physicians at this Hospital
                    </h2>
                    <Badge variant="secondary">{hospitalPhysicians.length} doctor{hospitalPhysicians.length !== 1 ? 's' : ''}</Badge>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    {hospitalPhysicians.slice(0, 6).map((doc) => (
                      <Link key={doc.id} href={`/physicians/${doc.slug || doc.id}`}>
                        <Card className="hover:shadow-md transition-shadow cursor-pointer" data-testid={`card-hospital-physician-${doc.id}`}>
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                                <Stethoscope className="h-5 w-5 text-emerald-600" />
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-medium text-sm">{doc.title} {doc.fullName}</h4>
                                <p className="text-xs text-emerald-600 font-medium">{doc.specialty}</p>
                                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                  <Badge variant="outline" className="text-[10px] py-0">{doc.role}</Badge>
                                  {doc.yearsOfExperience && <span>{doc.yearsOfExperience}yr exp</span>}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                  {hospitalPhysicians.length > 6 && (
                    <div className="text-center mt-4">
                      <Link href={`/physicians?hospitalId=${hospitalId}`}>
                        <Button variant="outline" size="sm">View all {hospitalPhysicians.length} physicians</Button>
                      </Link>
                    </div>
                  )}
                </section>
              )}

              {/* Quick Comments / Recommendations */}
              <section className="bg-white rounded-xl border p-6" data-testid="section-comments">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-slate-900">Quick Recommendations</h2>
                  <span className="text-sm text-slate-500">{comments.length} comment{comments.length !== 1 ? "s" : ""}</span>
                </div>
                <p className="text-sm text-slate-500 mb-6">Share a quick recommendation or comment about this hospital. No ratings needed.</p>

                {user ? (
                  <div className="border rounded-lg p-4 mb-6 bg-slate-50" data-testid="comment-form">
                    <Textarea
                      placeholder="Share a quick thought about this hospital... (min 10 characters)"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className="mb-3 bg-white"
                      rows={3}
                      data-testid="input-comment-text"
                    />
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-600">Recommend?</span>
                          <div className="flex gap-1">
                            <Button
                              type="button"
                              size="sm"
                              variant={commentRecommends === true ? "default" : "outline"}
                              className={commentRecommends === true ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                              onClick={() => setCommentRecommends(commentRecommends === true ? null : true)}
                              data-testid="button-recommend-yes"
                            >
                              <ThumbsUp className="w-3.5 h-3.5 mr-1" /> Yes
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant={commentRecommends === false ? "default" : "outline"}
                              className={commentRecommends === false ? "bg-red-600 hover:bg-red-700" : ""}
                              onClick={() => setCommentRecommends(commentRecommends === false ? null : false)}
                              data-testid="button-recommend-no"
                            >
                              <ThumbsUp className="w-3.5 h-3.5 mr-1 rotate-180" /> No
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={commentAnonymous}
                            onCheckedChange={setCommentAnonymous}
                            data-testid="switch-comment-anonymous"
                          />
                          <span className="text-sm text-slate-600">Anonymous</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        disabled={commentText.length < 10 || createComment.isPending}
                        onClick={async () => {
                          try {
                            await createComment.mutateAsync({
                              commentText,
                              recommends: commentRecommends ?? undefined,
                              isAnonymous: commentAnonymous,
                            });
                            setCommentText("");
                            setCommentRecommends(null);
                            setCommentAnonymous(false);
                            toast({ title: "Comment posted!" });
                          } catch (error: any) {
                            toast({ title: "Error", description: error.message, variant: "destructive" });
                          }
                        }}
                        data-testid="button-post-comment"
                      >
                        {createComment.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                        Post Comment
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="border rounded-lg p-4 mb-6 bg-slate-50 text-center">
                    <p className="text-sm text-slate-500 mb-2">Sign in to leave a comment</p>
                    <Link href="/login">
                      <Button size="sm" variant="outline" data-testid="button-login-to-comment">Sign In</Button>
                    </Link>
                  </div>
                )}

                {commentsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                  </div>
                ) : comments.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No comments yet. Be the first to share your thoughts!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {comments.map(comment => (
                      <div key={comment.id} className="border-b border-slate-100 pb-4 last:border-0" data-testid={`comment-${comment.id}`}>
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-blue-700 font-semibold text-xs">
                              {comment.isAnonymous ? "A" : comment.displayName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm text-slate-900">
                                {comment.isAnonymous ? "Anonymous" : comment.displayName}
                              </span>
                              {comment.recommends !== null && (
                                <Badge variant="secondary" className={comment.recommends ? "bg-emerald-50 text-emerald-700 text-xs" : "bg-red-50 text-red-700 text-xs"}>
                                  <ThumbsUp className={`w-3 h-3 mr-1 ${comment.recommends ? "" : "rotate-180"}`} />
                                  {comment.recommends ? "Recommends" : "Doesn't recommend"}
                                </Badge>
                              )}
                              <span className="text-xs text-slate-400">
                                {comment.createdAt ? new Date(comment.createdAt).toLocaleDateString() : ""}
                              </span>
                            </div>
                            <p className="text-sm text-slate-700 mt-1">{comment.commentText}</p>
                            {user && comment.userId === user.id && (
                              <button
                                onClick={() => deleteComment.mutate(comment.id)}
                                className="text-xs text-red-500 hover:underline mt-1"
                                data-testid={`button-delete-comment-${comment.id}`}
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Related Hospitals */}
              {relatedHospitals.length > 0 && (
                <section className="bg-white rounded-xl border p-6">
                  <h2 className="text-xl font-bold text-slate-900 mb-2">Similar Hospitals Near {hospital.lga}, {hospital.state}</h2>
                  <p className="text-sm text-slate-500 mb-4">
                    Compare {hospital.name} with other {hospital.ownership?.toLowerCase()} hospitals offering similar services in {hospital.state}, Nigeria
                  </p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {relatedHospitals.map((h, i) => {
                      const sharedServices = h.services?.filter((s: string) => hospital.services?.includes(s)) || [];
                      return (
                        <Link key={h.id} href={getHospitalUrl(h)}>
                          <Card className="hover:shadow-md transition-shadow cursor-pointer group" data-testid={`card-related-${h.id}`}>
                            <CardContent className="p-0">
                              <div className="flex gap-3">
                                <div className="w-24 h-24 overflow-hidden rounded-l-lg flex-shrink-0">
                                  <img src={getHospitalImage(h)} alt={`${h.name} - ${h.ownership} hospital in ${h.lga}, ${h.state}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                </div>
                                <div className="py-3 pr-3 flex-1">
                                  <h3 className="font-semibold text-slate-900 line-clamp-1 group-hover:text-emerald-700">{h.name}</h3>
                                  <p className="text-xs text-slate-500 mt-1">{h.lga}, {h.state}</p>
                                  <div className="flex items-center gap-1 mt-1.5">
                                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                    <span className="text-sm font-medium">{(h.averageRating || 0).toFixed(1)}</span>
                                    <span className="text-xs text-slate-500">({h.totalReviews || 0} reviews)</span>
                                  </div>
                                  {sharedServices.length > 0 && (
                                    <p className="text-xs text-emerald-600 mt-1 line-clamp-1">
                                      Also offers: {sharedServices.slice(0, 2).join(", ")}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      );
                    })}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link href={`/hospitals/${hospital.state.toLowerCase().replace(/\s+/g, '-')}`} className="text-sm text-emerald-600 hover:underline font-medium" data-testid="link-all-state-hospitals">
                      View all hospitals in {hospital.state} →
                    </Link>
                    <Link href={`/search?location=${encodeURIComponent(hospital.state)}&q=${encodeURIComponent(hospital.ownership || '')}`} className="text-sm text-emerald-600 hover:underline font-medium" data-testid="link-ownership-hospitals">
                      Browse {hospital.ownership?.toLowerCase()} hospitals in {hospital.state} →
                    </Link>
                  </div>
                </section>
              )}
            </div>

            {/* Sidebar */}
            <aside className="space-y-6">
              {/* Profile Strength */}
              <ProfileStrength hospital={hospital} />

              {/* Contact Card */}
              <Card className="sticky top-24">
                <CardContent className="p-6">
                  <h3 className="font-bold text-slate-900 mb-4">Contact Information</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 text-sm">
                      <MapPin className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="text-slate-600" itemProp="address">{hospital.address}</span>
                    </div>
                    {hospital.phone && (
                      <div className="flex items-center gap-3 text-sm">
                        <Phone className="w-5 h-5 text-slate-400 shrink-0" />
                        <ClickToCall 
                          phoneNumber={hospital.phone} 
                          variant="ghost" 
                          className="p-0 h-auto text-emerald-600 hover:text-emerald-700 hover:bg-transparent"
                        />
                      </div>
                    )}
                    {hospital.email && (
                      <div className="flex items-center gap-3 text-sm">
                        <Mail className="w-5 h-5 text-slate-400 shrink-0" />
                        <a href={`mailto:${hospital.email}`} className="text-emerald-600 hover:underline" itemProp="email">{hospital.email}</a>
                      </div>
                    )}
                    {hospital.website && (
                      <div className="flex items-center gap-3 text-sm">
                        <Globe className="w-5 h-5 text-slate-400 shrink-0" />
                        <a href={hospital.website} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline truncate" itemProp="url">
                          {hospital.website.replace(/^https?:\/\//, "")}
                        </a>
                      </div>
                    )}
                  </div>

                  <Separator className="my-5" />

                  {/* Operating Hours */}
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4" /> Operating Hours
                    </h4>
                    <div className="text-sm text-slate-600">
                      {hospital.operatingHours || "24 Hours / 7 Days"}
                    </div>
                  </div>

                  <Separator className="my-5" />

                  {/* Insurance Accepted */}
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-3">Insurance / HMO Accepted</h4>
                    {hospital.acceptedHmos && hospital.acceptedHmos.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {hospital.acceptedHmos.map(provider => (
                          <Badge key={provider} variant="outline" className="text-xs" data-testid={`badge-hmo-${provider.toLowerCase().replace(/\s+/g, '-')}`}>{provider}</Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">No HMO information available yet. <Link href="/suggest-hospital" className="text-emerald-600 hover:underline">Help us update this listing</Link></p>
                    )}
                  </div>

                  <Separator className="my-5" />

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <ShieldCheck className={`w-4 h-4 ${hospital.verified ? "text-emerald-600" : "text-slate-400"}`} />
                      <span className={hospital.verified ? "text-emerald-700" : "text-slate-500"}>
                        {hospital.verified ? "Verified Listing" : "Unverified Listing"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 pt-5 border-t">
                    <Link href={`/claim-profile/${hospital.id}`}>
                      <Button variant="ghost" className="w-full text-sm" data-testid="button-claim">
                        Is this your hospital? Claim this profile
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Back Link */}
              <Link href={`/hospitals/${hospital.state.toLowerCase().replace(/\s+/g, '-')}`} className="flex items-center gap-2 text-sm text-slate-500 hover:text-emerald-600" data-testid="link-back-state">
                <ChevronLeft className="w-4 h-4" /> Browse more hospitals in {hospital.state}
              </Link>
            </aside>
          </div>
        </div>

        {/* Mobile Floating Call Button */}
        {hospital.phone && (
          <div className="fixed bottom-6 right-6 lg:hidden z-50">
            <ClickToCallIcon 
              phoneNumber={hospital.phone} 
              className="shadow-lg"
            />
          </div>
        )}
      </article>
    </>
  );
}
