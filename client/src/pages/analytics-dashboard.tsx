import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import {
  Building2,
  MessageSquare,
  Users,
  Star,
  TrendingUp,
  Download,
  Clock,
  CheckCircle,
  AlertCircle,
  Activity,
  MapPin,
  FileText,
} from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import type { Hospital } from "@shared/schema";

const CHART_COLORS = ["#16a34a", "#22c55e", "#4ade80", "#86efac", "#bbf7d0", "#dcfce7"];
const CATEGORY_COLORS: Record<string, string> = {
  "Care Quality": "#16a34a",
  "Staff Attitude": "#22c55e",
  "Cleanliness": "#4ade80",
  "Wait Time": "#f59e0b",
  "Value for Money": "#3b82f6",
};

interface AnalyticsSummary {
  totalHospitals: number;
  totalReviews: number;
  totalUsers: number;
  avgRating: number;
  pendingReviews: number;
  verifiedReviews: number;
}

interface ReviewOverTime {
  date: string;
  count: number;
}

interface CategoryRating {
  category: string;
  average: number;
}

interface HospitalWithReviewCount extends Hospital {
  reviewCount: number;
}

interface StateCount {
  state: string;
  count: number;
}

interface RecentActivity {
  id: number;
  type: string;
  title: string;
  createdAt: string;
  hospitalId: number;
  userId: string;
}

