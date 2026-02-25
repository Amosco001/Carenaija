import { useMemo } from "react";
import { useParams, Link } from "wouter";
import { useHospitals } from "@/hooks/useHospitals";
import { HospitalCard } from "@/components/hospital-card";
import { SEOHead } from "@/components/seo-head";
import { Breadcrumb } from "@/components/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Search, Stethoscope, Heart, Baby, Bone, Brain, Eye } from "lucide-react";
import { getHospitalImage } from "@/lib/hospital-images";

const SPECIALTY_INFO: Record<string, { title: string; description: string; icon: any; relatedTerms: string[] }> = {
  "cardiology": {
    title: "Cardiology",
    description: "Find the best cardiology hospitals and heart care centres in Nigeria. Compare patient reviews, ratings, and services for hospitals specializing in heart disease treatment, cardiac surgery, and cardiovascular care across Lagos, Abuja, and other major cities.",
    icon: Heart,
    relatedTerms: ["Heart", "Cardiac", "Cardiovascular", "Cardiology"],
  },
  "maternity": {
    title: "Maternity",
    description: "Discover top-rated maternity hospitals in Nigeria for prenatal care, delivery, and postnatal support. Read reviews from mothers about their birth experiences at hospitals in Lagos, Abuja, Port Harcourt, and across Nigeria.",
    icon: Baby,
    relatedTerms: ["Maternity", "Obstetrics", "Gynecology", "Prenatal", "Antenatal", "Delivery"],
  },
  "orthopedics": {
    title: "Orthopedics",
    description: "Find orthopaedic hospitals and bone specialists in Nigeria. Compare ratings and reviews for hospitals offering fracture treatment, joint replacement, spine surgery, and sports medicine across Nigerian cities.",
    icon: Bone,
    relatedTerms: ["Orthopedics", "Orthopaedics", "Bone", "Joint", "Spine", "Sports Medicine"],
  },
  "neurology": {
    title: "Neurology",
    description: "Search for neurology hospitals and brain care specialists across Nigeria. Read reviews and compare ratings for hospitals offering treatment for stroke, epilepsy, headaches, and neurological conditions.",
    icon: Brain,
    relatedTerms: ["Neurology", "Brain", "Neurological", "Neurosurgery", "Nerve"],
  },
  "eye-care": {
    title: "Eye Care",
    description: "Find the best eye hospitals and ophthalmology clinics in Nigeria. Compare reviews and ratings for hospitals offering cataract surgery, LASIK, glaucoma treatment, and comprehensive eye care services.",
    icon: Eye,
    relatedTerms: ["Eye Care", "Ophthalmology", "Eye", "Vision", "Optical"],
  },
  "pediatrics": {
    title: "Pediatrics",
    description: "Discover top children's hospitals and pediatric care centres in Nigeria. Read parent reviews and compare ratings for hospitals specializing in child healthcare, neonatal care, and pediatric surgery.",
    icon: Stethoscope,
    relatedTerms: ["Pediatrics", "Paediatrics", "Children", "Child", "Neonatal"],
  },
  "dental": {
    title: "Dental",
    description: "Find top dental clinics and oral health hospitals in Nigeria. Compare patient reviews and ratings for dental surgeons, orthodontists, and general dentistry services across Lagos, Abuja, and other cities.",
    icon: Stethoscope,
    relatedTerms: ["Dental", "Dentistry", "Oral", "Orthodontics"],
  },
  "general-medicine": {
    title: "General Medicine",
    description: "Find general hospitals and family medicine clinics across Nigeria. Compare reviews, ratings, and services for hospitals providing comprehensive primary healthcare and general medical services.",
    icon: Stethoscope,
    relatedTerms: ["General Medicine", "General", "Family Medicine", "Primary Care", "Internal Medicine"],
  },
};

const ALL_SPECIALTIES = Object.keys(SPECIALTY_INFO);

