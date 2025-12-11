import { useState, useMemo, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { MOCK_HOSPITALS, Hospital } from "@/lib/mockData";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { StarRating } from "@/components/star-rating";
import { MapPin, Search as SearchIcon, Filter, SlidersHorizontal, Map, Navigation, Loader2, ShieldCheck, Award, Star, Briefcase } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Haversine formula to calculate distance
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2-lat1);  // deg2rad below
  var dLon = deg2rad(lon2-lon1); 
  var a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number) {
  return deg * (Math.PI/180);
}

// Helper to determine Safety Grade based on rating
function getSafetyGrade(rating: number) {
  if (rating >= 4.5) return { grade: 'A', color: 'bg-green-600' };
  if (rating >= 4.0) return { grade: 'B', color: 'bg-green-500' };
  if (rating >= 3.0) return { grade: 'C', color: 'bg-yellow-500' };
  if (rating >= 2.0) return { grade: 'D', color: 'bg-orange-500' };
  return { grade: 'F', color: 'bg-red-500' };
}

export default function SearchPage() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const initialQuery = searchParams.get("q") || "";
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("rating");
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [visibleCount, setVisibleCount] = useState(6); // For "Load More" simulation

  // Get unique states and types for filters
  const allStates = Array.from(new Set(MOCK_HOSPITALS.map(h => h.state)));
  const allTypes = Array.from(new Set(MOCK_HOSPITALS.map(h => h.type)));

  const handleNearMe = () => {
    if (!navigator.geolocation) {
      toast({ title: "Error", description: "Geolocation is not supported by your browser", variant: "destructive" });
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setSortBy("distance");
        setIsLocating(false);
        toast({ title: "Location found", description: "Showing hospitals near you" });
      },
      (error) => {
        setIsLocating(false);
        toast({ title: "Error", description: "Unable to retrieve your location", variant: "destructive" });
      }
    );
  };

  const filteredHospitals = useMemo(() => {
    let filtered = MOCK_HOSPITALS.filter(hospital => {
      const matchesSearch = 
        hospital.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        hospital.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        hospital.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesState = selectedStates.length === 0 || selectedStates.includes(hospital.state);
      const matchesType = selectedTypes.length === 0 || selectedTypes.includes(hospital.type);

      return matchesSearch && matchesState && matchesType;
    });

    if (sortBy === "distance" && userLocation) {
      return filtered.sort((a, b) => {
        const distA = getDistanceFromLatLonInKm(userLocation.lat, userLocation.lng, a.latitude, a.longitude);
        const distB = getDistanceFromLatLonInKm(userLocation.lat, userLocation.lng, b.latitude, b.longitude);
        return distA - distB;
      });
    } else {
      return filtered.sort((a, b) => {
        if (sortBy === "rating") return b.ratingPatient - a.ratingPatient;
        if (sortBy === "reviews") return b.reviewCountPatient - a.reviewCountPatient;
        if (sortBy === "name") return a.name.localeCompare(b.name);
        return 0;
      });
    }
  }, [searchQuery, selectedStates, selectedTypes, sortBy, userLocation]);

  const toggleState = (state: string) => {
    setSelectedStates(prev => 
      prev.includes(state) ? prev.filter(s => s !== state) : [...prev, state]
    );
  };

  const toggleType = (type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="bg-white border-b sticky top-0 z-30 shadow-sm">
        <div className="container mx-auto px-4 py-4">
           <div className="flex flex-col md:flex-row gap-4 items-center">
             <div className="relative flex-1 w-full">
                <SearchIcon className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                <Input 
                  placeholder="Search by name, specialty, or city..." 
                  className="pl-10 h-10 bg-slate-50 border-slate-200"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                 <Button 
                    variant={sortBy === "distance" ? "default" : "outline"}
                    size="sm"
                    onClick={handleNearMe}
                    disabled={isLocating}
                    className="gap-2 whitespace-nowrap"
                  >
                    {isLocating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
                    Near Me
                  </Button>
                   <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[160px] h-10">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rating">Highest Rated</SelectItem>
                      <SelectItem value="reviews">Most Reviews</SelectItem>
                      <SelectItem value="distance" disabled={!userLocation}>Nearest Location</SelectItem>
                      <SelectItem value="name">Name (A-Z)</SelectItem>
                    </SelectContent>
                  </Select>
              </div>
           </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-[260px_1fr] gap-8">
          {/* Sidebar Filters */}
          <aside className="hidden md:block space-y-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm sticky top-24">
              <div className="flex items-center gap-2 font-bold text-slate-900 mb-4">
                <Filter className="h-4 w-4" />
                Filters
              </div>
              
              <div className="space-y-5">
                <div>
                  <h3 className="font-semibold text-sm text-slate-900 mb-3">State</h3>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {allStates.map(state => (
                      <div key={state} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`state-${state}`} 
                          checked={selectedStates.includes(state)}
                          onCheckedChange={() => toggleState(state)}
                        />
                        <Label htmlFor={`state-${state}`} className="text-sm font-normal text-slate-600 cursor-pointer">
                          {state}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold text-sm text-slate-900 mb-3">Hospital Type</h3>
                  <div className="space-y-2">
                    {allTypes.map(type => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`type-${type}`} 
                          checked={selectedTypes.includes(type)}
                          onCheckedChange={() => toggleType(type)}
                        />
                        <Label htmlFor={`type-${type}`} className="text-sm font-normal text-slate-600 cursor-pointer">
                          {type}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 text-center">
               <h3 className="font-bold text-primary mb-2">Can't find a hospital?</h3>
               <p className="text-sm text-slate-600 mb-4">Help the community by adding it to our database.</p>
               <Link href="/suggest-hospital">
                 <Button variant="outline" className="w-full bg-white border-primary/20 text-primary hover:bg-primary/5">
                   + Add Hospital
                 </Button>
               </Link>
            </div>
          </aside>

          {/* Results Grid */}
          <div className="space-y-6">
            <div className="flex justify-between items-center text-slate-500 text-sm bg-white p-3 rounded-lg border shadow-sm">
              <span>Showing <span className="font-bold text-slate-900">{Math.min(visibleCount, filteredHospitals.length)}</span> of {filteredHospitals.length} hospitals</span>
              {userLocation && <span className="text-green-600 flex items-center gap-1 font-medium"><MapPin className="h-3 w-3" /> Location active</span>}
            </div>

            <div className="space-y-4">
              {filteredHospitals.slice(0, visibleCount).map(hospital => {
                const safety = getSafetyGrade(hospital.ratingPatient);
                return (
                  <Link key={hospital.id} href={`/hospital/${hospital.id}`} className="block bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-lg transition-all duration-300 group hover:border-primary/30 relative overflow-hidden">
                    {/* Top "Best" Badge logic could go here */}
                    {hospital.ratingPatient >= 4.5 && (
                      <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-1 rounded-bl-lg z-10 flex items-center gap-1">
                        <Award className="w-3 h-3" /> TOP RATED
                      </div>
                    )}

                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="w-full md:w-56 h-40 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0 relative">
                        <img 
                          src={hospital.images[0]} 
                          alt={hospital.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur px-2 py-0.5 rounded text-xs font-semibold text-slate-700">
                           {hospital.images.length} photos
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2 mb-2">
                          <div>
                             <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <Badge variant="outline" className="font-normal text-slate-500 border-slate-300">
                                  {hospital.type}
                                </Badge>
                                <span className="text-sm text-slate-500 flex items-center">
                                  <MapPin className="w-3 h-3 mr-1" />
                                  {hospital.city}, {hospital.state}
                                </span>
                                {userLocation && (
                                  <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                                    {getDistanceFromLatLonInKm(userLocation.lat, userLocation.lng, hospital.latitude, hospital.longitude).toFixed(1)} km
                                  </span>
                                )}
                             </div>
                             <h3 className="text-xl font-bold text-slate-900 group-hover:text-primary transition-colors font-serif truncate">
                               {hospital.name}
                             </h3>
                          </div>
                          
                          <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-lg border border-slate-100 shrink-0">
                             <div className="text-right">
                               <div className="text-xs text-slate-500 uppercase font-semibold">Patient Score</div>
                               <div className="flex items-center justify-end gap-1">
                                 <span className="font-bold text-xl text-slate-900">{hospital.ratingPatient}</span>
                                 <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                               </div>
                             </div>
                             <div className={`w-12 h-12 ${safety.color} rounded-lg flex flex-col items-center justify-center text-white shadow-sm`}>
                                <span className="text-xs font-medium opacity-80">Grade</span>
                                <span className="text-xl font-bold leading-none">{safety.grade}</span>
                             </div>
                          </div>
                        </div>

                        <p className="text-slate-600 text-sm line-clamp-2 mb-4">
                          {hospital.description}
                        </p>

                        <div className="flex flex-wrap gap-2 mb-4">
                          {hospital.services.slice(0, 4).map(service => (
                            <span key={service} className="text-xs bg-slate-50 text-slate-600 px-2 py-1 rounded border border-slate-100">
                              {service}
                            </span>
                          ))}
                          {hospital.services.length > 4 && (
                            <span className="text-xs text-slate-400 px-2 py-1">+ {hospital.services.length - 4} more</span>
                          )}
                        </div>
                        
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-1 text-xs text-slate-500">
                                <Briefcase className="w-3 h-3" />
                                <span>Employee Rating: <strong>{hospital.ratingEmployee}/5</strong> ({hospital.reviewCountEmployee})</span>
                            </div>
                            <span className="text-xs font-semibold text-primary group-hover:underline">View Profile &rarr;</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}

              {filteredHospitals.length === 0 && (
                <div className="text-center py-16 bg-white rounded-xl border border-dashed">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <SearchIcon className="h-8 w-8 text-slate-300" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">No hospitals found</h3>
                  <p className="text-slate-500 max-w-sm mx-auto mt-2">We couldn't find any hospitals matching your criteria. Try adjusting your filters or search terms.</p>
                  <div className="mt-6">
                    <Button variant="outline" onClick={() => {
                       setSearchQuery("");
                       setSelectedStates([]);
                       setSelectedTypes([]);
                    }}>
                      Clear Filters
                    </Button>
                  </div>
                </div>
              )}

              {filteredHospitals.length > visibleCount && (
                <div className="text-center pt-8">
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="min-w-[200px] bg-white hover:bg-slate-50"
                    onClick={() => setVisibleCount(prev => prev + 6)}
                  >
                    Load More Hospitals
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