function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  description,
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<any>;
  trend?: { value: number; positive: boolean };
  description?: string;
}) {
  return (
    <Card data-testid={`stat-card-${title.toLowerCase().replace(/\s+/g, "-")}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <p className={`text-xs ${trend.positive ? "text-green-600" : "text-red-600"}`}>
            {trend.positive ? "+" : ""}{trend.value}% from last month
          </p>
        )}
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  );
}

function exportToCSV(data: any[], filename: string) {
  if (!data || data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(","),
    ...data.map(row => headers.map(h => JSON.stringify(row[h] ?? "")).join(","))
  ].join("\n");
  
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${format(new Date(), "yyyy-MM-dd")}.csv`;
  link.click();
}

export default function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState("30");

  const { data: summary, isLoading: loadingSummary, error: summaryError } = useQuery<AnalyticsSummary>({
    queryKey: ["/api/admin/analytics/summary"],
    queryFn: async () => {
      const res = await fetch("/api/admin/analytics/summary", { credentials: "include" });
      if (!res.ok) throw new Error(res.status === 401 ? "Unauthorized" : "Failed to fetch");
      return res.json();
    },
    retry: false,
  });

  const { data: reviewsOverTime, isLoading: loadingReviews } = useQuery<ReviewOverTime[]>({
    queryKey: ["/api/admin/analytics/reviews-over-time", timeRange],
    queryFn: async () => {
      const res = await fetch(`/api/admin/analytics/reviews-over-time?days=${timeRange}`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !summaryError,
  });

  const { data: topHospitals = [] } = useQuery<Hospital[]>({
    queryKey: ["/api/admin/analytics/top-hospitals"],
    queryFn: async () => {
      const res = await fetch("/api/admin/analytics/top-hospitals?limit=10", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !summaryError,
  });

  const { data: mostReviewed = [] } = useQuery<HospitalWithReviewCount[]>({
    queryKey: ["/api/admin/analytics/most-reviewed"],
    queryFn: async () => {
      const res = await fetch("/api/admin/analytics/most-reviewed?limit=10", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !summaryError,
  });

  const { data: ratingsByCategory = [] } = useQuery<CategoryRating[]>({
    queryKey: ["/api/admin/analytics/ratings-by-category"],
    queryFn: async () => {
      const res = await fetch("/api/admin/analytics/ratings-by-category", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !summaryError,
  });

  const { data: hospitalsByState = [] } = useQuery<StateCount[]>({
    queryKey: ["/api/admin/analytics/hospitals-by-state"],
    queryFn: async () => {
      const res = await fetch("/api/admin/analytics/hospitals-by-state", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !summaryError,
  });

  const { data: recentActivity = [] } = useQuery<RecentActivity[]>({
    queryKey: ["/api/admin/analytics/recent-activity"],
    queryFn: async () => {
      const res = await fetch("/api/admin/analytics/recent-activity", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !summaryError,
  });

  if (summaryError) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-lg text-center">
        <Card>
          <CardContent className="pt-6">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">
              You need to be logged in as an administrator to view the analytics dashboard.
            </p>
            <Button onClick={() => window.location.href = "/login"} className="bg-green-600 hover:bg-green-700">
              Log In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loadingSummary) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl" data-testid="analytics-dashboard">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-1">Platform performance and insights</p>
        </div>
        <div className="flex items-center gap-4 mt-4 md:mt-0">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]" data-testid="select-time-range">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => exportToCSV(topHospitals || [], "top_hospitals")}
            data-testid="button-export-csv"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="Total Hospitals"
          value={summary?.totalHospitals?.toLocaleString() || "0"}
          icon={Building2}
          description="Registered facilities"
        />
        <StatCard
          title="Total Reviews"
          value={summary?.totalReviews?.toLocaleString() || "0"}
          icon={MessageSquare}
          description={`${summary?.verifiedReviews || 0} verified`}
        />
        <StatCard
          title="Registered Users"
          value={summary?.totalUsers?.toLocaleString() || "0"}
          icon={Users}
          description="Active accounts"
        />
        <StatCard
          title="Average Rating"
          value={summary?.avgRating?.toFixed(1) || "0.0"}
          icon={Star}
          description="Across all hospitals"
        />
      </div>

      {/* Review Status Cards */}
      <div className="grid gap-4 md:grid-cols-2 mb-8">
        <Card data-testid="card-pending-reviews">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{summary?.pendingReviews || 0}</div>
            <p className="text-xs text-muted-foreground">Awaiting moderation</p>
          </CardContent>
        </Card>
        <Card data-testid="card-verified-reviews">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Verified Reviews</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{summary?.verifiedReviews || 0}</div>
            <Progress
              value={summary?.totalReviews ? ((summary?.verifiedReviews || 0) / summary.totalReviews) * 100 : 0}
              className="mt-2"
            />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList data-testid="tabs-analytics">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="hospitals">Hospitals</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Reviews Over Time Chart */}
            <Card data-testid="chart-reviews-over-time">
              <CardHeader>
                <CardTitle>Reviews Over Time</CardTitle>
                <CardDescription>Daily review submissions</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {reviewsOverTime && reviewsOverTime.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={reviewsOverTime}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(date) => format(new Date(date), "MMM d")}
                        fontSize={12}
                      />
                      <YAxis fontSize={12} />
                      <Tooltip
                        labelFormatter={(date) => format(new Date(date), "MMMM d, yyyy")}
                      />
                      <Area
                        type="monotone"
                        dataKey="count"
                        stroke="#16a34a"
                        fill="#dcfce7"
                        name="Reviews"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No review data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Hospitals by State */}
            <Card data-testid="chart-hospitals-by-state">
              <CardHeader>
                <CardTitle>Hospitals by State</CardTitle>
                <CardDescription>Distribution across Nigeria</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {hospitalsByState && hospitalsByState.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={hospitalsByState.slice(0, 6)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ state, percent }) => `${state} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {hospitalsByState.slice(0, 6).map((_, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No state data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Ratings by Category */}
          <Card data-testid="chart-ratings-by-category">
            <CardHeader>
              <CardTitle>Average Ratings by Category</CardTitle>
              <CardDescription>How hospitals perform across different aspects</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              {ratingsByCategory && ratingsByCategory.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ratingsByCategory} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 5]} fontSize={12} />
                    <YAxis type="category" dataKey="category" width={120} fontSize={12} />
                    <Tooltip formatter={(value: number) => value.toFixed(2)} />
                    <Bar dataKey="average" radius={[0, 4, 4, 0]}>
                      {ratingsByCategory.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CATEGORY_COLORS[entry.category] || CHART_COLORS[0]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No rating data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hospitals" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Top Rated Hospitals */}
            <Card data-testid="card-top-rated-hospitals">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Top Rated Hospitals</CardTitle>
                  <CardDescription>Highest rated facilities</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => exportToCSV(topHospitals || [], "top_rated_hospitals")}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topHospitals?.slice(0, 5).map((hospital, index) => (
                    <div
                      key={hospital.id}
                      className="flex items-center justify-between"
                      data-testid={`row-top-hospital-${hospital.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-700 font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{hospital.name}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {hospital.city}, {hospital.state}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {hospital.averageRating?.toFixed(1) || "N/A"}
                      </Badge>
                    </div>
                  ))}
                  {(!topHospitals || topHospitals.length === 0) && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No hospitals found
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Most Reviewed Hospitals */}
            <Card data-testid="card-most-reviewed-hospitals">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Most Reviewed Hospitals</CardTitle>
                  <CardDescription>Highest engagement</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => exportToCSV(mostReviewed || [], "most_reviewed_hospitals")}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mostReviewed?.slice(0, 5).map((hospital, index) => (
                    <div
                      key={hospital.id}
                      className="flex items-center justify-between"
                      data-testid={`row-reviewed-hospital-${hospital.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{hospital.name}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {hospital.city}, {hospital.state}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {hospital.reviewCount}
                      </Badge>
                    </div>
                  ))}
                  {(!mostReviewed || mostReviewed.length === 0) && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No review data found
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Most Reviewed Chart */}
          <Card data-testid="chart-most-reviewed">
            <CardHeader>
              <CardTitle>Review Distribution</CardTitle>
              <CardDescription>Top 10 hospitals by review count</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              {mostReviewed && mostReviewed.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mostReviewed} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" fontSize={12} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={150}
                      fontSize={11}
                      tickFormatter={(name) => name.length > 20 ? name.slice(0, 20) + "..." : name}
                    />
                    <Tooltip />
                    <Bar dataKey="reviewCount" fill="#16a34a" radius={[0, 4, 4, 0]} name="Reviews" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Review Quality</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Verified</span>
                    <span className="font-medium">{summary?.verifiedReviews || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Pending</span>
                    <span className="font-medium text-amber-600">{summary?.pendingReviews || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total</span>
                    <span className="font-medium">{summary?.totalReviews || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Rating Categories Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {ratingsByCategory?.map((cat) => (
                    <div key={cat.category} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{cat.category}</span>
                        <span className="font-medium">{cat.average.toFixed(2)}/5</span>
                      </div>
                      <Progress value={(cat.average / 5) * 100} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card data-testid="card-recent-activity">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>Latest platform activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity?.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-4 p-3 rounded-lg bg-muted/50"
                    data-testid={`activity-item-${activity.id}`}
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100">
                      <FileText className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {activity.title || "New review submitted"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Hospital ID: {activity.hospitalId}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                      {activity.createdAt && format(new Date(activity.createdAt), "MMM d, HH:mm")}
                    </div>
                  </div>
                ))}
                {(!recentActivity || recentActivity.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No recent activity</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
