import { useRoute, Link } from "wouter";
import { usePhysician, usePhysicianAffiliations } from "@/hooks/usePhysicians";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Mail, GraduationCap, Clock, Star, Video, UserCheck, Building2, Calendar, Stethoscope, Loader2, AlertCircle, Languages } from "lucide-react";

function formatPrice(amount: number | null | undefined): string {
  if (!amount) return "N/A";
  return `₦${amount.toLocaleString()}`;
}

export default function PhysicianDetailsPage() {
  const [, params] = useRoute("/physicians/:idOrSlug");
  const idOrSlug = params?.idOrSlug || "";

  const { data: physician, isLoading } = usePhysician(idOrSlug);
  const physicianId = physician?.id || (/^\d+$/.test(idOrSlug) ? parseInt(idOrSlug) : 0);
  const { data: affiliations } = usePhysicianAffiliations(physicianId);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!physician) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Physician Not Found</h2>
          <Link href="/physicians">
            <Button>Browse Physicians</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 text-emerald-100 text-sm mb-4">
            <Link href="/" className="hover:text-white">Home</Link>
            <span>/</span>
            <Link href="/physicians" className="hover:text-white">Find Physicians</Link>
            <span>/</span>
            <span className="text-white">{physician.title} {physician.fullName}</span>
          </div>
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <Stethoscope className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-1" data-testid="text-physician-name">
                {physician.title} {physician.fullName}
              </h1>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-emerald-100 font-medium">{physician.specialty}</span>
                {physician.subspecialty && (
                  <>
                    <span className="text-emerald-200">•</span>
                    <span className="text-emerald-100">{physician.subspecialty}</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                {physician.acceptingNewPatients && (
                  <Badge className="bg-white/20 text-white border-0 gap-1">
                    <UserCheck className="h-3 w-3" /> Accepting New Patients
                  </Badge>
                )}
                {physician.teleconsultation && (
                  <Badge className="bg-white/20 text-white border-0 gap-1">
                    <Video className="h-3 w-3" /> Teleconsultation Available
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {physician.bio && (
              <Card>
                <CardHeader>
                  <CardTitle>About</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed" data-testid="text-physician-bio">{physician.bio}</p>
                </CardContent>
              </Card>
            )}

            {physician.qualifications && physician.qualifications.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" /> Qualifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {physician.qualifications.map(q => (
                      <Badge key={q} variant="secondary" className="text-sm py-1 px-3">{q}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {affiliations && affiliations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" /> Hospital Affiliations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {affiliations.map((aff) => (
                    <div key={aff.id} className="border rounded-lg p-4" data-testid={`card-affiliation-${aff.id}`}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <Link href={`/hospital/${aff.hospitalId}`} className="font-medium text-emerald-600 hover:underline">
                            {aff.hospitalName}
                          </Link>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {aff.hospitalCity}, {aff.hospitalState}
                          </p>
                        </div>
                        <Badge variant="outline">{aff.role}</Badge>
                      </div>
                      {aff.department && (
                        <p className="text-sm text-muted-foreground mb-2">Department: {aff.department}</p>
                      )}
                      {aff.availableDays && aff.availableDays.length > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {aff.availableDays.join(", ")}
                            {aff.availableHours && ` (${aff.availableHours})`}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Consultation Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-4 bg-emerald-50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Consultation Fee</p>
                  <p className="text-2xl font-bold text-emerald-600" data-testid="text-consultation-fee">
                    {formatPrice(physician.consultationFee)}
                  </p>
                </div>
                {physician.phone && (
                  <a href={`tel:${physician.phone}`} className="w-full">
                    <Button variant="outline" className="w-full gap-2" data-testid="button-call">
                      <Phone className="h-4 w-4" /> Call Doctor
                    </Button>
                  </a>
                )}
                {physician.email && (
                  <a href={`mailto:${physician.email}`}>
                    <Button variant="outline" className="w-full gap-2 mt-2" data-testid="button-email">
                      <Mail className="h-4 w-4" /> Send Email
                    </Button>
                  </a>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Location</span>
                  <span className="font-medium flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {physician.city}, {physician.state}
                  </span>
                </div>
                {physician.yearsOfExperience && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Experience</span>
                    <span className="font-medium">{physician.yearsOfExperience} years</span>
                  </div>
                )}
                {physician.gender && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Gender</span>
                    <span className="font-medium">{physician.gender}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">New Patients</span>
                  <span className="font-medium">{physician.acceptingNewPatients ? "Yes" : "No"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Teleconsultation</span>
                  <span className="font-medium">{physician.teleconsultation ? "Available" : "Not Available"}</span>
                </div>
              </CardContent>
            </Card>

            {physician.languages && physician.languages.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Languages className="h-5 w-5" /> Languages
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {physician.languages.map(lang => (
                      <Badge key={lang} variant="secondary">{lang}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
