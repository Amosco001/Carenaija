import { Link } from "wouter";
import { Search, Bookmark, Share2 } from "lucide-react";

interface HomeFABProps {
  className?: string;
}

export function HomeFAB({ className = "" }: HomeFABProps) {
  return (
    <div className={`fixed bottom-6 right-4 z-40 md:hidden ${className}`}>
      <Link href="/search">
        <button
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold px-5 py-3.5 rounded-full shadow-lg shadow-emerald-900/30 transition-all"
          data-testid="fab-find-hospital"
          aria-label="Find a hospital"
        >
          <Search className="w-5 h-5" />
          <span>Find a hospital</span>
        </button>
      </Link>
    </div>
  );
}

interface DetailFABProps {
  hospitalName: string;
  onShare?: () => void;
  onSave?: () => void;
  isSaved?: boolean;
}

export function DetailFAB({ hospitalName, onShare, isSaved = false }: DetailFABProps) {
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${hospitalName} — CareNaija`,
          text: `Check out ${hospitalName} on CareNaija — Nigeria's hospital review platform`,
          url: window.location.href,
        });
        return;
      } catch {}
    }
    if (onShare) onShare();
  };

  return (
    <div className="fixed bottom-6 right-4 z-40 md:hidden flex gap-3">
      <button
        onClick={handleShare}
        className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 font-semibold px-4 py-3 rounded-full shadow-lg transition-all hover:bg-slate-50 active:bg-slate-100"
        data-testid="fab-share"
        aria-label="Share this hospital"
      >
        <Share2 className="w-5 h-5" />
        <span className="text-sm">Share</span>
      </button>
      <Link href={`/search`}>
        <button
          className="flex items-center gap-2 bg-emerald-600 text-white font-semibold px-4 py-3 rounded-full shadow-lg shadow-emerald-900/30 transition-all hover:bg-emerald-700 active:bg-emerald-800"
          data-testid="fab-find-another"
          aria-label="Find another hospital"
        >
          <Search className="w-5 h-5" />
          <span className="text-sm">Find more</span>
        </button>
      </Link>
    </div>
  );
}
