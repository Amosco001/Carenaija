import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Award, ThumbsUp, MessageSquare, RotateCw } from "lucide-react";

type ReviewerStats = {
  displayName: string;
  reviewCount: number;
  helpfulVotesReceived: number;
};

export function ReviewerStatsPanel() {
  const { data, isLoading, isError, refetch } = useQuery<ReviewerStats>({
    queryKey: ["/api/user/reviewer-stats"],
    queryFn: async () => {
      const response = await fetch("/api/user/reviewer-stats", { credentials: "include" });
      if (!response.ok) throw new Error("Unable to load your reviewer stats");
      return response.json();
    },
  });

  return (
    <Card className="mt-6" data-testid="reviewer-own-stats">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Award className="h-5 w-5 text-emerald-700" /> Your reviewer profile</CardTitle>
        <CardDescription>Your contribution totals include approved reviews you chose to post anonymously.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid sm:grid-cols-2 gap-4"><Skeleton className="h-20" /><Skeleton className="h-20" /></div>
        ) : isError ? (
          <div className="flex items-center justify-between gap-3 text-sm text-slate-600">
            <span>Reviewer stats could not be loaded.</span>
            <Button type="button" size="sm" variant="outline" onClick={() => refetch()}><RotateCw className="h-4 w-4 mr-2" />Retry</Button>
          </div>
        ) : data ? (
          <>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-lg bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-sm text-slate-500"><MessageSquare className="h-4 w-4" /> Approved reviews</div>
                <p className="mt-1 text-2xl font-semibold text-slate-800">{data.reviewCount.toLocaleString()}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-sm text-slate-500"><ThumbsUp className="h-4 w-4" /> Helpful votes received</div>
                <p className="mt-1 text-2xl font-semibold text-slate-800">{data.helpfulVotesReceived.toLocaleString()}</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-500">Reviewer name: {data.displayName}</p>
          </>
        ) : (
          <p className="text-sm text-slate-600">Your reviewer summary will appear here once you have an approved review.</p>
        )}
      </CardContent>
    </Card>
  );
}