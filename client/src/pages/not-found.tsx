import { Link } from "wouter";
import { Search, Home, MapPin, Star, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useLocation } from "wouter";
import { SEOHead } from "@/components/seo-head";

const POPULAR_SEARCHES = [
  { label: "Hospitals in Lagos", href: "/search?location=Lagos" },
  { label: "Hospitals in Abuja", href: "/search?location=Abuja" },
  { label: "Maternity care", href: "/search?q=Maternity" },
  { label: "Teaching hospitals", href: "/search?q=Teaching Hospital" },
  { label: "Cardiology", href: "/search?q=Cardiology" },
  { label: "Private hospitals", href: "/search?q=Private" },
];

export default function NotFound() {
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) setLocation(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-16" data-testid="page-not-found">
      <SEOHead
        title="Page Not Found — CareNaija"
        description="The page you're looking for doesn't exist. Find hospitals and read reviews on CareNaija."
      />

      <div className="max-w-lg w-full text-center">
        <div className="mb-8">
          <div className="text-8xl font-black text-emerald-600/20 leading-none select-none">404</div>
          <h1 className="text-2xl font-bold text-slate-900 mt-2 mb-3">
            Page not found
          </h1>
          <p className="text-slate-500">
            The page you're looking for doesn't exist or may have moved. 
            Let's get you back to finding quality healthcare in Nigeria.
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
            <Input
              placeholder="Search hospitals, cities, specialties..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="pl-10 h-11"
              data-testid="input-404-search"
              aria-label="Search hospitals"
            />
          </div>
          <Button type="submit" className="h-11 bg-emerald-600 hover:bg-emerald-700" data-testid="button-404-search">
            Search
          </Button>
        </form>

        <div className="mb-8">
          <p className="text-sm font-medium text-slate-500 mb-3 text-left">Popular searches</p>
          <div className="flex flex-wrap gap-2">
            {POPULAR_SEARCHES.map(item => (
              <Link key={item.href} href={item.href}>
                <span
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 text-sm rounded-full cursor-pointer transition-all"
                  data-testid={`link-popular-search-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <MapPin className="w-3 h-3" />
                  {item.label}
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/">
            <Button variant="outline" className="w-full sm:w-auto gap-2" data-testid="button-go-home">
              <Home className="w-4 h-4" />
              Go to Homepage
            </Button>
          </Link>
          <Link href="/search">
            <Button className="w-full sm:w-auto gap-2 bg-emerald-600 hover:bg-emerald-700" data-testid="button-browse-hospitals">
              <Star className="w-4 h-4" />
              Browse all hospitals
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        <p className="mt-8 text-xs text-slate-400">
          If you think this is a mistake, please{" "}
          <a href="mailto:support@carenaija.com" className="text-emerald-600 hover:underline">
            contact support
          </a>
          .
        </p>
      </div>
    </div>
  );
}
