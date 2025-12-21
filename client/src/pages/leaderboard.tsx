import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Trophy, Medal, Award, Star, Crown, Flame, TrendingUp, 
  Users, ChevronRight, Sparkles, Target
} from "lucide-react";
import { profileLevels } from "@shared/schema";

type LeaderboardEntry = {
  userId: string;
  totalPoints: number;
  currentLevel: string;
  reviewCount: number;
  helpfulVotesReceived: number;
  helpfulVotesGiven: number;
  referralCount: number;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
  };
};

type BadgeType = {
  id: number;
  code: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  rarity: string;
  isSecret: boolean;
};

const levelConfig: Record<string, { name: string; color: string; icon: React.ReactNode; bgClass: string }> = {
  novice: { 
    name: "Novice", 
    color: "text-slate-500", 
    icon: <Star className="w-4 h-4" />,
    bgClass: "bg-slate-100"
  },
  contributor: { 
    name: "Contributor", 
    color: "text-blue-500", 
    icon: <TrendingUp className="w-4 h-4" />,
    bgClass: "bg-blue-100"
  },
  expert: { 
    name: "Expert", 
    color: "text-purple-500", 
    icon: <Award className="w-4 h-4" />,
    bgClass: "bg-purple-100"
  },
  superReviewer: { 
    name: "Super Reviewer", 
    color: "text-amber-500", 
    icon: <Crown className="w-4 h-4" />,
    bgClass: "bg-amber-100"
  },
};

const rarityColors: Record<string, string> = {
  common: "bg-slate-100 text-slate-700",
  uncommon: "bg-green-100 text-green-700",
  rare: "bg-blue-100 text-blue-700",
  epic: "bg-purple-100 text-purple-700",
  legendary: "bg-amber-100 text-amber-700",
};

function getRankIcon(rank: number) {
  if (rank === 1) return <Trophy className="w-6 h-6 text-amber-500" />;
  if (rank === 2) return <Medal className="w-6 h-6 text-slate-400" />;
  if (rank === 3) return <Medal className="w-6 h-6 text-amber-700" />;
  return <span className="w-6 h-6 flex items-center justify-center text-slate-500 font-bold">{rank}</span>;
}

