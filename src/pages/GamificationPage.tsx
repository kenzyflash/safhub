import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import AchievementCard from "@/components/gamification/AchievementCard";
import UserProgress from "@/components/gamification/UserProgress";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Trophy, Award } from "lucide-react";

interface Achievement { id: string; name: string; description: string; icon: string; points: number; category: string; created_at: string; }
interface EarnedAchievement extends Achievement { earned_at: string; }
interface UserStats { totalPoints: number; level: number; achievementCount: number; }

const GamificationPage = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<EarnedAchievement[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({ totalPoints: 0, level: 1, achievementCount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (user) fetchData(); }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: allAchievements, error: achievementsError } = await supabase.from('achievements').select('*').order('category', { ascending: true });
      if (!achievementsError && allAchievements) setAchievements(allAchievements); else setAchievements([]);
      const { data: userAchievementData, error: userAchievementsError } = await supabase.from('user_achievements').select('earned_at, achievement_id').eq('user_id', user?.id);
      if (!userAchievementsError && userAchievementData && allAchievements) {
        const earnedAchievements = userAchievementData.map((userAch) => { const achievement = allAchievements.find((ach) => ach.id === userAch.achievement_id); return achievement ? { ...achievement, earned_at: userAch.earned_at } : null; }).filter((item): item is EarnedAchievement => item !== null);
        setUserAchievements(earnedAchievements);
      } else setUserAchievements([]);
      const { data: userPoints, error: pointsError } = await supabase.from('user_points').select('*').eq('user_id', user?.id).single();
      if (!pointsError && userPoints) { setUserStats({ totalPoints: userPoints.total_points || 0, level: userPoints.level || 1, achievementCount: userAchievements.length }); }
      else { await supabase.from('user_points').insert({ user_id: user?.id, total_points: 0, level: 1 }); setUserStats({ totalPoints: 0, level: 1, achievementCount: 0 }); }
    } catch (error) { console.error('Error:', error); setAchievements([]); setUserAchievements([]); setUserStats({ totalPoints: 0, level: 1, achievementCount: 0 }); } finally { setLoading(false); }
  };

  const isAchievementEarned = (achievementId: string) => userAchievements.some(ua => ua.id === achievementId);
  const getAchievementsByCategory = (category: string) => achievements.filter(a => a.category === category);

  if (loading) {
    return (<div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50"><DashboardHeader title="EdHub - Achievements" /><div className="container mx-auto px-4 py-8"><div className="text-center">{t('gamification.loadingAchievements')}</div></div></div>);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50">
      <DashboardHeader title="EdHub - Achievements" />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{t('gamification.yourAchievements')}</h1>
          <p className="text-gray-600">{t('gamification.trackProgress')}</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <div className="lg:col-span-1"><UserProgress totalPoints={userStats.totalPoints} level={userStats.level} achievements={userStats.achievementCount} /></div>
          <div className="lg:col-span-3">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader><CardTitle className="flex items-center gap-2"><Award className="h-5 w-5 text-emerald-600" />{t('gamification.recentAchievements')}</CardTitle><CardDescription>{t('gamification.latestAccomplishments')}</CardDescription></CardHeader>
              <CardContent>
                {userAchievements.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{userAchievements.slice(0, 4).map((achievement) => (<AchievementCard key={achievement.id} achievement={achievement} isEarned={true} />))}</div>
                ) : (<div className="text-center py-8 text-gray-500"><Trophy className="h-12 w-12 mx-auto mb-3 text-gray-300" /><p>{t('gamification.noAchievements')}</p></div>)}
              </CardContent>
            </Card>
          </div>
        </div>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">{t('gamification.all')}</TabsTrigger>
            <TabsTrigger value="milestone">{t('gamification.milestones')}</TabsTrigger>
            <TabsTrigger value="learning">{t('gamification.learning')}</TabsTrigger>
            <TabsTrigger value="consistency">{t('gamification.consistency')}</TabsTrigger>
            <TabsTrigger value="community">{t('gamification.community')}</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-6"><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{achievements.map((achievement) => (<AchievementCard key={achievement.id} achievement={achievement} isEarned={isAchievementEarned(achievement.id)} />))}</div></TabsContent>
          {['milestone', 'learning', 'consistency', 'community'].map((category) => (
            <TabsContent key={category} value={category} className="mt-6"><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{getAchievementsByCategory(category).map((achievement) => (<AchievementCard key={achievement.id} achievement={achievement} isEarned={isAchievementEarned(achievement.id)} />))}</div></TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
};

export default GamificationPage;
