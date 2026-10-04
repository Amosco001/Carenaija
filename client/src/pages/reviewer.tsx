import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Award, ThumbsUp, MessageSquare, ChevronLeft, RotateCw } from "lucide-react";

type ReviewerStats = {
  displayName: string;
  reviewCount: number;
  helpfulVotesReceived: number;
};

function errorStatus(error: unknown) {
  const match = error instanceof Error ? error.message.match(/^(\d{3}):/) : null;
  return match ? Number(match[1]) : null;
}

export default function ReviewerPage() {
  const { userId = "" } = useParams<{ userId: string }>();
  const { data, error, isLoading, isError, refetch } = useQuery<ReviewerStats>({
    queryKey: [`/api/reviewers/${userId}`],
    enabled: !!userId,
    queryFn: async () => {
      const response = await fetch(`/api/reviewers/${encodeURIComponent(userId)}`, { credentials: "include" });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
  });
  const isNotFound = errorStatus(error) === 404;

  return (
    <main className="min-h-[60vh] bg-slate-50 py-8">
      <div className="container mx-auto max-w-2xl px-4">
        <Link href="/search" className="mb-5 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-emerald-700"><ChevronLeft className="h-4 w-4" /> Back to hospitals</Link>
        {isLoading ? (
          <Card><CardHeader><Skeleton className="h-7 w-48" /><Skeleton className="h-4 w-64" /></CardHeader><CardContent className="grid sm:grid-cols-2 gap-4"><Skeleton className="h-24" /><Skeleton className="h-24" /></CardContent></Card>
        ) : isError ? (
          <Card><CardHeader><CardTitle>{isNotFound ? "Reviewer not found" : "Reviewer profile unavailable"}</CardTitle><CardDescription>{isNotFound ? "This reviewer has no public approved reviews." : "We could not load this reviewer profile right now."}</CardDescription></CardHeader>
            {!isNotFound && <CardContent><Button type="button" variant="outline" onClick={() => refetch()}><RotateCw className="mr-2 h-4 w-4" />Try again</Button></CardContent>}
          </Card>
        ) : data ? (
          <Card data-testid="public-reviewer-profile">
            <CardHeader>
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-800"><Award className="h-6 w-6" /></div>
              <CardTitle>{data.displayName}</CardTitle>
              <CardDescription>CareNaija reviewer · approved public contributions</CardDescription>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-lg bg-slate-50 p-4"><p className="flex items-center gap-2 text-sm text-slate-500"><MessageSquare className="h-4 w-4" /> Reviews</p><p className="mt-2 text-3xl font-semibold text-slate-800">{data.reviewCount.toLocaleString()}</p></div>
              <div className="rounded-lg bg-slate-50 p-4"><p className="flex items-center gap-2 text-sm text-slate-500"><ThumbsUp className="h-4 w-4" /> Helpful votes received</p><p className="mt-2 text-3xl font-semibold text-slate-800">{data.helpfulVotesReceived.toLocaleString()}</p></div>
              <p className="sm:col-span-2 text-xs text-slate-500">Only approved public reviews are reflected here. Anonymous reviews are never shown on this profile.</p>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </main>
  );
}