function LeaderboardRow({ entry, rank }: { entry: LeaderboardEntry; rank: number }) {
  const level = levelConfig[entry.currentLevel] || levelConfig.novice;
  const displayName = entry.user.firstName && entry.user.lastName 
    ? `${entry.user.firstName} ${entry.user.lastName}`
    : entry.user.firstName || "Anonymous User";

  return (
    <div 
      className={`flex items-center gap-4 p-4 rounded-lg transition-colors ${rank <= 3 ? 'bg-gradient-to-r from-amber-50/50 to-transparent' : 'hover:bg-slate-50'}`}
      data-testid={`leaderboard-row-${rank}`}
    >
      <div className="w-10 flex-shrink-0 flex justify-center">
        {getRankIcon(rank)}
      </div>
      
      <Avatar className="w-12 h-12">
        <AvatarImage src={entry.user.profileImageUrl || undefined} />
        <AvatarFallback className={level.bgClass}>
          {displayName.substring(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate" data-testid={`leaderboard-name-${rank}`}>
            {displayName}
          </span>
          <Badge variant="secondary" className={`${level.color} ${level.bgClass} text-xs`}>
            {level.icon}
            <span className="ml-1">{level.name}</span>
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
          <span>{entry.reviewCount} reviews</span>
          <span>{entry.helpfulVotesReceived} helpful votes</span>
        </div>
      </div>
      
      <div className="text-right">
        <div className="font-bold text-emerald-600 text-lg" data-testid={`leaderboard-points-${rank}`}>
          {entry.totalPoints.toLocaleString()}
        </div>
        <div className="text-xs text-slate-500">points</div>
      </div>
    </div>
  );
}

function BadgeCard({ badge }: { badge: BadgeType }) {
  const rarityClass = rarityColors[badge.rarity] || rarityColors.common;
  
  return (
    <div className="p-4 rounded-lg border bg-white hover:shadow-md transition-shadow" data-testid={`badge-card-${badge.code}`}>
      <div className="flex items-start gap-3">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${rarityClass}`}>
          <Sparkles className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium">{badge.name}</span>
            <Badge variant="outline" className={`text-xs capitalize ${rarityClass}`}>
              {badge.rarity}
            </Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">{badge.description}</p>
        </div>
      </div>
    </div>
  );
}

export default function Leaderboard() {
  const { data: leaderboard, isLoading: leaderboardLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/leaderboard"],
    queryFn: async () => {
      const res = await fetch("/api/leaderboard?limit=20");
      if (!res.ok) throw new Error("Failed to fetch leaderboard");
      return res.json();
    },
  });

  const { data: badges, isLoading: badgesLoading } = useQuery<BadgeType[]>({
    queryKey: ["/api/badges"],
    queryFn: async () => {
      const res = await fetch("/api/badges");
      if (!res.ok) throw new Error("Failed to fetch badges");
      return res.json();
    },
  });

  const { data: featuredReviewer } = useQuery({
    queryKey: ["/api/featured-reviewer"],
    queryFn: async () => {
      const res = await fetch("/api/featured-reviewer");
      if (!res.ok) return null;
      return res.json();
    },
  });

  const publicBadges = badges?.filter(b => !b.isSecret) || [];
  const badgesByCategory = publicBadges.reduce((acc, badge) => {
    if (!acc[badge.category]) acc[badge.category] = [];
    acc[badge.category].push(badge);
    return acc;
  }, {} as Record<string, BadgeType[]>);

  return (
    <div className="min-h-screen bg-slate-50 py-8" data-testid="page-leaderboard">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Trophy className="w-8 h-8 text-amber-500" />
            Community Leaderboard
          </h1>
          <p className="text-slate-600 mt-2">
            Recognizing our most active and helpful community members
          </p>
        </div>

        {featuredReviewer && (
          <Card className="mb-8 bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="w-16 h-16 border-2 border-amber-400">
                    <AvatarImage src={featuredReviewer.user?.profileImageUrl || undefined} />
                    <AvatarFallback className="bg-amber-100 text-amber-700">
                      {(featuredReviewer.user?.firstName || "U").substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <Crown className="w-6 h-6 text-amber-500 absolute -top-2 -right-2" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-amber-500 text-white">
                      <Star className="w-3 h-3 mr-1" />
                      Featured Reviewer of the Month
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-lg mt-1">
                    {featuredReviewer.user?.firstName} {featuredReviewer.user?.lastName}
                  </h3>
                  <p className="text-sm text-slate-600 mt-1">{featuredReviewer.reason}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="leaderboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-flex">
            <TabsTrigger value="leaderboard" data-testid="tab-leaderboard">
              <Trophy className="w-4 h-4 mr-2" />
              Leaderboard
            </TabsTrigger>
            <TabsTrigger value="badges" data-testid="tab-badges">
              <Award className="w-4 h-4 mr-2" />
              Badges
            </TabsTrigger>
            <TabsTrigger value="levels" data-testid="tab-levels">
              <Target className="w-4 h-4 mr-2" />
              Levels
            </TabsTrigger>
          </TabsList>

          <TabsContent value="leaderboard">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Top Contributors
                </CardTitle>
                <CardDescription>
                  Members ranked by total points earned through reviews and community engagement
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {leaderboardLoading ? (
                  <div className="p-4 space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <Skeleton className="w-10 h-10 rounded-full" />
                        <Skeleton className="w-12 h-12 rounded-full" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-32 mb-2" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                        <Skeleton className="h-6 w-16" />
                      </div>
                    ))}
                  </div>
                ) : leaderboard && leaderboard.length > 0 ? (
                  <div className="divide-y">
                    {leaderboard.map((entry, index) => (
                      <LeaderboardRow key={entry.userId} entry={entry} rank={index + 1} />
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-500">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No contributors yet. Be the first to earn points!</p>
                    <Link href="/search">
                      <span className="text-emerald-600 hover:underline mt-2 inline-block">
                        Write a review to get started
                      </span>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="badges">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Available Badges
                </CardTitle>
                <CardDescription>
                  Earn badges by writing reviews, helping others, and contributing to the community
                </CardDescription>
              </CardHeader>
              <CardContent>
                {badgesLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[...Array(6)].map((_, i) => (
                      <Skeleton key={i} className="h-24 rounded-lg" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-8">
                    {Object.entries(badgesByCategory).map(([category, categoryBadges]) => (
                      <div key={category}>
                        <h3 className="text-lg font-semibold capitalize mb-4 flex items-center gap-2">
                          {category === 'reviews' && <Star className="w-5 h-5 text-amber-500" />}
                          {category === 'community' && <Users className="w-5 h-5 text-blue-500" />}
                          {category === 'points' && <Flame className="w-5 h-5 text-orange-500" />}
                          {category === 'special' && <Crown className="w-5 h-5 text-purple-500" />}
                          {category} Badges
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {categoryBadges.map(badge => (
                            <BadgeCard key={badge.id} badge={badge} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="levels">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Profile Levels
                </CardTitle>
                <CardDescription>
                  Progress through levels as you earn more points
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {Object.entries(profileLevels).map(([key, level]) => {
                    const config = levelConfig[key] || levelConfig.novice;
                    const nextLevel = Object.values(profileLevels).find(l => l.minPoints > level.minPoints);
                    
                    return (
                      <div key={key} className="p-4 rounded-lg border bg-white" data-testid={`level-card-${key}`}>
                        <div className="flex items-center gap-4">
                          <div className={`w-14 h-14 rounded-full flex items-center justify-center ${config.bgClass}`}>
                            {config.icon}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className={`font-semibold text-lg ${config.color}`}>{level.name}</h3>
                              <Badge variant="outline" className="text-xs">
                                {level.minPoints.toLocaleString()}+ points
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-600 mt-1">{level.description}</p>
                            {nextLevel && (
                              <div className="mt-3">
                                <div className="flex justify-between text-xs text-slate-500 mb-1">
                                  <span>{level.minPoints.toLocaleString()} pts</span>
                                  <span>{nextLevel.minPoints.toLocaleString()} pts to next level</span>
                                </div>
                                <Progress value={0} className="h-2" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="mt-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">Ready to join the leaderboard?</h3>
                <p className="text-slate-600 mt-1">
                  Start writing reviews and helping others to earn points and badges!
                </p>
              </div>
              <Link href="/search">
                <span className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors">
                  Find a Hospital
                  <ChevronRight className="w-4 h-4" />
                </span>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
