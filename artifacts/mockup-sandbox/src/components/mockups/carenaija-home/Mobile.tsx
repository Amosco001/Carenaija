import React from "react";
import { Menu, Search, Star, MapPin, Shield, CheckCircle, ChevronRight, Activity, Baby, Eye, Heart, Stethoscope } from "lucide-react";

export function Mobile() {
  return (
    <div className="w-[375px] min-h-screen bg-slate-50 font-sans mx-auto shadow-xl overflow-hidden flex flex-col text-slate-800">
      {/* Sticky Nav */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-[#008751] flex items-center justify-center text-white font-bold text-lg">
            +
          </div>
          <span className="font-bold text-xl text-slate-900 tracking-tight">CareNaija</span>
        </div>
        <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-md">
          <Menu size={24} />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto">
        {/* Hero Section */}
        <section className="px-4 pt-8 pb-6 bg-white">
          <h1 className="text-3xl font-extrabold text-slate-900 leading-tight mb-3">
            Find Trusted Hospitals Near You
          </h1>
          <p className="text-slate-600 text-base mb-6">
            Real patient reviews across all 36 Nigerian states. Make informed healthcare decisions.
          </p>

          <div className="space-y-3 mb-6">
            <div className="relative">
              <MapPin className="absolute left-3 top-3.5 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="City, State, or Hospital Name"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#008751] focus:border-transparent placeholder:text-slate-400"
              />
            </div>
            <button className="w-full bg-[#008751] hover:bg-[#007043] text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors">
              <Search size={18} />
              Search Hospitals
            </button>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs font-medium text-slate-500 bg-slate-50 py-2 px-3 rounded-md border border-slate-100">
            <Shield size={14} className="text-[#008751]" />
            <span>1,200+ Hospitals</span>
            <span className="text-slate-300">•</span>
            <span>Verified Reviews</span>
          </div>
        </section>

        {/* Quick Categories */}
        <section className="py-4 bg-slate-50 border-y border-slate-100 overflow-hidden">
          <div className="flex overflow-x-auto px-4 pb-2 gap-2 hide-scrollbar whitespace-nowrap">
            {["Maternity", "Cardiology", "Eye Care", "Pediatrics", "Emergency", "Surgery"].map((cat) => (
              <button
                key={cat}
                className="px-4 py-2 bg-white border border-slate-200 rounded-full text-sm font-medium text-slate-700 hover:border-[#008751] hover:text-[#008751] transition-colors shadow-sm"
              >
                {cat}
              </button>
            ))}
          </div>
        </section>

        {/* Featured Hospitals */}
        <section className="px-4 py-8 bg-white">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-slate-900">Featured Hospitals</h2>
            <button className="text-sm font-medium text-[#008751] flex items-center">
              See all <ChevronRight size={16} />
            </button>
          </div>

          <div className="space-y-4">
            {[
              { name: "Lagos University Teaching Hospital", loc: "Idi-Araba, Lagos", rating: 4.2, reviews: 342, hmo: "Hygeia HMO" },
              { name: "Reddington Hospital", loc: "Victoria Island, Lagos", rating: 4.6, reviews: 185, hmo: "AXA Mansard" },
              { name: "National Hospital", loc: "Central Area, Abuja", rating: 4.0, reviews: 521, hmo: "Reliance HMO" },
            ].map((hospital, idx) => (
              <div key={idx} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <div className="flex gap-3">
                  <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0 border border-slate-200">
                    <Activity size={24} className="text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 leading-tight truncate">{hospital.name}</h3>
                    <p className="text-sm text-slate-500 mt-1 flex items-center gap-1 truncate">
                      <MapPin size={12} /> {hospital.loc}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center text-amber-500">
                        <Star size={14} fill="currentColor" />
                        <span className="text-sm font-bold ml-1">{hospital.rating}</span>
                      </div>
                      <span className="text-xs text-slate-500">({hospital.reviews} reviews)</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 bg-green-50 text-green-700 px-2.5 py-1 rounded-md text-xs font-semibold">
                    <CheckCircle size={12} /> Accepts {hospital.hmo}
                  </div>
                  <button className="text-sm font-bold text-[#008751] hover:text-[#007043]">
                    View Profile
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section className="px-4 py-8 bg-slate-50">
          <h2 className="text-xl font-bold text-slate-900 mb-6 text-center">How CareNaija Works</h2>
          <div className="space-y-6">
            {[
              { step: 1, title: "Search", desc: "Find hospitals, clinics, or doctors by location and specialty." },
              { step: 2, title: "Read Reviews", desc: "Browse verified experiences from real Nigerian patients." },
              { step: 3, title: "Book / Visit", desc: "Make your choice with confidence and get the care you need." }
            ].map((item) => (
              <div key={item.step} className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-[#008751] text-white font-bold flex items-center justify-center flex-shrink-0">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{item.title}</h3>
                  <p className="text-sm text-slate-600 mt-1">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 px-4 py-8">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-6 h-6 rounded bg-[#008751] flex items-center justify-center text-white font-bold text-sm">
            +
          </div>
          <span className="font-bold text-lg text-white">CareNaija</span>
        </div>
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div>
            <h4 className="text-white font-semibold mb-3">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white">About Us</a></li>
              <li><a href="#" className="hover:text-white">Write a Review</a></li>
              <li><a href="#" className="hover:text-white">Find Hospitals</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white">Contact</a></li>
              <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        <div className="text-xs text-slate-500 pt-6 border-t border-slate-800 text-center">
          © {new Date().getFullYear()} CareNaija. All rights reserved.
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}
