import { Star, StarHalf } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number; // 0 to 5
  maxRating?: number;
  size?: number;
  className?: string;
  showCount?: boolean;
  count?: number;
  readonly?: boolean;
  onChange?: (rating: number) => void;
}

export function StarRating({
  rating,
  maxRating = 5,
  size = 16,
  className,
  showCount = false,
  count = 0,
  readonly = true,
  onChange
}: StarRatingProps) {
  const stars = [];

  for (let i = 1; i <= maxRating; i++) {
    const isFull = i <= Math.floor(rating);
    const isHalf = !isFull && i === Math.ceil(rating) && rating % 1 >= 0.5;
    const isEmpty = !isFull && !isHalf;

    stars.push(
      <button
        key={i}
        type="button"
        disabled={readonly}
        onClick={() => onChange && onChange(i)}
        className={cn(
          "focus:outline-none transition-transform hover:scale-110",
          readonly ? "cursor-default hover:scale-100" : "cursor-pointer"
        )}
      >
        <Star
          size={size}
          className={cn(
            "fill-current",
            isFull || isHalf ? "text-accent" : "text-muted-foreground/30",
            isEmpty && "fill-transparent"
          )}
          fill={isFull ? "currentColor" : isHalf ? "url(#half)" : "transparent"} // Simple fill for now, half star handled by icon choice if needed but Lucide Star is tricky with half fill.
          // Lucide doesn't have native half-fill prop easily.
          // Alternative: Use full star with color for filled, empty star for empty. 
          // For half, we can overlay or just use nearest integer for display if simple.
          // Let's stick to full/empty color change for simplicity in this mockup unless we need strict half stars.
          // Actually, let's just color the stars based on index.
        />
      </button>
    );
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex">
        {Array.from({ length: maxRating }).map((_, i) => (
          <Star
            key={i}
            size={size}
            className={cn(
              "transition-colors",
              i < Math.floor(rating) 
                ? "text-accent fill-accent" 
                : i < rating 
                  ? "text-accent fill-accent opacity-50" // poor man's half star
                  : "text-muted-foreground/30",
              !readonly && "cursor-pointer hover:text-accent"
            )}
            onClick={() => !readonly && onChange && onChange(i + 1)}
          />
        ))}
      </div>
      {showCount && (
        <span className="text-xs text-muted-foreground ml-1">
          ({count} reviews)
        </span>
      )}
    </div>
  );
}
