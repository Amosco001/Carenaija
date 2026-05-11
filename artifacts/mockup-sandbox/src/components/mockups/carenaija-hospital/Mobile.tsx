import React from "react";
import { ArrowLeft, MapPin, ShieldCheck, Star, Share2, Navigation, MessageSquare, Clock, Bed, Building2, ChevronRight, Check } from "lucide-react";

export function Mobile() {
  return (
    <div className="w-[375px] bg-[#f8fafc] min-h-screen pb-20 font-sans mx-auto relative overflow-hidden text-slate-900 border border-slate-200 shadow-xl rounded-[40px] mt-8 mb-8" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
      {/* Sticky Nav */}
      <div className="sticky top-0 z-50 bg-white border-b border-slate-100 px-4 py-4 flex items-center justify-between">
        <button className="p-2 -ml-2 rounded-full hover:bg-slate-50 transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-700" />
        </button>
        <span className="font-semibold text-slate-900 text-[15px]">Hospital Profile</span>
        <button className="p-2 -mr-2 rounded-full hover:bg-slate-50 transition-colors">
          <Share2 className="w-5 h-5 text-slate-700" />
        </button>
      </div>

      <div className="bg-white px-5 pt-5 pb-6 border-b border-slate-100">
        <h1 className="text-2xl font-bold text-slate-900 leading-tight mb-2">Reddington Hospital</h1>
        <div className="flex items-center text-slate-500 mb-3 text-sm">
          <MapPin className="w-4 h-4 mr-1 text-slate-400" />
          Victoria Island, Lagos
        </div>
        
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">
            <Building2 className="w-3 h-3 mr-1" />
            Private
          </span>
          <span className="inline-flex items-center px-2 py-1 rounded-md bg-[#008751]/10 text-[#008751] text-xs font-medium">
            <ShieldCheck className="w-3 h-3 mr-1" />
            Verified
          </span>
        </div>

        <div className="flex items-center mb-6">
          <div className="flex items-center">
            {[1, 2, 3, 4].map((i) => (
              <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
            ))}
            <Star className="w-4 h-4 text-amber-400 fill-amber-400/30" />
          </div>
          <span className="ml-2 font-semibold text-sm text-slate-900">4.3</span>
          <span className="mx-2 text-slate-300">•</span>
          <span className="text-sm text-slate-500 underline decoration-slate-300 underline-offset-2">214 reviews</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button className="flex items-center justify-center gap-2 bg-[#008751] hover:bg-[#007043] text-white py-3 px-4 rounded-xl font-semibold text-sm transition-colors shadow-sm shadow-[#008751]/20">
            <Navigation className="w-4 h-4" />
            Get Directions
          </button>
          <button className="flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 py-3 px-4 rounded-xl font-semibold text-sm transition-colors">
            <MessageSquare className="w-4 h-4" />
            Write Review
          </button>
        </div>
      </div>

      {/* Photo Strip */}
      <div className="bg-white py-5 border-b border-slate-100">
        <div className="flex overflow-x-auto gap-3 px-5 pb-2 snap-x hide-scrollbar">
          {[1, 2, 3].map((i) => (
            <div key={i} className="min-w-[260px] aspect-video bg-slate-100 rounded-2xl snap-center shrink-0 border border-slate-200 flex items-center justify-center">
              <span className="text-slate-400 text-sm font-medium">Photo {i}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Key Info */}
      <div className="px-5 py-6 bg-white border-b border-slate-100">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <Bed className="w-5 h-5 text-slate-400 mb-2" />
            <div className="text-xs text-slate-500 font-medium mb-1">Bed Capacity</div>
            <div className="font-semibold text-slate-900 text-sm">230 Beds</div>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <Clock className="w-5 h-5 text-[#008751] mb-2" />
            <div className="text-xs text-slate-500 font-medium mb-1">Operating Hours</div>
            <div className="font-semibold text-slate-900 text-sm">24/7 Open</div>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <div className="w-5 h-5 flex items-center justify-center rounded-full bg-red-100 text-red-600 mb-2 text-[10px] font-bold">ER</div>
            <div className="text-xs text-slate-500 font-medium mb-1">Emergency</div>
            <div className="font-semibold text-slate-900 text-sm">Available (Yes)</div>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <Building2 className="w-5 h-5 text-slate-400 mb-2" />
            <div className="text-xs text-slate-500 font-medium mb-1">Established</div>
            <div className="font-semibold text-slate-900 text-sm">1999</div>
          </div>
        </div>
      </div>

      {/* HMOs */}
      <div className="px-5 py-6 bg-white border-b border-slate-100">
        <h3 className="font-bold text-slate-900 text-base mb-4 flex justify-between items-center">
          Accepted HMOs
          <button className="text-sm text-[#008751] font-medium">View all</button>
        </h3>
        <div className="flex flex-wrap gap-2">
          {["Hygeia HMO", "AXA Mansard", "Reliance HMO", "NHIS", "Avon HMO"].map((hmo) => (
            <span key={hmo} className="px-3 py-1.5 bg-white border border-slate-200 rounded-full text-xs font-medium text-slate-700 shadow-sm">
              {hmo}
            </span>
          ))}
        </div>
      </div>

      {/* Services */}
      <div className="px-5 py-6 bg-white border-b border-slate-100">
        <h3 className="font-bold text-slate-900 text-base mb-4">Core Services</h3>
        <div className="flex flex-wrap gap-2">
          {["Emergency Care", "ICU", "Surgery", "Maternity", "Cardiology", "Pediatrics", "Radiology"].map((service) => (
            <span key={service} className="px-3 py-1.5 bg-slate-50 rounded-lg text-xs font-medium text-slate-600">
              {service}
            </span>
          ))}
        </div>
      </div>

      {/* Reviews */}
      <div className="px-5 py-6 bg-white border-b border-slate-100">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h3 className="font-bold text-slate-900 text-base mb-1">Patient Reviews</h3>
            <p className="text-sm text-slate-500">Based on 214 experiences</p>
          </div>
          <button className="text-sm text-[#008751] font-medium">View all</button>
        </div>

        <div className="space-y-4">
          {[
            { name: "O*** A.", date: "2 weeks ago", text: "Excellent facility and very attentive staff. The pediatric ward was particularly impressive. Highly recommended for families." },
            { name: "C*** N.", date: "1 month ago", text: "Wait times can be a bit long during peak hours, but the quality of care from the specialists is unmatched in Lagos." },
            { name: "Anonymous", date: "3 months ago", text: "Clean environment and modern equipment. The admission process was seamless through my HMO provider." },
          ].map((review, i) => (
            <div key={i} className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
              <div className="flex justify-between items-start mb-2">
                <div className="font-medium text-sm text-slate-900">{review.name}</div>
                <div className="text-xs text-slate-400">{review.date}</div>
              </div>
              <div className="flex mb-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className={`w-3 h-3 ${s === 5 && i === 1 ? 'text-slate-300' : 'text-amber-400 fill-amber-400'}`} />
                ))}
              </div>
              <p className="text-sm text-slate-600 leading-relaxed line-clamp-2">{review.text}</p>
              <button className="text-xs font-semibold text-[#008751] mt-2">Read more</button>
            </div>
          ))}
        </div>
      </div>

      {/* Write a Review CTA */}
      <div className="p-5">
        <div className="bg-[#008751] rounded-2xl p-6 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-10 -mt-10 blur-xl"></div>
          <h3 className="font-bold text-lg mb-2">Visited Reddington?</h3>
          <p className="text-sm text-[#008751] text-white/80 mb-5">Share your experience to help others make informed healthcare decisions.</p>
          <button className="w-full bg-white text-[#008751] font-bold py-3 rounded-xl text-sm shadow-lg hover:bg-slate-50 transition-colors">
            Write a Review
          </button>
        </div>
      </div>

      {/* Nearby */}
      <div className="px-5 py-6">
        <h3 className="font-bold text-slate-900 text-base mb-4">Nearby Hospitals</h3>
        <div className="flex overflow-x-auto gap-4 pb-4 snap-x hide-scrollbar">
          {[
            { name: "St. Nicholas Hospital", type: "Private", dist: "1.2 km" },
            { name: "Lagoon Hospital", type: "Private", dist: "2.4 km" }
          ].map((hosp, i) => (
            <div key={i} className="min-w-[220px] bg-white border border-slate-200 rounded-2xl p-4 snap-center shrink-0">
              <div className="w-full h-24 bg-slate-100 rounded-lg mb-3 flex items-center justify-center border border-slate-200/60">
                < बिल्डिंग className="w-6 h-6 text-slate-300" />
              </div>
              <h4 className="font-semibold text-sm text-slate-900 truncate mb-1">{hosp.name}</h4>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">{hosp.type}</span>
                <span className="text-xs font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">{hosp.dist}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
