import { useEffect } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StarRating } from "@/components/star-rating";
import { Skeleton } from "@/components/ui/skeleton";
import { EngagementProfileCard, ReferralCard } from "@/components/engagement-profile";
import {
  User, Star, Bookmark, Settings, PenSquare, Building2,
  Calendar, ChevronRight, MapPin, Loader2, LogOut
} from "lucide-react";
import { format } from "date-fns";
import { getHospitalUrl } from "@shared/schema";

export default function Dashboard() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = "/login";
    }
  }, [authLoading, isAuthenticated]);

  const { data: bookmarksData, isLoading: bookmarksLoading } = useQuery({
    queryKey: ["/api/user/bookmarks"],
    queryFn: async () => {
      const res = await fetch("/api/user/bookmarks", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch bookmarks");
      return res.json();
    },
    enabled: isAuthenticated,
  });

  const { data: reviewsData, isLoading: reviewsLoading } = useQuery({
    queryKey: ["/api/user/reviews"],
    queryFn: async () => {
      const res = await fetch("/api/user/reviews", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch reviews");
      return res.json();
    },
    enabled: isAuthenticated,
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const patientReviews = reviewsData?.patientReviews || [];
  const employeeReviews = reviewsData?.employeeReviews || [];
  const allReviews = [...patientReviews, ...employeeReviews];
  const bookmarks = bookmarksData || [];

  return (
    <div className="min-h-screen bg-slate-50 py-8" data-testid="page-dashboard">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Avatar className="w-24 h-24 mx-auto mb-4">
                    <AvatarImage src={user?.profileImageUrl || ""} />
                    <AvatarFallback className="bg-emerald-100 text-emerald-700 text-2xl">
                      {user?.firstName?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <h2 className="text-xl font-semibold">
                    {user?.firstName ? `${user.firstName} ${user.lastName || ""}` : user?.email}
                  </h2>
                  <p className="text-slate-500 text-sm">{user?.email}</p>
                  {user?.location && (
                    <p className="text-slate-500 text-sm flex items-center justify-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" /> {user.location}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="text-center p-3 bg-slate-50 rounded-lg">
                    <div className="text-2xl font-bold text-emerald-600">{allReviews.length}</div>
                    <div className="text-xs text-slate-500">Reviews</div>
                  </div>
                  <div className="text-center p-3 bg-slate-50 rounded-lg">
                    <div className="text-2xl font-bold text-emerald-600">{bookmarks.length}</div>
                    <div className="text-xs text-slate-500">Saved</div>
                  </div>
                </div>

                <div className="mt-6 space-y-2">
                  <Link href="/profile">
                    <Button variant="outline" className="w-full justify-start gap-2" data-testid="link-edit-profile">
                      <User className="w-4 h-4" />
                      Edit Profile
                    </Button>
                  </Link>
                  <button onClick={() => { fetch("/api/auth/logout", { method: "POST", credentials: "include" }).then(() => { window.location.href = "/"; }); }}>
                    <Button variant="outline" className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50">
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </Button>
                  </button>
                </div>
              </CardContent>
            </Card>
            
            <div className="mt-6">
              <EngagementProfileCard />
            </div>
            
            <div className="mt-6">
              <ReferralCard />
            </div>
          </div>

          <div className="md:col-span-2">
            <Tabs defaultValue="reviews" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="reviews" className="gap-2" data-testid="tab-reviews">
                  <Star className="w-4 h-4" />
                  My Reviews ({allReviews.length})
                </TabsTrigger>
                <TabsTrigger value="bookmarks" className="gap-2" data-testid="tab-bookmarks">
                  <Bookmark className="w-4 h-4" />
                  Saved ({bookmarks.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="reviews" className="space-y-4">
                {reviewsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <Card key={i}>
                        <CardContent className="pt-4">
                          <Skeleton className="h-6 w-1/2 mb-2" />
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-3/4 mt-2" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : allReviews.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <PenSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Reviews Yet</h3>
                      <p className="text-slate-500 mb-4">Share your healthcare experiences to help others</p>
                      <Link href="/search">
                        <Button className="bg-emerald-600 hover:bg-emerald-700">
                          Find a Hospital to Review
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {patientReviews.map((review: any) => (
                      <Card key={`patient-${review.id}`}>
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <Link href={review.hospital ? getHospitalUrl(review.hospital) : `/hospital/${review.hospitalId}`}>
                                <span className="font-semibold text-emerald-700 hover:underline flex items-center gap-1">
                                  <Building2 className="w-4 h-4" />
                                  {review.hospital?.name}
                                </span>
                              </Link>
                              <div className="flex items-center gap-2 mt-1">
                                <StarRating rating={review.rating} readonly size={16} />
                                <span className="text-xs text-slate-500">Patient Review</span>
                              </div>
                            </div>
                            <span className="text-xs text-slate-400">
                              {review.createdAt && format(new Date(review.createdAt), "MMM d, yyyy")}
                            </span>
                          </div>
                          {review.title && <h4 className="font-medium mt-2">{review.title}</h4>}
                          <p className="text-sm text-slate-600 mt-1 line-clamp-2">{review.reviewText}</p>
                          <Link href={review.hospital ? getHospitalUrl(review.hospital) : `/hospital/${review.hospitalId}`}>
                            <span className="text-sm text-emerald-600 hover:underline mt-2 inline-flex items-center gap-1">
                              View Hospital <ChevronRight className="w-3 h-3" />
                            </span>
                          </Link>
                        </CardContent>
                      </Card>
                    ))}
                    {employeeReviews.map((review: any) => (
                      <Card key={`employee-${review.id}`}>
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <Link href={review.hospital ? getHospitalUrl(review.hospital) : `/hospital/${review.hospitalId}`}>
                                <span className="font-semibold text-emerald-700 hover:underline flex items-center gap-1">
                                  <Building2 className="w-4 h-4" />
                                  {review.hospital?.name}
                                </span>
                              </Link>
                              <div className="flex items-center gap-2 mt-1">
                                <StarRating rating={review.rating} readonly size={16} />
                                <span className="text-xs text-slate-500">Employee Review • {review.position}</span>
                              </div>
                            </div>
                            <span className="text-xs text-slate-400">
                              {review.createdAt && format(new Date(review.createdAt), "MMM d, yyyy")}
                            </span>
                          </div>
                          {review.title && <h4 className="font-medium mt-2">{review.title}</h4>}
                          <p className="text-sm text-slate-600 mt-1 line-clamp-2">{review.reviewText}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="bookmarks" className="space-y-4">
                {bookmarksLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <Card key={i}>
                        <CardContent className="pt-4">
                          <Skeleton className="h-6 w-1/2 mb-2" />
                          <Skeleton className="h-4 w-full" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : bookmarks.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Bookmark className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Saved Hospitals</h3>
                      <p className="text-slate-500 mb-4">Bookmark hospitals to easily find them later</p>
                      <Link href="/search">
                        <Button className="bg-emerald-600 hover:bg-emerald-700">
                          Browse Hospitals
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {bookmarks.map((bookmark: any) => (
                      <Card key={bookmark.id}>
                        <CardContent className="pt-4">
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-emerald-100 rounded-lg flex items-center justify-center">
                              <Building2 className="w-8 h-8 text-emerald-600" />
                            </div>
                            <div className="flex-1">
                              <Link href={getHospitalUrl(bookmark.hospital)}>
                                <span className="font-semibold text-slate-900 hover:text-emerald-600">
                                  {bookmark.hospital.name}
                                </span>
                              </Link>
                              <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                                <MapPin className="w-3 h-3" />
                                {bookmark.hospital.lga}, {bookmark.hospital.state}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <StarRating rating={bookmark.hospital.averageRating || 0} readonly size={14} />
                                <span className="text-xs text-slate-500">
                                  ({bookmark.hospital.totalReviews || 0} reviews)
                                </span>
                              </div>
                            </div>
                            <Link href={getHospitalUrl(bookmark.hospital)}>
                              <Button variant="outline" size="sm">View</Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
