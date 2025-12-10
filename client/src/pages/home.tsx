import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Activity, Star, Stethoscope, Briefcase } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import { MOCK_HOSPITALS } from "@/lib/mockData";
import { StarRating } from "@/components/star-rating";
import { Link } from "wouter";
import generatedHeroImage from "@assets/generated_images/modern_nigerian_hospital_exterior_with_friendly_medical_staff_interaction.png";

export default function Home() {
  const [location, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm) {
      setLocation(`/search?q=${encodeURIComponent(searchTerm)}`);
    } else {
      setLocation("/search");
    }
  };

  const topHospitals = [...MOCK_HOSPITALS].sort((a, b) => b.ratingPatient - a.ratingPatient).slice(0, 3);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={generatedHeroImage} 
            alt="Hospital Background" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 to-slate-900/40" />
        </div>

        <div className="container relative z-10 px-4 mx-auto text-center md:text-left">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-6 leading-tight animate-in slide-in-from-bottom-5 duration-700">
              Find Trusted Healthcare <br/>
              <span className="text-primary-foreground/90">in Nigeria</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-200 mb-8 max-w-2xl animate-in slide-in-from-bottom-5 duration-700 delay-150">
              Real reviews from patients and employees. Make informed decisions about where to receive care and where to work.
            </p>

            <form onSubmit={handleSearch} className="bg-white p-2 rounded-lg shadow-xl max-w-2xl flex flex-col md:flex-row gap-2 animate-in slide-in-from-bottom-5 duration-700 delay-300">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input 
                  placeholder="Hospital name, specialty, or condition" 
                  className="pl-10 border-0 shadow-none focus-visible:ring-0 text-base h-12"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="w-px bg-slate-200 hidden md:block" />
              <div className="flex-1 relative md:max-w-[200px]">
                <MapPin className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input 
                  placeholder="City or State" 
                  className="pl-10 border-0 shadow-none focus-visible:ring-0 text-base h-12"
                />
              </div>
              <Button type="submit" size="lg" className="h-12 px-8 text-base font-semibold">
                Search
              </Button>
            </form>

            <div className="mt-8 flex flex-wrap gap-3 animate-in slide-in-from-bottom-5 duration-700 delay-500">
              <span className="text-slate-300 text-sm font-medium mr-2 self-center">Popular:</span>
              {["Maternity", "Cardiology", "Lagos", "Abuja", "Teaching Hospitals"].map((tag) => (
                <Link key={tag} href={`/search?q=${tag}`} className="bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm transition-colors border border-white/10">
                  {tag}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section className="py-20 bg-slate-50">
        <div className="container px-4 mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                For Patients
              </div>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900">
                Know before you go.
              </h2>
              <p className="text-lg text-slate-600 leading-relaxed">
                Don't gamble with your health. Read authentic reviews from patients about wait times, cleanliness, doctor attentiveness, and billing transparency.
              </p>
              <ul className="space-y-4">
                {[
                  "Verified patient reviews",
                  "Detailed ratings on facilities & care",
                  "Filter by specialty and location"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center text-primary">
                      <Stethoscope size={14} />
                    </div>
                    <span className="text-slate-700">{item}</span>
                  </li>
                ))}
              </ul>
              <Button variant="outline" size="lg" onClick={() => setLocation("/search")}>
                Find a Hospital
              </Button>
            </div>
            <div className="relative">
              <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-100 max-w-md mx-auto rotate-2 hover:rotate-0 transition-transform duration-500">
                <div className="flex items-start gap-4 mb-4">
                  <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500">
                    NA
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Nneka A.</h4>
                    <div className="flex items-center gap-2">
                      <StarRating rating={5} size={14} />
                      <span className="text-xs text-slate-500">Verified Patient</span>
                    </div>
                  </div>
                </div>
                <p className="text-slate-600 mb-4">
                  "The maternity ward at Reddington was exceptional. The nurses were attentive and the facilities were world-class. Highly recommended!"
                </p>
                <div className="flex gap-2">
                  <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">Maternity</span>
                  <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">Cleanliness</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Employee Section */}
      <section className="py-20 bg-white border-t border-slate-100">
        <div className="container px-4 mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center md:flex-row-reverse">
             <div className="order-2 md:order-1 relative">
               {/* Abstract visual for employee reviews - maybe a salary chart mock */}
               <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 max-w-md mx-auto -rotate-1 hover:rotate-0 transition-transform duration-500">
                 <div className="space-y-4">
                   <div className="flex justify-between items-center border-b pb-4">
                     <span className="font-medium text-slate-700">Senior Registrar</span>
                     <span className="font-bold text-primary">₦250k - ₦350k</span>
                   </div>
                   <div className="space-y-2">
                     <div className="flex justify-between text-sm">
                       <span className="text-slate-500">Work-Life Balance</span>
                       <StarRating rating={2} size={12} />
                     </div>
                     <div className="flex justify-between text-sm">
                       <span className="text-slate-500">Management</span>
                       <StarRating rating={4} size={12} />
                     </div>
                     <div className="flex justify-between text-sm">
                       <span className="text-slate-500">Career Growth</span>
                       <StarRating rating={5} size={12} />
                     </div>
                   </div>
                 </div>
               </div>
            </div>
            <div className="order-1 md:order-2 space-y-6">
              <div className="inline-block px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-sm font-medium">
                For Healthcare Professionals
              </div>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900">
                See what it's like to work there.
              </h2>
              <p className="text-lg text-slate-600 leading-relaxed">
                Get the inside scoop on salaries, culture, and management before you apply. Anonymous reviews from current and former employees.
              </p>
               <ul className="space-y-4">
                {[
                  "Salary transparency",
                  "Work culture insights",
                  "Management ratings"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="h-6 w-6 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                      <Briefcase size={14} />
                    </div>
                    <span className="text-slate-700">{item}</span>
                  </li>
                ))}
              </ul>
              <Button size="lg" className="bg-slate-900 text-white hover:bg-slate-800">
                Write an Employee Review
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Top Rated Section */}
      <section className="py-20 bg-slate-50">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-serif font-bold text-slate-900 mb-4">Top Rated Hospitals</h2>
            <p className="text-slate-600">Based on verified patient reviews</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {topHospitals.map((hospital) => (
              <Link key={hospital.id} href={`/hospital/${hospital.id}`} className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 flex flex-col h-full">
                <div className="h-48 overflow-hidden relative">
                  <img 
                    src={hospital.images[0]} 
                    alt={hospital.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-2 py-1 rounded-md shadow-sm flex items-center gap-1">
                    <Star className="w-4 h-4 text-accent fill-accent" />
                    <span className="font-bold text-slate-900">{hospital.ratingPatient}</span>
                  </div>
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <div className="mb-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-primary/80">{hospital.type}</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                    {hospital.name}
                  </h3>
                  <div className="flex items-center text-slate-500 text-sm mb-4">
                    <MapPin className="w-4 h-4 mr-1" />
                    {hospital.city}, {hospital.state}
                  </div>
                  <div className="mt-auto flex flex-wrap gap-2">
                    {hospital.tags.slice(0, 2).map(tag => (
                      <span key={tag} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link href="/search">
              <Button variant="outline" size="lg" className="min-w-[200px]">
                View All Hospitals
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
