import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Calendar, Clock, Search, Tag, ArrowRight, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { BlogArticle, BlogCategory, BlogTag } from "@shared/schema";
import { SEOHead } from "@/components/seo-head";

function formatDate(date: string | Date | null): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-NG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function ArticleCard({ article }: { article: BlogArticle }) {
  return (
    <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden" data-testid={`article-card-${article.id}`}>
      {article.coverImageUrl && (
        <div className="aspect-video overflow-hidden">
          <img
            src={article.coverImageUrl}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="text-xs">
            {article.articleType || "Article"}
          </Badge>
          {article.isFeatured && (
            <Badge className="bg-yellow-500 text-white text-xs">Featured</Badge>
          )}
        </div>
        <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
          <Link href={`/blog/${article.slug}`} data-testid={`link-article-${article.id}`}>{article.title}</Link>
        </CardTitle>
        <CardDescription className="line-clamp-2">{article.excerpt}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatDate(article.publishedAt)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {article.readingTimeMinutes} min read
            </span>
          </div>
          <span className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            {article.viewCount || 0}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function FeaturedArticle({ article }: { article: BlogArticle }) {
  return (
    <Card className="group overflow-hidden border-0 bg-gradient-to-r from-primary/5 to-primary/10" data-testid="featured-article">
      <div className="grid md:grid-cols-2 gap-6">
        {article.coverImageUrl && (
          <div className="aspect-video md:aspect-auto overflow-hidden">
            <img
              src={article.coverImageUrl}
              alt={article.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}
        <div className="p-6 flex flex-col justify-center">
          <Badge className="w-fit mb-4 bg-primary">Featured</Badge>
          <h2 className="text-2xl md:text-3xl font-bold mb-4 group-hover:text-primary transition-colors">
            <Link href={`/blog/${article.slug}`} data-testid="link-featured-article-title">{article.title}</Link>
          </h2>
          <p className="text-muted-foreground mb-6 line-clamp-3">{article.excerpt}</p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatDate(article.publishedAt)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {article.readingTimeMinutes} min read
            </span>
          </div>
          <Link href={`/blog/${article.slug}`} data-testid="link-featured-article-cta">
            <Button className="w-fit group/btn" data-testid="read-featured-article">
              Read Article
              <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}

export default function BlogPage() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string>("all");

  const { data: articlesData, isLoading: articlesLoading } = useQuery<{ articles: BlogArticle[]; total: number }>({
    queryKey: ["/api/blog/articles", selectedCategory, selectedType, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("limit", "12");
      if (selectedCategory) params.set("category", selectedCategory);
      if (selectedType !== "all") params.set("type", selectedType);
      if (searchQuery) params.set("search", searchQuery);
      const res = await fetch(`/api/blog/articles?${params}`);
      return res.json();
    },
  });

  const { data: featuredArticles } = useQuery<BlogArticle[]>({
    queryKey: ["/api/blog/articles/featured"],
  });

  const { data: categories } = useQuery<BlogCategory[]>({
    queryKey: ["/api/blog/categories"],
  });

  const { data: tags } = useQuery<BlogTag[]>({
    queryKey: ["/api/blog/tags"],
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const articleTypes = [
    { value: "all", label: "All Posts" },
    { value: "health_tip", label: "Health Tips" },
    { value: "hospital_spotlight", label: "Hospital Spotlights" },
    { value: "news", label: "Healthcare News" },
    { value: "guide", label: "Patient Guides" },
    { value: "interview", label: "Interviews" },
  ];

  return (
    <div className="flex-1 bg-background">
      <SEOHead 
        title="Health Blog - Expert Healthcare Insights & Hospital Guides"
        description="Read expert health tips, hospital spotlights, and healthcare insights for Nigerians. Stay informed with CareNaija's health blog covering hospitals, treatments, and wellness."
        keywords="Nigeria health blog, healthcare tips, hospital guides Nigeria, health advice, medical news Nigeria"
        canonicalUrl="https://www.carenaija.com/blog"
      />
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary/5 to-background py-16">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-4" data-testid="blog-title">
                CareNaija Health Blog
              </h1>
              <p className="text-xl text-muted-foreground" data-testid="blog-description">
                Expert health advice, hospital guides, and healthcare insights for Nigerians
              </p>
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 py-6 text-lg rounded-full"
                  data-testid="blog-search-input"
                />
              </div>
            </form>
          </div>
        </section>

        {/* Featured Article */}
        {featuredArticles && featuredArticles.length > 0 && (
          <section className="container mx-auto px-4 py-8">
            <FeaturedArticle article={featuredArticles[0]} />
          </section>
        )}

        {/* Categories and Articles */}
        <section className="container mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar */}
            <aside className="lg:w-64 flex-shrink-0">
              <div className="sticky top-4 space-y-6">
                {/* Categories */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Categories</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button
                      variant={!selectedCategory ? "default" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => setSelectedCategory(null)}
                      data-testid="category-all"
                    >
                      All Categories
                    </Button>
                    {categories?.map((category) => (
                      <Button
                        key={category.id}
                        variant={selectedCategory === category.slug ? "default" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => setSelectedCategory(category.slug)}
                        data-testid={`category-${category.slug}`}
                      >
                        {category.name}
                      </Button>
                    ))}
                  </CardContent>
                </Card>

                {/* Tags */}
                {tags && tags.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        Popular Tags
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {tags.slice(0, 10).map((tag) => (
                          <Link key={tag.id} href={`/blog/tag/${tag.slug}`} data-testid={`link-tag-${tag.slug}`}>
                            <Badge variant="outline" className="cursor-pointer hover:bg-primary/10" data-testid={`tag-${tag.slug}`}>
                              {tag.name}
                            </Badge>
                          </Link>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1">
              {/* Type Filters */}
              <Tabs value={selectedType} onValueChange={setSelectedType} className="mb-6">
                <TabsList className="flex-wrap h-auto">
                  {articleTypes.map((type) => (
                    <TabsTrigger key={type.value} value={type.value} data-testid={`type-${type.value}`}>
                      {type.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              {/* Articles Grid */}
              {articlesLoading ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <Card key={i}>
                      <Skeleton className="aspect-video" />
                      <CardHeader>
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-4 w-full" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-4 w-32" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : articlesData?.articles && articlesData.articles.length > 0 ? (
                <>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {articlesData.articles.map((article) => (
                      <ArticleCard key={article.id} article={article} />
                    ))}
                  </div>

                  {articlesData.total > 12 && (
                    <div className="flex justify-center mt-8">
                      <Button variant="outline" data-testid="load-more-articles">
                        Load More Articles
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <Card className="p-12 text-center">
                  <div className="text-muted-foreground">
                    <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">No articles found</h3>
                    <p>Try adjusting your search or filters to find what you're looking for.</p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </section>
    </div>
  );
}
