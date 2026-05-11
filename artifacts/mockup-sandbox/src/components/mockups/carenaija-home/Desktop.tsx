import React from "react";
import { Search, Star, MapPin, Shield, CheckCircle, Heart, Baby, Eye, Activity, Brain, Bone, Users } from "lucide-react";

export function Desktop() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col">
      {/* Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-[1200px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-[#008751] flex items-center justify-center text-white font-bold text-xl">
              +
            </div>
            <span className="font-extrabold text-2xl text-slate-900 tracking-tight">CareNaija</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 font-medium text-slate-600">
            <a href="#" className="text-[#008751] font-semibold">Hospitals</a>
            <a href="#" className="hover:text-slate-900 transition-colors">Doctors</a>
            <a href="#" className="hover:text-slate-900 transition-colors">Diagnostic Centres</a>
            <a href="#" className="hover:text-slate-900 transition-colors">Pharmacies</a>
          </nav>

          <button className="bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 px-5 rounded-lg transition-colors">
            Write a Review
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="bg-white py-20 px-6 border-b border-slate-200 relative overflow-hidden">
          {/* Background decorative pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
          
          <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
            <div className="max-w-xl">
              <h1 className="text-5xl lg:text-6xl font-extrabold text-slate-900 leading-[1.1] mb-6 tracking-tight">
                Find Trusted Hospitals Near You
              </h1>
              <p className="text-lg text-slate-600 mb-10 leading-relaxed">
                Make informed healthcare decisions with real patient reviews across all 36 Nigerian states. Quality healthcare starts with trust.
              </p>

              <div className="flex bg-white p-2 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-200">
                <div className="relative flex-1 flex items-center">
                  <MapPin className="absolute left-4 text-slate-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search by city, state, or hospital name..."
                    className="w-full pl-12 pr-4 py-3 bg-transparent text-slate-900 focus:outline-none placeholder:text-slate-400 text-lg"
                  />
                </div>
                <button className="bg-[#008751] hover:bg-[#007043] text-white font-bold py-3 px-8 rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap">
                  <Search size={20} />
                  Search
                </button>
              </div>
            </div>

            <div className="hidden lg:flex justify-end">
              <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm relative">
                <div className="absolute -top-4 -right-4 bg-amber-100 text-amber-800 p-3 rounded-xl shadow-lg border border-amber-200">
                  <Star className="fill-amber-500 text-amber-500 w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-6">CareNaija Stats</h3>
                <div className="space-y-6">
                  <div className="flex justify-between items-end border-b border-slate-100 pb-4">
                    <span className="text-slate-500 font-medium">Hospitals Covered</span>
                    <span className="text-3xl font-extrabold text-slate-900">186+</span>
                  </div>
                  <div className="flex justify-between items-end border-b border-slate-100 pb-4">
                    <span className="text-slate-500 font-medium">Verified Reviews</span>
                    <span className="text-3xl font-extrabold text-slate-900">1,200+</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-slate-500 font-medium">Average Rating</span>
                    <span className="text-3xl font-extrabold text-[#008751]">4.2<span className="text-lg text-slate-400 font-normal">/5</span></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Indicators */}
        <section className="bg-slate-900 text-white py-8 px-6">
          <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-slate-800 rounded-full text-[#008751]"><Shield size={24} /></div>
              <div>
                <h4 className="font-bold text-lg">Verified Reviews</h4>
                <p className="text-slate-400 text-sm">Every review is moderated</p>
              </div>
            </div>
            <div className="hidden md:block w-px h-12 bg-slate-800"></div>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-slate-800 rounded-full text-[#008751]"><Users size={24} /></div>
              <div>
                <h4 className="font-bold text-lg">Real Patients</h4>
                <p className="text-slate-400 text-sm">Authentic Nigerian experiences</p>
              </div>
            </div>
            <div className="hidden md:block w-px h-12 bg-slate-800"></div>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-slate-800 rounded-full text-[#008751]"><Star size={24} /></div>
              <div>
                <h4 className="font-bold text-lg">Unbiased Ratings</h4>
                <p className="text-slate-400 text-sm">Data-driven facility scores</p>
              </div>
            </div>
          </div>
        </section>

        {/* Specialties */}
        <section className="py-20 px-6 bg-slate-50">
          <div className="max-w-[1200px] mx-auto">
            <div className="mb-10">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Browse by Specialty</h2>
              <p className="text-slate-500 text-lg">Find the right specialist for your specific needs</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { name: "Maternity", icon: Baby, count: "45 Hospitals" },
                { name: "Cardiology", icon: Heart, count: "32 Hospitals" },
                { name: "Orthopedics", icon: Bone, count: "28 Hospitals" },
                { name: "Neurology", icon: Brain, count: "15 Hospitals" },
                { name: "Eye Care", icon: Eye, count: "41 Clinics" },
                { name: "Pediatrics", icon: Activity, count: "56 Hospitals" },
              ].map((spec, idx) => (
                <div key={idx} className="group bg-white border border-slate-200 p-6 rounded-xl hover:shadow-lg hover:border-[#008751] transition-all cursor-pointer flex items-center gap-5">
                  <div className="w-14 h-14 bg-green-50 text-[#008751] rounded-lg flex items-center justify-center group-hover:bg-[#008751] group-hover:text-white transition-colors">
                    <spec.icon size={28} />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-slate-900 group-hover:text-[#008751] transition-colors">{spec.name}</h3>
                    <p className="text-slate-500">{spec.count}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Top Rated Hospitals */}
        <section className="py-20 px-6 bg-white border-t border-slate-200">
          <div className="max-w-[1200px] mx-auto">
            <div className="flex justify-between items-end mb-10">
              <div>
                <h2 className="text-3xl font-bold text-slate-900 mb-2">Top Rated This Month</h2>
                <p className="text-slate-500 text-lg">Highest rated facilities based on recent patient reviews</p>
              </div>
              <button className="text-[#008751] font-bold hover:underline">View All Hospitals →</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { name: "Lagos University Teaching Hospital", loc: "Lagos", rating: 4.8, reviews: 342, hmos: ["Hygeia", "Reliance"] },
                { name: "National Hospital Abuja", loc: "Abuja", rating: 4.5, reviews: 521, hmos: ["AXA Mansard"] },
                { name: "Reddington Hospital", loc: "Lagos", rating: 4.6, reviews: 185, hmos: ["Avon", "Hygeia"] },
              ].map((hospital, idx) => (
                <div key={idx} className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-xl transition-shadow flex flex-col h-full">
                  <div className="h-48 bg-slate-100 flex items-center justify-center border-b border-slate-200 relative">
                    <Activity size={48} className="text-slate-300" />
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-slate-700 shadow-sm flex items-center gap-1">
                      <MapPin size={12} /> {hospital.loc}
                    </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="text-xl font-bold text-slate-900 mb-2 leading-tight">{hospital.name}</h3>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex items-center text-amber-500">
                        <Star size={16} fill="currentColor" />
                        <span className="font-bold ml-1 text-slate-900">{hospital.rating}</span>
                      </div>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-500 text-sm">{hospital.reviews} verified reviews</span>
                    </div>
                    
                    <div className="mt-auto pt-4 border-t border-slate-100">
                      <p className="text-xs text-slate-500 font-medium mb-2 uppercase tracking-wider">Accepts HMOs</p>
                      <div className="flex flex-wrap gap-2 mb-6">
                        {hospital.hmos.map(hmo => (
                          <span key={hmo} className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md text-sm font-medium">
                            {hmo}
                          </span>
                        ))}
                      </div>
                      <button className="w-full bg-white border-2 border-[#008751] text-[#008751] hover:bg-[#008751] hover:text-white font-bold py-2.5 rounded-lg transition-colors">
                        View Profile
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-16 px-6 border-t border-slate-800">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded bg-[#008751] flex items-center justify-center text-white font-bold">
                +
              </div>
              <span className="font-bold text-2xl text-white">CareNaija</span>
            </div>
            <p className="text-slate-400 mb-6 leading-relaxed">
              Empowering Nigerians to make informed healthcare decisions through transparent, verified patient reviews.
            </p>
          </div>

          <div>
            <h4 className="text-white font-bold text-lg mb-6">Quick Links</h4>
            <ul className="space-y-3">
              <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">How it Works</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Write a Review</a></li>
              <li><a href="#" className="hover:text-white transition-colors">For Hospitals</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold text-lg mb-6">Find Care</h4>
            <ul className="space-y-3">
              <li><a href="#" className="hover:text-white transition-colors">Hospitals in Lagos</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Hospitals in Abuja</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Top Rated Clinics</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Specialist Doctors</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold text-lg mb-6">Legal & Contact</h4>
            <ul className="space-y-3">
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Review Guidelines</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact Support</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-[1200px] mx-auto mt-16 pt-8 border-t border-slate-800 text-center text-slate-500">
          © {new Date().getFullYear()} CareNaija. All rights reserved. Made in Nigeria.
        </div>
      </footer>
    </div>
  );
}
