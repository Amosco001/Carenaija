import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { 
  Calendar, Clock, Eye, User, ChevronLeft, Share2, Twitter, Facebook, 
  Linkedin, Copy, MessageCircle, Heart, Tag, ArrowRight, Send 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import type { BlogArticle, BlogCategory, BlogTag, BlogComment } from "@shared/schema";

function formatDate(date: string | Date | null): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-NG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

interface ArticleResponse {
  article: BlogArticle;
  category: BlogCategory | null;
  tags: BlogTag[];
  related: BlogArticle[];
  comments: BlogComment[];
}

function CommentItem({ comment, onReply }: { comment: BlogComment; onReply: (id: number) => void }) {
  return (
    <div className="flex gap-4" data-testid={`comment-${comment.id}`}>
      <Avatar className="h-10 w-10 flex-shrink-0">
        <AvatarImage src={comment.userAvatarUrl || undefined} />
        <AvatarFallback>{comment.userName?.charAt(0) || "U"}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium">{comment.userName}</span>
          <span className="text-sm text-muted-foreground">{formatDate(comment.createdAt)}</span>
        </div>
        <p className="text-muted-foreground mb-2">{comment.content}</p>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => onReply(comment.id)}
          data-testid={`reply-to-comment-${comment.id}`}
        >
          <MessageCircle className="h-4 w-4 mr-1" />
          Reply
        </Button>
      </div>
    </div>
  );
}

