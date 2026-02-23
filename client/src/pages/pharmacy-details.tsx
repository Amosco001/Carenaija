import { useParams, Link } from "wouter";
import { usePharmacy } from "@/hooks/usePharmacies";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MapPin, Phone, Mail, Globe, Clock, Star, Truck, ShieldCheck, ArrowLeft, Pill, ShoppingCart, Building2 } from "lucide-react";
import { Loader2 } from "lucide-react";

export default function PharmacyDetailsPage() {
  const params = useParams<{ idOrSlug: string }>();
  const { data: pharmacy, isLoading, error } = usePharmacy(params.idOrSlug || "");

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (error || !pharmacy) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Pill className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Pharmacy not found</h2>
        <Link href="/pharmacies">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Pharmacies
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white py-10">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 text-green-100 text-sm mb-4">
            <Link href="/" className="hover:text-white">Home</Link>
            <span>/</span>
            <Link href="/pharmacies" className="hover:text-white">Pharmacies</Link>
            <span>/</span>
            <span className="line-clamp-1">{pharmacy.name}</span>
          </div>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2" data-testid="text-pharmacy-name">
                {pharmacy.name}
              </h1>
              <div className="flex items-center gap-2 text-green-100 text-sm">
                <MapPin className="h-4 w-4" />
                <span>{pharmacy.address}, {pharmacy.city}, {pharmacy.state}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {pharmacy.isVerified && (
                <Badge className="bg-white/20 text-white hover:bg-white/30 text-sm">
                  <ShieldCheck className="h-4 w-4 mr-1" /> PCN Verified
                </Badge>
              )}
              {pharmacy.is24Hours && (
                <Badge className="bg-white/20 text-white hover:bg-white/30 text-sm">
                  <Clock className="h-4 w-4 mr-1" /> Open 24/7
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {pharmacy.description && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">About</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground" data-testid="text-pharmacy-description">{pharmacy.description}</p>
                </CardContent>
              </Card>
            )}

            {pharmacy.services && pharmacy.services.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Services Available</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2" data-testid="list-services">
                    {pharmacy.services.map((service) => (
                      <Badge key={service} variant="secondary" className="text-sm py-1 px-3">
                        {service}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Features</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className={`flex items-center gap-3 p-3 rounded-lg ${pharmacy.hasDelivery ? 'bg-green-50 text-green-700' : 'bg-slate-50 text-muted-foreground'}`}>
                    <Truck className="h-5 w-5" />
                    <div>
                      <p className="font-medium text-sm">Home Delivery</p>
                      <p className="text-xs">{pharmacy.hasDelivery ? 'Available' : 'Not available'}</p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-3 p-3 rounded-lg ${pharmacy.hasOnlineOrdering ? 'bg-green-50 text-green-700' : 'bg-slate-50 text-muted-foreground'}`}>
                    <ShoppingCart className="h-5 w-5" />
                    <div>
                      <p className="font-medium text-sm">Online Ordering</p>
                      <p className="text-xs">{pharmacy.hasOnlineOrdering ? 'Available' : 'Not available'}</p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-3 p-3 rounded-lg ${pharmacy.acceptsInsurance ? 'bg-green-50 text-green-700' : 'bg-slate-50 text-muted-foreground'}`}>
                    <ShieldCheck className="h-5 w-5" />
                    <div>
                      <p className="font-medium text-sm">Insurance Accepted</p>
                      <p className="text-xs">{pharmacy.acceptsInsurance ? 'HMO/Insurance plans accepted' : 'Cash/card only'}</p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-3 p-3 rounded-lg ${pharmacy.is24Hours ? 'bg-green-50 text-green-700' : 'bg-slate-50 text-muted-foreground'}`}>
                    <Clock className="h-5 w-5" />
                    <div>
                      <p className="font-medium text-sm">24-Hour Service</p>
                      <p className="text-xs">{pharmacy.is24Hours ? 'Open round the clock' : 'Regular hours'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(pharmacy.averageRating ?? 0) > 0 && (
                  <div className="flex items-center gap-2 mb-4">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <span className="text-lg font-bold">{(pharmacy.averageRating ?? 0).toFixed(1)}</span>
                    <span className="text-sm text-muted-foreground">({pharmacy.totalReviews} reviews)</span>
                  </div>
                )}
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 mt-1 text-muted-foreground shrink-0" />
                    <span className="text-sm">{pharmacy.address}, {pharmacy.city}, {pharmacy.state}</span>
                  </div>
                  {pharmacy.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                      <a href={`tel:${pharmacy.phone}`} className="text-sm text-green-600 hover:underline">{pharmacy.phone}</a>
                    </div>
                  )}
                  {pharmacy.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                      <a href={`mailto:${pharmacy.email}`} className="text-sm text-green-600 hover:underline">{pharmacy.email}</a>
                    </div>
                  )}
                  {pharmacy.website && (
                    <div className="flex items-center gap-3">
                      <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                      <a href={pharmacy.website} target="_blank" rel="noopener noreferrer" className="text-sm text-green-600 hover:underline">Visit Website</a>
                    </div>
                  )}
                  {pharmacy.operatingHours && (
                    <div className="flex items-start gap-3">
                      <Clock className="h-4 w-4 mt-1 text-muted-foreground shrink-0" />
                      <span className="text-sm">{pharmacy.operatingHours}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  <span>{pharmacy.ownership} Pharmacy</span>
                </div>
              </CardContent>
            </Card>

            <Link href="/pharmacies">
              <Button variant="outline" className="w-full" data-testid="button-back-pharmacies">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to All Pharmacies
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
