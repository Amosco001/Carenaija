import { useState } from "react";
import { useLocation } from "wouter";
import { Star, MessageSquarePlus, ArrowRight, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

interface QuickRatePromptProps {
  hospitalId: number;
  hospitalName: string;
  onClose: () => void;
  initialRating?: number;
}

export function QuickRatePrompt({ hospitalId, hospitalName, onClose, initialRating = 0 }: QuickRatePromptProps) {
  const [rating, setRating] = useState(initialRating);
  const [hoveredStar, setHoveredStar] = useState(0);
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const handleContinueToReview = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLocation(`/write-review/patient/${hospitalId}`);
  };

  const handleLogin = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLocation("/login");
  };

  const ratingLabels = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

  return (
    <div
      className="absolute inset-0 z-20 bg-white/98 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center p-6 animate-in fade-in duration-200"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
      data-testid={`quick-rate-overlay-${hospitalId}`}
    >
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClose(); }}
        className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 text-sm font-medium"
        data-testid="button-close-quick-rate"
      >
        ✕
      </button>

      <MessageSquarePlus className="w-8 h-8 text-emerald-500 mb-2" />
      <p className="text-sm font-semibold text-slate-800 mb-1 text-center">Rate {hospitalName}</p>
      <p className="text-xs text-slate-500 mb-4 text-center">Tap a star to get started</p>

      <div className="flex items-center gap-1 mb-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onMouseEnter={() => setHoveredStar(star)}
            onMouseLeave={() => setHoveredStar(0)}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setRating(star);
            }}
            className="focus:outline-none transition-transform hover:scale-125 p-0.5"
            data-testid={`quick-star-${star}`}
          >
            <Star
              size={28}
              className={cn(
                "transition-colors",
                (hoveredStar || rating) >= star
                  ? "text-yellow-400 fill-yellow-400"
                  : "text-slate-300"
              )}
            />
          </button>
        ))}
      </div>

      {(hoveredStar > 0 || rating > 0) && (
        <p className="text-xs font-medium text-emerald-600 mb-3">
          {ratingLabels[hoveredStar || rating]}
        </p>
      )}

      {rating > 0 && (
        <div className="w-full space-y-2 animate-in slide-in-from-bottom-2 duration-200">
          {user ? (
            <Button
              size="sm"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-sm h-9"
              onClick={handleContinueToReview}
              data-testid="button-continue-review"
            >
              Continue to Full Review <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              size="sm"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-sm h-9"
              onClick={handleLogin}
              data-testid="button-login-to-review"
            >
              <LogIn className="w-4 h-4 mr-1" /> Sign in to Leave Review
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

interface InlineQuickStarsProps {
  hospitalId: number;
  totalReviews: number;
  onStarClick: (rating: number) => void;
}

export function InlineQuickStars({ hospitalId, totalReviews, onStarClick }: InlineQuickStarsProps) {
  const [hoveredStar, setHoveredStar] = useState(0);

  if (totalReviews > 5) return null;

  return (
    <div
      className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
    >
      <span className="text-xs text-emerald-600 font-medium whitespace-nowrap">
        {totalReviews === 0 ? "Be the first!" : "Rate it:"}
      </span>
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onMouseEnter={() => setHoveredStar(star)}
            onMouseLeave={() => setHoveredStar(0)}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onStarClick(star);
            }}
            className="focus:outline-none transition-transform hover:scale-125"
            data-testid={`inline-star-${hospitalId}-${star}`}
          >
            <Star
              size={16}
              className={cn(
                "transition-colors",
                hoveredStar >= star
                  ? "text-yellow-400 fill-yellow-400"
                  : "text-slate-300"
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
