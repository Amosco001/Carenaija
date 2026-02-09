import { useState, useMemo } from "react";
import { useParams, Link } from "wouter";
import { useHospitals } from "@/hooks/useHospitals";
import type { Hospital } from "@/lib/types";
import { HospitalCard } from "@/components/hospital-card";
import { SEOHead } from "@/components/seo-head";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MapPin, ChevronRight, Building2, Star, Search,
  Stethoscope, Shield, Clock, Home, ArrowRight, Loader2
} from "lucide-react";
import luthHospitalImage from "@assets/generated_images/luth_hospital_lagos_nigeria.png";
import neuropsychHospitalImage from "@assets/generated_images/neuropsychiatric_hospital_yaba.png";
import orthoHospitalImage from "@assets/generated_images/orthopaedic_hospital_igbobi.png";

const hospitalImages = [luthHospitalImage, neuropsychHospitalImage, orthoHospitalImage];

const NIGERIAN_CITIES: Record<string, { state: string; description: string; neighborhoods: string[] }> = {
  "lagos": {
    state: "Lagos",
    description: "Lagos is Nigeria's largest city and economic hub, home to some of the country's best private and public hospitals. Whether you need a top maternity hospital in Lekki, an affordable clinic in Surulere, or a specialist hospital on Victoria Island, CareNaija helps you find the right hospital with verified patient reviews and ratings.",
    neighborhoods: ["Ikeja", "Lekki", "Victoria Island", "Surulere", "Yaba", "Ikoyi", "Apapa", "Ajah", "Oshodi"]
  },
  "abuja": {
    state: "Abuja",
    description: "Abuja, Nigeria's capital city, offers a wide range of modern healthcare facilities. From specialist hospitals in Wuse to emergency care centres in Garki and Maitama, find the best hospitals in Abuja with honest patient reviews, hospital ratings, and detailed facility information on CareNaija.",
    neighborhoods: ["Wuse", "Garki", "Maitama", "Asokoro", "Gwarinpa", "Kubwa", "Jabi", "Central Area"]
  },
  "port-harcourt": {
    state: "Rivers",
    description: "Port Harcourt is the capital of Rivers State and a major hub for healthcare in the Niger Delta region. Find the best hospitals in Port Harcourt, from teaching hospitals to private clinics offering maternity care, surgery, and specialist treatments. Read real patient reviews and compare hospital ratings on CareNaija.",
    neighborhoods: ["GRA", "Old GRA", "Trans Amadi", "Diobu", "Rumuokwurushi", "Eleme"]
  },
  "ibadan": {
    state: "Oyo",
    description: "Ibadan, one of Nigeria's largest cities, is home to the University College Hospital (UCH) and numerous private healthcare facilities. Whether you need a hospital in Bodija, Ring Road, or Challenge, CareNaija helps you compare hospitals in Ibadan with verified patient reviews and detailed ratings.",
    neighborhoods: ["Bodija", "Ring Road", "Challenge", "Mokola", "Dugbe", "Agodi", "Oluyole"]
  },
  "kano": {
    state: "Kano",
    description: "Kano is the largest city in Northern Nigeria with a growing network of modern hospitals and clinics. Find top-rated hospitals in Kano, from Aminu Kano Teaching Hospital to private specialist clinics. Read patient reviews and compare hospital ratings to make informed healthcare decisions.",
    neighborhoods: ["Nassarawa", "Sabon Gari", "Tarauni", "Fagge", "Gwale"]
  },
  "enugu": {
    state: "Enugu",
    description: "Enugu, the Coal City, offers quality healthcare facilities including the University of Nigeria Teaching Hospital (UNTH). Find the best hospitals in Enugu with patient reviews covering care quality, staff attitude, and facilities. Compare private and public hospitals on CareNaija.",
    neighborhoods: ["Independence Layout", "GRA", "New Haven", "Ogui", "Trans Ekulu"]
  },
  "benin-city": {
    state: "Edo",
    description: "Benin City in Edo State has a range of healthcare facilities including the University of Benin Teaching Hospital (UBTH). Find top hospitals in Benin City, read patient reviews, and compare ratings for private and public hospitals on CareNaija.",
    neighborhoods: ["GRA", "Sapele Road", "Ring Road", "Ugbowo", "Uselu"]
  },
  "calabar": {
    state: "Cross River",
    description: "Calabar, the capital of Cross River State, offers quality healthcare services with both public and private hospitals. Find the best hospitals in Calabar, read honest patient reviews, and compare hospital ratings on CareNaija.",
    neighborhoods: ["Marian", "Diamond Hill", "Calabar South", "Ekorinim"]
  }
};

