import React from "react";
import { ArrowLeft, MapPin, ShieldCheck, Star, Share2, Navigation, MessageSquare, Clock, Bed, Building2, Phone, Mail, Check, ChevronRight, Map } from "lucide-react";

export function Desktop() {
  return (
    <div className="w-full min-h-screen bg-[#f8fafc] font-sans text-slate-900" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#008751] rounded-lg flex items-center justify-center text-white font-bold text-xl">
              +
            </div>
            <span className="font-bold text-xl tracking-tight">CareNaija</span>
          </div>
          <div className="flex items-center gap-6 text-sm font-medium text-slate-600">
            <span className="hover:text-slate-900 cursor-pointer">Find Doctors</span>
            <span className="text-[#008751] cursor-pointer">Hospitals</span>
            <span className="hover:text-slate-900 cursor-pointer">Pharmacies</span>
            <div className="h-4 w-px bg-slate-200"></div>
            <button className="text-slate-900 font-semibold hover:text-[#008751] transition-colors">Log in</button>
            <button className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg transition-colors">Sign up</button>
          </div>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-6 py-8 pb-32">
        {/* Breadcrumb */}
        <div className="flex items-center text-sm text-slate-500 mb-8">
          <span className="hover:text-slate-900 cursor-pointer">Home</span>
          <ChevronRight className="w-4 h-4 mx-1" />
          <span className="hover:text-slate-900 cursor-pointer">Lagos</span>
          <ChevronRight className="w-4 h-4 mx-1" />
          <span className="hover:text-slate-900 cursor-pointer">Hospitals</span>
          <ChevronRight className="w-4 h-4 mx-1" />
          <span className="text-slate-900 font-medium">Reddington Hospital</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 mb-10">
          {/* Hero Left */}
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold uppercase tracking-wider">
                <Building2 className="w-3 h-3 mr-1.5" />
                Private
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-[#008751]/10 text-[#008751] text-xs font-semibold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
                Verified Profile
              </span>
            </div>

            <h1 className="text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
              Reddington Hospital
            </h1>

            <div className="flex items-center gap-6 mb-8 text-base">
              <div className="flex items-center text-slate-600">
                <MapPin className="w-5 h-5 mr-2 text-slate-400" />
                12 Idowu Taylor St, Victoria Island, Lagos
              </div>
              <div className="flex items-center">
                <div className="flex items-center mr-2">
                  {[1, 2, 3, 4].map((i) => (
                    <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
                  ))}
                  <Star className="w-5 h-5 text-amber-400 fill-amber-400/30" />
                </div>
                <span className="font-bold text-slate-900">4.3</span>
                <span className="text-slate-500 ml-1.5 underline decoration-slate-300 underline-offset-4 cursor-pointer">(214 reviews)</span>
              </div>
            </div>

            <div className="flex gap-4">
              <button className="flex items-center gap-2 bg-[#008751] hover:bg-[#007043] text-white py-3 px-6 rounded-xl font-bold transition-colors shadow-sm shadow-[#008751]/20">
                <Navigation className="w-5 h-5" />
                Get Directions
              </button>
              <button className="flex items-center gap-2 bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800 py-3 px-6 rounded-xl font-bold transition-all">
                <MessageSquare className="w-5 h-5" />
                Write a Review
              </button>
              <button className="flex items-center justify-center w-12 h-12 bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600 rounded-xl transition-all">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Hero Right / Info Card */}
          <div className="w-full lg:w-[380px] shrink-0">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
              <h3 className="font-bold text-slate-900 mb-5 flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#008751]" />
                Operating Hours
                <span className="ml-auto text-xs font-semibold bg-green-100 text-green-700 px-2 py-1 rounded">OPEN NOW</span>
              </h3>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Monday - Sunday</span>
                  <span className="font-medium text-slate-900">24 Hours</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Emergency</span>
                  <span className="font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded">24/7 Available</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Bed Capacity</span>
                  <span className="font-medium text-slate-900">230 Beds</span>
                </div>
              </div>

              <div className="h-px bg-slate-100 mb-6"></div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <span className="font-medium text-slate-900">+234 (0) 1 271 5361</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <span className="font-medium text-[#008751] hover:underline cursor-pointer">info@reddingtonhospital.com</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Photo Gallery */}
        <div className="grid grid-cols-4 gap-4 mb-10 h-[380px]">
          <div className="col-span-3 bg-slate-200 rounded-2xl border border-slate-200 flex items-center justify-center overflow-hidden relative group cursor-pointer">
            <span className="text-slate-400 font-medium">Main Photo Placeholder</span>
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors"></div>
          </div>
          <div className="col-span-1 flex flex-col gap-4">
            <div className="flex-1 bg-slate-200 rounded-2xl border border-slate-200 flex items-center justify-center">
              <span className="text-slate-400 text-sm font-medium">Thumb 1</span>
            </div>
            <div className="flex-1 bg-slate-200 rounded-2xl border border-slate-200 flex items-center justify-center relative overflow-hidden">
              <span className="text-slate-400 text-sm font-medium">Thumb 2</span>
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <span className="text-white font-bold">+12 Photos</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs & Content */}
        <div className="flex flex-col lg:flex-row gap-10">
          <div className="flex-1">
            <div className="flex border-b border-slate-200 mb-8 sticky top-16 bg-[#f8fafc] z-40 pt-4">
              {['Overview', 'Reviews (214)', 'Employees', 'Pricing'].map((tab, i) => (
                <button 
                  key={tab} 
                  className={`px-6 py-4 font-bold text-sm border-b-2 transition-colors ${
                    i === 0 
                      ? 'border-[#008751] text-[#008751]' 
                      : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="space-y-12">
              {/* About */}
              <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">About Reddington</h2>
                <div className="text-slate-600 leading-relaxed space-y-4">
                  <p>
                    The Reddington Hospital is a 5-Star independently owned private hospital situated in Victoria Island, Lagos. It was established in 2001, providing comprehensive cardiovascular care, and has since grown into a multi-specialist healthcare facility.
                  </p>
                  <p>
                    With state-of-the-art equipment and internationally trained personnel, we offer exceptional clinical care across various medical specialties. Our facility is designed to provide a comfortable, healing environment for all patients.
                  </p>
                </div>
              </section>

              {/* Facilities Checklist */}
              <section className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900 mb-6">Key Facilities</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-8">
                  {['Intensive Care Unit (ICU)', '24/7 Laboratory', 'In-house Pharmacy', 'Radiology Center', 'Cafeteria', 'Ambulance Service', 'Wheelchair Access', 'Private Suites', 'Neonatal ICU'].map(fac => (
                    <div key={fac} className="flex items-center text-slate-700 font-medium">
                      <div className="w-5 h-5 rounded-full bg-[#008751]/10 flex items-center justify-center mr-3 shrink-0">
                        <Check className="w-3.5 h-3.5 text-[#008751]" />
                      </div>
                      {fac}
                    </div>
                  ))}
                </div>
              </section>

              {/* Services */}
              <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Medical Specialties</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {['Emergency Care', 'Cardiology', 'General Surgery', 'Maternity & Obstetrics', 'Pediatrics', 'Orthopedics', 'Neurology', 'Oncology', 'Dentistry'].map(service => (
                    <div key={service} className="bg-white border border-slate-200 p-4 rounded-xl font-medium text-slate-700 hover:border-[#008751] hover:text-[#008751] transition-colors cursor-pointer text-sm">
                      {service}
                    </div>
                  ))}
                </div>
              </section>

              {/* HMOs */}
              <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Accepted Health Insurance (HMO)</h2>
                <div className="flex flex-wrap gap-3">
                  {['Hygeia HMO', 'AXA Mansard', 'Reliance HMO', 'NHIS', 'Avon HMO', 'Leadway Health', 'Redcare HMO'].map(hmo => (
                    <span key={hmo} className="px-4 py-2.5 bg-white border border-slate-200 rounded-full text-sm font-bold text-slate-700 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                      {hmo}
                    </span>
                  ))}
                </div>
              </section>
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-[320px] xl:w-[380px] shrink-0 pt-4">
            <h3 className="font-bold text-lg text-slate-900 mb-4 flex items-center justify-between">
              Recent Reviews
              <span className="text-[#008751] text-sm font-semibold cursor-pointer hover:underline">View all 214</span>
            </h3>
            <div className="space-y-4">
              {[
                { name: "Olamide A.", date: "2 weeks ago", text: "Excellent facility and very attentive staff. The pediatric ward was particularly impressive." },
                { name: "Chinedu N.", date: "1 month ago", text: "Wait times can be a bit long during peak hours, but the quality of care is unmatched." },
                { name: "Verified Patient", date: "3 months ago", text: "Clean environment and modern equipment. The admission process was seamless." }
              ].map((review, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm">
                      {review.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{review.name}</div>
                      <div className="text-xs text-slate-500">{review.date}</div>
                    </div>
                  </div>
                  <div className="flex mb-3">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={`w-4 h-4 ${s === 5 && i === 1 ? 'text-slate-300' : 'text-amber-400 fill-amber-400'}`} />
                    ))}
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">{review.text}</p>
                </div>
              ))}
            </div>
            
            <div className="mt-6 bg-slate-100 rounded-xl p-6 text-center">
              <Map className="w-8 h-8 text-slate-400 mx-auto mb-3" />
              <h4 className="font-bold text-slate-900 mb-1">Need to get here?</h4>
              <p className="text-sm text-slate-500 mb-4">View map and get directions from your location.</p>
              <button className="text-[#008751] font-bold text-sm hover:underline">Open in Google Maps →</button>
            </div>
          </div>
        </div>
      </main>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-50">
        <div className="max-w-[1200px] mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <div className="font-bold text-slate-900 text-lg">Visited Reddington Hospital?</div>
            <div className="text-slate-500 text-sm">Your review helps millions of Nigerians find better healthcare.</div>
          </div>
          <button className="bg-[#008751] hover:bg-[#007043] text-white px-8 py-3.5 rounded-xl font-bold transition-colors shadow-lg shadow-[#008751]/20">
            Write a Review
          </button>
        </div>
      </div>
    </div>
  );
}
