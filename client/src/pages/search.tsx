import { useState, useMemo, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useHospitals } from "@/hooks/useHospitals";
import type { Hospital } from "@/lib/types";
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
import { MapPin, Search as SearchIcon, Filter, SlidersHorizontal, Map, Navigation, Loader2, ShieldCheck, Award, Star, Briefcase, ExternalLink } from "lucide-react";
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

export default function SearchPage() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const initialQuery = searchParams.get("q") || "";
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedOwnership, setSelectedOwnership] = useState<string[]>([]);
  const [selectedLGAs, setSelectedLGAs] = useState<string[]>([]);
  const [selectedState, setSelectedState] = useState<string>("All");
  const [sortBy, setSortBy] = useState("name");
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const { data: hospitals = [], isLoading } = useHospitals();

  const allStates = ["All", ...Array.from(new Set(hospitals.map(h => h.state))).sort()];
  const allLGAs = Array.from(new Set(hospitals.filter(h => selectedState === "All" || h.state === selectedState).map(h => h.lga))).sort();
  const allOwnership = Array.from(new Set(hospitals.map(h => h.ownership))).sort();

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
    let filtered = hospitals.filter(hospital => {
      const matchesSearch = 
        hospital.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        hospital.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        hospital.lga.toLowerCase().includes(searchQuery.toLowerCase()) ||
        hospital.services.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesOwnership = selectedOwnership.length === 0 || selectedOwnership.includes(hospital.ownership);
      const matchesLGA = selectedLGAs.length === 0 || selectedLGAs.includes(hospital.lga);
      const matchesState = selectedState === "All" || hospital.state === selectedState;

      return matchesSearch && matchesOwnership && matchesLGA && matchesState;
    });

    if (sortBy === "distance" && userLocation) {
      return filtered.sort((a, b) => {
        if (!a.latitude || !a.longitude || !b.latitude || !b.longitude) return 0;
        const distA = getDistanceFromLatLonInKm(userLocation.lat, userLocation.lng, a.latitude, a.longitude);
        const distB = getDistanceFromLatLonInKm(userLocation.lat, userLocation.lng, b.latitude, b.longitude);
        return distA - distB;
      });
    } else {
      return filtered.sort((a, b) => {
        if (sortBy === "name") return a.name.localeCompare(b.name);
        if (sortBy === "bedCapacity") return (b.bedCapacity || 0) - (a.bedCapacity || 0);
        return 0;
      });
    }
  }, [hospitals, searchQuery, selectedOwnership, selectedLGAs, selectedState, sortBy, userLocation]);

  const toggleLGA = (lga: string) => {
    setSelectedLGAs(prev => 
      prev.includes(lga) ? prev.filter(l => l !== lga) : [...prev, lga]
    );
  };

  const toggleOwnership = (ownership: string) => {
    setSelectedOwnership(prev => 
      prev.includes(ownership) ? prev.filter(o => o !== ownership) : [...prev, ownership]
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
                      <SelectItem value="name">Name (A-Z)</SelectItem>
                      <SelectItem value="bedCapacity">Bed Capacity</SelectItem>
                      <SelectItem value="distance" disabled={!userLocation}>Nearest Location</SelectItem>
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
                  <Select value={selectedState} onValueChange={(value) => { setSelectedState(value); setSelectedLGAs([]); }}>
                    <SelectTrigger className="w-full" data-testid="select-state">
                      <SelectValue placeholder="Select State" />
                    </SelectTrigger>
                    <SelectContent>
                      {allStates.map(state => (
                        <SelectItem key={state} value={state} data-testid={`option-state-${state}`}>
                          {state === "All" ? "All States" : state} {state !== "All" && `(${hospitals.filter(h => h.state === state).length})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold text-sm text-slate-900 mb-3">Ownership</h3>
                  <div className="space-y-2">
                    {allOwnership.map(ownership => (
                      <div key={ownership} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`ownership-${ownership}`} 
                          checked={selectedOwnership.includes(ownership)}
                          onCheckedChange={() => toggleOwnership(ownership)}
                          data-testid={`checkbox-ownership-${ownership}`}
                        />
                        <Label htmlFor={`ownership-${ownership}`} className="text-sm font-normal text-slate-600 cursor-pointer">
                          {ownership}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold text-sm text-slate-900 mb-3">Local Government Area</h3>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                    {allLGAs.map(lga => (
                      <div key={lga} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`lga-${lga}`} 
                          checked={selectedLGAs.includes(lga)}
                          onCheckedChange={() => toggleLGA(lga)}
                          data-testid={`checkbox-lga-${lga}`}
                        />
                        <Label htmlFor={`lga-${lga}`} className="text-sm font-normal text-slate-600 cursor-pointer">
                          {lga}
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
              <span>Showing <span className="font-bold text-slate-900">{filteredHospitals.length}</span> hospital{filteredHospitals.length !== 1 ? 's' : ''}</span>
              {userLocation && <span className="text-green-600 flex items-center gap-1 font-medium"><MapPin className="h-3 w-3" /> Location active</span>}
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-4">
                {filteredHospitals.map(hospital => {
                return (
                  <div key={hospital.id} onClick={() => window.location.href = `/hospital/${hospital.id}`} className="block bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-lg transition-all duration-300 group hover:border-primary/30 relative overflow-hidden cursor-pointer" data-testid={`card-hospital-${hospital.id}`}>
                    {hospital.verified && (
                      <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg z-10 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> VERIFIED
                      </div>
                    )}

                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="w-full md:w-56 h-40 rounded-lg overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5 flex-shrink-0 relative flex items-center justify-center">
                        <div className="text-center p-4">
                          <MapPin className="h-12 w-12 text-primary/30 mx-auto mb-2" />
                          <p className="text-xs text-slate-500">
                            {hospital.lga}, {hospital.state}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2 mb-2">
                          <div className="flex-1">
                             <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <Badge variant="outline" className="font-normal text-slate-500 border-slate-300">
                                  {hospital.ownership}
                                </Badge>
                                <span className="text-sm text-slate-500 flex items-center">
                                  <MapPin className="w-3 h-3 mr-1" />
                                  {hospital.lga}, {hospital.state}
                                </span>
                                {userLocation && hospital.latitude && hospital.longitude && (
                                  <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                                    {getDistanceFromLatLonInKm(userLocation.lat, userLocation.lng, hospital.latitude, hospital.longitude).toFixed(1)} km
                                  </span>
                                )}
                             </div>
                             <h3 className="text-xl font-bold text-slate-900 group-hover:text-primary transition-colors font-serif" data-testid={`text-hospital-name-${hospital.id}`}>
                               {hospital.name}
                             </h3>
                          </div>
                          
                          {hospital.bedCapacity && (
                            <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 shrink-0 text-center">
                              <div className="text-xs text-slate-500 uppercase font-semibold">Beds</div>
                              <div className="font-bold text-lg text-slate-900">{hospital.bedCapacity}</div>
                            </div>
                          )}
                        </div>

                        <p className="text-slate-600 text-sm mb-3">
                          {hospital.address}
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
                            <div className="flex items-center gap-3">
                              <div className="text-xs text-slate-500">
                                  {hospital.operatingHours && <span>{hospital.operatingHours}</span>}
                              </div>
                              {hospital.latitude && hospital.longitude && (
                                <a 
                                  href={`https://www.google.com/maps?q=${hospital.latitude},${hospital.longitude}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-xs text-primary hover:underline flex items-center gap-1"
                                  data-testid={`link-directions-${hospital.id}`}
                                >
                                  <Navigation className="w-3 h-3" /> Directions
                                </a>
                              )}
                            </div>
                            <span className="text-xs font-semibold text-primary group-hover:underline" data-testid={`link-view-profile-${hospital.id}`}>View Profile &rarr;</span>
                        </div>
                      </div>
                    </div>
                  </div>
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
                       setSelectedLGAs([]);
                       setSelectedOwnership([]);
                       setSelectedState("All");
                    }}>
                      Clear Filters
                    </Button>
                  </div>
                </div>
              )}

            </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
