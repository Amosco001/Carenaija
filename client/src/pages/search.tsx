import { useState, useMemo, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useHospitals } from "@/hooks/useHospitals";
import type { Hospital } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/seo-head";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { MapPin, Search as SearchIcon, Filter, Navigation, Loader2, ShieldCheck, Star, X, ChevronLeft, ChevronRight, Building2, Clock, Stethoscope } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import luthHospitalImage from "@assets/generated_images/luth_hospital_lagos_nigeria.png";
import neuropsychHospitalImage from "@assets/generated_images/neuropsychiatric_hospital_yaba.png";
import orthoHospitalImage from "@assets/generated_images/orthopaedic_hospital_igbobi.png";
import { SkeletonCard } from "@/components/skeleton-card";

const hospitalImages = [luthHospitalImage, neuropsychHospitalImage, orthoHospitalImage];

const RESULTS_PER_PAGE = 20;

const FACILITIES_OPTIONS = [
  "Emergency Care",
  "ICU",
  "Laboratory",
  "Pharmacy",
  "Radiology",
  "Surgery",
  "Maternity",
  "Pediatrics",
];

const SPECIALTIES_OPTIONS = [
  "Cardiology",
  "Orthopedics",
  "Neurology",
  "Pediatrics",
  "Maternity",
  "Eye Care",
  "Dental",
  "General Medicine",
];

function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

