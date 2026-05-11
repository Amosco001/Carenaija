import React from "react";
import { 
  Search, 
  SlidersHorizontal, 
  MapPin, 
  Star, 
  ShieldCheck, 
  ChevronRight,
  List,
  Grid3x3,
  ChevronLeft
} from "lucide-react";

const hospitals = [
  {
    id: 1,
    name: "Evercare Hospital Lekki",
    address: "Lekki Phase 1",
    state: "Lagos",
    rating: 4.8,
    reviews: 342,
    services: ["Emergency", "ICU", "Maternity"],
    hmos: "Hygeia HMO +3",
    verified: true,
  },
  {
    id: 2,
    name: "Reddington Hospital",
    address: "Victoria Island",
    state: "Lagos",
    rating: 4.6,
    reviews: 215,
    services: ["Cardiology", "Surgery", "Pediatrics"],
    hmos: "Hygeia HMO +2",
    verified: true,
  },
  {
    id: 3,
    name: "Duchess International Hospital",
    address: "Ikeja",
    state: "Lagos",
    rating: 4.9,
    reviews: 189,
    services: ["Maternity", "Surgery", "Diagnostics"],
    hmos: "AXA Mansard +4",
    verified: true,
  },
  {
    id: 4,
    name: "St. Nicholas Hospital",
    address: "Lagos Island",
    state: "Lagos",
    rating: 4.5,
    reviews: 420,
    services: ["Nephrology", "ICU", "Emergency"],
    hmos: "Reliance HMO +5",
    verified: false,
  },
  {
    id: 5,
    name: "Lagoon Hospitals",
    address: "Ikoyi",
    state: "Lagos",
    rating: 4.4,
    reviews: 310,
    services: ["Orthopedics", "Surgery", "Emergency"],
    hmos: "Hygeia HMO +4",
    verified: true,
  },
  {
    id: 6,
    name: "First Cardiology Consultants",
    address: "Ikoyi",
    state: "Lagos",
    rating: 4.7,
    reviews: 156,
    services: ["Cardiology", "ICU", "Diagnostics"],
    hmos: "Avon HMO +1",
    verified: true,
  }
];