function CommentForm({ 
  articleSlug, 
  parentId, 
  onSuccess,
  onCancel 
}: { 
  articleSlug: string;
  parentId?: number | null;
  onSuccess: () => void;
  onCancel?: () => void;
}) {
  const [content, setContent] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: { content: string; parentId?: number | null }) => {
      const res = await fetch(`/api/blog/articles/${articleSlug}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to post comment");
      return res.json();
    },
    onSuccess: () => {
      setContent("");
      queryClient.invalidateQueries({ queryKey: [`/api/blog/articles/${articleSlug}`] });
      toast({ title: "Comment posted successfully!" });
      onSuccess();
    },
    onError: () => {
      toast({ title: "Failed to post comment", variant: "destructive" });
    },
  });

  if (!user) {
    return (
      <Card>
        <CardContent className="py-6 text-center">
          <p className="text-muted-foreground mb-4">Sign in to join the discussion</p>
          <Link href="/login" data-testid="link-sign-in">
            <Button data-testid="sign-in-to-comment">Sign In</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    mutation.mutate({ content, parentId });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Textarea
        placeholder={parentId ? "Write a reply..." : "Share your thoughts..."}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={4}
        data-testid="comment-input"
      />
      <div className="flex gap-2">
        <Button type="submit" disabled={mutation.isPending || !content.trim()} data-testid="submit-comment">
          <Send className="h-4 w-4 mr-2" />
          {mutation.isPending ? "Posting..." : "Post Comment"}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} data-testid="button-cancel-reply">
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

function RelatedArticleCard({ article }: { article: BlogArticle }) {
  return (
    <Link href={`/blog/${article.slug}`} data-testid={`link-related-article-${article.id}`}>
      <Card className="group hover:shadow-md transition-shadow cursor-pointer" data-testid={`related-article-${article.id}`}>
        {article.coverImageUrl && (
          <div className="aspect-video overflow-hidden rounded-t-lg">
            <img
              src={article.coverImageUrl}
              alt={article.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}
        <CardHeader className="pb-2">
          <CardTitle className="text-base line-clamp-2 group-hover:text-primary transition-colors">
            {article.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-3 w-3" />
            {article.readingTimeMinutes} min read
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function ShareButtons({ url, title }: { url: string; title: string }) {
  const { toast } = useToast();
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(url);
    toast({ title: "Link copied to clipboard!" });
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground mr-2">Share:</span>
      <Button
        variant="outline"
        size="icon"
        onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`, "_blank")}
        data-testid="share-twitter"
      >
        <Twitter className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, "_blank")}
        data-testid="share-facebook"
      >
        <Facebook className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={() => window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}`, "_blank")}
        data-testid="share-linkedin"
      >
        <Linkedin className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="icon" onClick={copyToClipboard} data-testid="share-copy">
        <Copy className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default function BlogArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const [replyingTo, setReplyingTo] = useState<number | null>(null);

  const { data, isLoading, error } = useQuery<ArticleResponse>({
    queryKey: [`/api/blog/articles/${slug}`],
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="flex-1 container mx-auto px-4 py-8 bg-background">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-12 w-full mb-4" />
          <Skeleton className="h-6 w-48 mb-8" />
          <Skeleton className="aspect-video w-full mb-8" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data?.article) {
    return (
      <div className="flex-1 container mx-auto px-4 py-16 text-center bg-background">
        <h1 className="text-2xl font-bold mb-4">Article Not Found</h1>
        <p className="text-muted-foreground mb-8">The article you're looking for doesn't exist or has been removed.</p>
        <Link href="/blog" data-testid="link-back-to-blog">
          <Button data-testid="back-to-blog">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Blog
          </Button>
        </Link>
      </div>
    );
  }

  const { article, category, tags, related, comments } = data;
  const currentUrl = typeof window !== "undefined" ? window.location.href : "";
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  useEffect(() => {
    if (article) {
      const siteBaseUrl = baseUrl || "https://carenaija.com";
      const pageTitle = article.metaTitle || `${article.title} | CareNaija Blog`;
      const pageDesc = article.metaDescription || article.excerpt || "";
      
      document.title = pageTitle;
      
      let metaDesc = document.querySelector('meta[name="description"]') as HTMLMetaElement;
      if (!metaDesc) {
        metaDesc = document.createElement("meta");
        metaDesc.name = "description";
        document.head.appendChild(metaDesc);
      }
      metaDesc.content = pageDesc;

      let ogTitle = document.querySelector('meta[property="og:title"]') as HTMLMetaElement;
      if (ogTitle) ogTitle.content = pageTitle;
      
      let ogDesc = document.querySelector('meta[property="og:description"]') as HTMLMetaElement;
      if (ogDesc) ogDesc.content = pageDesc;
      
      if (article.coverImageUrl) {
        let ogImage = document.querySelector('meta[property="og:image"]') as HTMLMetaElement;
        if (ogImage) ogImage.content = article.coverImageUrl;
      }

      const structuredData = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": article.title,
        "description": article.metaDescription || article.excerpt || "",
        "image": article.coverImageUrl ? [article.coverImageUrl] : [],
        "datePublished": article.publishedAt ? new Date(article.publishedAt).toISOString() : undefined,
        "dateModified": article.updatedAt ? new Date(article.updatedAt).toISOString() : article.publishedAt ? new Date(article.publishedAt).toISOString() : undefined,
        "author": {
          "@type": "Person",
          "name": article.authorName || "CareNaija"
        },
        "publisher": {
          "@type": "Organization",
          "name": "CareNaija",
          "logo": {
            "@type": "ImageObject",
            "url": `${siteBaseUrl}/favicon.ico`
          }
        },
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": currentUrl || `${siteBaseUrl}/blog/${article.slug}`
        },
        "articleSection": category?.name,
        "keywords": tags?.map(t => t.name).join(", ")
      };

      let existingScript = document.querySelector('script#article-structured-data');
      if (existingScript) {
        existingScript.remove();
      }
      const script = document.createElement("script");
      script.id = "article-structured-data";
      script.type = "application/ld+json";
      script.textContent = JSON.stringify(structuredData);
      document.head.appendChild(script);

      return () => {
        const scriptEl = document.querySelector('script#article-structured-data');
        if (scriptEl) scriptEl.remove();
      };
    }
  }, [article, category, tags, baseUrl, currentUrl]);

  return (
    <div className="flex-1 bg-background">
        {/* Breadcrumb */}
        <div className="border-b bg-muted/30">
          <div className="container mx-auto px-4 py-4">
            <nav className="flex items-center gap-2 text-sm text-muted-foreground" data-testid="breadcrumb">
              <Link href="/" className="hover:text-foreground" data-testid="breadcrumb-home">Home</Link>
              <span>/</span>
              <Link href="/blog" className="hover:text-foreground" data-testid="breadcrumb-blog">Blog</Link>
              {category && (
                <>
                  <span>/</span>
                  <Link href={`/blog/category/${category.slug}`} className="hover:text-foreground" data-testid="breadcrumb-category">
                    {category.name}
                  </Link>
                </>
              )}
              <span>/</span>
              <span className="text-foreground truncate max-w-[200px]">{article.title}</span>
            </nav>
          </div>
        </div>

        {/* Article Header */}
        <header className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="flex items-center gap-2 mb-4">
            {category && (
              <Link href={`/blog/category/${category.slug}`} data-testid="link-article-category">
                <Badge variant="outline" className="hover:bg-primary/10" data-testid="article-category">
                  {category.name}
                </Badge>
              </Link>
            )}
            <Badge variant="secondary">{article.articleType || "Article"}</Badge>
          </div>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6" data-testid="article-title">
            {article.title}
          </h1>

          {article.excerpt && (
            <p className="text-xl text-muted-foreground mb-6" data-testid="article-excerpt">
              {article.excerpt}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground mb-6">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={article.authorAvatarUrl || undefined} />
                <AvatarFallback>{article.authorName?.charAt(0) || "A"}</AvatarFallback>
              </Avatar>
              <span className="font-medium text-foreground">{article.authorName}</span>
            </div>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatDate(article.publishedAt)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {article.readingTimeMinutes} min read
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {article.viewCount || 0} views
            </span>
          </div>

          <ShareButtons url={currentUrl} title={article.title} />
        </header>

        {/* Cover Image */}
        {article.coverImageUrl && (
          <div className="container mx-auto px-4 max-w-5xl mb-8">
            <img
              src={article.coverImageUrl}
              alt={article.coverImageAlt || article.title}
              className="w-full rounded-xl shadow-lg"
              data-testid="article-featured-image"
            />
          </div>
        )}

        {/* Article Content */}
        <article className="container mx-auto px-4 max-w-4xl">
          <div 
            className="prose prose-lg dark:prose-invert max-w-none mb-8"
            dangerouslySetInnerHTML={{ __html: article.contentHtml || article.content }}
            data-testid="article-content"
          />

          {/* Tags */}
          {tags && tags.length > 0 && (
            <div className="flex items-center flex-wrap gap-2 py-6 border-t border-b">
              <Tag className="h-4 w-4 text-muted-foreground" />
              {tags.map((tag) => (
                <Link key={tag.id} href={`/blog/tag/${tag.slug}`} data-testid={`link-article-tag-${tag.slug}`}>
                  <Badge variant="outline" className="hover:bg-primary/10" data-testid={`article-tag-${tag.slug}`}>
                    {tag.name}
                  </Badge>
                </Link>
              ))}
            </div>
          )}

          {/* Author Bio */}
          {article.authorBio && (
            <Card className="my-8">
              <CardContent className="py-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={article.authorAvatarUrl || undefined} />
                    <AvatarFallback className="text-xl">{article.authorName?.charAt(0) || "A"}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-bold text-lg mb-1">About {article.authorName}</h3>
                    <p className="text-muted-foreground">{article.authorBio}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Comments Section */}
          {article.allowComments && (
            <section className="my-12" id="comments">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <MessageCircle className="h-6 w-6" />
                Discussion ({comments?.length || 0})
              </h2>

              <div className="mb-8">
                <CommentForm 
                  articleSlug={article.slug} 
                  onSuccess={() => setReplyingTo(null)} 
                />
              </div>

              {comments && comments.length > 0 && (
                <div className="space-y-6">
                  {comments.map((comment) => (
                    <div key={comment.id}>
                      <CommentItem 
                        comment={comment} 
                        onReply={(id) => setReplyingTo(id)} 
                      />
                      {replyingTo === comment.id && (
                        <div className="ml-14 mt-4">
                          <CommentForm
                            articleSlug={article.slug}
                            parentId={comment.id}
                            onSuccess={() => setReplyingTo(null)}
                            onCancel={() => setReplyingTo(null)}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </article>

        {/* Related Articles */}
        {related && related.length > 0 && (
          <section className="bg-muted/30 py-12 mt-12">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold">Related Articles</h2>
                <Link href="/blog" data-testid="link-view-all-articles">
                  <Button variant="ghost" data-testid="view-all-articles">
                    View All
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {related.map((article) => (
                  <RelatedArticleCard key={article.id} article={article} />
                ))}
              </div>
            </div>
          </section>
        )}
    </div>
  );
}
