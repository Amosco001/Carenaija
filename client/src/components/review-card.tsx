import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Star, 
  ThumbsUp, 
  Clock, 
  ShieldCheck, 
  CheckCircle2, 
  Building2, 
  MessageSquareText,
  Flag
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { useVoteReviewHelpful, useRemoveHelpfulVote } from "@/hooks/useHospitals";
import { cn } from "@/lib/utils";
import { getHospitalUrl } from "@shared/schema";

interface ReviewCardProps {
  review: {
    id: number;
    reviewerName: string;
    reviewerRole?: string;
    isAnonymous?: boolean;
    title?: string | null;
    rating: number;
    reviewText: string;
    helpfulCount: number;
    verifiedVisit?: boolean;
    createdAt?: string | null;
    wouldRecommend: boolean;
    waitTime?: string | null;
    cleanliness?: number | null;
    staffAttitude?: number | null;
    facilities?: number | null;
  };
  reviewType?: "patient" | "employee";
  hospitalClaimed?: boolean;
  hospitalResponse?: {
    responseText: string;
    responderName: string;
    responderTitle?: string | null;
    createdAt: string;
  } | null;
  userHasVotedHelpful?: boolean;
  showHospitalName?: boolean;
  hospitalName?: string;
  hospitalId?: number;
  hospitalSlug?: string | null;
  hospitalState?: string;
  onReportClick?: () => void;
}

export function ReviewCard({
  review,
  reviewType = "patient",
  hospitalClaimed = false,
  hospitalResponse,
  userHasVotedHelpful = false,
  showHospitalName = false,
  hospitalName,
  hospitalId,
  hospitalSlug,
  hospitalState,
  onReportClick,
}: ReviewCardProps) {
  const { user } = useAuth();
  const [hasVoted, setHasVoted] = useState(userHasVotedHelpful);
  const [helpfulCount, setHelpfulCount] = useState(review.helpfulCount);
  
  const voteHelpful = useVoteReviewHelpful();
  const removeVote = useRemoveHelpfulVote();

  const handleHelpfulClick = async () => {
    if (!user) return;
    
    try {
      if (hasVoted) {
        await removeVote.mutateAsync({ reviewId: review.id, reviewType });
        setHasVoted(false);
        setHelpfulCount((prev) => Math.max(0, prev - 1));
      } else {
        await voteHelpful.mutateAsync({ reviewId: review.id, reviewType });
        setHasVoted(true);
        setHelpfulCount((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Failed to update helpful vote:", error);
    }
  };

  const getRecencyText = (dateString?: string | null) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      return `Reviewed ${formatDistanceToNow(date, { addSuffix: true })}`;
    } catch {
      return null;
    }
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={cn(
          "w-4 h-4",
          i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
        )}
      />
    ));
  };

  const recencyText = getRecencyText(review.createdAt);

  return (
    <Card className="bg-white border-slate-200 hover:shadow-md transition-shadow" data-testid={`review-card-${review.id}`}>
      <CardContent className="p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <span className="text-emerald-700 font-semibold text-sm">
              {review.isAnonymous ? "A" : (review.reviewerName?.charAt(0).toUpperCase() || "A")}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-slate-900">{review.isAnonymous ? "Anonymous" : (review.reviewerName || "Anonymous")}</p>
              {review.verifiedVisit && (
                <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 gap-1 text-xs" data-testid="badge-verified-visit">
                  <CheckCircle2 className="w-3 h-3" />
                  Verified Visit
                </Badge>
              )}
            </div>
            {review.reviewerRole && (
              <p className="text-sm text-slate-500">{review.reviewerRole}</p>
            )}
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-0.5">
                {getRatingStars(review.rating)}
              </div>
              {recencyText && (
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <Clock className="w-3 h-3" />
                  <span>{recencyText}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {review.title && (
          <h4 className="font-medium text-slate-800 mb-2">{review.title}</h4>
        )}
        
        <p className="text-slate-600 text-sm mb-4 whitespace-pre-line">
          {review.reviewText}
        </p>

        {reviewType === "patient" && (review.cleanliness || review.staffAttitude || review.facilities) && (
          <div className="flex flex-wrap gap-3 mb-4 text-xs">
            {review.cleanliness && (
              <div className="flex items-center gap-1 text-slate-500">
                <span className="font-medium">Cleanliness:</span>
                <span>{review.cleanliness}/5</span>
              </div>
            )}
            {review.staffAttitude && (
              <div className="flex items-center gap-1 text-slate-500">
                <span className="font-medium">Staff:</span>
                <span>{review.staffAttitude}/5</span>
              </div>
            )}
            {review.facilities && (
              <div className="flex items-center gap-1 text-slate-500">
                <span className="font-medium">Facilities:</span>
                <span>{review.facilities}/5</span>
              </div>
            )}
            {review.waitTime && (
              <div className="flex items-center gap-1 text-slate-500">
                <span className="font-medium">Wait:</span>
                <span>{review.waitTime}</span>
              </div>
            )}
          </div>
        )}

        {showHospitalName && hospitalName && hospitalId && (
          <a 
            href={hospitalState ? getHospitalUrl({ id: hospitalId, slug: hospitalSlug, state: hospitalState }) : `/hospital/${hospitalId}`} 
            className="inline-flex items-center text-sm text-emerald-700 hover:text-emerald-800 font-medium mb-4"
          >
            <Building2 className="w-3 h-3 mr-1" />
            {hospitalName}
          </a>
        )}

        {hospitalResponse && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4" data-testid="hospital-response">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-emerald-700 border-emerald-200 gap-1 text-xs">
                <MessageSquareText className="w-3 h-3" />
                Hospital Responded
              </Badge>
            </div>
            <p className="text-sm text-slate-600 mb-2">{hospitalResponse.responseText}</p>
            <p className="text-xs text-slate-400">
              — {hospitalResponse.responderName}
              {hospitalResponse.responderTitle && `, ${hospitalResponse.responderTitle}`}
              {hospitalResponse.createdAt && ` • ${getRecencyText(hospitalResponse.createdAt)}`}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleHelpfulClick}
              disabled={!user || voteHelpful.isPending || removeVote.isPending}
              className={cn(
                "text-slate-500 hover:text-emerald-700 gap-1.5",
                hasVoted && "text-emerald-700 bg-emerald-50"
              )}
              data-testid={`button-helpful-${review.id}`}
            >
              <ThumbsUp className={cn("w-4 h-4", hasVoted && "fill-emerald-700")} />
              <span className="text-sm">
                {helpfulCount > 0 ? `${helpfulCount} found helpful` : "Helpful"}
              </span>
            </Button>

            {onReportClick && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onReportClick}
                className="text-slate-400 hover:text-red-500 gap-1.5"
                data-testid={`button-report-${review.id}`}
              >
                <Flag className="w-4 h-4" />
                <span className="text-sm">Report</span>
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {hospitalClaimed && (
              <Badge variant="secondary" className="bg-blue-50 text-blue-700 gap-1 text-xs" data-testid="badge-claimed">
                <ShieldCheck className="w-3 h-3" />
                Claimed Hospital
              </Badge>
            )}
            {review.wouldRecommend && (
              <Badge variant="secondary" className="bg-green-50 text-green-700 text-xs">
                Recommends
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