export default function SearchPage() {
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const initialQuery = searchParams.get("q") || "";
  const initialLocation = searchParams.get("location") || "";
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [locationQuery, setLocationQuery] = useState(initialLocation);
  const [selectedOwnership, setSelectedOwnership] = useState<string[]>([]);
  const [selectedState, setSelectedState] = useState<string>("All");
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);
  const [minRating, setMinRating] = useState<number>(0);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sortBy, setSortBy] = useState("rating");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { data: hospitals = [], isLoading } = useHospitals();

  const allStates = useMemo(() => 
    ["All", ...Array.from(new Set(hospitals.map(h => h.state))).sort()],
    [hospitals]
  );
  
  const allOwnership = useMemo(() => 
    Array.from(new Set(hospitals.map(h => h.ownership))).sort(),
    [hospitals]
  );

  const suggestions = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];
    const query = searchQuery.toLowerCase();
    const hospitalMatches = hospitals
      .filter(h => h.name.toLowerCase().includes(query))
      .slice(0, 5)
      .map(h => ({ type: "hospital" as const, value: h.name, id: h.id }));
    
    const stateMatches = allStates
      .filter(s => s !== "All" && s.toLowerCase().includes(query))
      .slice(0, 3)
      .map(s => ({ type: "location" as const, value: s }));
    
    const specialtyMatches = SPECIALTIES_OPTIONS
      .filter(s => s.toLowerCase().includes(query))
      .slice(0, 3)
      .map(s => ({ type: "specialty" as const, value: s }));

    return [...hospitalMatches, ...stateMatches, ...specialtyMatches].slice(0, 8);
  }, [searchQuery, hospitals, allStates]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, locationQuery, selectedOwnership, selectedState, selectedFacilities, minRating, verifiedOnly, sortBy]);

  const handleNearMe = () => {
    if (!navigator.geolocation) {
      toast({ title: "Error", description: "Geolocation is not supported", variant: "destructive" });
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        setSortBy("distance");
        setIsLocating(false);
        toast({ title: "Location found", description: "Showing hospitals near you" });
      },
      () => {
        setIsLocating(false);
        toast({ title: "Error", description: "Unable to retrieve location", variant: "destructive" });
      }
    );
  };

  const filteredHospitals = useMemo(() => {
    let filtered = hospitals.filter(hospital => {
      const searchLower = searchQuery.toLowerCase();
      const locationLower = locationQuery.toLowerCase();
      
      const matchesSearch = !searchQuery ||
        hospital.name.toLowerCase().includes(searchLower) ||
        hospital.address.toLowerCase().includes(searchLower) ||
        hospital.services.some(s => s.toLowerCase().includes(searchLower));

      const matchesLocation = !locationQuery ||
        hospital.state.toLowerCase().includes(locationLower) ||
        hospital.lga.toLowerCase().includes(locationLower) ||
        (hospital.city && hospital.city.toLowerCase().includes(locationLower));

      const matchesOwnership = selectedOwnership.length === 0 || selectedOwnership.includes(hospital.ownership);
      const matchesState = selectedState === "All" || hospital.state === selectedState;
      const matchesRating = (hospital.averageRating || 0) >= minRating;
      const matchesVerified = !verifiedOnly || hospital.verified;
      
      const matchesFacilities = selectedFacilities.length === 0 ||
        selectedFacilities.every(f => 
          hospital.services.some(s => s.toLowerCase().includes(f.toLowerCase())) ||
          (hospital.facilities && hospital.facilities.some(fac => fac.toLowerCase().includes(f.toLowerCase())))
        );

      return matchesSearch && matchesLocation && matchesOwnership && matchesState && 
             matchesRating && matchesVerified && matchesFacilities;
    });

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return (b.averageRating || 0) - (a.averageRating || 0);
        case "reviews":
          return (b.totalReviews || 0) - (a.totalReviews || 0);
        case "recent":
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case "distance":
          if (!userLocation) return 0;
          const distA = a.latitude && a.longitude ? getDistanceFromLatLonInKm(userLocation.lat, userLocation.lng, a.latitude, a.longitude) : Infinity;
          const distB = b.latitude && b.longitude ? getDistanceFromLatLonInKm(userLocation.lat, userLocation.lng, b.latitude, b.longitude) : Infinity;
          return distA - distB;
        case "name":
        default:
          return a.name.localeCompare(b.name);
      }
    });
  }, [hospitals, searchQuery, locationQuery, selectedOwnership, selectedState, selectedFacilities, minRating, verifiedOnly, sortBy, userLocation]);

  const totalPages = Math.ceil(filteredHospitals.length / RESULTS_PER_PAGE);
  const paginatedHospitals = filteredHospitals.slice(
    (currentPage - 1) * RESULTS_PER_PAGE,
    currentPage * RESULTS_PER_PAGE
  );

  const activeFiltersCount = [
    selectedOwnership.length > 0,
    selectedState !== "All",
    selectedFacilities.length > 0,
    minRating > 0,
    verifiedOnly,
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setSearchQuery("");
    setLocationQuery("");
    setSelectedOwnership([]);
    setSelectedState("All");
    setSelectedFacilities([]);
    setMinRating(0);
    setVerifiedOnly(false);
  };

  const getRatingStars = (rating: number) => (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className={`w-4 h-4 ${i < Math.round(rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`} />
      ))}
    </div>
  );

  const FilterContent = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-sm text-slate-900 mb-3">Rating</h3>
        <div className="space-y-2">
          {[4, 3, 2, 1].map(rating => (
            <div key={rating} className="flex items-center space-x-2">
              <Checkbox
                id={`rating-${rating}`}
                checked={minRating === rating}
                onCheckedChange={(checked) => setMinRating(checked ? rating : 0)}
                data-testid={`checkbox-rating-${rating}`}
              />
              <Label htmlFor={`rating-${rating}`} className="flex items-center gap-2 cursor-pointer text-sm">
                {getRatingStars(rating)}
                <span className="text-slate-500">& up</span>
              </Label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="font-semibold text-sm text-slate-900 mb-3">Verification</h3>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="verified-only"
            checked={verifiedOnly}
            onCheckedChange={(checked) => setVerifiedOnly(!!checked)}
            data-testid="checkbox-verified"
          />
          <Label htmlFor="verified-only" className="flex items-center gap-2 cursor-pointer text-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Verified hospitals only
          </Label>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="font-semibold text-sm text-slate-900 mb-3">State</h3>
        <Select value={selectedState} onValueChange={setSelectedState}>
          <SelectTrigger className="w-full" data-testid="select-state">
            <SelectValue placeholder="Select State" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {allStates.map(state => (
              <SelectItem key={state} value={state}>
                {state === "All" ? "All States" : state}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      <div>
        <h3 className="font-semibold text-sm text-slate-900 mb-3">Ownership Type</h3>
        <div className="space-y-2">
          {allOwnership.map(ownership => (
            <div key={ownership} className="flex items-center space-x-2">
              <Checkbox
                id={`ownership-${ownership}`}
                checked={selectedOwnership.includes(ownership)}
                onCheckedChange={() => {
                  setSelectedOwnership(prev =>
                    prev.includes(ownership) ? prev.filter(o => o !== ownership) : [...prev, ownership]
                  );
                }}
                data-testid={`checkbox-ownership-${ownership}`}
              />
              <Label htmlFor={`ownership-${ownership}`} className="text-sm cursor-pointer">
                {ownership}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="font-semibold text-sm text-slate-900 mb-3">Facilities</h3>
        <div className="space-y-2 max-h-[200px] overflow-y-auto">
          {FACILITIES_OPTIONS.map(facility => (
            <div key={facility} className="flex items-center space-x-2">
              <Checkbox
                id={`facility-${facility}`}
                checked={selectedFacilities.includes(facility)}
                onCheckedChange={() => {
                  setSelectedFacilities(prev =>
                    prev.includes(facility) ? prev.filter(f => f !== facility) : [...prev, facility]
                  );
                }}
                data-testid={`checkbox-facility-${facility.toLowerCase().replace(' ', '-')}`}
              />
              <Label htmlFor={`facility-${facility}`} className="text-sm cursor-pointer">
                {facility}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {activeFiltersCount > 0 && (
        <>
          <Separator />
          <Button variant="outline" className="w-full" onClick={clearAllFilters} data-testid="button-clear-filters">
            Clear All Filters
          </Button>
        </>
      )}
    </div>
  );

  const seoTitle = searchQuery 
    ? `Search: ${searchQuery} - Hospitals in Nigeria`
    : selectedState !== "All"
    ? `Best Hospitals in ${selectedState}, Nigeria`
    : "Search Hospitals in Nigeria";
  
  const seoDescription = searchQuery
    ? `Find hospitals for "${searchQuery}" in Nigeria. Compare ratings and read patient reviews.`
    : selectedState !== "All"
    ? `Find the best hospitals in ${selectedState}, Nigeria. Compare ratings, read patient reviews, and make informed healthcare decisions.`
    : "Search and compare hospitals across Nigeria. Read verified patient reviews and ratings for hospitals in Lagos, Abuja, and all Nigerian states.";

  return (
    <div className="bg-slate-50 min-h-screen" data-testid="page-search">
      <SEOHead 
        title={seoTitle}
        description={seoDescription}
        keywords={`hospitals ${selectedState !== "All" ? selectedState : "Nigeria"}, hospital reviews, Nigerian healthcare, ${searchQuery || "medical facilities"}`}
        canonicalUrl={`https://carenaija.replit.app/search${searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ""}`}
      />
      {/* Search Header */}
      <div className="bg-white border-b sticky top-0 z-30 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-3">
              {/* Search Input with Autocomplete */}
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <Input
                  ref={searchInputRef}
                  placeholder="Hospital name, specialty, or condition..."
                  className="pl-10 h-11 bg-slate-50 border-slate-200"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  type="search"
                  inputMode="search"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck="false"
                  data-testid="input-search"
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 overflow-hidden">
                    {suggestions.map((s, i) => (
                      <button
                        key={i}
                        className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center gap-3 border-b border-slate-100 last:border-0"
                        onMouseDown={() => {
                          if (s.type === "hospital") {
                            setLocation(`/hospital/${s.id}`);
                          } else {
                            setSearchQuery(s.value);
                          }
                          setShowSuggestions(false);
                        }}
                        data-testid={`suggestion-${i}`}
                      >
                        {s.type === "hospital" && <Building2 className="w-4 h-4 text-emerald-600" />}
                        {s.type === "location" && <MapPin className="w-4 h-4 text-blue-600" />}
                        {s.type === "specialty" && <Stethoscope className="w-4 h-4 text-purple-600" />}
                        <div>
                          <span className="text-sm font-medium text-slate-900">{s.value}</span>
                          <span className="text-xs text-slate-500 ml-2 capitalize">{s.type}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Location Input */}
              <div className="relative md:w-64">
                <MapPin className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <Input
                  placeholder="City or State"
                  className="pl-10 h-11 bg-slate-50 border-slate-200"
                  value={locationQuery}
                  onChange={(e) => setLocationQuery(e.target.value)}
                  data-testid="input-location"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  variant={sortBy === "distance" ? "default" : "outline"}
                  className="h-11 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={handleNearMe}
                  disabled={isLocating}
                  data-testid="button-near-me"
                >
                  {isLocating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
                  <span className="hidden sm:inline">Near Me</span>
                </Button>

                {/* Mobile Filter Button */}
                <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="h-11 md:hidden relative" data-testid="button-mobile-filters">
                      <Filter className="h-4 w-4 mr-2" />
                      Filters
                      {activeFiltersCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-600 text-white text-xs rounded-full flex items-center justify-center">
                          {activeFiltersCount}
                        </span>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[300px] overflow-y-auto">
                    <SheetHeader>
                      <SheetTitle>Filters</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6">
                      <FilterContent />
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>

            {/* Sort and Results Info */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-slate-600">
                  <span className="font-semibold text-slate-900">{filteredHospitals.length}</span> hospitals found
                </span>
                {activeFiltersCount > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                  >
                    <X className="w-3 h-3" /> Clear filters
                  </button>
                )}
              </div>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px] h-9" data-testid="select-sort">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="reviews">Most Reviewed</SelectItem>
                  <SelectItem value="distance" disabled={!userLocation}>Nearest Location</SelectItem>
                  <SelectItem value="recent">Recently Added</SelectItem>
                  <SelectItem value="name">Name (A-Z)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid md:grid-cols-[280px_1fr] gap-6">
          {/* Desktop Sidebar Filters */}
          <aside className="hidden md:block">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm sticky top-32">
              <div className="flex items-center gap-2 font-bold text-slate-900 mb-5">
                <Filter className="h-4 w-4" />
                Filters
                {activeFiltersCount > 0 && (
                  <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                    {activeFiltersCount}
                  </Badge>
                )}
              </div>
              <FilterContent />
            </div>
          </aside>

          {/* Results */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonCard key={i} variant="horizontal" />
                ))}
              </div>
            ) : paginatedHospitals.length > 0 ? (
              <>
                {paginatedHospitals.map((hospital, index) => (
                  <Link key={hospital.id} href={`/hospital/${hospital.id}`}>
                    <div
                      className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group hover:border-emerald-300 cursor-pointer"
                      data-testid={`card-hospital-${hospital.id}`}
                    >
                      <div className="flex flex-col sm:flex-row">
                        {/* Thumbnail */}
                        <div className="sm:w-48 h-40 sm:h-auto relative overflow-hidden flex-shrink-0">
                          <img
                            src={hospitalImages[index % hospitalImages.length]}
                            alt={hospital.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                          {hospital.verified && (
                            <div className="absolute top-2 left-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3" /> Verified
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 p-4 sm:p-5">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                                <Badge variant="outline" className="font-normal text-xs">
                                  {hospital.ownership}
                                </Badge>
                                <span className="flex items-center">
                                  <MapPin className="w-3 h-3 mr-1" />
                                  {hospital.lga}, {hospital.state}
                                </span>
                              </div>
                              <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1" data-testid={`text-hospital-name-${hospital.id}`}>
                                {hospital.name}
                              </h3>
                            </div>

                            {/* Rating */}
                            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg">
                              <div className="flex items-center gap-1">
                                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                                <span className="font-bold text-slate-900">{(hospital.averageRating || 0).toFixed(1)}</span>
                              </div>
                              <span className="text-xs text-slate-500">({hospital.totalReviews || 0} reviews)</span>
                            </div>
                          </div>

                          {/* Distance if available */}
                          {userLocation && hospital.latitude && hospital.longitude && (
                            <div className="flex items-center gap-1 text-sm text-orange-600 mb-2">
                              <Navigation className="w-3 h-3" />
                              {getDistanceFromLatLonInKm(userLocation.lat, userLocation.lng, hospital.latitude, hospital.longitude).toFixed(1)} km away
                            </div>
                          )}

                          {/* Services/Specialties */}
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {hospital.services.slice(0, 4).map(service => (
                              <span key={service} className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded">
                                {service}
                              </span>
                            ))}
                            {hospital.services.length > 4 && (
                              <span className="text-xs text-slate-400 px-2 py-1">+{hospital.services.length - 4} more</span>
                            )}
                          </div>

                          {/* Footer */}
                          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                            <div className="flex items-center gap-4 text-xs text-slate-500">
                              {hospital.bedCapacity && (
                                <span className="flex items-center gap-1">
                                  <Building2 className="w-3 h-3" />
                                  {hospital.bedCapacity} beds
                                </span>
                              )}
                              {hospital.operatingHours && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {hospital.operatingHours}
                                </span>
                              )}
                            </div>
                            <span className="text-sm font-semibold text-emerald-600 group-hover:underline">
                              View Details →
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      data-testid="button-prev-page"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum: number;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            className={currentPage === pageNum ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                            onClick={() => setCurrentPage(pageNum)}
                            data-testid={`button-page-${pageNum}`}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      data-testid="button-next-page"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                <p className="text-center text-sm text-slate-500 pt-2">
                  Showing {(currentPage - 1) * RESULTS_PER_PAGE + 1}-{Math.min(currentPage * RESULTS_PER_PAGE, filteredHospitals.length)} of {filteredHospitals.length} results
                </p>
              </>
            ) : (
              <div className="text-center py-16 bg-white rounded-xl border border-dashed">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <SearchIcon className="h-8 w-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">No hospitals found</h3>
                <p className="text-slate-500 max-w-sm mx-auto mt-2">
                  Try adjusting your filters or search terms.
                </p>
                <div className="mt-6 flex justify-center gap-3">
                  <Button variant="outline" onClick={clearAllFilters} data-testid="button-clear-all">
                    Clear All Filters
                  </Button>
                  <Link href="/suggest-hospital">
                    <Button className="bg-emerald-600 hover:bg-emerald-700">
                      Suggest a Hospital
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
