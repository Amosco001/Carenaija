import { useState } from "react";
import { Link } from "wouter";
import { usePhysicians, usePhysicianSpecialties, usePhysicianCities } from "@/hooks/usePhysicians";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, GraduationCap, Clock, Star, Phone, Video, UserCheck, ChevronLeft, ChevronRight, Stethoscope, Users } from "lucide-react";

function formatPrice(amount: number | null | undefined): string {
  if (!amount) return "N/A";
  return `₦${amount.toLocaleString()}`;
}

export default function PhysiciansPage() {
  const [search, setSearch] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [city, setCity] = useState("");
  const [page, setPage] = useState(1);
  const limit = 12;

  const { data: specialties } = usePhysicianSpecialties();
  const { data: cities } = usePhysicianCities();
  const { data, isLoading } = usePhysicians({
    search: search || undefined,
    specialty: specialty || undefined,
    city: city || undefined,
    page,
    limit,
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 text-emerald-100 text-sm mb-4">
            <Link href="/" className="hover:text-white">Home</Link>
            <span>/</span>
            <span>Find Physicians</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3" data-testid="text-page-title">
            <Stethoscope className="inline h-8 w-8 mr-2" />
            Find Physicians in Nigeria
          </h1>
          <p className="text-emerald-100 text-lg max-w-2xl">
            Search for qualified doctors by specialty, city, or name. View profiles, qualifications, consultation fees, and hospital affiliations.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by doctor name or specialty..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-10"
              data-testid="input-search-physicians"
            />
          </div>
          <Select value={specialty} onValueChange={(v) => { setSpecialty(v === "all" ? "" : v); setPage(1); }}>
            <SelectTrigger className="w-full md:w-52" data-testid="select-specialty-filter">
              <SelectValue placeholder="All Specialties" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Specialties</SelectItem>
              {specialties?.map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={city} onValueChange={(v) => { setCity(v === "all" ? "" : v); setPage(1); }}>
            <SelectTrigger className="w-full md:w-44" data-testid="select-city-filter">
              <SelectValue placeholder="All Cities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cities</SelectItem>
              {cities?.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-12 w-12 bg-slate-200 rounded-full" />
                    <div className="flex-1">
                      <div className="h-5 bg-slate-200 rounded w-3/4 mb-2" />
                      <div className="h-4 bg-slate-200 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="h-4 bg-slate-200 rounded w-full mb-2" />
                  <div className="h-4 bg-slate-200 rounded w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground" data-testid="text-results-count">
                {data?.total || 0} physician{(data?.total || 0) !== 1 ? 's' : ''} found
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data?.data.map((physician) => (
                <Link key={physician.id} href={`/physicians/${physician.slug || physician.id}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full" data-testid={`card-physician-${physician.id}`}>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                          <Stethoscope className="h-6 w-6 text-emerald-600" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold line-clamp-1" data-testid={`text-physician-name-${physician.id}`}>
                            {physician.title} {physician.fullName}
                          </h3>
                          <p className="text-sm text-emerald-600 font-medium">{physician.specialty}</p>
                          {physician.subspecialty && (
                            <p className="text-xs text-muted-foreground">{physician.subspecialty}</p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          <span>{physician.city}, {physician.state}</span>
                        </div>
                        {physician.yearsOfExperience && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-3.5 w-3.5 shrink-0" />
                            <span>{physician.yearsOfExperience} years experience</span>
                          </div>
                        )}
                        {physician.qualifications && physician.qualifications.length > 0 && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <GraduationCap className="h-3.5 w-3.5 shrink-0" />
                            <span className="line-clamp-1">{physician.qualifications.join(", ")}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between border-t pt-3">
                        <div className="font-semibold text-emerald-600">
                          {formatPrice(physician.consultationFee)}
                        </div>
                        <div className="flex gap-1.5">
                          {physician.acceptingNewPatients && (
                            <Badge variant="outline" className="text-[10px] gap-0.5 py-0">
                              <UserCheck className="h-3 w-3" /> Open
                            </Badge>
                          )}
                          {physician.teleconsultation && (
                            <Badge variant="outline" className="text-[10px] gap-0.5 py-0">
                              <Video className="h-3 w-3" /> Tele
                            </Badge>
                          )}
                        </div>
                      </div>
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
