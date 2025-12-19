import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Star, Stethoscope, Briefcase, Heart, Baby, Bone, Brain, Eye, ShieldCheck, ChevronRight, ChevronLeft, Loader2, Users, Building2, MessageSquare, Quote } from "lucide-react";
import { useLocation } from "wouter";
import { useState, useEffect, useCallback } from "react";
import { useHospitals, useAllPatientReviews } from "@/hooks/useHospitals";
import { Link } from "wouter";
import generatedHeroImage from "@assets/generated_images/modern_nigerian_hospital_exterior_with_friendly_medical_staff_interaction.png";
import luthHospitalImage from "@assets/generated_images/luth_hospital_lagos_nigeria.png";
import neuropsychHospitalImage from "@assets/generated_images/neuropsychiatric_hospital_yaba.png";
import orthoHospitalImage from "@assets/generated_images/orthopaedic_hospital_igbobi.png";
import { Card, CardContent } from "@/components/ui/card";
import useEmblaCarousel from "embla-carousel-react";
import { SEOHead } from "@/components/seo-head";
import { SkeletonHospitalCard } from "@/components/skeleton-card";
import { HospitalCard } from "@/components/hospital-card";

const hospitalImages = [luthHospitalImage, neuropsychHospitalImage, orthoHospitalImage];

