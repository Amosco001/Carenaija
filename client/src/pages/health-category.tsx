import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { ArrowLeft, Clock, Eye, Bookmark, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SEOHead } from "@/components/seo-head";
import type { HealthArticle, HealthCategory } from "@shared/schema";

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

export default function HealthCategoryPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data: category, isLoading: categoryLoading } = useQuery<HealthCategory>({
    queryKey: ["/api/health/categories", slug],
    queryFn: () => fetch(`/api/health/categories/${slug}`).then(r => r.json()),
    enabled: !!slug,
  });

  const { data: articles, isLoading: articlesLoading } = useQuery<HealthArticle[]>({
    queryKey: ["/api/health/articles", { category: slug }],
    queryFn: () => fetch(`/api/health/articles?category=${slug}`).then(r => r.json()),
    enabled: !!slug,
  });

  const isLoading = categoryLoading || articlesLoading;

  return (
    <>
      <SEOHead
        title={category ? `${category.name} - Health Hub` : "Category - Health Hub"}
        description={category?.description || "Health articles by category"}
      />

      <div className="bg-gradient-to-b from-green-50 to-white min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <Link href="/health">
            <Button variant="ghost" className="mb-6" data-testid="back-to-health">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Health Hub
            </Button>
          </Link>

          {categoryLoading ? (
            <div className="mb-8">
              <Skeleton className="h-10 w-64 mb-2" />
              <Skeleton className="h-6 w-96" />
            </div>
          ) : category ? (
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2" data-testid="category-title">{category.name}</h1>
              <p className="text-muted-foreground text-lg">{category.description}</p>
            </div>
          ) : (
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Category Not Found</h1>
              <p className="text-muted-foreground">The category you're looking for doesn't exist.</p>
            </div>
          )}

          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-80" />
              ))}
            </div>
          ) : articles && articles.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No articles yet</h3>
              <p className="text-muted-foreground">
                Articles in this category will appear here once published.
              </p>
              <Link href="/health">
                <Button variant="outline" className="mt-4">
                  Browse All Articles
                </Button>
              </Link>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
