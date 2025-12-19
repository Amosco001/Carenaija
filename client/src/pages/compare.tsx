import { useRef, useState } from "react";
import { Link } from "wouter";
import { useComparison } from "@/lib/comparison-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ArrowLeft,
  Download,
  Star,
  MapPin,
  MessageSquare,
  Clock,
  Phone,
  Building2,
  X,
  Scale,
  Check,
  Minus,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from "recharts";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import type { Hospital } from "@shared/schema";

const CHART_COLORS = ["#16a34a", "#3b82f6", "#f59e0b"];

function getHighlightClass(values: (number | null | undefined)[], currentValue: number | null | undefined, type: "high" | "low" = "high"): string {
  if (currentValue === null || currentValue === undefined) return "";
  const validValues = values.filter((v): v is number => v !== null && v !== undefined);
  if (validValues.length === 0) return "";
  
  const best = type === "high" ? Math.max(...validValues) : Math.min(...validValues);
  const worst = type === "high" ? Math.min(...validValues) : Math.max(...validValues);
  
  if (currentValue === best && validValues.length > 1) {
    return "bg-green-50 text-green-700 font-semibold";
  }
  if (currentValue === worst && validValues.length > 1) {
    return "bg-red-50 text-red-700";
  }
  return "";
}

function CompareCell({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={`px-4 py-3 text-center border-b ${className}`}>
      {children}
    </td>
  );
}

function FeatureCheck({ has }: { has: boolean }) {
  return has ? (
    <Check className="h-5 w-5 text-green-600 mx-auto" />
  ) : (
    <Minus className="h-5 w-5 text-gray-300 mx-auto" />
  );
}

