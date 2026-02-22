import { useState } from "react";
import { useRoute, Link } from "wouter";
import { useDiagnosticCenter, useDiagnosticTests } from "@/hooks/useDiagnosticCenters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Phone, Mail, Globe, Clock, Star, Home, Wifi, Search, FlaskConical, Shield, AlertCircle, Loader2, Beaker, ChevronDown, ChevronUp } from "lucide-react";

function formatPrice(amount: number | null | undefined): string {
  if (!amount) return "N/A";
  return `₦${amount.toLocaleString()}`;
}

export default function DiagnosticCenterDetailsPage() {
  const [, params] = useRoute("/diagnostic-centers/:idOrSlug");
  const idOrSlug = params?.idOrSlug || "";
  const numericId = /^\d+$/.test(idOrSlug) ? parseInt(idOrSlug) : 0;

  const { data: center, isLoading: centerLoading } = useDiagnosticCenter(idOrSlug);
  const centerId = center?.id || numericId;
  const { data: tests, isLoading: testsLoading } = useDiagnosticTests(centerId);

  const [testSearch, setTestSearch] = useState("");
  const [testCategory, setTestCategory] = useState("");
  const [expandedTest, setExpandedTest] = useState<number | null>(null);

  if (centerLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!center) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Diagnostic Center Not Found</h2>
          <Link href="/diagnostic-centers">
            <Button>Browse Diagnostic Centers</Button>
          </Link>
        </div>
      </div>
    );
  }

  const categories = tests ? Array.from(new Set(tests.map(t => t.category))).sort() : [];
  const filteredTests = tests?.filter(t => {
    if (testCategory && t.category !== testCategory) return false;
    if (testSearch && !t.testName.toLowerCase().includes(testSearch.toLowerCase())) return false;
    return true;
  }) || [];

  const groupedTests: Record<string, typeof filteredTests> = {};
  filteredTests.forEach(t => {
    if (!groupedTests[t.category]) groupedTests[t.category] = [];
    groupedTests[t.category].push(t);
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 text-blue-100 text-sm mb-4">
            <Link href="/" className="hover:text-white">Home</Link>
            <span>/</span>
            <Link href="/diagnostic-centers" className="hover:text-white">Diagnostic Centers</Link>
            <span>/</span>
            <span className="text-white">{center.name}</span>
          </div>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2" data-testid="text-center-name">{center.name}</h1>
              <div className="flex items-center gap-3 flex-wrap">
                <Badge variant="secondary" className="bg-white/20 text-white border-0">
                  {center.ownership}
                </Badge>
                {(center.averageRating ?? 0) > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-300 text-yellow-300" />
                    <span className="font-medium">{(center.averageRating ?? 0).toFixed(1)}</span>
                    <span className="text-blue-100">({center.totalReviews} reviews)</span>
                  </div>
                )}
                {center.homeService && (
                  <Badge variant="secondary" className="bg-white/20 text-white border-0 gap-1">
                    <Home className="h-3 w-3" /> Home Service
                  </Badge>
                )}
                {center.onlineResults && (
                  <Badge variant="secondary" className="bg-white/20 text-white border-0 gap-1">
                    <Wifi className="h-3 w-3" /> Online Results
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Tabs defaultValue="tests">
              <TabsList className="mb-6">
                <TabsTrigger value="tests" data-testid="tab-tests">
                  <Beaker className="h-4 w-4 mr-1" /> Tests & Pricing
                </TabsTrigger>
                <TabsTrigger value="about" data-testid="tab-about">About</TabsTrigger>
              </TabsList>

              <TabsContent value="tests">
                <div className="flex flex-col md:flex-row gap-3 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search tests..."
                      value={testSearch}
                      onChange={(e) => setTestSearch(e.target.value)}
                      className="pl-10"
                      data-testid="input-search-tests"
                    />
                  </div>
                  <Select value={testCategory} onValueChange={(v) => setTestCategory(v === "all" ? "" : v)}>
                    <SelectTrigger className="w-full md:w-52" data-testid="select-test-category">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {testsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : filteredTests.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      No tests found matching your criteria.
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(groupedTests).map(([category, catTests]) => (
                      <div key={category}>
                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                          <FlaskConical className="h-5 w-5 text-blue-600" />
                          {category}
                          <Badge variant="secondary" className="text-xs">{catTests.length}</Badge>
                        </h3>
                        <div className="space-y-2">
                          {catTests.map((test) => (
                            <Card key={test.id} className="overflow-hidden" data-testid={`card-test-${test.id}`}>
                              <div
                                className="p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                                onClick={() => setExpandedTest(expandedTest === test.id ? null : test.id)}
                              >
                                <div className="flex items-center justify-between gap-4">
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium" data-testid={`text-test-name-${test.id}`}>{test.testName}</h4>
                                    {test.sampleType && (
                                      <span className="text-xs text-muted-foreground">Sample: {test.sampleType}</span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3 shrink-0">
                                    <div className="text-right">
                                      <div className="font-semibold text-blue-600" data-testid={`text-test-price-${test.id}`}>
                                        {formatPrice(test.priceMin)} - {formatPrice(test.priceMax)}
                                      </div>
                                      <div className="flex gap-1.5 justify-end mt-1">
                                        {test.insuranceAccepted && (
                                          <Badge variant="outline" className="text-[10px] py-0">Insurance</Badge>
                                        )}
                                        {test.homeCollection && (
                                          <Badge variant="outline" className="text-[10px] py-0">Home</Badge>
                                        )}
                                      </div>
                                    </div>
                                    {expandedTest === test.id ? (
                                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                    )}
                                  </div>
                                </div>
                              </div>
                              {expandedTest === test.id && (
                                <div className="px-4 pb-4 border-t pt-3 bg-slate-50/50">
                                  {test.description && (
                                    <p className="text-sm text-muted-foreground mb-2">{test.description}</p>
                                  )}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                    {test.turnaroundTime && (
                                      <div className="flex items-center gap-2">
                                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                        <span><strong>Results:</strong> {test.turnaroundTime}</span>
                                      </div>
                                    )}
                                    {test.sampleType && (
                                      <div className="flex items-center gap-2">
                                        <Beaker className="h-3.5 w-3.5 text-muted-foreground" />
                                        <span><strong>Sample:</strong> {test.sampleType}</span>
                                      </div>
                                    )}
                                  </div>
                                  {test.preparationNotes && (
                                    <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-md text-sm">
                                      <AlertCircle className="h-3.5 w-3.5 inline text-amber-600 mr-1" />
                                      <strong className="text-amber-800">Preparation:</strong>{" "}
                                      <span className="text-amber-700">{test.preparationNotes}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </Card>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="about">
                <Card>
                  <CardContent className="p-6 space-y-4">
                    {center.description && (
                      <p className="text-muted-foreground">{center.description}</p>
                    )}
                    {center.services && center.services.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-2">Services</h3>
                        <div className="flex flex-wrap gap-2">
                          {center.services.map(s => (
                            <Badge key={s} variant="secondary">{s}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {center.accreditations && center.accreditations.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-2">Accreditations</h3>
                        <div className="flex flex-wrap gap-2">
                          {center.accreditations.map(a => (
                            <Badge key={a} variant="outline" className="gap-1">
                              <Shield className="h-3 w-3" /> {a}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <span>{center.address}, {center.city}, {center.state}</span>
                </div>
                {center.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${center.phone}`} className="text-blue-600 hover:underline">{center.phone}</a>
                  </div>
                )}
                {center.email && (
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${center.email}`} className="text-blue-600 hover:underline">{center.email}</a>
                  </div>
                )}
                {center.website && (
                  <div className="flex items-center gap-3 text-sm">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a href={center.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline line-clamp-1">
                      {center.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
                {center.operatingHours && (
                  <div className="flex items-start gap-3 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <span>{center.operatingHours}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Facts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ownership</span>
                  <span className="font-medium">{center.ownership}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Home Service</span>
                  <span className="font-medium">{center.homeService ? "Yes" : "No"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Online Results</span>
                  <span className="font-medium">{center.onlineResults ? "Yes" : "No"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Tests</span>
                  <span className="font-medium">{tests?.length || 0}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