const MAJOR_CITIES = Object.keys(NIGERIAN_CITIES);

export default function CityHospitalsPage() {
  const { city } = useParams<{ city: string }>();
  const { data: allHospitals, isLoading } = useHospitals();
  const [sortBy, setSortBy] = useState<string>("rating");
  const [ownershipFilter, setOwnershipFilter] = useState<string>("all");

  const citySlug = city?.toLowerCase() || "";
  const cityInfo = NIGERIAN_CITIES[citySlug];
  const cityName = citySlug === "port-harcourt" ? "Port Harcourt" : citySlug === "benin-city" ? "Benin City" : citySlug.charAt(0).toUpperCase() + citySlug.slice(1);
  const stateName = cityInfo?.state || cityName;

  const cityHospitals = useMemo(() => {
    if (!allHospitals) return [];
    let filtered = allHospitals.filter(h =>
      h.state?.toLowerCase() === stateName.toLowerCase() ||
      h.lga?.toLowerCase().includes(citySlug.replace("-", " ")) ||
      h.address?.toLowerCase().includes(citySlug.replace("-", " "))
    );

    if (ownershipFilter !== "all") {
      filtered = filtered.filter(h => h.ownership?.toLowerCase() === ownershipFilter.toLowerCase());
    }

    switch (sortBy) {
      case "rating":
        return filtered.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
      case "reviews":
        return filtered.sort((a, b) => (b.totalReviews || 0) - (a.totalReviews || 0));
      case "name":
        return filtered.sort((a, b) => a.name.localeCompare(b.name));
      default:
        return filtered;
    }
  }, [allHospitals, stateName, citySlug, sortBy, ownershipFilter]);

  const privateCount = cityHospitals.filter(h => h.ownership?.toLowerCase() === "private").length;
  const publicCount = cityHospitals.filter(h => h.ownership?.toLowerCase() !== "private").length;
  const avgRating = cityHospitals.length > 0
    ? (cityHospitals.reduce((sum, h) => sum + (h.averageRating || 0), 0) / cityHospitals.length).toFixed(1)
    : "0.0";

  const seoTitle = `Best Hospitals in ${cityName}, Nigeria`;
  const seoDescription = `Find the best hospitals in ${cityName}, Nigeria. Compare ${cityHospitals.length}+ hospital ratings, read verified patient reviews, and discover top-rated private and public hospitals in ${stateName} State.`;

  if (!cityInfo) {
    return (
      <div className="min-h-screen bg-slate-50">
        <SEOHead
          title={`Hospitals in ${cityName} Nigeria`}
          description={`Find hospitals in ${cityName}, Nigeria. Read patient reviews and compare ratings.`}
          canonicalUrl={`https://www.carenaija.com/hospitals/${citySlug}`}
        />
        <div className="container mx-auto px-4 py-16 text-center">
          <Building2 className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Hospitals in {cityName}, Nigeria</h1>
          <p className="text-muted-foreground mb-6">
            We're working on adding more cities. Browse all hospitals across Nigeria instead.
          </p>
          <Link href="/search">
            <Button className="bg-emerald-600 hover:bg-emerald-700" data-testid="button-browse-all">
              Browse All Hospitals
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.carenaija.com/" },
      { "@type": "ListItem", "position": 2, "name": "Hospitals", "item": "https://www.carenaija.com/search" },
      { "@type": "ListItem", "position": 3, "name": `Hospitals in ${cityName}`, "item": `https://www.carenaija.com/hospitals/${citySlug}` }
    ]
  };

  const collectionPageSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": seoTitle,
    "description": seoDescription,
    "url": `https://www.carenaija.com/hospitals/${citySlug}`,
    "mainEntity": {
      "@type": "ItemList",
      "numberOfItems": cityHospitals.length,
      "itemListElement": cityHospitals.slice(0, 10).map((h: Hospital, i: number) => ({
        "@type": "ListItem",
        "position": i + 1,
        "item": {
          "@type": "Hospital",
          "name": h.name,
          "address": {
            "@type": "PostalAddress",
            "streetAddress": h.address,
            "addressRegion": h.state,
            "addressCountry": "NG"
          },
          "url": `https://www.carenaija.com/hospital/${h.id}`,
          ...((h.averageRating ?? 0) > 0 && (h.totalReviews ?? 0) > 0 ? {
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": (h.averageRating ?? 0).toFixed(1),
              "reviewCount": h.totalReviews
            }
          } : {})
        }
      }))
    }
  };

  return (
    <div className="min-h-screen bg-slate-50" data-testid="page-city-hospitals">
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        keywords={`best hospitals in ${cityName}, hospitals ${stateName} Nigeria, private hospitals ${cityName}, hospital reviews ${cityName}, top hospitals ${cityName}, affordable hospitals ${cityName}`}
        canonicalUrl={`https://www.carenaija.com/hospitals/${citySlug}`}
        structuredData={[breadcrumbSchema, collectionPageSchema]}
      />

      {/* Breadcrumb */}
      <nav className="bg-white border-b" aria-label="Breadcrumb">
        <div className="container mx-auto px-4 py-3">
          <ol className="flex items-center gap-2 text-sm">
            <li>
              <Link href="/" className="text-slate-500 hover:text-emerald-600 flex items-center gap-1">
                <Home className="w-4 h-4" />
                Home
              </Link>
            </li>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <li>
              <Link href="/search" className="text-slate-500 hover:text-emerald-600">
                Hospitals
              </Link>
            </li>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <li className="text-slate-900 font-medium">{cityName}</li>
          </ol>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-emerald-700 via-emerald-600 to-green-600 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <Badge className="bg-white/20 text-white border-white/30 mb-4">
              <MapPin className="w-3 h-3 mr-1" /> {stateName} State, Nigeria
            </Badge>
            <h1 className="text-3xl md:text-5xl font-bold mb-4" data-testid="text-city-title">
              Best Hospitals in {cityName}, Nigeria
            </h1>
            <p className="text-lg text-emerald-100 mb-6">
              Compare {cityHospitals.length} hospitals in {cityName} with verified patient reviews and ratings. Find top-rated private and public hospitals near you.
            </p>

            {/* Quick Stats */}
            <div className="flex flex-wrap gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3 flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                <div>
                  <div className="font-bold text-lg">{cityHospitals.length}</div>
                  <div className="text-xs text-emerald-200">Hospitals Listed</div>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-300" />
                <div>
                  <div className="font-bold text-lg">{avgRating}</div>
                  <div className="text-xs text-emerald-200">Average Rating</div>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                <div>
                  <div className="font-bold text-lg">{privateCount}</div>
                  <div className="text-xs text-emerald-200">Private Hospitals</div>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3 flex items-center gap-2">
                <Stethoscope className="w-5 h-5" />
                <div>
                  <div className="font-bold text-lg">{publicCount}</div>
                  <div className="text-xs text-emerald-200">Public Hospitals</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-[1fr_320px] gap-8">
          {/* Hospital Listings */}
          <div>
            {/* Sort & Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                Top-Rated Hospitals in {cityName}
              </h2>
              <div className="flex items-center gap-3">
                <Select value={ownershipFilter} onValueChange={setOwnershipFilter}>
                  <SelectTrigger className="w-[140px]" data-testid="select-ownership">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="government">Government</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[140px]" data-testid="select-sort">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                    <SelectItem value="reviews">Most Reviewed</SelectItem>
                    <SelectItem value="name">Name A-Z</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
              </div>
            ) : cityHospitals.length > 0 ? (
              <div className="grid gap-4">
                {cityHospitals.map((hospital, index) => (
                  <HospitalCard key={hospital.id} hospital={hospital} imageUrl={hospitalImages[index % hospitalImages.length]} variant="list" />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-xl border">
                <Search className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900">No hospitals found</h3>
                <p className="text-slate-500 mt-2">Try adjusting your filters or browse all hospitals.</p>
                <Link href="/search">
                  <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700">Browse All Hospitals</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* About This City */}
            <Card>
              <CardContent className="p-6">
                <h2 className="font-bold text-slate-900 mb-3">About Healthcare in {cityName}</h2>
                <p className="text-sm text-slate-600 leading-relaxed">{cityInfo.description}</p>
              </CardContent>
            </Card>

            {/* Popular Areas */}
            {cityInfo.neighborhoods.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-bold text-slate-900 mb-3">Popular Areas in {cityName}</h3>
                  <div className="flex flex-wrap gap-2">
                    {cityInfo.neighborhoods.map(area => (
                      <Link key={area} href={`/search?q=${area} ${cityName}`}>
                        <Badge variant="outline" className="cursor-pointer hover:bg-emerald-50 hover:border-emerald-300" data-testid={`badge-area-${area.toLowerCase()}`}>
                          <MapPin className="w-3 h-3 mr-1" /> {area}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Other Cities */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold text-slate-900 mb-3">Hospitals in Other Cities</h3>
                <div className="space-y-2">
                  {MAJOR_CITIES.filter(c => c !== citySlug).map(otherCity => {
                    const info = NIGERIAN_CITIES[otherCity];
                    const displayName = otherCity === "port-harcourt" ? "Port Harcourt" : otherCity === "benin-city" ? "Benin City" : otherCity.charAt(0).toUpperCase() + otherCity.slice(1);
                    return (
                      <Link key={otherCity} href={`/hospitals/${otherCity}`}>
                        <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50 cursor-pointer group" data-testid={`link-city-${otherCity}`}>
                          <span className="text-sm font-medium text-slate-700 group-hover:text-emerald-700">{displayName}</span>
                          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold text-slate-900 mb-3">Quick Links</h3>
                <div className="space-y-2 text-sm">
                  <Link href={`/search?q=maternity ${cityName}`} className="flex items-center gap-2 text-emerald-600 hover:underline" data-testid="link-maternity">
                    <Stethoscope className="w-4 h-4" /> Best Maternity Hospitals in {cityName}
                  </Link>
                  <Link href={`/search?q=emergency ${cityName}`} className="flex items-center gap-2 text-emerald-600 hover:underline" data-testid="link-emergency">
                    <Clock className="w-4 h-4" /> Emergency Hospitals in {cityName}
                  </Link>
                  <Link href="/compare" className="flex items-center gap-2 text-emerald-600 hover:underline" data-testid="link-compare">
                    <Search className="w-4 h-4" /> Compare Hospitals in {cityName}
                  </Link>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>

        {/* SEO Content Section */}
        <section className="mt-12 bg-white rounded-xl border p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            Finding the Best Hospital in {cityName}, Nigeria
          </h2>
          <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-4">
            <p>
              Choosing the right hospital in {cityName} is an important decision that affects your health and wellbeing.
              CareNaija makes it easy to compare hospitals in {stateName} State by providing verified patient reviews,
              detailed ratings, and comprehensive hospital information including services, specialties, and operating hours.
            </p>
            <h3 className="text-lg font-semibold text-slate-900">How to Choose a Hospital in {cityName}</h3>
            <p>
              When looking for a hospital in {cityName}, consider these factors: patient review ratings, range of services offered,
              proximity to your location, whether the hospital accepts your HMO or insurance plan, and the availability of
              specialist care. CareNaija's hospital ratings are based on real patient experiences covering care quality,
              cleanliness, staff attitude, and overall facilities.
            </p>
            <h3 className="text-lg font-semibold text-slate-900">Private vs Public Hospitals in {cityName}</h3>
            <p>
              {cityName} has both private and public (government) hospitals. Private hospitals in {cityName} often offer
              shorter wait times and more comfortable facilities, while government hospitals typically provide more
              affordable care and accept NHIS insurance. Read patient reviews on CareNaija to compare the quality
              of care at private and public hospitals in {stateName}.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
