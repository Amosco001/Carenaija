import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, Search, Activity, AlertCircle, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SEOHead } from "@/components/seo-head";
import type { Disease } from "@shared/schema";

function DiseaseCard({ disease }: { disease: Disease }) {
  return (
    <Link href={`/health/disease/${disease.slug}`} data-testid={`disease-card-${disease.id}`}>
      <Card className="group hover:shadow-lg hover:border-primary/50 transition-all duration-300 h-full cursor-pointer">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg group-hover:text-primary transition-colors flex items-center gap-2">
            <Activity className="h-5 w-5 text-red-500" />
            {disease.name}
          </CardTitle>
          {disease.alternateNames && disease.alternateNames.length > 0 && (
            <p className="text-sm text-muted-foreground">
              Also known as: {disease.alternateNames.slice(0, 2).join(", ")}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-3 mb-3">{disease.description}</p>
          {disease.symptoms && disease.symptoms.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Common symptoms:</p>
              <div className="flex flex-wrap gap-1">
                {disease.symptoms.slice(0, 4).map((symptom, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">{symptom}</Badge>
                ))}
                {disease.symptoms.length > 4 && (
                  <Badge variant="secondary" className="text-xs">+{disease.symptoms.length - 4} more</Badge>
                )}
              </div>
            </div>
          )}
          {disease.isCommon && (
            <Badge className="mt-3 bg-orange-100 text-orange-700 hover:bg-orange-200">
              <AlertCircle className="h-3 w-3 mr-1" />
              Common in Nigeria
            </Badge>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

export default function HealthDiseasesPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: diseases, isLoading } = useQuery<Disease[]>({
    queryKey: ["/api/health/diseases"],
    queryFn: () => fetch("/api/health/diseases").then(r => r.json()),
  });

  const filteredDiseases = diseases?.filter(disease => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      disease.name.toLowerCase().includes(query) ||
      disease.description.toLowerCase().includes(query) ||
      disease.symptoms?.some(s => s.toLowerCase().includes(query)) ||
      disease.alternateNames?.some(n => n.toLowerCase().includes(query))
    );
  });

  const commonDiseases = filteredDiseases?.filter(d => d.isCommon);
  const otherDiseases = filteredDiseases?.filter(d => !d.isCommon);

  return (
    <>
      <SEOHead
        title="Disease Library - CareNaija Health Hub"
        description="Learn about common diseases in Nigeria, their symptoms, causes, prevention and treatment. Trusted health information from medical professionals."
      />

      <div className="bg-gradient-to-b from-red-50 to-white min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <Link href="/health">
            <Button variant="ghost" className="mb-6" data-testid="back-to-health">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Health Hub
            </Button>
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2" data-testid="diseases-title">Disease Library</h1>
            <p className="text-muted-foreground text-lg">
              Learn about common health conditions, their symptoms, and how to prevent them.
            </p>
          </div>

          <div className="mb-8">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search diseases by name or symptoms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="disease-search"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-64" />
              ))}
            </div>
          ) : filteredDiseases && filteredDiseases.length > 0 ? (
            <div className="space-y-10">
              {commonDiseases && commonDiseases.length > 0 && (
                <section>
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2" data-testid="common-diseases-section">
                    <AlertCircle className="h-5 w-5 text-orange-500" />
                    Common Diseases in Nigeria
                  </h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {commonDiseases.map((disease) => (
                      <DiseaseCard key={disease.id} disease={disease} />
                    ))}
                  </div>
                </section>
              )}

              {otherDiseases && otherDiseases.length > 0 && (
                <section>
                  <h2 className="text-xl font-bold mb-4" data-testid="other-diseases-section">
                    {commonDiseases && commonDiseases.length > 0 ? "Other Conditions" : "All Conditions"}
                  </h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {otherDiseases.map((disease) => (
                      <DiseaseCard key={disease.id} disease={disease} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {searchQuery ? "No diseases found" : "No diseases in library yet"}
              </h3>
              <p className="text-muted-foreground">
                {searchQuery 
                  ? "Try searching with different terms or browse our health articles."
                  : "Disease information will appear here once added."}
              </p>
              <Link href="/health">
                <Button variant="outline" className="mt-4">
                  Browse Health Articles
                </Button>
              </Link>
            </Card>
          )}

          <Card className="mt-12 p-6 bg-yellow-50 border-yellow-200">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-yellow-800 mb-1">Medical Disclaimer</h3>
                <p className="text-sm text-yellow-700">
                  The information in this disease library is for educational purposes only and should not replace 
                  professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare 
                  provider for proper diagnosis and treatment of any health condition.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