export default function Home() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [locationTerm, setLocationTerm] = useState("");
  const { data: hospitals = [], isLoading } = useHospitals();
  const { data: reviews = [], isLoading: reviewsLoading } = useAllPatientReviews();

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
        title="Hospital Reviews Nigeria - Find Best Hospitals in Lagos & Nigeria"
        description="Find the best hospitals in Nigeria with verified patient reviews. Compare ratings for hospitals in Lagos, Abuja and across Nigeria. Read honest reviews about care quality."
        keywords="hospital reviews Nigeria, best hospitals in Lagos, Nigerian hospital ratings, Lagos hospitals, Abuja hospitals, healthcare Nigeria"
        canonicalUrl="https://carenaija.replit.app/"
      />
      {/* Hero Section - Nigerian Green Theme */}
      <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-800 via-emerald-700 to-green-600">
        <div className="absolute inset-0 z-0">
          <img 
            src={generatedHeroImage} 
            alt="Hospital Background" 
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
              Find Quality Healthcare <br/>
              <span className="text-emerald-200">Across Nigeria</span>
            </h1>
            <p className="text-lg md:text-xl text-emerald-100 mb-10 max-w-2xl mx-auto">
              Compare hospital ratings, read patient reviews, and make informed decisions about your healthcare.
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            <div className="text-center" data-testid="stat-hospitals">
              <div className="flex justify-center mb-2">
                <Building2 className="w-8 h-8 text-emerald-600" />
              </div>
              <div className="text-2xl md:text-3xl font-bold text-slate-900">{hospitals.length.toLocaleString()}+</div>
              <div className="text-sm text-slate-500">Hospitals Listed</div>
            </div>
            <div className="text-center" data-testid="stat-reviews">
              <div className="flex justify-center mb-2">
                <MessageSquare className="w-8 h-8 text-emerald-600" />
              </div>
              <div className="text-2xl md:text-3xl font-bold text-slate-900">{totalReviews.toLocaleString()}+</div>
              <div className="text-sm text-slate-500">Patient Reviews</div>
            </div>
            <div className="text-center" data-testid="stat-verified">
              <div className="flex justify-center mb-2">
                <ShieldCheck className="w-8 h-8 text-emerald-600" />
              </div>
              <div className="text-2xl md:text-3xl font-bold text-slate-900">{verifiedHospitals || "100"}+</div>
              <div className="text-sm text-slate-500">Verified Hospitals</div>
            </div>
            <div className="text-center" data-testid="stat-users">
              <div className="flex justify-center mb-2">
                <Users className="w-8 h-8 text-emerald-600" />
              </div>
              <div className="text-2xl md:text-3xl font-bold text-slate-900">10,000+</div>
              <div className="text-sm text-slate-500">Monthly Visitors</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Hospitals Carousel */}
      <section className="py-16 bg-slate-50">
        <div className="container px-4 mx-auto">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2" data-testid="text-featured-title">Featured Hospitals</h2>
              <p className="text-slate-600">Top-rated healthcare facilities across Nigeria</p>
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
                      imageUrl={hospitalImages[index % hospitalImages.length]}
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

      {/* Popular Specialties Grid */}
      <section className="py-16 bg-white">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4" data-testid="text-specialties-title">Browse by Specialty</h2>
            <p className="text-slate-600">Find hospitals known for specific treatments and care</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {specialties.map((spec) => (
              <Link key={spec.name} href={`/search?q=${spec.name}`} data-testid={`card-specialty-${spec.name.toLowerCase()}`}>
                <Card className={`${spec.hoverBg} hover:shadow-md transition-all duration-300 cursor-pointer border-slate-200 hover:border-emerald-300 group bg-white h-full`}>
                  <CardContent className="flex flex-col items-center justify-center p-6 h-full">
                    <div className={`w-14 h-14 rounded-full ${spec.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <spec.icon className={`h-7 w-7 ${spec.color}`} />
                    </div>
                    <span className="font-semibold text-slate-700 group-hover:text-emerald-700">{spec.name}</span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Reviews Section */}
      <section className="py-16 bg-slate-50">
        <div className="container px-4 mx-auto">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2" data-testid="text-reviews-title">Recent Reviews</h2>
              <p className="text-slate-600">What patients are saying about their experiences</p>
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
                          <p className="font-semibold text-slate-900 truncate">{review.reviewerName || "Anonymous"}</p>
                          <div className="flex items-center gap-1 mt-1">
                            {getRatingStars(review.rating)}
                          </div>
                        </div>
                        <Quote className="w-6 h-6 text-emerald-200 flex-shrink-0" />
                      </div>
                      
                      <p className="text-slate-600 text-sm line-clamp-3 mb-4">
                        {review.reviewText}
                      </p>
                      
                      {hospital && (
                        <Link href={`/hospital/${hospital.id}`} className="inline-flex items-center text-sm text-emerald-700 hover:text-emerald-800 font-medium">
                          <MapPin className="w-3 h-3 mr-1" />
                          {hospital.name}
                        </Link>
                      )}
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
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">Why Choose CareNaija?</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">We're committed to helping Nigerians find quality healthcare with confidence</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-xl hover:bg-slate-50 transition-colors">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 mb-4">
                <Star className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Honest Patient Reviews</h3>
              <p className="text-slate-600 leading-relaxed">
                Real experiences from real patients. From wait times to staff attitude, get the full picture before your visit.
              </p>
            </div>
            <div className="text-center p-6 rounded-xl hover:bg-slate-50 transition-colors">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 mb-4">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Verified Information</h3>
              <p className="text-slate-600 leading-relaxed">
                We verify hospital details and services to ensure you have accurate, up-to-date information.
              </p>
            </div>
            <div className="text-center p-6 rounded-xl hover:bg-slate-50 transition-colors">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 mb-4">
                <Briefcase className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Employee Insights</h3>
              <p className="text-slate-600 leading-relaxed">
                Healthcare workers share workplace experiences, helping you understand hospital culture and standards.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Nigerian Green */}
      <section className="py-20 bg-gradient-to-br from-emerald-700 via-emerald-600 to-green-600 text-white">
        <div className="container px-4 mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Help Improve Nigerian Healthcare
          </h2>
          <p className="text-xl text-emerald-100 mb-8 max-w-2xl mx-auto">
            Your review could help someone make a life-saving decision. Share your experience and contribute to better healthcare for all Nigerians.
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
    </div>
  );
}
