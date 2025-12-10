import { useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { MOCK_HOSPITALS } from "@/lib/mockData";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { StarRating } from "@/components/star-rating";
import { MapPin, Search as SearchIcon, Filter, SlidersHorizontal } from "lucide-react";

export default function SearchPage() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const initialQuery = searchParams.get("q") || "";

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("rating");

  // Get unique states and types for filters
  const allStates = Array.from(new Set(MOCK_HOSPITALS.map(h => h.state)));
  const allTypes = Array.from(new Set(MOCK_HOSPITALS.map(h => h.type)));

  const filteredHospitals = useMemo(() => {
    return MOCK_HOSPITALS.filter(hospital => {
      const matchesSearch = 
        hospital.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        hospital.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        hospital.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesState = selectedStates.length === 0 || selectedStates.includes(hospital.state);
      const matchesType = selectedTypes.length === 0 || selectedTypes.includes(hospital.type);

      return matchesSearch && matchesState && matchesType;
    }).sort((a, b) => {
      if (sortBy === "rating") return b.ratingPatient - a.ratingPatient;
      if (sortBy === "reviews") return b.reviewCountPatient - a.reviewCountPatient;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return 0;
    });
  }, [searchQuery, selectedStates, selectedTypes, sortBy]);

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
    <div className="container mx-auto px-4 py-8">
      {/* Search Header */}
      <div className="mb-8 space-y-4">
        <h1 className="text-3xl font-serif font-bold text-slate-900">Find a Hospital</h1>
        <div className="flex gap-4 max-w-2xl">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Search by name, specialty, or city..." 
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rating">Highest Rated</SelectItem>
              <SelectItem value="reviews">Most Reviews</SelectItem>
              <SelectItem value="name">Name (A-Z)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid md:grid-cols-[280px_1fr] gap-8">
        {/* Sidebar Filters */}
        <aside className="space-y-6">
          <div className="bg-white p-6 rounded-lg border shadow-sm space-y-6">
            <div className="flex items-center gap-2 font-semibold text-slate-900">
              <Filter className="h-4 w-4" />
              Filters
            </div>
            
            <Separator />

            <div className="space-y-4">
              <h3 className="font-medium text-sm text-slate-900">State</h3>
              <div className="space-y-2">
                {allStates.map(state => (
                  <div key={state} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`state-${state}`} 
                      checked={selectedStates.includes(state)}
                      onCheckedChange={() => toggleState(state)}
                    />
                    <Label htmlFor={`state-${state}`} className="text-sm font-normal text-slate-600">
                      {state}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="font-medium text-sm text-slate-900">Hospital Type</h3>
              <div className="space-y-2">
                {allTypes.map(type => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`type-${type}`} 
                      checked={selectedTypes.includes(type)}
                      onCheckedChange={() => toggleType(type)}
                    />
                    <Label htmlFor={`type-${type}`} className="text-sm font-normal text-slate-600">
                      {type}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Results Grid */}
        <div className="space-y-6">
          <div className="text-slate-500 text-sm">
            Showing {filteredHospitals.length} results
          </div>

          <div className="space-y-4">
            {filteredHospitals.map(hospital => (
              <Link key={hospital.id} href={`/hospital/${hospital.id}`} className="block bg-white border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow group">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="w-full md:w-48 h-32 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                    <img 
                      src={hospital.images[0]} 
                      alt={hospital.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded">
                              {hospital.type}
                            </span>
                            <span className="text-xs text-slate-500">{hospital.city}, {hospital.state}</span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 group-hover:text-primary transition-colors">
                          {hospital.name}
                        </h3>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-lg text-slate-900">{hospital.ratingPatient}</span>
                          <StarRating rating={hospital.ratingPatient} size={16} readonly />
                        </div>
                        <span className="text-xs text-slate-500">{hospital.reviewCountPatient} patient reviews</span>
                      </div>
                    </div>

                    <p className="text-slate-600 text-sm line-clamp-2">
                      {hospital.description}
                    </p>

                    <div className="pt-2 flex flex-wrap gap-2">
                      {hospital.tags.map(tag => (
                        <span key={tag} className="text-xs border px-2 py-1 rounded text-slate-500 bg-slate-50">
                          {tag}
                        </span>
                      ))}
                    </div>
                    
                    <div className="pt-2 flex items-center gap-4 text-xs text-slate-500 border-t mt-4">
                        <span>Employee Rating: <strong>{hospital.ratingEmployee}/5</strong></span>
                        <span>•</span>
                        <span>Based on {hospital.reviewCountEmployee} employee reviews</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}

            {filteredHospitals.length === 0 && (
              <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed">
                <SearchIcon className="h-10 w-10 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900">No hospitals found</h3>
                <p className="text-slate-500">Try adjusting your filters or search terms.</p>
                <Button 
                  variant="link" 
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedStates([]);
                    setSelectedTypes([]);
                  }}
                >
                  Clear all filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