export default function SpecialtyPage() {
  const { slug } = useParams<{ slug: string }>();
  const specialtySlug = slug?.toLowerCase() || "";
  const specialtyInfo = SPECIALTY_INFO[specialtySlug];
  const { data: allHospitals = [], isLoading } = useHospitals();

  const matchingHospitals = useMemo(() => {
    if (!specialtyInfo) return [];
    return allHospitals.filter(h => {
      const services = (h.services || []).map((s: string) => s.toLowerCase());
      return specialtyInfo.relatedTerms.some(term =>
        services.some(s => s.includes(term.toLowerCase()))
      );
    }).sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
  }, [allHospitals, specialtyInfo]);

  const hospitalsByState = useMemo(() => {
    const stateMap: Record<string, number> = {};
    matchingHospitals.forEach(h => {
      stateMap[h.state] = (stateMap[h.state] || 0) + 1;
    });
    return Object.entries(stateMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  }, [matchingHospitals]);

  if (!specialtyInfo) {
    return (
      <div className="min-h-screen bg-slate-50" data-testid="page-specialty">
        <SEOHead
          title="Medical Specialties - CareNaija"
          description="Browse hospitals by medical specialty across Nigeria. Find cardiology, maternity, orthopedic, neurology, and other specialist hospitals."
          canonicalUrl="https://www.carenaija.com/specialties"
        />
        <Breadcrumb items={[{ label: "Medical Specialties" }]} />
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Browse Hospitals by Medical Specialty</h1>
          <p className="text-slate-600 mb-8">Find specialist hospitals across Nigeria by choosing a medical specialty below.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {ALL_SPECIALTIES.map(specSlug => {
              const info = SPECIALTY_INFO[specSlug];
              const Icon = info.icon;
              return (
                <Link key={specSlug} href={`/specialties/${specSlug}`}>
                  <Card className="hover:shadow-md transition-all cursor-pointer hover:border-emerald-300 group h-full" data-testid={`card-specialty-${specSlug}`}>
                    <CardContent className="flex flex-col items-center justify-center p-6">
                      <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <Icon className="h-7 w-7 text-emerald-600" />
                      </div>
                      <span className="font-semibold text-slate-700 group-hover:text-emerald-700 text-center">
                        Best {info.title} Hospitals
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const Icon = specialtyInfo.icon;
  const seoTitle = `Best ${specialtyInfo.title} Hospitals in Nigeria - Reviews & Ratings | CareNaija`;
  const seoDescription = specialtyInfo.description;

  return (
    <div className="min-h-screen bg-slate-50" data-testid="page-specialty">
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        keywords={`${specialtyInfo.title} hospitals Nigeria, best ${specialtyInfo.title.toLowerCase()} hospital Lagos, ${specialtyInfo.title.toLowerCase()} specialist Nigeria, ${specialtyInfo.relatedTerms.join(', ')}`}
        canonicalUrl={`https://www.carenaija.com/specialties/${specialtySlug}`}
      />
      <Breadcrumb items={[
        { label: "Medical Specialties", href: "/specialties" },
        { label: `${specialtyInfo.title} Hospitals in Nigeria` },
      ]} />

      <section className="bg-gradient-to-br from-emerald-700 via-emerald-600 to-green-600 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <Icon className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold">
                Best {specialtyInfo.title} Hospitals in Nigeria
              </h1>
            </div>
            <p className="text-emerald-100 text-lg mb-4">{seoDescription}</p>
            <div className="flex items-center gap-4 text-sm text-emerald-200">
              <span>{matchingHospitals.length} hospitals found</span>
              <span>·</span>
              <span>{hospitalsByState.length} states</span>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-[1fr_320px] gap-8">
          <div>
            {isLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
              </div>
            ) : matchingHospitals.length > 0 ? (
              <div className="grid gap-4">
                {matchingHospitals.map((hospital, index) => (
                  <HospitalCard key={hospital.id} hospital={hospital} imageUrl={getHospitalImage(hospital)} variant="list" />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-xl border">
                <Search className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900">No {specialtyInfo.title.toLowerCase()} hospitals found</h3>
                <p className="text-slate-500 mt-2">Try browsing all hospitals instead.</p>
                <Link href="/search">
                  <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700" data-testid="button-browse-all">Browse All Hospitals</Button>
                </Link>
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h2 className="font-bold text-slate-900 mb-3">{specialtyInfo.title} Hospitals by State</h2>
                <div className="space-y-2">
                  {hospitalsByState.map(([state, count]) => (
                    <Link key={state} href={`/search?q=${encodeURIComponent(specialtyInfo.title)}&location=${encodeURIComponent(state)}`}>
                      <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50 cursor-pointer group" data-testid={`link-state-${state.toLowerCase().replace(/\s+/g, '-')}`}>
                        <span className="text-sm font-medium text-slate-700 group-hover:text-emerald-700 flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-slate-400" /> {specialtyInfo.title} hospitals in {state}
                        </span>
                        <Badge variant="secondary" className="text-xs">{count}</Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold text-slate-900 mb-3">Other Specialties</h3>
                <div className="flex flex-wrap gap-2">
                  {ALL_SPECIALTIES.filter(s => s !== specialtySlug).map(specSlug => {
                    const info = SPECIALTY_INFO[specSlug];
                    return (
                      <Link key={specSlug} href={`/specialties/${specSlug}`}>
                        <Badge variant="outline" className="cursor-pointer hover:bg-emerald-50 hover:border-emerald-300" data-testid={`link-specialty-${specSlug}`}>
                          {info.title}
                        </Badge>
                      </Link>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold text-slate-900 mb-3">About {specialtyInfo.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {specialtyInfo.description}
                </p>
              </CardContent>
            </Card>
          </aside>
        </div>

        <section className="mt-12 bg-white rounded-xl border p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            Finding the Best {specialtyInfo.title} Hospital in Nigeria
          </h2>
          <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-4">
            <p>
              When looking for a {specialtyInfo.title.toLowerCase()} hospital in Nigeria, it is important to consider the hospital's
              experience, patient reviews, available equipment, and the qualifications of their {specialtyInfo.title.toLowerCase()} specialists.
              CareNaija helps you compare {specialtyInfo.title.toLowerCase()} hospitals across Lagos, Abuja, Port Harcourt, and other Nigerian cities
              using verified patient reviews and detailed ratings.
            </p>
            <h3 className="text-lg font-semibold text-slate-900">What to Look for in a {specialtyInfo.title} Hospital</h3>
            <p>
              Consider these factors when choosing a {specialtyInfo.title.toLowerCase()} hospital: patient satisfaction ratings,
              specialist qualifications, range of {specialtyInfo.title.toLowerCase()} services offered, hospital facilities and equipment,
              location and accessibility, insurance acceptance, and whether the hospital is accredited. Read reviews from other patients
              on CareNaija to learn about their experiences with {specialtyInfo.title.toLowerCase()} care at hospitals near you.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
