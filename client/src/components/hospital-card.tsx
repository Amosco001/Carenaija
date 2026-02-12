import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Star, ShieldCheck, Scale, Check, Sparkles } from "lucide-react";
import { useComparison } from "@/lib/comparison-context";
import { toast } from "sonner";
import type { Hospital } from "@shared/schema";
import { getHospitalUrl } from "@shared/schema";

interface HospitalCardProps {
  hospital: Hospital;
  imageUrl: string;
  variant?: "carousel" | "list";
}

export function HospitalCard({ hospital, imageUrl, variant = "list" }: HospitalCardProps) {
  const { addToCompare, removeFromCompare, isInCompare, canAddMore } = useComparison();
  const inCompare = isInCompare(hospital.id);
  
  const isRecentlyUpdated = hospital.updatedAt 
    ? (Date.now() - new Date(hospital.updatedAt).getTime()) < 7 * 24 * 60 * 60 * 1000 
    : false;

  const handleCompareClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (inCompare) {
      removeFromCompare(hospital.id);
      toast.success(`Removed ${hospital.name} from comparison`);
    } else {
      if (!canAddMore) {
        toast.error("Maximum 3 hospitals can be compared at once");
        return;
      }
      const added = addToCompare(hospital);
      if (added) {
        toast.success(`Added ${hospital.name} to comparison`);
      }
    }
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`w-4 h-4 ${i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`} 
      />
    ));
  };

  if (variant === "carousel") {
    return (
      <div className="relative group">
        <Link href={getHospitalUrl(hospital)} data-testid={`card-hospital-${hospital.id}`}>
          <Card className="overflow-hidden border-slate-200 hover:border-emerald-300 hover:shadow-lg transition-all duration-300 h-full">
            <div className="h-48 overflow-hidden relative">
              <img 
                src={imageUrl} 
                alt={`${hospital.name} - ${hospital.ownership} hospital in ${hospital.lga}, ${hospital.state} Nigeria`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <div className="absolute top-3 left-3 flex gap-1.5">
                {hospital.verified && (
                  <div className="bg-emerald-500 text-white px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Verified
                  </div>
                )}
                {isRecentlyUpdated && (
                  <div className="bg-orange-500 text-white px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1" data-testid={`badge-new-reviews-${hospital.id}`}>
                    <Sparkles className="w-3 h-3" /> New Reviews
                  </div>
                )}
              </div>
              <div className="absolute top-3 right-3 bg-white/95 backdrop-blur px-2 py-1 rounded-md shadow-sm">
                <span className="text-xs font-semibold text-emerald-700">{hospital.ownership}</span>
              </div>
            </div>
            <CardContent className="p-5">
              <h3 className="font-bold text-lg text-slate-900 mb-2 line-clamp-2 group-hover:text-emerald-700 transition-colors">
                {hospital.name}
              </h3>
              <div className="flex items-center text-slate-500 text-sm mb-3">
                <MapPin className="w-4 h-4 mr-1 text-slate-400" />
                {hospital.lga}, {hospital.state}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {getRatingStars(hospital.averageRating || 4)}
                  <span className="text-sm text-slate-500 ml-1">({hospital.totalReviews || 0})</span>
                </div>
                {hospital.bedCapacity && (
                  <span className="text-xs text-slate-500">{hospital.bedCapacity} beds</span>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>
        <Button
          size="sm"
          variant={inCompare ? "default" : "outline"}
          className={`absolute bottom-20 right-4 z-10 transition-all ${
            inCompare 
              ? "bg-emerald-600 hover:bg-emerald-700" 
              : "bg-white/90 hover:bg-emerald-50 border-emerald-300"
          }`}
          onClick={handleCompareClick}
          data-testid={`button-compare-${hospital.id}`}
        >
          {inCompare ? (
            <>
              <Check className="w-4 h-4 mr-1" /> Comparing
            </>
          ) : (
            <>
              <Scale className="w-4 h-4 mr-1" /> Compare
            </>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="relative">
      <Link href={getHospitalUrl(hospital)}>
        <div
          className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group hover:border-emerald-300 cursor-pointer"
          data-testid={`card-hospital-${hospital.id}`}
        >
          <div className="flex flex-col sm:flex-row">
            <div className="sm:w-48 h-40 sm:h-auto relative overflow-hidden flex-shrink-0">
              <img
                src={imageUrl}
                alt={`${hospital.name} - ${hospital.ownership} hospital in ${hospital.lga}, ${hospital.state} Nigeria`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute top-2 left-2 flex gap-1">
                {hospital.verified && (
                  <div className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Verified
                  </div>
                )}
                {isRecentlyUpdated && (
                  <div className="bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1" data-testid={`badge-new-reviews-list-${hospital.id}`}>
                    <Sparkles className="w-3 h-3" /> New
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                    <Badge variant="outline" className="font-normal text-xs">
                      {hospital.ownership}
                    </Badge>
                    <span className="flex items-center">
                      <MapPin className="w-3 h-3 mr-1" />
                      {hospital.lga}, {hospital.state}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1" data-testid={`text-hospital-name-${hospital.id}`}>
                    {hospital.name}
                  </h3>
                </div>

                <div className="flex items-center gap-1">
                  {getRatingStars(hospital.averageRating || 0)}
                  <span className="text-sm text-slate-500 ml-1">({hospital.totalReviews || 0})</span>
                </div>
              </div>

              {hospital.services && hospital.services.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {hospital.services.slice(0, 3).map((service) => (
                    <Badge key={service} variant="secondary" className="text-xs">
                      {service}
                    </Badge>
                  ))}
                  {hospital.services.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{hospital.services.length - 3} more
                    </Badge>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between mt-auto">
                <div className="flex items-center gap-4 text-sm text-slate-500">
                  {hospital.bedCapacity && (
                    <span>{hospital.bedCapacity} beds</span>
                  )}
                  {hospital.operatingHours && (
                    <span>{hospital.operatingHours}</span>
                  )}
                </div>
                <span className="text-sm font-semibold text-emerald-600 group-hover:underline">
                  Read Reviews & Details →
                </span>
              </div>
            </div>
          </div>
        </div>
      </Link>
      <Button
        size="sm"
        variant={inCompare ? "default" : "outline"}
        className={`absolute top-2 right-2 sm:top-4 sm:right-4 z-10 transition-all ${
          inCompare 
            ? "bg-emerald-600 hover:bg-emerald-700" 
            : "bg-white/90 hover:bg-emerald-50 border-emerald-300"
        }`}
        onClick={handleCompareClick}
        data-testid={`button-compare-${hospital.id}`}
      >
        {inCompare ? (
          <>
            <Check className="w-4 h-4 mr-1" /> Comparing
          </>
        ) : (
          <>
            <Scale className="w-4 h-4 mr-1" /> Compare
          </>
        )}
      </Button>
    </div>
  );
}
