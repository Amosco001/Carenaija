import { Link } from "wouter";
import { X, ArrowRight, Scale, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useComparison } from "@/lib/comparison-context";
import { cn } from "@/lib/utils";

export function CompareBar() {
  const { compareList, removeFromCompare, clearCompare } = useComparison();

  if (compareList.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-lg",
        "transition-transform duration-300 ease-in-out"
      )}
      data-testid="compare-bar"
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-green-600" />
            <span className="font-medium text-sm hidden sm:inline">
              Compare ({compareList.length}/3)
            </span>
            <span className="font-medium text-sm sm:hidden">
              {compareList.length}/3
            </span>
          </div>

          <div className="flex-1 flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {compareList.map((hospital) => (
              <div
                key={hospital.id}
                className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5 min-w-fit"
                data-testid={`compare-item-${hospital.id}`}
              >
                <span className="text-sm font-medium text-green-900 truncate max-w-[120px] sm:max-w-[180px]">
                  {hospital.name}
                </span>
                <button
                  onClick={() => removeFromCompare(hospital.id)}
                  className="text-green-600 hover:text-green-800 p-0.5"
                  aria-label={`Remove ${hospital.name} from comparison`}
                  data-testid={`remove-compare-${hospital.id}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearCompare}
              className="text-gray-500 hover:text-red-600"
              data-testid="button-clear-compare"
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline ml-1">Clear</span>
            </Button>
            
            <Link href="/compare">
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700"
                disabled={compareList.length < 2}
                data-testid="button-view-comparison"
              >
                <span className="hidden sm:inline">Compare Now</span>
                <span className="sm:hidden">Compare</span>
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