export default function ComparePage() {
  const { compareList, removeFromCompare, clearCompare } = useComparison();
  const compareRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const exportPDF = async () => {
    if (!compareRef.current) return;
    
    setIsExporting(true);
    try {
      const canvas = await html2canvas(compareRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });
      
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [canvas.width, canvas.height],
      });
      
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save(`hospital-comparison-${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success("PDF exported successfully");
    } catch (error) {
      console.error("PDF export failed:", error);
      toast.error("Failed to export PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  if (compareList.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-8 pb-8">
            <Scale className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">No Hospitals to Compare</h2>
            <p className="text-muted-foreground mb-6">
              Add hospitals to your comparison list by clicking "Add to Compare" on hospital cards.
            </p>
            <Link href="/search">
              <Button className="bg-green-600 hover:bg-green-700">
                Browse Hospitals
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (compareList.length < 2) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-8 pb-8">
            <Scale className="h-16 w-16 text-amber-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Add More Hospitals</h2>
            <p className="text-muted-foreground mb-6">
              You need at least 2 hospitals to compare. Currently selected: {compareList.length}
            </p>
            <Link href="/search">
              <Button className="bg-green-600 hover:bg-green-700">
                Add More Hospitals
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const ratings = compareList.map((h) => h.averageRating || 0);
  const reviews = compareList.map((h) => h.totalReviews || 0);

  const radarData = [
    { subject: "Rating", fullMark: 5, ...Object.fromEntries(compareList.map((h, i) => [`h${i}`, h.averageRating || 0])) },
  ];

  const barData = compareList.map((h) => ({
    name: h.name.length > 15 ? h.name.slice(0, 15) + "..." : h.name,
    reviews: h.totalReviews || 0,
    rating: (h.averageRating || 0) * 20,
  }));

  return (
    <div className="container mx-auto px-4 py-8 pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Link href="/search">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Compare Hospitals</h1>
            <p className="text-muted-foreground">Comparing {compareList.length} hospitals</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={clearCompare}>
            Clear All
          </Button>
          <Button onClick={exportPDF} disabled={isExporting} className="bg-green-600 hover:bg-green-700">
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? "Exporting..." : "Export PDF"}
          </Button>
        </div>
      </div>

      <div ref={compareRef} className="space-y-6 bg-white p-4 rounded-lg">
        {/* Comparison Table */}
        <Card>
          <CardHeader>
            <CardTitle>Hospital Comparison</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-3 text-left font-medium text-gray-500 w-40">Attribute</th>
                  {compareList.map((hospital) => (
                    <th key={hospital.id} className="px-4 py-3 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <span className="font-semibold text-gray-900">{hospital.name}</span>
                        <button
                          onClick={() => removeFromCompare(hospital.id)}
                          className="text-gray-400 hover:text-red-500"
                          data-testid={`table-remove-${hospital.id}`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Rating */}
                <tr>
                  <td className="px-4 py-3 text-left font-medium text-gray-600 border-b">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      Rating
                    </div>
                  </td>
                  {compareList.map((hospital) => (
                    <CompareCell
                      key={hospital.id}
                      className={getHighlightClass(ratings, hospital.averageRating, "high")}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>{hospital.averageRating?.toFixed(1) || "N/A"}</span>
                      </div>
                    </CompareCell>
                  ))}
                </tr>

                {/* Reviews */}
                <tr>
                  <td className="px-4 py-3 text-left font-medium text-gray-600 border-b">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-blue-500" />
                      Reviews
                    </div>
                  </td>
                  {compareList.map((hospital) => (
                    <CompareCell
                      key={hospital.id}
                      className={getHighlightClass(reviews, hospital.totalReviews, "high")}
                    >
                      {hospital.totalReviews || 0} reviews
                    </CompareCell>
                  ))}
                </tr>

                {/* Location */}
                <tr>
                  <td className="px-4 py-3 text-left font-medium text-gray-600 border-b">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-red-500" />
                      Location
                    </div>
                  </td>
                  {compareList.map((hospital) => (
                    <CompareCell key={hospital.id}>
                      <div className="text-sm">
                        {hospital.lga}, {hospital.state}
                      </div>
                    </CompareCell>
                  ))}
                </tr>

                {/* Ownership */}
                <tr>
                  <td className="px-4 py-3 text-left font-medium text-gray-600 border-b">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-purple-500" />
                      Ownership
                    </div>
                  </td>
                  {compareList.map((hospital) => (
                    <CompareCell key={hospital.id}>
                      <Badge variant={hospital.ownership === "Government" ? "secondary" : "outline"}>
                        {hospital.ownership}
                      </Badge>
                    </CompareCell>
                  ))}
                </tr>

                {/* Operating Hours */}
                <tr>
                  <td className="px-4 py-3 text-left font-medium text-gray-600 border-b">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-green-500" />
                      Hours
                    </div>
                  </td>
                  {compareList.map((hospital) => (
                    <CompareCell key={hospital.id}>
                      {hospital.operatingHours || "N/A"}
                    </CompareCell>
                  ))}
                </tr>

                {/* Phone */}
                <tr>
                  <td className="px-4 py-3 text-left font-medium text-gray-600 border-b">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-teal-500" />
                      Contact
                    </div>
                  </td>
                  {compareList.map((hospital) => (
                    <CompareCell key={hospital.id}>
                      <FeatureCheck has={!!hospital.phone} />
                    </CompareCell>
                  ))}
                </tr>

                {/* Bed Capacity */}
                <tr>
                  <td className="px-4 py-3 text-left font-medium text-gray-600 border-b">
                    Bed Capacity
                  </td>
                  {compareList.map((hospital) => {
                    const capacities = compareList.map((h) => h.bedCapacity);
                    return (
                      <CompareCell
                        key={hospital.id}
                        className={getHighlightClass(capacities, hospital.bedCapacity, "high")}
                      >
                        {hospital.bedCapacity || "N/A"}
                      </CompareCell>
                    );
                  })}
                </tr>

                {/* Services */}
                <tr>
                  <td className="px-4 py-3 text-left font-medium text-gray-600 border-b align-top">
                    Specialties
                  </td>
                  {compareList.map((hospital) => (
                    <CompareCell key={hospital.id} className="align-top">
                      <div className="flex flex-wrap gap-1 justify-center">
                        {(hospital.services || []).slice(0, 4).map((service) => (
                          <Badge key={service} variant="outline" className="text-xs">
                            {service}
                          </Badge>
                        ))}
                        {(hospital.services?.length || 0) > 4 && (
                          <Badge variant="secondary" className="text-xs">
                            +{hospital.services!.length - 4} more
                          </Badge>
                        )}
                      </div>
                    </CompareCell>
                  ))}
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Review Count Comparison</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="reviews" fill="#16a34a" radius={[4, 4, 0, 0]} name="Reviews" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Rating Comparison</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} fontSize={12} tickFormatter={(v) => `${v/20}`} />
                  <YAxis type="category" dataKey="name" width={100} fontSize={11} />
                  <Tooltip formatter={(value: number) => (value / 20).toFixed(1)} />
                  <Bar dataKey="rating" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Rating" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Legend */}
        <Card className="bg-gray-50">
          <CardContent className="py-4">
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-50 border border-green-200"></div>
                <span>Best in category</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-50 border border-red-200"></div>
                <span>Lowest in category</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span>Feature available</span>
              </div>
              <div className="flex items-center gap-2">
                <Minus className="h-4 w-4 text-gray-300" />
                <span>Not available</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
