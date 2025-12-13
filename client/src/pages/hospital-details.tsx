import { useEffect } from "react";
import { useParams, Link } from "wouter";
import { useHospital } from "@/hooks/useHospital";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StarRating } from "@/components/star-rating";
import { MapPin, Phone, Globe, ShieldCheck, Clock, Bed, Stethoscope, Briefcase, Navigation, ExternalLink, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import NotFound from "@/pages/not-found";

export default function HospitalDetails() {
  const { id } = useParams();
  const { data: hospital, isLoading, error } = useHospital(id || "");

  useEffect(() => {
    if (hospital) {
      document.title = `${hospital.name} - CareNaija`;
    }
  }, [hospital]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !hospital) return <NotFound />;

  const googleMapsUrl = hospital.latitude && hospital.longitude 
    ? `https://www.google.com/maps?q=${hospital.latitude},${hospital.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hospital.name + ", " + hospital.address)}`;
  
  const googleMapsEmbedUrl = hospital.latitude && hospital.longitude
    ? `https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d3000!2d${hospital.longitude}!3d${hospital.latitude}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2sng!4v1`
    : null;

  return (
    <div className="bg-white min-h-screen pb-20">
      <div className="h-64 md:h-80 relative bg-slate-900 overflow-hidden">
        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
          <MapPin className="h-24 w-24 text-primary/20" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8">
          <div className="container mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-end gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-primary text-white text-xs font-bold px-2 py-1 rounded uppercase tracking-wide">
                    {hospital.ownership}
                  </span>
                  <span className="text-slate-300 text-sm flex items-center">
                    <MapPin className="w-3 h-3 mr-1" />
                    {hospital.lga}, {hospital.state}
                  </span>
                </div>
                <h1 className="text-3xl md:text-5xl font-serif font-bold text-white mb-2 shadow-sm" data-testid="text-hospital-name">
                  {hospital.name}
                </h1>
                <p className="text-slate-300 max-w-2xl text-sm md:text-base">
                  {hospital.address}
                </p>
              </div>
              
              <div className="flex gap-3">
                <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="lg" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                    <Navigation className="w-4 h-4 mr-2" />
                    Get Directions
                  </Button>
                </a>
                <Link href={`/write-review/patient/${hospital.id}`}>
                  <Button size="lg" className="shadow-lg font-semibold" data-testid="button-write-review">
                    Write Review
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-[1fr_380px] gap-8">
          <div className="space-y-8">
            
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-xl border shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-green-100 rounded-lg text-primary">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-slate-900">Services</h3>
                </div>
                <p className="text-2xl font-bold text-slate-900">{hospital.services?.length || 0}</p>
                <p className="text-sm text-slate-500">Departments</p>
              </div>

              <div className="bg-white p-5 rounded-xl border shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                    <Bed className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-slate-900">Capacity</h3>
                </div>
                <p className="text-2xl font-bold text-slate-900">{hospital.bedCapacity || "N/A"}</p>
                <p className="text-sm text-slate-500">Beds</p>
              </div>

              <div className="bg-white p-5 rounded-xl border shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                    <Clock className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-slate-900">Hours</h3>
                </div>
                <p className="text-xl font-bold text-slate-900">{hospital.operatingHours || "N/A"}</p>
                <p className="text-sm text-slate-500">Operating</p>
              </div>
            </div>

            <section>
              <h2 className="text-2xl font-serif font-bold text-slate-900 mb-4">Services Offered</h2>
              <div className="flex flex-wrap gap-2">
                {hospital.services?.map((service: string) => (
                  <Badge key={service} variant="secondary" className="px-3 py-1.5 text-sm">
                    {service}
                  </Badge>
                ))}
                {(!hospital.services || hospital.services.length === 0) && (
                  <p className="text-slate-500 italic">No services listed yet.</p>
                )}
              </div>
            </section>

            {googleMapsEmbedUrl && (
              <section>
                <h2 className="text-2xl font-serif font-bold text-slate-900 mb-4">Location</h2>
                <div className="rounded-xl overflow-hidden border shadow-sm">
                  <iframe
                    src={googleMapsEmbedUrl}
                    width="100%"
                    height="350"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title={`Map of ${hospital.name}`}
                  />
                </div>
                <div className="mt-3 flex justify-end">
                  <a 
                    href={googleMapsUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                    data-testid="link-open-maps"
                  >
                    Open in Google Maps <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </section>
            )}

            <section>
              <Tabs defaultValue="patients" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8">
                  <TabsTrigger value="patients" data-testid="tab-patient-reviews">Patient Reviews</TabsTrigger>
                  <TabsTrigger value="employees" data-testid="tab-employee-reviews">Employee Reviews</TabsTrigger>
                </TabsList>
                
                <TabsContent value="patients" className="space-y-6">
                  <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed">
                    <Stethoscope className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900">No patient reviews yet</h3>
                    <p className="text-slate-500 max-w-sm mx-auto mt-2">Be the first to share your experience at this hospital.</p>
                    <Link href={`/write-review/patient/${hospital.id}`}>
                      <Button className="mt-4">Write a Review</Button>
                    </Link>
                  </div>
                </TabsContent>
                
                <TabsContent value="employees" className="space-y-6">
                  <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed">
                    <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900">No employee reviews yet</h3>
                    <p className="text-slate-500 max-w-sm mx-auto mt-2">Work here? Share your experience to help others.</p>
                    <Link href={`/write-review/employee/${hospital.id}`}>
                      <Button className="mt-4" variant="outline">Write Employee Review</Button>
                    </Link>
                  </div>
                </TabsContent>
              </Tabs>
            </section>
          </div>

          <div className="space-y-6">
            <div className="bg-white border rounded-xl p-6 shadow-sm sticky top-24">
              <h3 className="font-bold text-slate-900 mb-4">Contact Information</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3 text-sm">
                  <MapPin className="w-5 h-5 text-slate-400 shrink-0" />
                  <span className="text-slate-600">{hospital.address}</span>
                </div>
                {hospital.email && (
                  <div className="flex items-center gap-3 text-sm">
                    <Globe className="w-5 h-5 text-slate-400 shrink-0" />
                    <a href={`mailto:${hospital.email}`} className="text-primary hover:underline">{hospital.email}</a>
                  </div>
                )}
              </div>
              
              <Separator className="my-6" />

              <a 
                href={googleMapsUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block"
              >
                <Button className="w-full gap-2" variant="outline" data-testid="button-get-directions">
                  <Navigation className="w-4 h-4" />
                  Get Directions on Google Maps
                </Button>
              </a>
              
              <Separator className="my-6" />
              
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <ShieldCheck className={`w-4 h-4 ${hospital.verified ? 'text-green-600' : 'text-slate-400'}`} />
                  <span>{hospital.verified ? 'Verified Listing' : 'Unverified Listing'}</span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t">
                <Link href={`/claim-profile/${hospital.id}`}>
                  <Button variant="ghost" className="w-full text-sm" data-testid="button-claim-profile">
                    Is this your hospital? Claim this profile
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
