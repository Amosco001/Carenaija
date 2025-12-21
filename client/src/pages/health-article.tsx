import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { 
  Clock, Eye, Bookmark, BookmarkCheck, ArrowLeft, Share2, 
  Calendar, User, ChevronRight, Check, Facebook, Twitter, 
  Linkedin, Copy, AlertCircle, Stethoscope
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SEOHead } from "@/components/seo-head";
import { useAuth } from "@/lib/auth";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { HealthArticle, HealthCategory } from "@shared/schema";

function formatDate(date: string | Date | null): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-NG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function TableOfContents({ content }: { content: string }) {
  const [activeSection, setActiveSection] = useState("");
  const headings = content.match(/^#{1,3}\s.+$/gm) || [];
  
  const toc = headings.map((heading) => {
    const level = heading.match(/^(#{1,3})/)?.[1].length || 1;
    const text = heading.replace(/^#{1,3}\s/, "");
    const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    return { level, text, id };
  });

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-100px 0px -80% 0px" }
    );

    toc.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [toc]);

  if (toc.length < 3) return null;

  return (
    <Card className="sticky top-24">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">In This Article</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <nav aria-label="Table of contents">
          <ul className="space-y-2 text-sm">
            {toc.map(({ level, text, id }) => (
              <li key={id} style={{ marginLeft: `${(level - 1) * 12}px` }}>
                <a
                  href={`#${id}`}
                  className={`block py-1 text-muted-foreground hover:text-foreground transition-colors ${
                    activeSection === id ? "text-primary font-medium" : ""
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  {text}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </CardContent>
    </Card>
  );
}

function ShareButtons({ title, url }: { title: string; url: string }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const copyLink = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast({ title: "Link copied!", description: "Article link copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" data-testid="button-share-article">
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <a 
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Facebook className="h-4 w-4 mr-2" />
            Facebook
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a 
            href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Twitter className="h-4 w-4 mr-2" />
            Twitter
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a 
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Linkedin className="h-4 w-4 mr-2" />
            LinkedIn
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={copyLink}>
          {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
          {copied ? "Copied!" : "Copy Link"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function renderContent(content: string): string {
  let html = content;
  
  html = html.replace(/^### (.+)$/gm, (_, text) => {
    const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    return `<h3 id="${id}" class="text-xl font-bold mt-8 mb-4 scroll-mt-24">${text}</h3>`;
  });
  html = html.replace(/^## (.+)$/gm, (_, text) => {
    const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    return `<h2 id="${id}" class="text-2xl font-bold mt-10 mb-4 scroll-mt-24">${text}</h2>`;
  });
  html = html.replace(/^# (.+)$/gm, (_, text) => {
    const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    return `<h1 id="${id}" class="text-3xl font-bold mt-12 mb-6 scroll-mt-24">${text}</h1>`;
  });
  
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  
  html = html.replace(/^\- (.+)$/gm, '<li class="ml-6 list-disc">$1</li>');
  html = html.replace(/(<li[^>]*>.*<\/li>\n?)+/g, '<ul class="my-4 space-y-2">$&</ul>');
  
  html = html.replace(/^\d+\. (.+)$/gm, '<li class="ml-6 list-decimal">$1</li>');
  
  html = html.replace(/^(?!<[hul]|<li)(.+)$/gm, '<p class="my-4 text-muted-foreground leading-relaxed">$1</p>');
  
  return html;
}

export default function HealthArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: article, isLoading } = useQuery<HealthArticle>({
    queryKey: ["/api/health/articles", slug],
    queryFn: () => fetch(`/api/health/articles/${slug}`).then(r => {
      if (!r.ok) throw new Error("Article not found");
      return r.json();
    }),
    enabled: !!slug,
  });

  const { data: isBookmarked } = useQuery<{ isBookmarked: boolean }>({
    queryKey: ["/api/health/bookmarks", article?.id, "check"],
    queryFn: () => fetch(`/api/health/bookmarks/${article?.id}/check`).then(r => r.json()),
    enabled: !!user && !!article?.id,
  });

  const { data: category } = useQuery<HealthCategory>({
    queryKey: ["/api/health/categories", article?.categoryId],
    queryFn: async () => {
      const res = await fetch("/api/health/categories");
      const categories = await res.json();
      return categories.find((c: HealthCategory) => c.id === article?.categoryId);
    },
    enabled: !!article?.categoryId,
  });

  const { data: relatedArticles } = useQuery<HealthArticle[]>({
    queryKey: ["/api/health/articles/popular"],
    enabled: !!article,
  });

  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      const method = isBookmarked?.isBookmarked ? "DELETE" : "POST";
      const res = await fetch(`/api/health/bookmarks/${article?.id}`, { method });
      if (!res.ok) throw new Error("Failed to update bookmark");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/health/bookmarks", article?.id, "check"] });
      toast({
        title: isBookmarked?.isBookmarked ? "Bookmark removed" : "Article bookmarked",
        description: isBookmarked?.isBookmarked ? "Removed from your saved articles" : "Saved to your reading list",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-12 w-full mb-4" />
        <Skeleton className="h-6 w-64 mb-8" />
        <Skeleton className="h-64 w-full mb-8" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Article Not Found</h1>
        <p className="text-muted-foreground mb-6">The article you're looking for doesn't exist or has been removed.</p>
        <Link href="/health">
          <Button>Back to Health Hub</Button>
        </Link>
      </div>
    );
  }

  const fullUrl = typeof window !== "undefined" ? window.location.href : "";
  const filteredRelated = relatedArticles?.filter(a => a.id !== article.id).slice(0, 3);

  return (
    <>
      <SEOHead
        title={article.metaTitle || article.title}
        description={article.metaDescription || article.excerpt || ""}
        canonicalUrl={`/health/article/${article.slug}`}
        ogType="article"
        ogImage={article.coverImageUrl || undefined}
      />

      <article className="min-h-screen">
        <div className="container mx-auto px-4 py-8">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
            <Link href="/health" className="hover:text-foreground transition-colors">
              Health Hub
            </Link>
            <ChevronRight className="h-4 w-4" />
            {category && (
              <>
                <Link href={`/health/category/${category.slug}`} className="hover:text-foreground transition-colors">
                  {category.name}
                </Link>
                <ChevronRight className="h-4 w-4" />
              </>
            )}
            <span className="text-foreground truncate max-w-xs">{article.title}</span>
          </nav>

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* Article Header */}
              <header className="mb-8">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  {article.isFeatured && (
                    <Badge className="bg-yellow-500 text-white">Featured</Badge>
                  )}
                  {article.isEditorPick && (
                    <Badge variant="outline" className="border-primary text-primary">Editor's Pick</Badge>
                  )}
                  {article.medicalReviewedBy && (
                    <Badge variant="outline" className="border-green-500 text-green-600">
                      <Stethoscope className="h-3 w-3 mr-1" />
                      Medically Reviewed
                    </Badge>
                  )}
                </div>

                <h1 className="text-3xl md:text-4xl font-bold mb-4" data-testid="health-article-title">
                  {article.title}
                </h1>

                {article.excerpt && (
                  <p className="text-xl text-muted-foreground mb-6">{article.excerpt}</p>
                )}

                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
                  <span className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {article.authorName}
                    {article.authorCredentials && (
                      <span className="text-xs">({article.authorCredentials})</span>
                    )}
                  </span>
                  {article.publishedAt && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(article.publishedAt)}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {article.readingTimeMinutes} min read
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {article.viewCount} views
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {user && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => bookmarkMutation.mutate()}
                      disabled={bookmarkMutation.isPending}
                      data-testid="button-bookmark-article"
                    >
                      {isBookmarked?.isBookmarked ? (
                        <>
                          <BookmarkCheck className="h-4 w-4 mr-2 text-primary" />
                          Saved
                        </>
                      ) : (
                        <>
                          <Bookmark className="h-4 w-4 mr-2" />
                          Save
                        </>
                      )}
                    </Button>
                  )}
                  <ShareButtons title={article.title} url={fullUrl} />
                </div>
              </header>

              {/* Cover Image */}
              {article.coverImageUrl && (
                <figure className="mb-8">
                  <img
                    src={article.coverImageUrl}
                    alt={article.coverImageAlt || article.title}
                    className="w-full rounded-lg object-cover max-h-96"
                  />
                  {article.coverImageAlt && (
                    <figcaption className="text-sm text-muted-foreground mt-2 text-center">
                      {article.coverImageAlt}
                    </figcaption>
                  )}
                </figure>
              )}

              {/* Medical Review Notice */}
              {article.medicalReviewedBy && (
                <Card className="mb-8 border-green-200 bg-green-50 dark:bg-green-950/20">
                  <CardContent className="p-4 flex items-center gap-3">
                    <Stethoscope className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-green-700 dark:text-green-300">
                        Medically Reviewed by {article.medicalReviewedBy}
                      </p>
                      {article.medicalReviewedAt && (
                        <p className="text-xs text-green-600">
                          Last reviewed: {formatDate(article.medicalReviewedAt)}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Article Content */}
              <div 
                className="prose prose-lg dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: article.contentHtml || renderContent(article.content) }}
              />

              {/* Symptoms & Related Diseases */}
              {(article.symptoms?.length > 0 || article.relatedDiseases?.length > 0) && (
                <Card className="mt-8">
                  <CardContent className="p-6">
                    {article.symptoms && article.symptoms.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-semibold mb-2">Related Symptoms</h4>
                        <div className="flex flex-wrap gap-2">
                          {article.symptoms.map((symptom, i) => (
                            <Badge key={i} variant="secondary">{symptom}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {article.relatedDiseases && article.relatedDiseases.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Related Conditions</h4>
                        <div className="flex flex-wrap gap-2">
                          {article.relatedDiseases.map((disease, i) => (
                            <Badge key={i} variant="outline">{disease}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <Separator className="my-8" />

              {/* Back to Hub */}
              <div className="flex items-center justify-between">
                <Link href="/health">
                  <Button variant="ghost" data-testid="link-back-to-hub">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Health Hub
                  </Button>
                </Link>
                <ShareButtons title={article.title} url={fullUrl} />
              </div>
            </div>

            {/* Sidebar */}
            <aside className="hidden lg:block">
              <div className="space-y-6">
                {/* Table of Contents */}
                <TableOfContents content={article.content} />

                {/* Related Articles */}
                {filteredRelated && filteredRelated.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Related Articles</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-3">
                      {filteredRelated.map((related) => (
                        <Link 
                          key={related.id} 
                          href={`/health/article/${related.slug}`}
                          className="block group"
                        >
                          <p className="text-sm font-medium group-hover:text-primary transition-colors line-clamp-2">
                            {related.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {related.readingTimeMinutes} min read
                          </p>
                        </Link>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
            </aside>
          </div>
        </div>
      </article>
    </>
  );
}
