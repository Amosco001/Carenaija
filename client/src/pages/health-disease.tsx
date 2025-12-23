import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { ArrowLeft, Activity, AlertCircle, BookOpen, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SEOHead } from "@/components/seo-head";
import type { Disease, HealthArticle } from "@shared/schema";

export default function HealthDiseasePage() {
  const { slug } = useParams<{ slug: string }>();

  const { data: disease, isLoading } = useQuery<Disease>({
    queryKey: ["/api/health/diseases", slug],
    queryFn: () => fetch(`/api/health/diseases/${slug}`).then(r => r.json()),
    enabled: !!slug,
  });

  const { data: relatedArticles } = useQuery<HealthArticle[]>({
    queryKey: ["/api/health/articles", { disease: slug }],
    queryFn: () => fetch(`/api/health/articles?disease=${slug}`).then(r => r.json()),
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="bg-gradient-to-b from-red-50 to-white min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-10 w-32 mb-6" />
          <Skeleton className="h-12 w-96 mb-4" />
          <Skeleton className="h-6 w-full max-w-2xl mb-8" />
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Skeleton className="h-64" />
            </div>
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    );
  }

  if (!disease) {
    return (
      <div className="bg-gradient-to-b from-red-50 to-white min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <Link href="/health/diseases">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Disease Library
            </Button>
          </Link>
          <Card className="p-12 text-center">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Disease Not Found</h1>
            <p className="text-muted-foreground mb-4">
              The disease you're looking for doesn't exist in our library.
            </p>
            <Link href="/health/diseases">
              <Button>Browse Disease Library</Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title={`${disease.name} - CareNaija Health Hub`}
        description={disease.description}
      />

      <div className="bg-gradient-to-b from-red-50 to-white min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <Link href="/health/diseases">
            <Button variant="ghost" className="mb-6" data-testid="back-to-diseases">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Disease Library
            </Button>
          </Link>

          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Activity className="h-8 w-8 text-red-500" />
              <h1 className="text-3xl font-bold" data-testid="disease-title">{disease.name}</h1>
            </div>
            {disease.alternateNames && disease.alternateNames.length > 0 && (
              <p className="text-muted-foreground">
                Also known as: {disease.alternateNames.join(", ")}
              </p>
            )}
            {disease.isCommon && (
              <Badge className="mt-2 bg-orange-100 text-orange-700">
                <AlertCircle className="h-3 w-3 mr-1" />
                Common in Nigeria
              </Badge>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>About This Condition</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">{disease.description}</p>
                </CardContent>
              </Card>

              {disease.symptoms && disease.symptoms.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Common Symptoms</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {disease.symptoms.map((symptom, i) => (
                        <Badge key={i} variant="secondary" className="text-sm py-1 px-3">
                          {symptom}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {disease.causes && (
                <Card>
                  <CardHeader>
                    <CardTitle>Causes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">{disease.causes}</p>
                  </CardContent>
                </Card>
              )}

              {disease.riskFactors && disease.riskFactors.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Risk Factors</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      {disease.riskFactors.map((factor: string, i: number) => (
                        <li key={i}>{factor}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {disease.prevention && (
                <Card>
                  <CardHeader>
                    <CardTitle>Prevention</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">{disease.prevention}</p>
                  </CardContent>
                </Card>
              )}

              {disease.treatment && (
                <Card>
                  <CardHeader>
                    <CardTitle>Treatment Options</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">{disease.treatment}</p>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              <Card className="bg-yellow-50 border-yellow-200">
                <CardHeader>
                  <CardTitle className="text-yellow-800 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    When to See a Doctor
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-yellow-700 text-sm">
                    If you experience severe or persistent symptoms, please consult a healthcare 
                    professional immediately. Early diagnosis and treatment can prevent complications.
                  </p>
                  <Link href="/search?specialty=general">
                    <Button variant="outline" className="mt-4 w-full border-yellow-300 text-yellow-800 hover:bg-yellow-100">
                      Find a Hospital Near You
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {relatedArticles && relatedArticles.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      Related Articles
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {relatedArticles.slice(0, 5).map((article) => (
                        <li key={article.id}>
                          <Link 
                            href={`/health/article/${article.slug}`}
                            className="text-primary hover:underline flex items-center gap-1"
                          >
                            {article.title}
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {disease.prevalenceInNigeria && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Prevalence in Nigeria</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">{disease.prevalenceInNigeria}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          <Card className="mt-8 p-6 bg-blue-50 border-blue-200">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-blue-800 mb-1">Medical Disclaimer</h3>
                <p className="text-sm text-blue-700">
                  This information is for educational purposes only and should not replace professional 
                  medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider 
                  for proper diagnosis and treatment of any health condition.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
