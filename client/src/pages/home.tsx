import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Star, Stethoscope, Briefcase, Heart, Baby, Bone, Brain, Eye, ShieldCheck, ChevronRight, ChevronLeft, ChevronDown, Loader2, Users, Building2, MessageSquare, Quote, CheckCircle, Award, Lock, Clock, TrendingUp, Flame } from "lucide-react";
import { useLocation } from "wouter";
import { useState, useEffect, useCallback } from "react";
import { useHospitals, useAllPatientReviews, useTrustStats, useTestimonials, useTrendingHospitals } from "@/hooks/useHospitals";
import { getHospitalUrl } from "@shared/schema";
import { Link } from "wouter";
import generatedHeroImage from "@assets/generated_images/modern_nigerian_hospital_exterior_with_friendly_medical_staff_interaction.png";
import { getHospitalImage } from "@/lib/hospital-images";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import useEmblaCarousel from "embla-carousel-react";
import { SEOHead } from "@/components/seo-head";
import { SkeletonHospitalCard } from "@/components/skeleton-card";
import { HospitalCard } from "@/components/hospital-card";
import { formatDistanceToNow } from "date-fns";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { HomeFAB } from "@/components/floating-action-button";
import { EmailSignupBanner } from "@/components/email-signup";

export default function Home() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [locationTerm, setLocationTerm] = useState("");
  const { data: hospitals = [], isLoading } = useHospitals();
  const { data: reviews = [], isLoading: reviewsLoading } = useAllPatientReviews();
  const { data: trustStats } = useTrustStats();
  const { data: testimonials = [] } = useTestimonials();
  const { data: trendingHospitals = [] } = useTrendingHospitals();
  const { items: recentlyViewed } = useRecentlyViewed();

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start" });
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => {
      setCanScrollPrev(emblaApi.canScrollPrev());
      setCanScrollNext(emblaApi.canScrollNext());
    };
    emblaApi.on("select", onSelect);
    onSelect();
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchTerm) params.set("q", searchTerm);
    if (locationTerm) params.set("location", locationTerm);
    setLocation(`/search${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const featuredHospitals = [...hospitals]
    .filter(h => h.verified || (h.bedCapacity && h.bedCapacity > 50))
    .slice(0, 8);

  const recentReviews = [...reviews]
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 6);

  const totalReviews = reviews.length;
  const verifiedHospitals = hospitals.filter(h => h.verified).length;

  const specialties = [
    { name: "Maternity", icon: Baby, color: "text-pink-500", bg: "bg-pink-50", hoverBg: "hover:bg-pink-100" },
    { name: "Cardiology", icon: Heart, color: "text-red-500", bg: "bg-red-50", hoverBg: "hover:bg-red-100" },
    { name: "Orthopedics", icon: Bone, color: "text-slate-600", bg: "bg-slate-100", hoverBg: "hover:bg-slate-200" },
    { name: "Neurology", icon: Brain, color: "text-purple-500", bg: "bg-purple-50", hoverBg: "hover:bg-purple-100" },
    { name: "Eye Care", icon: Eye, color: "text-blue-500", bg: "bg-blue-50", hoverBg: "hover:bg-blue-100" },
    { name: "Pediatrics", icon: Stethoscope, color: "text-emerald-600", bg: "bg-emerald-50", hoverBg: "hover:bg-emerald-100" },
  ];

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`w-4 h-4 ${i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`} 
      />
    ));
  };

  return (
    <div className="flex flex-col min-h-screen bg-white" data-testid="page-home">
      <SEOHead 
        title="Find Best Hospitals & Reviews Nigeria - Lagos, Abuja, All 36 States"
        description="Nigeria's #1 hospital review platform. Find the best hospitals near you with verified patient reviews, HMO/NHIS accepted, ratings, and doctor recommendations. Compare hospitals in Lagos, Abuja, Port Harcourt, Ibadan, Kano, and all 36 Nigerian states."
        keywords="best hospitals in Nigeria, hospital reviews Nigeria, best hospitals in Lagos, hospitals that accept NHIS, hospitals that accept HMO in Lagos, best hospitals in Abuja, Nigerian hospital ratings, Lagos hospitals, Abuja hospitals, healthcare Nigeria, Hygeia HMO hospitals, AXA Mansard hospitals, Leadway Health hospitals, Reliance HMO hospitals, best private hospitals in Nigeria, best government hospitals in Nigeria, hospital near me Nigeria, top rated hospitals Nigeria, maternity hospitals Lagos, pediatric hospitals Nigeria, emergency hospitals near me, cheapest hospitals in Lagos, hospitals in Lekki, hospitals in Ikeja, hospitals in Victoria Island, teaching hospitals in Nigeria, federal medical centre, specialist hospitals Nigeria"
        canonicalUrl="https://www.carenaija.com/"
        structuredData={[
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            "@id": "https://www.carenaija.com/#organization",
            "name": "CareNaija",
            "url": "https://www.carenaija.com",
            "logo": {
              "@type": "ImageObject",
              "url": "https://www.carenaija.com/favicon.png"
            },
            "description": "Nigeria's #1 trusted hospital review platform. Find verified patient reviews, HMO acceptance info, and ratings for hospitals across Lagos, Abuja, and all 36 Nigerian states.",
            "foundingDate": "2025",
            "areaServed": {
              "@type": "Country",
              "name": "Nigeria"
            },
            "knowsAbout": [
              "Hospital Reviews Nigeria",
              "Healthcare Nigeria",
              "NHIS Hospitals",
              "HMO Hospitals Nigeria",
              "Patient Reviews",
              "Medical Facilities Nigeria"
            ],
            "sameAs": []
          },
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "@id": "https://www.carenaija.com/#website",
            "name": "CareNaija",
            "url": "https://www.carenaija.com",
            "description": "Find and compare the best hospitals in Nigeria. Read verified patient reviews, check HMO/NHIS acceptance, and make informed healthcare decisions.",
            "inLanguage": "en-NG",
            "potentialAction": {
              "@type": "SearchAction",
              "target": {
                "@type": "EntryPoint",
                "urlTemplate": "https://www.carenaija.com/search?q={search_term_string}"
              },
              "query-input": "required name=search_term_string"
            }
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "How do I find the best hospital near me in Nigeria?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Use CareNaija's hospital search to find top-rated hospitals near you. You can filter by location, HMO/NHIS acceptance, specialty, ownership (private or government), and patient ratings. Enable location services to see hospitals closest to you with distance information."
                }
              },
              {
                "@type": "Question",
                "name": "Which hospitals in Nigeria accept NHIS?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Most government hospitals and many private hospitals in Nigeria accept NHIS (National Health Insurance Scheme). On CareNaija, you can filter hospitals by HMO/insurance accepted, including NHIS, Hygeia HMO, AXA Mansard, Leadway Health, Reliance HMO, and Total Health Trust."
                }
              },
              {
                "@type": "Question",
                "name": "What are the best hospitals in Lagos?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Lagos has many top-rated hospitals including Lagos University Teaching Hospital (LUTH), Lagos State University Teaching Hospital (LASUTH), Reddington Hospital, Lagoon Hospitals, Eko Hospital, and St. Nicholas Hospital. Check CareNaija for verified patient reviews and ratings for all Lagos hospitals."
                }
              },
              {
                "@type": "Question",
                "name": "How do I find hospitals that accept my HMO in Nigeria?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "On CareNaija, use the Insurance/HMO filter on the search page to find hospitals that accept your specific HMO plan. We list accepted HMOs for each hospital including NHIS, Hygeia HMO, AXA Mansard, Leadway Health, Reliance HMO, Mediplan, Total Health Trust, Avon HMO, and Clearline HMO."
                }
              },
              {
                "@type": "Question",
                "name": "Can I read patient reviews for Nigerian hospitals?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes, CareNaija features verified patient reviews for hospitals across all 36 Nigerian states. Patients rate hospitals on care quality, cleanliness, staff attitude, and facilities. You can also read employee reviews for workplace insights."
                }
              },
              {
                "@type": "Question",
                "name": "What are the best hospitals in Abuja?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Top-rated hospitals in Abuja include National Hospital Abuja, University of Abuja Teaching Hospital (UATH), Cedarcrest Hospitals, Nisa Premier Hospital, and Garki Hospital. Visit CareNaija to compare ratings and read verified patient reviews for all Abuja hospitals."
                }
              }
            ]
          }
        ]}
      />
      {/* Hero Section - Nigerian Green Theme */}
      <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-800 via-emerald-700 to-green-600">
        <div className="absolute inset-0 z-0">
          <img 
            src={generatedHeroImage} 
            alt="Nigerian hospital exterior with modern healthcare facilities in Lagos" 
            className="w-full h-full object-cover opacity-20"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/90 via-emerald-800/85 to-green-700/80" />
        </div>

        <div className="container relative z-10 px-4 mx-auto py-12">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm mb-6 border border-white/20">
              <ShieldCheck className="w-4 h-4" />
              <span>Trusted by thousands of Nigerians</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight" data-testid="text-hero-title">
              Hospital Reviews Nigeria <br/>
              <span className="text-emerald-200">Find the Best Hospitals Near You</span>
            </h1>
            <p className="text-lg md:text-xl text-emerald-100 mb-10 max-w-2xl mx-auto">
              Read verified patient reviews and compare hospital ratings in Lagos, Abuja, Port Harcourt, and across all 36 Nigerian states.
            </p>

            <form onSubmit={handleSearch} className="bg-white p-2 md:p-3 rounded-2xl shadow-2xl flex flex-col md:flex-row gap-2" data-testid="form-hero-search">
              <div className="flex-1 relative group">
                <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                <Input 
                  placeholder="Hospital name, specialty, or condition..." 
                  className="pl-12 border-0 shadow-none focus-visible:ring-0 text-base h-12 bg-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  data-testid="input-search-term"
                />
              </div>
              <div className="w-px bg-slate-200 hidden md:block my-2" />
              <div className="flex-1 relative md:max-w-[220px] group">
                <MapPin className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                <Input 
                  placeholder="City or State" 
                  className="pl-12 border-0 shadow-none focus-visible:ring-0 text-base h-12 bg-transparent"
                  value={locationTerm}
                  onChange={(e) => setLocationTerm(e.target.value)}
                  data-testid="input-location"
                />
              </div>
              <Button type="submit" size="lg" className="h-12 px-8 text-base font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 transition-all" data-testid="button-search">
                Search
              </Button>
            </form>

            <div className="mt-8 flex flex-wrap justify-center gap-2 md:gap-3">
              <span className="text-emerald-200 text-sm font-medium mr-2 self-center">Popular:</span>
              {["Lagos", "Abuja", "Maternity", "Cardiology", "Teaching Hospitals"].map((tag) => (
                <Link key={tag} href={`/search?q=${tag}`} className="bg-white/10 hover:bg-white/20 text-white px-4 py-1.5 rounded-full text-sm backdrop-blur-sm transition-colors border border-white/20" data-testid={`link-popular-${tag.toLowerCase().replace(' ', '-')}`}>
                  {tag}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators with Stats */}
      <section className="py-8 bg-white border-b border-slate-100">
        <div className="container px-4 mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 md:gap-4">
            <div className="text-center" data-testid="stat-hospitals">
              <div className="flex justify-center mb-2">
                <Building2 className="w-8 h-8 text-emerald-600" />
              </div>
              <div className="text-2xl md:text-3xl font-bold text-slate-900">{(trustStats?.totalHospitals || hospitals.length).toLocaleString()}+</div>
              <div className="text-sm text-slate-500">Hospitals Listed</div>
            </div>
            <div className="text-center" data-testid="stat-reviews">
              <div className="flex justify-center mb-2">
                <MessageSquare className="w-8 h-8 text-emerald-600" />
              </div>
              <div className="text-2xl md:text-3xl font-bold text-slate-900">{(trustStats?.totalReviews || totalReviews).toLocaleString()}+</div>
              <div className="text-sm text-slate-500">Patient Reviews</div>
            </div>
            <div className="text-center" data-testid="stat-verified-reviews">
              <div className="flex justify-center mb-2">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <div className="text-2xl md:text-3xl font-bold text-slate-900">{(trustStats?.verifiedReviews || 0).toLocaleString()}</div>
              <div className="text-sm text-slate-500">Verified Reviews</div>
            </div>
            <div className="text-center" data-testid="stat-verified">
              <div className="flex justify-center mb-2">
                <ShieldCheck className="w-8 h-8 text-emerald-600" />
              </div>
              <div className="text-2xl md:text-3xl font-bold text-slate-900">{(trustStats?.verifiedHospitals || verifiedHospitals).toLocaleString()}+</div>
              <div className="text-sm text-slate-500">Verified Hospitals</div>
            </div>
            <div className="text-center" data-testid="stat-users">
              <div className="flex justify-center mb-2">
                <Users className="w-8 h-8 text-emerald-600" />
              </div>
              <div className="text-2xl md:text-3xl font-bold text-slate-900">{(trustStats?.activeUsersMonth || 0).toLocaleString() || "1,000"}+</div>
              <div className="text-sm text-slate-500">Active Users This Month</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Hospitals Carousel */}
      <section className="py-16 bg-slate-50">
        <div className="container px-4 mx-auto">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2" data-testid="text-featured-title">Top Hospitals in Nigeria</h2>
              <p className="text-slate-600">Highest-rated hospitals in Lagos, Abuja, and across Nigeria based on patient reviews</p>
            </div>
            <div className="hidden md:flex gap-2">
              <Button variant="outline" size="icon" onClick={scrollPrev} disabled={!canScrollPrev} className="rounded-full" data-testid="button-carousel-prev">
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button variant="outline" size="icon" onClick={scrollNext} disabled={!canScrollNext} className="rounded-full" data-testid="button-carousel-next">
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex gap-6 overflow-hidden">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex-none w-[85%] sm:w-[45%] lg:w-[30%]">
                  <SkeletonHospitalCard />
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-hidden" ref={emblaRef}>
              <div className="flex gap-6">
                {featuredHospitals.map((hospital, index) => (
                  <div 
                    key={hospital.id}
                    className="flex-none w-[85%] sm:w-[45%] lg:w-[30%]"
                    data-testid={`card-featured-hospital-${hospital.id}`}
                  >
                    <HospitalCard
                      hospital={hospital}
                      imageUrl={getHospitalImage(hospital)}
                      variant="carousel"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="text-center mt-8">
            <Link href="/search">
              <Button variant="outline" className="border-emerald-600 text-emerald-700 hover:bg-emerald-50" data-testid="button-view-all-hospitals">
                View All Hospitals <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Trending Hospitals */}
      {trendingHospitals.length > 0 && (
        <section className="py-16 bg-white">
          <div className="container px-4 mx-auto">
            <div className="flex justify-between items-end mb-8">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Flame className="h-6 w-6 text-orange-500" />
                  <h2 className="text-2xl md:text-3xl font-bold text-slate-900" data-testid="text-trending-title">Trending Hospitals in Nigeria</h2>
                </div>
                <p className="text-slate-600">Hospitals with the most recent review activity from patients across Nigeria</p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {trendingHospitals.slice(0, 6).map((hospital, index) => (
                <Link key={hospital.id} href={getHospitalUrl(hospital)} data-testid={`card-trending-hospital-${hospital.id}`}>
                  <Card className="hover:shadow-md transition-all duration-300 cursor-pointer border-slate-200 hover:border-orange-300 group bg-white h-full">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-100 to-amber-50 flex items-center justify-center flex-shrink-0">
                          <TrendingUp className="h-6 w-6 text-orange-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-slate-800 truncate group-hover:text-orange-700 text-sm">{hospital.name}</h3>
                            {hospital.recentReviewCount > 0 && (
                              <Badge className="bg-orange-100 text-orange-700 text-xs flex-shrink-0 border-0">
                                {hospital.recentReviewCount} new
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                            <MapPin className="w-3 h-3" />
                            <span>{hospital.state}</span>
                            {hospital.averageRating && hospital.averageRating > 0 && (
                              <>
                                <span>·</span>
                                <div className="flex items-center gap-0.5">
                                  <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                  <span>{hospital.averageRating.toFixed(1)}</span>
                                </div>
                              </>
                            )}
                            <span>·</span>
                            <span>{hospital.totalReviews || 0} reviews</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Popular Specialties Grid */}
      <section className="py-16 bg-white">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4" data-testid="text-specialties-title">Find Hospitals by Specialty</h2>
            <p className="text-slate-600">Search for the best maternity, cardiology, orthopaedic, and specialist hospitals in Nigeria</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {specialties.map((spec) => (
              <Link key={spec.name} href={`/specialties/${spec.name.toLowerCase().replace(/\s+/g, '-')}`} data-testid={`card-specialty-${spec.name.toLowerCase()}`}>
                <Card className={`${spec.hoverBg} hover:shadow-md transition-all duration-300 cursor-pointer border-slate-200 hover:border-emerald-300 group bg-white h-full`}>
                  <CardContent className="flex flex-col items-center justify-center p-6 h-full">
                    <div className={`w-14 h-14 rounded-full ${spec.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <spec.icon className={`h-7 w-7 ${spec.color}`} />
                    </div>
                    <span className="font-semibold text-slate-700 group-hover:text-emerald-700">Best {spec.name} Hospitals</span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          <div className="text-center mt-6">
            <Link href="/search" className="text-emerald-600 hover:underline font-medium text-sm" data-testid="link-all-specialties">
              Browse all hospital specialties across Nigeria →
            </Link>
          </div>
        </div>
      </section>

      {/* Browse by City Section */}
      <section className="py-16 bg-slate-50">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4" data-testid="text-city-browse-title">Best Hospitals by City</h2>
            <p className="text-slate-600" data-testid="text-city-browse-description">Find top-rated hospitals in major Nigerian cities</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: "Lagos", slug: "lagos", count: "50+" },
              { name: "Abuja", slug: "abuja", count: "30+" },
              { name: "Port Harcourt", slug: "port-harcourt", count: "20+" },
              { name: "Ibadan", slug: "ibadan", count: "15+" },
              { name: "Kano", slug: "kano", count: "15+" },
              { name: "Enugu", slug: "enugu", count: "10+" },
              { name: "Benin City", slug: "benin-city", count: "10+" },
              { name: "Calabar", slug: "calabar", count: "8+" },
            ].map(city => (
              <Link key={city.slug} href={`/hospitals/${city.slug}`} data-testid={`link-city-${city.slug}`}>
                <Card className="hover:shadow-md transition-all duration-300 cursor-pointer border-slate-200 hover:border-emerald-300 group bg-white h-full">
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-200 transition-colors">
                      <MapPin className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700 group-hover:text-emerald-700 block">Top Hospitals in {city.name}</span>
                      <span className="text-xs text-slate-500">{city.count} hospitals reviewed</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Reviews Section */}
      <section className="py-16 bg-white">
        <div className="container px-4 mx-auto">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2" data-testid="text-reviews-title">Latest Hospital Reviews</h2>
              <p className="text-slate-600">What patients in Lagos, Abuja, and across Nigeria are saying about their hospital experiences</p>
            </div>
            <Link href="/search" className="hidden md:block">
              <Button variant="ghost" className="text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50">
                See All Reviews <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {reviewsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
          ) : recentReviews.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentReviews.map((review) => {
                const hospital = hospitals.find(h => h.id === review.hospitalId);
                const reviewDate = review.createdAt ? new Date(review.createdAt) : null;
                const recencyText = reviewDate ? formatDistanceToNow(reviewDate, { addSuffix: true }) : null;
                return (
                  <Card key={review.id} className="bg-white border-slate-200 hover:shadow-md transition-shadow" data-testid={`card-review-${review.id}`}>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-emerald-700 font-semibold text-sm">
                            {review.reviewerName?.charAt(0).toUpperCase() || "A"}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-slate-900 truncate">{review.reviewerName || "Anonymous"}</p>
                            {review.verifiedVisit && (
                              <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 gap-0.5 text-xs py-0">
                                <CheckCircle className="w-3 h-3" />
                                Verified
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center gap-0.5">
                              {getRatingStars(review.rating)}
                            </div>
                            {recencyText && (
                              <span className="text-xs text-slate-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {recencyText}
                              </span>
                            )}
                          </div>
                        </div>
                        <Quote className="w-6 h-6 text-emerald-200 flex-shrink-0" />
                      </div>
                      
                      <p className="text-slate-600 text-sm line-clamp-3 mb-4">
                        {review.reviewText}
                      </p>

                      <div className="flex items-center justify-between">
                        {hospital && (
                          <Link href={getHospitalUrl(hospital)} className="inline-flex items-center text-sm text-emerald-700 hover:text-emerald-800 font-medium">
                            <MapPin className="w-3 h-3 mr-1" />
                            {hospital.name}
                          </Link>
                        )}
                        {review.helpfulCount > 0 && (
                          <span className="text-xs text-slate-500">{review.helpfulCount} found helpful</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
              <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 mb-2">No reviews yet</h3>
              <p className="text-slate-500 mb-4">Be the first to share your healthcare experience</p>
              <Link href="/search">
                <Button className="bg-emerald-600 hover:bg-emerald-700">Write a Review</Button>
              </Link>
            </div>
          )}
          
          <div className="text-center mt-8 md:hidden">
            <Link href="/search">
              <Button variant="outline" className="w-full border-emerald-600 text-emerald-700">
                See All Reviews
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features / Why CareNaija */}
      <section className="py-20 bg-white">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">Why Nigerians Trust CareNaija for Hospital Reviews</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">Nigeria's most trusted platform for finding and comparing private and public hospitals</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-xl hover:bg-slate-50 transition-colors">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 mb-4">
                <Star className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Verified Patient Reviews & Ratings</h3>
              <p className="text-slate-600 leading-relaxed">
                Real experiences from real patients across Lagos, Abuja, and all Nigerian states. From wait times to staff attitude, get the full picture before your visit.
              </p>
            </div>
            <div className="text-center p-6 rounded-xl hover:bg-slate-50 transition-colors">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 mb-4">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Verified Hospital Information</h3>
              <p className="text-slate-600 leading-relaxed">
                We verify hospital details, services, and specialties so you have accurate, up-to-date information for hospitals in Nigeria.
              </p>
            </div>
            <div className="text-center p-6 rounded-xl hover:bg-slate-50 transition-colors">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 mb-4">
                <Briefcase className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Hospital Staff & Employee Reviews</h3>
              <p className="text-slate-600 leading-relaxed">
                Healthcare workers share workplace experiences and salary insights, helping you understand hospital culture and standards across Nigeria.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      {testimonials.length > 0 && (
        <section className="py-16 bg-slate-50">
          <div className="container px-4 mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">What Nigerians Say About CareNaija</h2>
              <p className="text-slate-600 max-w-2xl mx-auto">Real feedback from patients who use CareNaija to find top hospitals in Lagos, Abuja, and beyond</p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {testimonials.slice(0, 6).map((testimonial) => (
                <Card key={testimonial.id} className="bg-white border-slate-200" data-testid={`testimonial-${testimonial.id}`}>
                  <CardContent className="p-6">
                    <Quote className="w-8 h-8 text-emerald-200 mb-4" />
                    <p className="text-slate-600 mb-4 italic">"{testimonial.quote}"</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                        <span className="text-emerald-700 font-semibold">
                          {testimonial.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{testimonial.name}</p>
                        <p className="text-sm text-slate-500">
                          {testimonial.role}{testimonial.location && `, ${testimonial.location}`}
                        </p>
                      </div>
                    </div>
                    {testimonial.rating && (
                      <div className="flex items-center gap-0.5 mt-3">
                        {getRatingStars(testimonial.rating)}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Trust Seals Section */}
      <section className="py-10 bg-white border-t border-slate-100">
        <div className="container px-4 mx-auto">
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            <div className="flex items-center gap-2 text-slate-500">
              <Lock className="w-5 h-5 text-emerald-600" />
              <span className="text-sm font-medium">SSL Secured</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span className="text-sm font-medium">Verified Platform</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <span className="text-sm font-medium">Trusted by {(trustStats?.activeUsersMonth || 1000).toLocaleString()}+ Users</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <Award className="w-5 h-5 text-emerald-600" />
              <span className="text-sm font-medium">Nigerian Healthcare Directory</span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section for SEO */}
      <section className="py-16 bg-slate-50">
        <div className="container px-4 mx-auto max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-slate-800 mb-2">
            Frequently Asked Questions
          </h2>
          <p className="text-center text-slate-500 mb-10">Everything you need to know about finding hospitals in Nigeria</p>
          <div className="space-y-4" data-testid="faq-section">
            {[
              { q: "How do I find the best hospital near me in Nigeria?", a: "Use CareNaija's hospital search to find top-rated hospitals near you. Filter by location, HMO/NHIS acceptance, specialty, ownership type (private or government), and patient ratings. Enable location services to see hospitals closest to you with distance information." },
              { q: "Which hospitals in Nigeria accept NHIS?", a: "Most government hospitals and many private hospitals in Nigeria accept NHIS (National Health Insurance Scheme). On CareNaija, you can filter hospitals by HMO/insurance accepted, including NHIS, Hygeia HMO, AXA Mansard, Leadway Health, Reliance HMO, and Total Health Trust." },
              { q: "What are the best hospitals in Lagos?", a: "Lagos has many top-rated hospitals including Lagos University Teaching Hospital (LUTH), Lagos State University Teaching Hospital (LASUTH), Reddington Hospital, Lagoon Hospitals, Eko Hospital, and St. Nicholas Hospital. Check CareNaija for verified patient reviews and ratings." },
              { q: "How do I find hospitals that accept my HMO?", a: "Use the Insurance/HMO filter on the search page to find hospitals that accept your specific HMO plan. We list accepted HMOs including NHIS, Hygeia HMO, AXA Mansard, Leadway Health, Reliance HMO, Mediplan, Total Health Trust, Avon HMO, and Clearline HMO." },
              { q: "Can I read patient reviews for Nigerian hospitals?", a: "Yes! CareNaija features verified patient reviews for hospitals across all 36 Nigerian states. Patients rate hospitals on care quality, cleanliness, staff attitude, and facilities. You can also read employee reviews for workplace insights." },
              { q: "What are the best hospitals in Abuja?", a: "Top-rated hospitals in Abuja include National Hospital Abuja, University of Abuja Teaching Hospital (UATH), Cedarcrest Hospitals, Nisa Premier Hospital, and Garki Hospital. Visit CareNaija to compare ratings and read verified reviews." },
            ].map((item, i) => (
              <details key={i} className="bg-white rounded-lg border border-slate-200 group" data-testid={`faq-item-${i}`}>
                <summary className="flex items-center justify-between p-5 cursor-pointer font-semibold text-slate-800 hover:text-emerald-700 transition-colors">
                  <span>{item.q}</span>
                  <ChevronDown className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform flex-shrink-0 ml-4" />
                </summary>
                <div className="px-5 pb-5 text-slate-600 leading-relaxed border-t border-slate-100 pt-4">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Recently Viewed Hospitals */}
      {recentlyViewed.length > 0 && (
        <section className="py-10 bg-slate-50 border-t border-slate-100">
          <div className="container px-4 mx-auto">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-slate-500" />
              Recently Viewed
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {recentlyViewed.map(h => (
                <Link key={h.id} href={`/hospitals/${h.slug}`}>
                  <div className="bg-white rounded-xl border border-slate-200 hover:border-emerald-300 hover:shadow-sm transition-all p-3 cursor-pointer group" data-testid={`card-recently-viewed-${h.id}`}>
                    <div className="font-semibold text-sm text-slate-900 group-hover:text-emerald-700 line-clamp-2 mb-1">
                      {h.name}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />{h.lga}, {h.state}
                    </div>
                    {h.averageRating !== null && (
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        <span className="text-xs text-slate-600">{(h.averageRating || 0).toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Email Signup Banner */}
      <EmailSignupBanner />

      {/* CTA Section - Nigerian Green */}
      <section className="py-20 bg-gradient-to-br from-emerald-700 via-emerald-600 to-green-600 text-white">
        <div className="container px-4 mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Share Your Hospital Experience in Nigeria
          </h2>
          <p className="text-xl text-emerald-100 mb-8 max-w-2xl mx-auto">
            Your hospital review could help another Nigerian make a life-saving decision. Share your experience at any hospital in Lagos, Abuja, Port Harcourt, Ibadan, or anywhere in Nigeria.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/search">
              <Button size="lg" className="h-14 px-8 text-lg font-semibold bg-white text-emerald-700 hover:bg-emerald-50" data-testid="button-cta-review">
                Write a Review
              </Button>
            </Link>
            <Link href="/suggest-hospital">
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-semibold border-white text-white hover:bg-white/10" data-testid="button-cta-suggest">
                Suggest a Hospital
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Mobile FAB */}
      <HomeFAB />
    </div>
  );
}
