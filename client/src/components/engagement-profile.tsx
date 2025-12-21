import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { 
  Trophy, Award, Star, Crown, Flame, TrendingUp, Gift,
  Users, ChevronRight, Sparkles, Target, ThumbsUp
} from "lucide-react";
import { profileLevels } from "@shared/schema";

type Badge = {
  id: number;
  code: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  rarity: string;
};

type UserBadgeWithBadge = {
  id: number;
  userId: string;
  badgeId: number;
  earnedAt: string;
  badge: Badge;
};

type PointTransaction = {
  id: number;
  userId: string;
  points: number;
  action: string;
  description: string | null;
  createdAt: string;
};

type UserPoints = {
  userId: string;
  totalPoints: number;
  currentLevel: string;
  reviewCount: number;
  helpfulVotesReceived: number;
  helpfulVotesGiven: number;
  referralCount: number;
};

type EngagementProfile = {
  points: UserPoints | null;
  badges: UserBadgeWithBadge[];
  recentTransactions: PointTransaction[];
  rank: number;
  isFeatured: boolean;
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

function getNextLevel(currentLevel: string) {
  const levels = Object.keys(profileLevels);
  const currentIndex = levels.indexOf(currentLevel);
  if (currentIndex >= levels.length - 1) return null;
  return levels[currentIndex + 1] as keyof typeof profileLevels;
}

function getProgressToNextLevel(points: number, currentLevel: string) {
  const nextLevelKey = getNextLevel(currentLevel);
  if (!nextLevelKey) return { progress: 100, pointsNeeded: 0 };
  
  const currentLevelConfig = profileLevels[currentLevel as keyof typeof profileLevels];
  const nextLevelConfig = profileLevels[nextLevelKey];
  
  const pointsInCurrentLevel = points - currentLevelConfig.minPoints;
  const pointsForNextLevel = nextLevelConfig.minPoints - currentLevelConfig.minPoints;
  const progress = Math.min(100, (pointsInCurrentLevel / pointsForNextLevel) * 100);
  const pointsNeeded = nextLevelConfig.minPoints - points;
  
  return { progress, pointsNeeded, nextLevel: nextLevelConfig.name };
}

export function EngagementProfileCard() {
  const { data: profile, isLoading } = useQuery<EngagementProfile>({
    queryKey: ["/api/engagement/profile"],
    queryFn: async () => {
      const res = await fetch("/api/engagement/profile", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch engagement profile");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Your Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="grid grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!profile) return null;

  const points = profile.points;
  const level = points ? levelConfig[points.currentLevel] || levelConfig.novice : levelConfig.novice;
  const progressInfo = points ? getProgressToNextLevel(points.totalPoints, points.currentLevel) : null;

  return (
    <Card data-testid="engagement-profile-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            Your Progress
          </CardTitle>
          {profile.isFeatured && (
            <Badge className="bg-amber-500 text-white">
              <Crown className="w-3 h-3 mr-1" />
              Featured Reviewer
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${level.bgClass}`}>
            {level.icon}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className={`font-semibold text-lg ${level.color}`}>{level.name}</span>
              {profile.rank > 0 && (
                <Badge variant="outline" className="text-xs">
                  Rank #{profile.rank}
                </Badge>
              )}
            </div>
            <div className="text-2xl font-bold text-emerald-600" data-testid="total-points">
              {(points?.totalPoints || 0).toLocaleString()} points
            </div>
          </div>
        </div>

        {progressInfo && progressInfo.progress < 100 && (
          <div>
            <div className="flex justify-between text-sm text-slate-500 mb-2">
              <span>Progress to {progressInfo.nextLevel}</span>
              <span>{progressInfo.pointsNeeded} points needed</span>
            </div>
            <Progress value={progressInfo.progress} className="h-2" />
          </div>
        )}

        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 rounded-lg bg-slate-50" data-testid="stat-reviews">
            <div className="text-2xl font-bold text-slate-700">{points?.reviewCount || 0}</div>
            <div className="text-xs text-slate-500">Reviews</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-50" data-testid="stat-helpful-received">
            <div className="text-2xl font-bold text-slate-700">{points?.helpfulVotesReceived || 0}</div>
            <div className="text-xs text-slate-500">Helpful Votes</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-50" data-testid="stat-referrals">
            <div className="text-2xl font-bold text-slate-700">{points?.referralCount || 0}</div>
            <div className="text-xs text-slate-500">Referrals</div>
          </div>
        </div>

        {profile.badges.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
              <Award className="w-4 h-4" />
              Your Badges ({profile.badges.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {profile.badges.slice(0, 6).map((ub) => (
                <Badge 
                  key={ub.id} 
                  variant="secondary" 
                  className={`${rarityColors[ub.badge.rarity] || rarityColors.common}`}
                  data-testid={`badge-${ub.badge.code}`}
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  {ub.badge.name}
                </Badge>
              ))}
              {profile.badges.length > 6 && (
                <Badge variant="outline" className="text-xs">
                  +{profile.badges.length - 6} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {profile.recentTransactions.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
              <Flame className="w-4 h-4" />
              Recent Activity
            </h4>
            <div className="space-y-2">
              {profile.recentTransactions.slice(0, 3).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">{tx.description || tx.action}</span>
                  <span className="font-medium text-emerald-600">+{tx.points}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <Link href="/leaderboard">
          <span className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 transition-colors cursor-pointer" data-testid="link-leaderboard">
            <div className="flex items-center gap-2 text-emerald-700">
              <Users className="w-4 h-4" />
              <span className="font-medium">View Leaderboard</span>
            </div>
            <ChevronRight className="w-4 h-4 text-emerald-600" />
          </span>
        </Link>
      </CardContent>
    </Card>
  );
}

export function ReferralCard() {
  const { data: codeData, isLoading } = useQuery<{ code: string }>({
    queryKey: ["/api/referral/code"],
    queryFn: async () => {
      const res = await fetch("/api/referral/code", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch referral code");
      return res.json();
    },
  });

  const copyToClipboard = () => {
    if (codeData?.code) {
      navigator.clipboard.writeText(`${window.location.origin}?ref=${codeData.code}`);
    }
  };

  return (
    <Card data-testid="referral-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="w-5 h-5 text-purple-500" />
          Invite Friends
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-slate-600 mb-4">
          Share your referral link and earn 50 points for each friend who joins and writes a review!
        </p>
        {isLoading ? (
          <Skeleton className="h-10 w-full" />
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={codeData?.code ? `${window.location.origin}?ref=${codeData.code}` : ""}
              className="flex-1 px-3 py-2 text-sm bg-slate-50 border rounded-lg truncate"
              data-testid="referral-input"
            />
            <button
              onClick={copyToClipboard}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm"
              data-testid="button-copy-referral"
            >
              Copy
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function AchievementNotifications() {
  const { data: notifications, refetch } = useQuery<any[]>({
    queryKey: ["/api/notifications/achievements"],
    queryFn: async () => {
      const res = await fetch("/api/notifications/achievements", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const markAsRead = async (id: number) => {
    await fetch(`/api/notifications/achievements/${id}/read`, {
      method: "POST",
      credentials: "include",
    });
    refetch();
  };

  if (!notifications || notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.slice(0, 3).map((notification) => (
        <div
          key={notification.id}
          className="bg-white border border-emerald-200 shadow-lg rounded-lg p-4 animate-in slide-in-from-right"
          data-testid={`notification-${notification.id}`}
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
              {notification.type === "badge_earned" ? (
                <Award className="w-5 h-5 text-emerald-600" />
              ) : notification.type === "level_up" ? (
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              ) : (
                <Sparkles className="w-5 h-5 text-emerald-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-slate-900">{notification.title}</h4>
              <p className="text-sm text-slate-600 mt-1">{notification.message}</p>
            </div>
            <button
              onClick={() => markAsRead(notification.id)}
              className="text-slate-400 hover:text-slate-600 text-sm"
              data-testid={`dismiss-notification-${notification.id}`}
            >
              Dismiss
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
