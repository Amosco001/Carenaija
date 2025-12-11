import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Activity, Star, Stethoscope, Briefcase, Heart, Baby, Bone, Brain, Eye, ShieldCheck, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import { MOCK_HOSPITALS } from "@/lib/mockData";
import { StarRating } from "@/components/star-rating";
import { Link } from "wouter";
import generatedHeroImage from "@assets/generated_images/modern_nigerian_hospital_exterior_with_friendly_medical_staff_interaction.png";
import { Card, CardContent } from "@/components/ui/card";

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

  const specialties = [
    { name: "Maternity", icon: Baby, color: "text-pink-500", bg: "bg-pink-50" },
    { name: "Cardiology", icon: Heart, color: "text-red-500", bg: "bg-red-50" },
    { name: "Orthopedics", icon: Bone, color: "text-slate-500", bg: "bg-slate-50" },
    { name: "Neurology", icon: Brain, color: "text-purple-500", bg: "bg-purple-50" },
    { name: "Eye Care", icon: Eye, color: "text-blue-500", bg: "bg-blue-50" },
    { name: "General", icon: Stethoscope, color: "text-green-500", bg: "bg-green-50" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative h-[550px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={generatedHeroImage} 
            alt="Hospital Background" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-slate-900/80" />
        </div>

        <div className="container relative z-10 px-4 mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-6 leading-tight animate-in slide-in-from-bottom-5 duration-700">
              Find the right care, <br/>
              <span className="text-primary-foreground/90">right now.</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-200 mb-10 max-w-2xl mx-auto animate-in slide-in-from-bottom-5 duration-700 delay-150">
              Compare hospital ratings, safety grades, and employee reviews across Nigeria.
            </p>

            <form onSubmit={handleSearch} className="bg-white p-2 rounded-full shadow-2xl flex flex-col md:flex-row gap-2 animate-in slide-in-from-bottom-5 duration-700 delay-300 max-w-3xl mx-auto">
              <div className="flex-1 relative group">
                <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                <Input 
                  placeholder="Doctor, condition, procedure or hospital..." 
                  className="pl-12 border-0 shadow-none focus-visible:ring-0 text-base h-12 bg-transparent rounded-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="w-px bg-slate-200 hidden md:block my-2" />
              <div className="flex-1 relative md:max-w-[250px] group">
                <MapPin className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                <Input 
                  placeholder="Lagos, Nigeria" 
                  className="pl-12 border-0 shadow-none focus-visible:ring-0 text-base h-12 bg-transparent rounded-full"
                />
              </div>
              <Button type="submit" size="lg" className="h-12 px-8 text-base font-semibold rounded-full bg-primary hover:bg-primary/90 transition-all">
                Search
              </Button>
            </form>

            <div className="mt-8 flex flex-wrap justify-center gap-3 animate-in slide-in-from-bottom-5 duration-700 delay-500">
              <span className="text-slate-300 text-sm font-medium mr-2 self-center">Popular:</span>
              {["Maternity", "Cardiology", "Lagos", "Abuja", "Teaching Hospitals"].map((tag) => (
                <Link key={tag} href={`/search?q=${tag}`} className="bg-white/10 hover:bg-white/20 text-white px-4 py-1.5 rounded-full text-sm backdrop-blur-sm transition-colors border border-white/10">
                  {tag}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Specialties Grid */}
      <section className="py-16 bg-slate-50">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-slate-900 mb-4">Browse by Specialty</h2>
            <p className="text-slate-600">Find hospitals known for specific treatments</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {specialties.map((spec) => (
              <Link key={spec.name} href={`/search?q=${spec.name}`}>
                <Card className="hover:shadow-md transition-all duration-300 cursor-pointer border-slate-200 hover:border-primary/50 group bg-white h-full">
                  <CardContent className="flex flex-col items-center justify-center p-6 h-full">
                    <div className={`w-12 h-12 rounded-full ${spec.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <spec.icon className={`h-6 w-6 ${spec.color}`} />
                    </div>
                    <span className="font-medium text-slate-700 group-hover:text-primary">{spec.name}</span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Indicators / Features */}
      <section className="py-20 bg-white">
        <div className="container px-4 mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 space-y-4">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto text-blue-600 mb-4">
                <Star className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Patient Reviews</h3>
              <p className="text-slate-600 leading-relaxed">
                See what real patients say about their experience, from wait times to bedside manner.
              </p>
            </div>
            <div className="text-center p-6 space-y-4">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto text-green-600 mb-4">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Verified Listings</h3>
              <p className="text-slate-600 leading-relaxed">
                We verify hospital information to ensure you have accurate details on location and services.
              </p>
            </div>
            <div className="text-center p-6 space-y-4">
              <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto text-orange-600 mb-4">
                <Briefcase className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Employee Insights</h3>
              <p className="text-slate-600 leading-relaxed">
                Get the inside scoop on work culture and salary transparency from healthcare staff.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Top Rated Section */}
      <section className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="container px-4 mx-auto">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-serif font-bold text-slate-900 mb-2">Top Rated Hospitals</h2>
              <p className="text-slate-600">Highest rated by patients for care quality</p>
            </div>
            <Link href="/search">
              <Button variant="outline" className="hidden md:flex">
                View All <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {topHospitals.map((hospital) => (
              <Link key={hospital.id} href={`/hospital/${hospital.id}`} className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-200 flex flex-col h-full">
                <div className="h-48 overflow-hidden relative">
                  <img 
                    src={hospital.images[0]} 
                    alt={hospital.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4 bg-white/95 backdrop-blur px-3 py-1 rounded-full shadow-sm">
                    <span className="text-xs font-bold uppercase tracking-wide text-primary">{hospital.type}</span>
                  </div>
                  <div className="absolute bottom-4 right-4 bg-green-600 text-white px-3 py-1 rounded-md shadow-lg flex items-center gap-1">
                    <span className="font-bold text-lg">{hospital.ratingPatient}</span>
                    <Star className="w-3 h-3 fill-current" />
                  </div>
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="text-xl font-bold text-slate-900 mb-2 line-clamp-2 group-hover:text-primary transition-colors font-serif">
                    {hospital.name}
                  </h3>
                  <div className="flex items-center text-slate-500 text-sm mb-4">
                    <MapPin className="w-4 h-4 mr-1 text-slate-400" />
                    {hospital.city}, {hospital.state}
                  </div>
                  
                  <div className="mt-auto space-y-4">
                     <div className="flex flex-wrap gap-2">
                      {hospital.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-xs bg-slate-50 text-slate-600 border border-slate-100 px-2 py-1 rounded-md">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          
          <div className="text-center mt-12 md:hidden">
            <Link href="/search">
              <Button variant="outline" size="lg" className="w-full">
                View All Hospitals
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-white">
        <div className="container px-4 mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6">
            Help improve Nigerian Healthcare
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Your review could save a life. Share your recent hospital experience to help others make better decisions.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/search">
              <Button size="lg" variant="secondary" className="h-14 px-8 text-lg font-semibold text-primary bg-white hover:bg-slate-100">
                Write a Review
              </Button>
            </Link>
            <Link href="/suggest-hospital">
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-semibold border-white text-white hover:bg-white/10">
                Suggest a Hospital
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
