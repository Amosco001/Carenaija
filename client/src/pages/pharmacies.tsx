import { useState } from "react";
import { Link } from "wouter";
import { usePharmacies } from "@/hooks/usePharmacies";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, Phone, Clock, Star, Truck, ShieldCheck, ChevronLeft, ChevronRight, Pill, Globe, ShoppingCart } from "lucide-react";

const NIGERIAN_STATES = ["FCT", "Lagos", "Rivers", "Oyo", "Kano", "Enugu", "Edo", "Ogun", "Osun", "Plateau", "Akwa Ibom", "Cross River", "Imo", "Delta", "Kaduna"];

export default function PharmaciesPage() {
  const [search, setSearch] = useState("");
  const [state, setState] = useState("");
  const [page, setPage] = useState(1);
  const limit = 12;

  const { data, isLoading } = usePharmacies({
    search: search || undefined,
    state: state || undefined,
    page,
    limit,
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 text-green-100 text-sm mb-4">
            <Link href="/" className="hover:text-white">Home</Link>
            <span>/</span>
            <span>Pharmacies</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3" data-testid="text-page-title">
            <Pill className="inline h-8 w-8 mr-2" />
            Verified Pharmacies in Nigeria
          </h1>
          <p className="text-green-100 text-lg max-w-2xl">
            Find verified pharmacies near you. Browse by location, check operating hours, delivery options, and services available.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search pharmacies..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-10"
              data-testid="input-search-pharmacies"
            />
          </div>
          <Select value={state} onValueChange={(v) => { setState(v === "all" ? "" : v); setPage(1); }}>
            <SelectTrigger className="w-full md:w-48" data-testid="select-state-filter">
              <SelectValue placeholder="All States" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All States</SelectItem>
              {NIGERIAN_STATES.map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-6 bg-slate-200 rounded w-3/4 mb-3" />
                  <div className="h-4 bg-slate-200 rounded w-1/2 mb-2" />
                  <div className="h-4 bg-slate-200 rounded w-full mb-4" />
                  <div className="flex gap-2">
                    <div className="h-6 bg-slate-200 rounded w-16" />
                    <div className="h-6 bg-slate-200 rounded w-16" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4" data-testid="text-results-count">
              {data?.total || 0} pharmacy{(data?.total || 0) !== 1 ? ' locations' : ''} found
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data?.data.map((pharmacy) => (
                <Link key={pharmacy.id} href={`/pharmacies/${pharmacy.slug || pharmacy.id}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full" data-testid={`card-pharmacy-${pharmacy.id}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-lg line-clamp-2">{pharmacy.name}</CardTitle>
                        {pharmacy.isVerified && (
                          <Badge className="shrink-0 text-xs bg-green-100 text-green-700 hover:bg-green-100">
                            <ShieldCheck className="h-3 w-3 mr-1" /> Verified
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{pharmacy.address}, {pharmacy.city}, {pharmacy.state}</span>
                      </div>
                      {pharmacy.phone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-4 w-4 shrink-0" />
                          <span>{pharmacy.phone}</span>
                        </div>
                      )}
                      {pharmacy.operatingHours && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4 shrink-0" />
                          <span className="line-clamp-1">{pharmacy.operatingHours}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        {(pharmacy.averageRating ?? 0) > 0 && (
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">{(pharmacy.averageRating ?? 0).toFixed(1)}</span>
                            <span className="text-xs text-muted-foreground">({pharmacy.totalReviews})</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {pharmacy.is24Hours && (
                          <Badge variant="outline" className="text-xs gap-1 border-green-300 text-green-700">
                            <Clock className="h-3 w-3" /> 24/7
                          </Badge>
                        )}
                        {pharmacy.hasDelivery && (
                          <Badge variant="outline" className="text-xs gap-1">
                            <Truck className="h-3 w-3" /> Delivery
                          </Badge>
                        )}
                        {pharmacy.hasOnlineOrdering && (
                          <Badge variant="outline" className="text-xs gap-1">
                            <ShoppingCart className="h-3 w-3" /> Online Orders
                          </Badge>
                        )}
                        {pharmacy.acceptsInsurance && (
                          <Badge variant="outline" className="text-xs gap-1">
                            <ShieldCheck className="h-3 w-3" /> Insurance
                          </Badge>
                        )}
                      </div>
                      {pharmacy.services && pharmacy.services.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {pharmacy.services.slice(0, 3).map((s) => (
                            <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                          ))}
                          {pharmacy.services.length > 3 && (
                            <Badge variant="secondary" className="text-xs">+{pharmacy.services.length - 3}</Badge>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {data && data.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                  data-testid="button-prev-page"
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </Button>
                <span className="text-sm text-muted-foreground px-4">
                  Page {page} of {data.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= data.totalPages}
                  onClick={() => setPage(p => p + 1)}
                  data-testid="button-next-page"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
