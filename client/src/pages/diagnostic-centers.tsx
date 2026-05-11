import { useState } from "react";
import { Link } from "wouter";
import { useDiagnosticCenters } from "@/hooks/useDiagnosticCenters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, Phone, Clock, Star, Home, Wifi, ChevronLeft, ChevronRight, FlaskConical, Building2 } from "lucide-react";
import { SEOHead } from "@/components/seo-head";

const NIGERIAN_STATES = ["FCT", "Lagos", "Rivers", "Oyo", "Kano", "Enugu", "Edo", "Ogun", "Osun", "Plateau", "Akwa Ibom", "Borno", "Cross River", "Imo"];

export default function DiagnosticCentersPage() {
  const [search, setSearch] = useState("");
  const [state, setState] = useState("");
  const [page, setPage] = useState(1);
  const limit = 12;

  const { data, isLoading } = useDiagnosticCenters({
    search: search || undefined,
    state: state || undefined,
    page,
    limit,
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <SEOHead
        title="Diagnostic Centers & Labs in Nigeria"
        description="Find accredited diagnostic centers and laboratories in Nigeria. Compare test prices, services, and turnaround times across Lagos, Abuja and nationwide."
        keywords="diagnostic centers Nigeria, labs Nigeria, medical tests Lagos, blood tests Nigeria, imaging centers Nigeria"
        canonicalUrl="https://www.carenaija.com/diagnostic-centers"
      />
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 text-blue-100 text-sm mb-4">
            <Link href="/" className="hover:text-white">Home</Link>
            <span>/</span>
            <span>Diagnostic Centers</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3" data-testid="text-page-title">
            <FlaskConical className="inline h-8 w-8 mr-2" />
            Diagnostic Centers in Nigeria
          </h1>
          <p className="text-blue-100 text-lg max-w-2xl">
            Find diagnostic laboratories and imaging centers near you. Compare test prices, view available services, and check turnaround times.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search diagnostic centers..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-10"
              data-testid="input-search-centers"
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
              {data?.total || 0} diagnostic center{(data?.total || 0) !== 1 ? 's' : ''} found
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data?.data.map((center) => (
                <Link key={center.id} href={`/diagnostic-centers/${center.slug || center.id}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full" data-testid={`card-center-${center.id}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-lg line-clamp-2">{center.name}</CardTitle>
                        <Badge variant={center.ownership === "Government" ? "secondary" : "default"} className="shrink-0 text-xs">
                          {center.ownership}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{center.address}, {center.city}, {center.state}</span>
                      </div>
                      {center.phone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-4 w-4 shrink-0" />
                          <span>{center.phone}</span>
                        </div>
                      )}
                      {center.operatingHours && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4 shrink-0" />
                          <span className="line-clamp-1">{center.operatingHours}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        {(center.averageRating ?? 0) > 0 && (
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">{(center.averageRating ?? 0).toFixed(1)}</span>
                            <span className="text-xs text-muted-foreground">({center.totalReviews})</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {center.homeService && (
                          <Badge variant="outline" className="text-xs gap-1">
                            <Home className="h-3 w-3" /> Home Service
                          </Badge>
                        )}
                        {center.onlineResults && (
                          <Badge variant="outline" className="text-xs gap-1">
                            <Wifi className="h-3 w-3" /> Online Results
                          </Badge>
                        )}
                      </div>
                      {center.services && center.services.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {center.services.slice(0, 3).map((s) => (
                            <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                          ))}
                          {center.services.length > 3 && (
                            <Badge variant="secondary" className="text-xs">+{center.services.length - 3}</Badge>
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