export function Desktop() {
  return (
    <div className="w-full bg-gray-50 min-h-screen font-sans flex flex-col">
      {/* Sticky Nav */}
      <header className="sticky top-0 z-20 bg-white border-b border-gray-200">
        <div className="max-w-[1440px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="font-bold text-xl tracking-tight text-[#008751]">CareNaija<span className="text-[#008751] text-2xl leading-none">.</span></div>
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
              <a href="#" className="hover:text-gray-900 transition-colors">Hospitals</a>
              <a href="#" className="hover:text-gray-900 transition-colors">Doctors</a>
              <a href="#" className="hover:text-gray-900 transition-colors">Write a Review</a>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-sm font-semibold text-gray-700 hover:text-gray-900">Log in</button>
            <button className="text-sm font-semibold text-white bg-[#008751] hover:bg-[#007043] px-4 py-2 rounded-lg transition-colors">
              Sign up
            </button>
          </div>
        </div>
      </header>

      {/* Search Header */}
      <div className="bg-white border-b border-gray-200 py-6">
        <div className="max-w-[1440px] mx-auto px-6">
          <div className="flex gap-4 max-w-3xl">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                defaultValue="Lagos"
                placeholder="Search hospitals, specialties, or HMOs"
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#008751] focus:bg-white transition-all shadow-sm"
              />
            </div>
            <button className="px-6 py-3 bg-gray-900 text-white rounded-lg font-semibold text-sm hover:bg-gray-800 transition-colors shadow-sm flex items-center gap-2">
              <Search className="w-4 h-4" />
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="max-w-[1440px] mx-auto px-6 py-8 flex items-start gap-8 flex-1 w-full">
        
        {/* Left Sidebar Filters */}
        <aside className="w-[280px] shrink-0 bg-white border border-gray-200 rounded-xl p-5 sticky top-[120px]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-lg text-gray-900">Filters</h2>
            <button className="text-sm text-[#008751] font-medium hover:underline">Clear all</button>
          </div>

          <div className="space-y-6">
            {/* Location */}
            <div>
              <h3 className="font-semibold text-gray-900 text-sm mb-3">Location</h3>
              <select className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#008751]">
                <option value="Lagos">Lagos</option>
                <option value="Abuja">Abuja</option>
                <option value="Rivers">Rivers</option>
              </select>
            </div>

            <hr className="border-gray-100" />

            {/* Ownership */}
            <div>
              <h3 className="font-semibold text-gray-900 text-sm mb-3">Ownership</h3>
              <div className="space-y-2.5">
                {['Private', 'Government', 'Faith-based'].map((item, i) => (
                  <label key={item} className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${i === 0 ? 'bg-[#008751] border-[#008751]' : 'border-gray-300 group-hover:border-[#008751]'}`}>
                      {i === 0 && <span className="w-2 h-2 bg-white rounded-sm"></span>}
                    </div>
                    <span className="text-sm text-gray-600">{item}</span>
                  </label>
                ))}
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* HMO Acceptance */}
            <div>
              <h3 className="font-semibold text-gray-900 text-sm mb-3">HMO Acceptance</h3>
              <div className="space-y-2.5">
                {['Hygeia HMO', 'AXA Mansard', 'Reliance HMO', 'NHIS', 'Avon HMO'].map((item, i) => (
                  <label key={item} className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${i === 0 ? 'bg-[#008751] border-[#008751]' : 'border-gray-300 group-hover:border-[#008751]'}`}>
                      {i === 0 && <span className="w-2 h-2 bg-white rounded-sm"></span>}
                    </div>
                    <span className="text-sm text-gray-600">{item}</span>
                  </label>
                ))}
              </div>
              <button className="text-sm text-[#008751] font-medium mt-3 hover:underline">Show all HMOs</button>
            </div>

            <hr className="border-gray-100" />

            {/* Minimum Rating */}
            <div>
              <h3 className="font-semibold text-gray-900 text-sm mb-3">Minimum Rating</h3>
              <div className="space-y-2.5">
                {['4.5+', '4.0+', '3.0+'].map((item, i) => (
                  <label key={item} className="flex items-center gap-3 cursor-pointer group">
                    <div className="w-4 h-4 rounded-full border border-gray-300 flex items-center justify-center group-hover:border-[#008751]">
                      {i === 1 && <div className="w-2 h-2 bg-[#008751] rounded-full"></div>}
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span className="text-sm text-gray-600">{item}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <button className="w-full py-2.5 bg-[#008751] text-white rounded-lg font-semibold text-sm hover:bg-[#007043] transition-colors shadow-sm">
              Apply Filters
            </button>
          </div>
        </aside>

        {/* Right Results Area */}
        <main className="flex-1 min-w-0">
          
          {/* Results Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold text-gray-900">
              24 hospitals found in <span className="text-[#008751]">Lagos</span>
            </h1>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 font-medium">Sort by:</span>
                <select className="text-sm font-semibold text-gray-900 bg-transparent border-none focus:ring-0 cursor-pointer">
                  <option>Highest Rated</option>
                  <option>Most Reviewed</option>
                  <option>Closest to me</option>
                </select>
              </div>

              <div className="h-6 w-px bg-gray-200"></div>

              <div className="flex items-center bg-white border border-gray-200 rounded-lg p-0.5 shadow-sm">
                <button className="p-1.5 text-gray-400 hover:text-gray-900 rounded-md">
                  <List className="w-4 h-4" />
                </button>
                <button className="p-1.5 bg-gray-100 text-gray-900 rounded-md shadow-sm">
                  <Grid3x3 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hospitals.map((hospital) => (
              <div key={hospital.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group flex flex-col">
                
                {/* Image Placeholder */}
                <div className="aspect-video bg-gray-100 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gray-200 group-hover:scale-105 transition-transform duration-500" />
                  {hospital.verified && (
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full shadow-sm flex items-center gap-1 border border-white/20">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#008751]" />
                      <span className="text-xs font-bold text-gray-900">Verified</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-bold text-lg text-gray-900 leading-tight mb-1 group-hover:text-[#008751] transition-colors">
                    {hospital.name}
                  </h3>
                  
                  <div className="flex items-center text-sm text-gray-500 mb-3">
                    <MapPin className="w-3.5 h-3.5 mr-1 shrink-0" />
                    <span className="truncate">{hospital.address}, {hospital.state}</span>
                  </div>

                  <div className="flex items-center gap-1.5 mb-4">
                    <div className="flex items-center bg-amber-50 px-1.5 py-0.5 rounded text-amber-700 font-bold text-sm">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 mr-1" />
                      {hospital.rating}
                    </div>
                    <span className="text-sm text-gray-500 font-medium">({hospital.reviews} reviews)</span>
                  </div>

                  <div className="mt-auto space-y-3">
                    <div className="flex flex-wrap gap-1.5">
                      {hospital.services.map(service => (
                        <span key={service} className="px-2 py-1 bg-gray-50 text-gray-600 rounded text-xs font-medium border border-gray-100">
                          {service}
                        </span>
                      ))}
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs font-medium text-teal-700 bg-teal-50/50 px-2.5 py-1.5 rounded-md border border-teal-100">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Accepts {hospital.hmos}
                    </div>
                  </div>

                  <hr className="my-4 border-gray-100" />

                  <button className="w-full py-2.5 bg-white border border-[#008751] text-[#008751] rounded-lg font-semibold text-sm hover:bg-[#008751] hover:text-white transition-colors group/btn flex items-center justify-center gap-2">
                    View Profile
                    <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
                  </button>
                </div>

              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="mt-10 flex items-center justify-center gap-2">
            <button className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50 flex items-center gap-1 disabled:opacity-50">
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>
            <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#008751] text-white font-bold text-sm shadow-sm">
              1
            </button>
            <button className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-700 font-semibold text-sm transition-colors">
              2
            </button>
            <button className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-700 font-semibold text-sm transition-colors">
              3
            </button>
            <span className="text-gray-400 mx-1">...</span>
            <button className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-1 shadow-sm">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>

        </main>
      </div>
    </div>
  );
}
