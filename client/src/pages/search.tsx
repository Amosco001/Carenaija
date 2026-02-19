import { useState, useMemo, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useHospitals, useHmoProviders } from "@/hooks/useHospitals";
import { getHospitalUrl } from "@shared/schema";
import type { Hospital } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/seo-head";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { HospitalCard } from "@/components/hospital-card";
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
import { MapPin, Search as SearchIcon, Filter, Navigation, Loader2, ShieldCheck, Star, X, ChevronLeft, ChevronRight, Building2, Clock, Stethoscope, List, Map as MapIcon, Crosshair, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import luthHospitalImage from "@assets/generated_images/luth_hospital_lagos_nigeria.png";
import neuropsychHospitalImage from "@assets/generated_images/neuropsychiatric_hospital_yaba.png";
import orthoHospitalImage from "@assets/generated_images/orthopaedic_hospital_igbobi.png";
import { SkeletonCard } from "@/components/skeleton-card";
import { useGeolocation, formatDistance, getGoogleMapsDirectionsUrl } from "@/hooks/useGeolocation";
import { MapView, StaticMapFallback } from "@/components/map-view";
import { Breadcrumb } from "@/components/breadcrumb";

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

const FALLBACK_INSURANCE_OPTIONS = [
  "NHIS",
  "AXA Mansard",
  "Avon HMO",
  "Clearline HMO",
  "Hygeia HMO",
  "Leadway Health",
  "Mediplan",
  "Reliance HMO",
  "Total Health Trust",
];

const RADIUS_OPTIONS = [
  { value: 1, label: "1 km" },
  { value: 5, label: "5 km" },
  { value: 10, label: "10 km" },
  { value: 25, label: "25 km" },
  { value: 50, label: "50 km" },
  { value: 0, label: "Any distance" },
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
  const [selectedInsurance, setSelectedInsurance] = useState<string[]>([]);
  const [minRating, setMinRating] = useState<number>(0);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sortBy, setSortBy] = useState("rating");
  const [currentPage, setCurrentPage] = useState(1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [selectedRadius, setSelectedRadius] = useState<number>(0);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const { 
    coords: userLocation, 
    isLoading: isLocating, 
    error: locationError,
    permissionState,
    requestLocation,
    hasLocation 
  } = useGeolocation();

  const { data: hospitals = [], isLoading } = useHospitals();
  const { data: hmoProviders } = useHmoProviders();
  const insuranceOptions = hmoProviders && hmoProviders.length > 0 ? hmoProviders : FALLBACK_INSURANCE_OPTIONS;

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
      .map(h => ({ type: "hospital" as const, value: h.name, id: h.id, slug: h.slug, state: h.state }));
    
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
  }, [searchQuery, locationQuery, selectedOwnership, selectedState, selectedFacilities, selectedInsurance, minRating, verifiedOnly, sortBy]);

  const handleNearMe = () => {
    requestLocation();
    setSortBy("distance");
    if (!hasLocation && !isLocating) {
      toast({ title: "Finding your location", description: "Please allow location access when prompted" });
    }
  };

  useEffect(() => {
    if (hasLocation && sortBy !== "distance") {
      setSortBy("distance");
      toast({ title: "Location found", description: "Showing hospitals near you" });
    }
  }, [hasLocation]);

  useEffect(() => {
    if (locationError) {
      toast({ title: "Location Error", description: locationError, variant: "destructive" });
    }
  }, [locationError]);

  const getHospitalDistance = (hospital: Hospital): number | null => {
    if (!userLocation || !hospital.latitude || !hospital.longitude) return null;
    return getDistanceFromLatLonInKm(userLocation.lat, userLocation.lng, hospital.latitude, hospital.longitude);
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

      const matchesInsurance = selectedInsurance.length === 0 ||
        selectedInsurance.some(ins => 
          hospital.acceptedHmos && hospital.acceptedHmos.some(hmo => hmo.toLowerCase() === ins.toLowerCase())
        );

      let matchesRadius = true;
      if (selectedRadius > 0 && userLocation && hospital.latitude && hospital.longitude) {
        const distance = getDistanceFromLatLonInKm(userLocation.lat, userLocation.lng, hospital.latitude, hospital.longitude);
        matchesRadius = distance <= selectedRadius;
      }

      return matchesSearch && matchesLocation && matchesOwnership && matchesState && 
             matchesRating && matchesVerified && matchesFacilities && matchesInsurance && matchesRadius;
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
  }, [hospitals, searchQuery, locationQuery, selectedOwnership, selectedState, selectedFacilities, selectedInsurance, minRating, verifiedOnly, sortBy, userLocation, selectedRadius]);

  const totalPages = Math.ceil(filteredHospitals.length / RESULTS_PER_PAGE);
  const paginatedHospitals = filteredHospitals.slice(
    (currentPage - 1) * RESULTS_PER_PAGE,
    currentPage * RESULTS_PER_PAGE
  );

  const activeFiltersCount = [
    selectedOwnership.length > 0,
    selectedState !== "All",
    selectedFacilities.length > 0,
    selectedInsurance.length > 0,
    minRating > 0,
    verifiedOnly,
    selectedRadius > 0,
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setSearchQuery("");
    setLocationQuery("");
    setSelectedOwnership([]);
    setSelectedState("All");
    setSelectedFacilities([]);
    setSelectedInsurance([]);
    setMinRating(0);
    setVerifiedOnly(false);
    setSelectedRadius(0);
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

      <Separator />

      <div>
        <h3 className="font-semibold text-sm text-slate-900 mb-3">Insurance / HMO</h3>
        <div className="space-y-2 max-h-[200px] overflow-y-auto">
          {insuranceOptions.map(insurance => (
            <div key={insurance} className="flex items-center space-x-2">
              <Checkbox
                id={`insurance-${insurance}`}
                checked={selectedInsurance.includes(insurance)}
                onCheckedChange={() => {
                  setSelectedInsurance(prev =>
                    prev.includes(insurance) ? prev.filter(i => i !== insurance) : [...prev, insurance]
                  );
                }}
                data-testid={`checkbox-insurance-${insurance.toLowerCase().replace(/\s+/g, '-')}`}
              />
              <Label htmlFor={`insurance-${insurance}`} className="text-sm cursor-pointer">
                {insurance}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Distance/Radius Filter */}
      <div>
        <h3 className="font-semibold text-sm text-slate-900 mb-3">Distance</h3>
        {!hasLocation ? (
          <div className="space-y-3">
            <p className="text-xs text-slate-500">Enable location to filter by distance</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full gap-2" 
              onClick={handleNearMe}
              disabled={isLocating}
              data-testid="button-enable-location"
            >
              {isLocating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Crosshair className="w-4 h-4" />
              )}
              {isLocating ? "Finding location..." : "Find hospitals near me"}
            </Button>
            {permissionState === "denied" && (
              <p className="text-xs text-red-500">Location access denied. Please enable in browser settings.</p>
            )}
          </div>
        ) : (
          <Select value={selectedRadius.toString()} onValueChange={(v) => setSelectedRadius(Number(v))}>
            <SelectTrigger className="w-full" data-testid="select-radius">
              <SelectValue placeholder="Any distance" />
            </SelectTrigger>
            <SelectContent>
              {RADIUS_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value.toString()}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
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
        keywords={`hospitals ${selectedState !== "All" ? selectedState : "Nigeria"}, hospital reviews, Nigerian healthcare, ${searchQuery || "medical facilities"}, best hospitals ${selectedState !== "All" ? `in ${selectedState}` : "near me Nigeria"}, hospitals that accept NHIS, HMO hospitals ${selectedState !== "All" ? selectedState : "Nigeria"}, private hospitals ${selectedState !== "All" ? selectedState : "Nigeria"}, government hospitals ${selectedState !== "All" ? selectedState : "Nigeria"}, specialist hospitals`}
        canonicalUrl={`https://www.carenaija.com/search${searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ""}`}
        structuredData={hospitals && hospitals.length > 0 ? [{
          "@context": "https://schema.org",
          "@type": "ItemList",
          "name": `Hospitals ${selectedState !== "All" ? `in ${selectedState}` : "in Nigeria"}`,
          "description": seoDescription,
          "numberOfItems": hospitals.length,
          "itemListElement": hospitals.slice(0, 10).map((h: any, i: number) => ({
            "@type": "ListItem",
            "position": i + 1,
            "item": {
              "@type": "MedicalOrganization",
              "name": h.name,
              "address": {
                "@type": "PostalAddress",
                "addressLocality": h.lga,
                "addressRegion": h.state,
                "addressCountry": "NG"
              },
              ...(h.averageRating ? {
                "aggregateRating": {
                  "@type": "AggregateRating",
                  "ratingValue": h.averageRating,
                  "bestRating": 5,
                  "ratingCount": h.totalReviews || 1
                }
              } : {}),
              "url": `https://www.carenaija.com/hospitals/${h.state?.toLowerCase().replace(/\s+/g, '-')}/${h.slug || h.id}`
            }
          }))
        }] : undefined}
      />
      <Breadcrumb items={[
        { label: "Find Hospitals in Nigeria" },
        ...(selectedState !== "All" ? [{ label: `Hospitals in ${selectedState}`, href: `/hospitals/${selectedState.toLowerCase().replace(/\s+/g, '-')}` }] : []),
        ...(searchQuery ? [{ label: searchQuery }] : []),
      ]} />
      {/* Search Header */}
      <div className="bg-white border-b sticky top-0 z-30 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <h1 className="sr-only">{searchQuery ? `${searchQuery} - Hospital Reviews Nigeria` : selectedState !== "All" ? `Best Hospitals in ${selectedState} Nigeria` : "Search Hospitals & Read Reviews Across Nigeria"}</h1>
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
                            setLocation(getHospitalUrl({ id: s.id!, slug: s.slug, state: s.state! }));
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

              <div className="flex items-center gap-2">
                {/* View Toggle */}
                <div className="hidden md:flex border rounded-lg overflow-hidden">
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    className={`rounded-none h-9 ${viewMode === "list" ? "bg-emerald-600 hover:bg-emerald-700" : ""}`}
                    onClick={() => setViewMode("list")}
                    data-testid="button-view-list"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === "map" ? "default" : "ghost"}
                    size="sm"
                    className={`rounded-none h-9 ${viewMode === "map" ? "bg-emerald-600 hover:bg-emerald-700" : ""}`}
                    onClick={() => setViewMode("map")}
                    data-testid="button-view-map"
                  >
                    <MapIcon className="w-4 h-4" />
                  </Button>
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
                  <HospitalCard
                    key={hospital.id}
                    hospital={hospital}
                    imageUrl={hospitalImages[index % hospitalImages.length]}
                    variant="list"
                  />
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
