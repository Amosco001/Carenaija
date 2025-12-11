import { useEffect } from "react";
import { useParams, Link } from "wouter";
import { getHospital, getPatientReviews, getEmployeeReviews } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { StarRating } from "@/components/star-rating";
import { MapPin, Phone, Globe, ShieldCheck, UserCheck, Stethoscope, Briefcase, ThumbsUp, ThumbsDown, Users } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import NotFound from "@/pages/not-found";

export default function HospitalDetails() {
  const { id } = useParams();
  const hospital = getHospital(id || "");

  // SEO: Inject Structured Data for LocalBusiness/MedicalOrganization
  useEffect(() => {
    if (hospital) {
      document.title = `${hospital.name} Reviews & Ratings - CareNaija`;
      
      const structuredData = {
        "@context": "https://schema.org",
        "@type": "MedicalOrganization",
        "name": hospital.name,
        "image": hospital.images,
        "@id": `https://carenaija.com/hospital/${hospital.id}`,
        "url": `https://carenaija.com/hospital/${hospital.id}`,
        "telephone": hospital.phone,
        "address": {
          "@type": "PostalAddress",
          "streetAddress": hospital.address,
          "addressLocality": hospital.city,
          "addressRegion": hospital.state,
          "addressCountry": "NG"
        },
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": hospital.latitude,
          "longitude": hospital.longitude
        },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": hospital.ratingPatient,
          "reviewCount": hospital.reviewCountPatient,
          "bestRating": "5",
          "worstRating": "1"
        }
      };

      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.text = JSON.stringify(structuredData);
      document.head.appendChild(script);

      return () => {
        document.head.removeChild(script);
      };
    }
  }, [hospital]);

  if (!hospital) return <NotFound />;

  const patientReviews = getPatientReviews(hospital.id);
  const employeeReviews = getEmployeeReviews(hospital.id);

  return (
    <div className="bg-white min-h-screen pb-20">
      {/* Header Banner */}
      <div className="h-64 md:h-80 relative bg-slate-900 overflow-hidden">
        <img 
          src={hospital.images[0]} 
          alt={hospital.name} 
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8">
          <div className="container mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-end gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-primary text-white text-xs font-bold px-2 py-1 rounded uppercase tracking-wide">
                    {hospital.type}
                  </span>
                  <span className="text-slate-300 text-sm flex items-center">
                    <MapPin className="w-3 h-3 mr-1" />
                    {hospital.city}, {hospital.state}
                  </span>
                </div>
                <h1 className="text-3xl md:text-5xl font-serif font-bold text-white mb-2 shadow-sm">
                  {hospital.name}
                </h1>
                <p className="text-slate-300 max-w-2xl text-sm md:text-base">
                  {hospital.address}
                </p>
              </div>
              
              <div className="flex gap-3">
                 <Link href={`/write-review/patient/${hospital.id}`}>
                   <Button size="lg" className="shadow-lg font-semibold">
                     Write Patient Review
                   </Button>
                 </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-[1fr_350px] gap-8">
          {/* Main Content */}
          <div className="space-y-8">
            
            {/* Overview Stats */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-xl border shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-100 rounded-lg text-primary">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-slate-900">Patient Experience</h3>
                </div>
                <div className="flex items-end gap-3 mb-2">
                  <span className="text-4xl font-bold text-slate-900">{hospital.ratingPatient}</span>
                  <div className="mb-1">
                    <StarRating rating={hospital.ratingPatient} size={18} readonly />
                  </div>
                </div>
                <p className="text-sm text-slate-500">Based on {hospital.reviewCountPatient} reviews</p>
              </div>

              <div className="bg-white p-6 rounded-xl border shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-slate-900">Employee Rating</h3>
                </div>
                <div className="flex items-end gap-3 mb-2">
                  <span className="text-4xl font-bold text-slate-900">{hospital.ratingEmployee}</span>
                  <div className="mb-1">
                     <StarRating rating={hospital.ratingEmployee} size={18} readonly />
                  </div>
                </div>
                <p className="text-sm text-slate-500">Based on {hospital.reviewCountEmployee} reviews</p>
                <Link href={`/write-review/employee/${hospital.id}`} className="text-xs text-primary font-medium hover:underline mt-2 block">
                  Work here? Rate this employer
                </Link>
              </div>
            </div>

            {/* About */}
            <section>
              <h2 className="text-2xl font-serif font-bold text-slate-900 mb-4">About</h2>
              <p className="text-slate-600 leading-relaxed">
                {hospital.description}
              </p>
              
              <div className="mt-6 flex flex-wrap gap-2">
                {hospital.tags.map(tag => (
                   <span key={tag} className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm font-medium">
                     {tag}
                   </span>
                ))}
              </div>
            </section>

            {/* Reviews Tabs */}
            <section>
              <Tabs defaultValue="patients" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8">
                  <TabsTrigger value="patients">Patient Reviews</TabsTrigger>
                  <TabsTrigger value="employees">Employee Reviews</TabsTrigger>
                </TabsList>
                
                <TabsContent value="patients" className="space-y-6">
                  {patientReviews.map(review => (
                    <div key={review.id} className="border-b pb-6 last:border-0 animate-in fade-in duration-500">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-bold text-slate-900 text-lg">{review.title}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <StarRating rating={review.rating} size={14} readonly />
                            <span className="text-slate-400 text-sm">•</span>
                            <span className="text-sm text-slate-500">{review.userName}</span>
                            {review.reviewerRole && (
                              <Badge variant="secondary" className="text-xs font-normal">
                                {review.reviewerRole}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-slate-400">{new Date(review.date).toLocaleDateString()}</span>
                      </div>
                      
                      <p className="text-slate-600 mt-3 leading-relaxed">
                        {review.comment}
                      </p>
                      
                      {review.tags.length > 0 && (
                        <div className="mt-3 flex gap-2">
                          {review.tags.map(tag => (
                            <span key={tag} className="text-xs bg-slate-50 text-slate-500 border px-2 py-0.5 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {patientReviews.length === 0 && (
                    <div className="text-center py-10 text-slate-500 italic">
                      No patient reviews yet. Be the first to share your experience.
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="employees" className="space-y-6">
                  {employeeReviews.map(review => (
                    <div key={review.id} className="bg-slate-50 p-6 rounded-xl border animate-in fade-in duration-500">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-bold text-slate-900">{review.jobTitle}</h4>
                          <div className="flex items-center gap-2 mt-1">
                             <StarRating rating={review.rating} size={14} readonly />
                             <span className="text-slate-400 text-sm">•</span>
                             <span className="text-sm font-medium text-slate-700">
                               ₦{(review.salaryMin/1000).toFixed(0)}k - ₦{(review.salaryMax/1000).toFixed(0)}k / month
                             </span>
                          </div>
                        </div>
                        <span className="text-xs text-slate-400">{new Date(review.date).toLocaleDateString()}</span>
                      </div>

                      <div className="space-y-3">
                         <div>
                           <span className="text-xs font-bold text-green-700 uppercase tracking-wide">Pros</span>
                           <p className="text-sm text-slate-600 mt-1">{review.pros}</p>
                         </div>
                         <div>
                           <span className="text-xs font-bold text-red-700 uppercase tracking-wide">Cons</span>
                           <p className="text-sm text-slate-600 mt-1">{review.cons}</p>
                         </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-slate-200 flex items-center gap-2">
                         {review.recommends ? (
                           <div className="flex items-center text-xs font-medium text-green-700">
                             <ThumbsUp className="w-3 h-3 mr-1" />
                             Recommends working here
                           </div>
                         ) : (
                           <div className="flex items-center text-xs font-medium text-red-700">
                             <ThumbsDown className="w-3 h-3 mr-1" />
                             Does not recommend
                           </div>
                         )}
                      </div>
                    </div>
                  ))}
                  {employeeReviews.length === 0 && (
                    <div className="text-center py-10 text-slate-500 italic">
                      No employee reviews yet.
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
             {/* Contact Card */}
             <div className="bg-white border rounded-xl p-6 shadow-sm sticky top-24">
               <h3 className="font-bold text-slate-900 mb-4">Contact Information</h3>
               <div className="space-y-4">
                 <div className="flex items-start gap-3 text-sm">
                   <MapPin className="w-5 h-5 text-slate-400 shrink-0" />
                   <span className="text-slate-600">{hospital.address}</span>
                 </div>
                 {hospital.phone && (
                   <div className="flex items-center gap-3 text-sm">
                     <Phone className="w-5 h-5 text-slate-400 shrink-0" />
                     <a href={`tel:${hospital.phone}`} className="text-primary hover:underline">{hospital.phone}</a>
                   </div>
                 )}
                 {hospital.website && (
                   <div className="flex items-center gap-3 text-sm">
                     <Globe className="w-5 h-5 text-slate-400 shrink-0" />
                     <a href={hospital.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">
                       {hospital.website}
                     </a>
                   </div>
                 )}
               </div>
               
               <Separator className="my-6" />
               
               <div className="space-y-3">
                 <div className="flex items-center gap-2 text-sm text-slate-600">
                   <ShieldCheck className="w-4 h-4 text-green-600" />
                   <span>Verified Listing</span>
                 </div>
                 <div className="flex items-center gap-2 text-sm text-slate-600">
                   <UserCheck className="w-4 h-4 text-slate-400" />
                   <span>Claimed Profile</span>
                 </div>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
