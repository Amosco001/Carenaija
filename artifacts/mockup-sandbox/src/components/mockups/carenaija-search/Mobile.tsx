import React from "react";
import { 
  ArrowLeft, 
  Search, 
  SlidersHorizontal, 
  X, 
  MapPin, 
  Star, 
  ShieldCheck, 
  ChevronRight 
} from "lucide-react";

const hospitals = [
  {
    id: 1,
    name: "Evercare Hospital Lekki",
    address: "Lekki Phase 1",
    state: "Lagos",
    rating: 4.8,
    reviews: 342,
    hmos: ["Hygeia HMO", "Reliance HMO"],
    verified: true,
  },
  {
    id: 2,
    name: "Reddington Hospital",
    address: "Victoria Island",
    state: "Lagos",
    rating: 4.6,
    reviews: 215,
    hmos: ["Hygeia HMO", "NHIS"],
    verified: true,
  },
  {
    id: 3,
    name: "Duchess International Hospital",
    address: "Ikeja",
    state: "Lagos",
    rating: 4.9,
    reviews: 189,
    hmos: ["AXA Mansard", "Avon HMO"],
    verified: true,
  },
  {
    id: 4,
    name: "St. Nicholas Hospital",
    address: "Lagos Island",
    state: "Lagos",
    rating: 4.5,
    reviews: 420,
    hmos: ["Hygeia HMO", "Reliance HMO", "NHIS"],
    verified: false,
  }
];

export function Mobile() {
  return (
    <div className="w-full max-w-[375px] mx-auto bg-gray-50 min-h-screen font-sans shadow-xl overflow-hidden relative">
      {/* Sticky Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3 p-4">
          <button className="p-1 -ml-1 text-gray-600 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              defaultValue="Lagos"
              className="w-full pl-9 pr-3 py-2 bg-gray-100 border-transparent rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#008751] focus:bg-white"
            />
          </div>
          
          <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-full relative">
            <SlidersHorizontal className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#008751] rounded-full border border-white"></span>
          </button>
        </div>

        {/* Active Filters */}
        <div className="flex items-center gap-2 px-4 pb-3 overflow-x-auto no-scrollbar whitespace-nowrap">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#008751]/10 text-[#008751] rounded-full text-xs font-medium border border-[#008751]/20">
            Lagos
            <X className="w-3.5 h-3.5 cursor-pointer" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#008751]/10 text-[#008751] rounded-full text-xs font-medium border border-[#008751]/20">
            Verified
            <X className="w-3.5 h-3.5 cursor-pointer" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#008751]/10 text-[#008751] rounded-full text-xs font-medium border border-[#008751]/20">
            Hygeia HMO
            <X className="w-3.5 h-3.5 cursor-pointer" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4">
        <p className="text-sm text-gray-600 mb-4 font-medium">
          24 hospitals found in <span className="text-gray-900 font-semibold">Lagos</span>
        </p>

        <div className="flex flex-col gap-4">
          {hospitals.map((hospital) => (
            <div key={hospital.id} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex flex-col gap-3">
              <div className="flex gap-3">
                <div className="w-[80px] h-[80px] rounded-lg bg-gray-200 shrink-0 object-cover overflow-hidden relative">
                  <div className="absolute inset-0 bg-gray-300 animate-pulse" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-gray-900 leading-tight truncate pr-2">
                      {hospital.name}
                    </h3>
                    {hospital.verified && (
                      <ShieldCheck className="w-4 h-4 text-[#008751] shrink-0 mt-0.5" />
                    )}
                  </div>
                  
                  <div className="flex items-center text-xs text-gray-500 mt-1">
                    <MapPin className="w-3 h-3 mr-1 shrink-0" />
                    <span className="truncate">{hospital.address}, {hospital.state}</span>
                  </div>

                  <div className="flex items-center gap-1 mt-1.5">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-semibold text-gray-900">{hospital.rating}</span>
                    <span className="text-xs text-gray-500">· {hospital.reviews} reviews</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-gray-50">
                {hospital.hmos.map(hmo => (
                  <span key={hmo} className="px-2 py-0.5 bg-teal-50 text-teal-700 rounded text-[10px] font-medium">
                    {hmo}
                  </span>
                ))}
              </div>

              <div className="flex justify-end mt-1">
                <button className="text-[#008751] text-xs font-semibold flex items-center gap-1 hover:underline">
                  View Profile <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <button className="w-full mt-6 py-3 bg-white border border-gray-200 text-gray-700 font-semibold text-sm rounded-lg shadow-sm hover:bg-gray-50 transition-colors">
          Load more hospitals
        </button>
      </main>
    </div>
  );
}
