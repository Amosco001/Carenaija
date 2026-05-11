import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Search, ArrowRight, Clock, Eye, Bookmark, Heart, 
  Stethoscope, Shield, Apple, Baby, Brain, Activity, 
  Ambulance, BookOpen, TrendingUp, Mail
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SEOHead } from "@/components/seo-head";
import type { HealthArticle, HealthCategory, Disease } from "@shared/schema";

const iconMap: Record<string, React.ComponentType<any>> = {
  stethoscope: Stethoscope,
  'shield-check': Shield,
  apple: Apple,
  heart: Heart,
  baby: Baby,
  brain: Brain,
  activity: Activity,
  ambulance: Ambulance,
};

function formatDate(date: string | Date | null): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-NG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function CategoryCard({ category }: { category: HealthCategory }) {
  const IconComponent = iconMap[category.icon] || BookOpen;
  return (
    <Link href={`/health/category/${category.slug}`} data-testid={`category-card-${category.id}`}>
      <Card className="group hover:shadow-lg hover:border-primary/50 transition-all duration-300 h-full cursor-pointer">
        <CardHeader className="pb-2">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
            <IconComponent className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-lg group-hover:text-primary transition-colors">
            {category.name}
          </CardTitle>
          <CardDescription className="line-clamp-2">{category.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{category.articleCount || 0} articles</span>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function ArticleCard({ article }: { article: HealthArticle }) {
  return (
    <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden" data-testid={`health-article-card-${article.id}`}>
      {article.coverImageUrl && (
        <div className="aspect-video overflow-hidden">
          <img
            src={article.coverImageUrl}
            alt={article.coverImageAlt || article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            decoding="async"
          />
        </div>
      )}
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2 mb-2">
          {article.isFeatured && (
            <Badge className="bg-yellow-500 text-white text-xs">Featured</Badge>
          )}
          {article.isEditorPick && (
            <Badge variant="outline" className="text-xs border-primary text-primary">Editor's Pick</Badge>
          )}
          {article.medicalReviewedBy && (
            <Badge variant="outline" className="text-xs border-green-500 text-green-600">Medically Reviewed</Badge>
          )}
        </div>
        <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
          <Link href={`/health/article/${article.slug}`} data-testid={`link-health-article-${article.id}`}>
            {article.title}
          </Link>
        </CardTitle>
        <CardDescription className="line-clamp-2">{article.excerpt}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {article.readingTimeMinutes} min
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {article.viewCount || 0}
            </span>
          </div>
          <span className="flex items-center gap-1">
            <Bookmark className="h-4 w-4" />
            {article.bookmarkCount || 0}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function FeaturedArticle({ article }: { article: HealthArticle }) {
  return (
    <Card className="group overflow-hidden border-0 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30" data-testid="featured-health-article">
      <div className="grid md:grid-cols-2 gap-6">
        {article.coverImageUrl && (
          <div className="aspect-video md:aspect-auto overflow-hidden rounded-lg">
            <img
              src={article.coverImageUrl}
              alt={article.coverImageAlt || article.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
              decoding="async"
            />
          </div>
        )}
        <div className="p-6 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-4">
            <Badge className="bg-green-600">Featured</Badge>
            {article.medicalReviewedBy && (
              <Badge variant="outline" className="border-green-500 text-green-600">
                Medically Reviewed
              </Badge>
            )}
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-4 group-hover:text-primary transition-colors">
            <Link href={`/health/article/${article.slug}`} data-testid="link-featured-health-article">
              {article.title}
            </Link>
          </h2>
          <p className="text-muted-foreground mb-6 line-clamp-3">{article.excerpt}</p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {article.readingTimeMinutes} min read
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {article.viewCount || 0} views
            </span>
          </div>
          <Link href={`/health/article/${article.slug}`}>
            <Button className="w-fit group/btn bg-green-600 hover:bg-green-700" data-testid="read-featured-health-article">
              Read Article
              <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}

function DiseaseCard({ disease }: { disease: Disease }) {
  return (
    <Link href={`/health/disease/${disease.slug}`} data-testid={`disease-card-${disease.id}`}>
      <Card className="group hover:shadow-md hover:border-primary/50 transition-all duration-300 h-full cursor-pointer">
        <CardHeader className="pb-2">
          <CardTitle className="text-base group-hover:text-primary transition-colors flex items-center gap-2">
            <Activity className="h-4 w-4 text-red-500" />
            {disease.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-2">{disease.description}</p>
          {disease.symptoms && disease.symptoms.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {disease.symptoms.slice(0, 3).map((symptom, i) => (
                <Badge key={i} variant="secondary" className="text-xs">{symptom}</Badge>
              ))}
              {disease.symptoms.length > 3 && (
                <Badge variant="secondary" className="text-xs">+{disease.symptoms.length - 3}</Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const res = await fetch("/api/health/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setSubscribed(true);
        setEmail("");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
      <CardContent className="p-8">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-xl font-bold mb-2">Get Weekly Health Tips</h3>
            <p className="text-muted-foreground">
              Subscribe to our newsletter for the latest health articles, tips, and disease prevention guides.
            </p>
          </div>
          {subscribed ? (
            <div className="text-green-600 font-medium flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Thanks for subscribing!
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex gap-2 w-full md:w-auto">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="min-w-[200px]"
                data-testid="input-newsletter-email"
              />
              <Button type="submit" disabled={loading} data-testid="button-subscribe-newsletter">
                {loading ? "..." : "Subscribe"}
              </Button>
            </form>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function HealthHub() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const { data: categories, isLoading: categoriesLoading } = useQuery<HealthCategory[]>({
    queryKey: ["/api/health/categories"],
  });

  const { data: featuredArticles, isLoading: featuredLoading } = useQuery<HealthArticle[]>({
    queryKey: ["/api/health/articles/featured"],
  });

  const { data: recentArticles, isLoading: recentLoading } = useQuery<HealthArticle[]>({
    queryKey: ["/api/health/articles/recent"],
  });

  const { data: popularArticles, isLoading: popularLoading } = useQuery<HealthArticle[]>({
    queryKey: ["/api/health/articles/popular"],
  });

  const { data: editorPicks } = useQuery<HealthArticle[]>({
    queryKey: ["/api/health/articles/editor-picks"],
  });

  const { data: commonDiseases, isLoading: diseasesLoading } = useQuery<Disease[]>({
    queryKey: ["/api/health/diseases", { common: true }],
    queryFn: () => fetch("/api/health/diseases?common=true").then(r => r.json()),
  });

  const { data: searchResults, isLoading: searchLoading } = useQuery<HealthArticle[]>({
    queryKey: ["/api/health/articles/search", searchQuery],
    queryFn: () => fetch(`/api/health/articles/search?q=${encodeURIComponent(searchQuery)}`).then(r => r.json()),
    enabled: searchQuery.length >= 3,
  });

  const { data: healthTip } = useQuery<{ title: string; content: string } | null>({
    queryKey: ["/api/health/tips/today"],
  });

  const displayArticles = searchQuery.length >= 3 ? searchResults : 
    activeTab === "popular" ? popularArticles :
    activeTab === "editor-picks" ? editorPicks :
    recentArticles;

  return (
    <>
      <SEOHead
        title="Health Hub - Wellness Tips & Guides"
        description="Explore trusted health information, disease prevention guides, and wellness tips tailored for Nigerians. Learn about common diseases, symptoms, and when to see a doctor."
        keywords="health tips Nigeria, disease prevention, wellness guide, Nigerian healthcare education"
        canonicalUrl="https://www.carenaija.com/health"
        ogType="website"
      />

      <div className="min-h-screen bg-gradient-to-b from-green-50/50 to-white dark:from-green-950/10 dark:to-background">
        <div className="container mx-auto px-4 py-8">
          {/* Hero Section */}
          <section className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-4 py-2 rounded-full mb-6">
              <Heart className="h-4 w-4" />
              <span className="text-sm font-medium">Your Health Matters</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4" data-testid="health-hub-title">
              Health Education Hub
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Trusted health information to help you and your family make informed decisions about your wellbeing.
            </p>

            {/* Search */}
            <div className="max-w-xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search health topics, diseases, symptoms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 text-lg rounded-full"
                data-testid="input-health-search"
              />
            </div>
          </section>

          {/* Health Tip of the Day */}
          {healthTip && (
            <Card className="mb-10 border-l-4 border-l-green-500 bg-green-50/50 dark:bg-green-950/20">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-green-700 dark:text-green-300 mb-1">Health Tip of the Day</h3>
                    <p className="text-muted-foreground">{healthTip?.content || "Stay hydrated! Drink at least 8 glasses of water daily for optimal health."}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Featured Article */}
          {!searchQuery && featuredArticles && featuredArticles.length > 0 && (
            <section className="mb-12">
              <FeaturedArticle article={featuredArticles[0]} />
            </section>
          )}

          {/* Categories */}
          {!searchQuery && (
            <section className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold" data-testid="section-categories">Browse by Topic</h2>
                <Link href="/health/categories">
                  <Button variant="ghost" className="group" data-testid="link-all-categories">
                    View All
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
              {categoriesLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[...Array(8)].map((_, i) => (
                    <Skeleton key={i} className="h-40" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {categories?.slice(0, 8).map((category) => (
                    <CategoryCard key={category.id} category={category} />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Common Diseases in Nigeria */}
          {!searchQuery && (
            <section className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold" data-testid="section-diseases">Common Diseases in Nigeria</h2>
                  <p className="text-muted-foreground">Learn about prevalent health conditions and their symptoms</p>
                </div>
                <Link href="/health/diseases">
                  <Button variant="ghost" className="group" data-testid="link-all-diseases">
                    Disease Library
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
              {diseasesLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-32" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {commonDiseases?.slice(0, 8).map((disease) => (
                    <DiseaseCard key={disease.id} disease={disease} />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Articles Section with Tabs */}
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold" data-testid="section-articles">
                {searchQuery ? `Search Results for "${searchQuery}"` : "Health Articles"}
              </h2>
            </div>

            {!searchQuery && (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
                <TabsList>
                  <TabsTrigger value="all" data-testid="tab-all-articles">Recent</TabsTrigger>
                  <TabsTrigger value="popular" data-testid="tab-popular-articles">Popular</TabsTrigger>
                  <TabsTrigger value="editor-picks" data-testid="tab-editor-picks">Editor's Picks</TabsTrigger>
                </TabsList>
              </Tabs>
            )}

            {(recentLoading || popularLoading || searchLoading) ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-80" />
                ))}
              </div>
            ) : displayArticles && displayArticles.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayArticles.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  {searchQuery ? "No articles found" : "No articles yet"}
                </h3>
                <p className="text-muted-foreground">
                  {searchQuery ? "Try different search terms" : "Health articles will appear here once published"}
                </p>
              </Card>
            )}
          </section>

          {/* Newsletter */}
          <section className="mb-12">
            <NewsletterSection />
          </section>

          {/* Quick Links */}
          <section>
            <Card className="p-6">
              <h3 className="font-bold mb-4">Quick Health Resources</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link href="/search?specialty=emergency" className="flex items-center gap-2 text-primary hover:underline">
                  <Ambulance className="h-4 w-4" />
                  Find Emergency Care
                </Link>
                <Link href="/health/category/first-aid" className="flex items-center gap-2 text-primary hover:underline">
                  <Shield className="h-4 w-4" />
                  First Aid Guides
                </Link>
                <Link href="/health/diseases" className="flex items-center gap-2 text-primary hover:underline">
                  <Activity className="h-4 w-4" />
                  Disease Library
                </Link>
                <Link href="/help" className="flex items-center gap-2 text-primary hover:underline">
                  <BookOpen className="h-4 w-4" />
                  Help Center
                </Link>
              </div>
            </Card>
          </section>
        </div>
      </div>
    </>
  );
}
