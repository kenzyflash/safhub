
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useGamification = () => {
  const { user } = useAuth();
  const [userPoints, setUserPoints] = useState(0);
  const [userLevel, setUserLevel] = useState(1);

  useEffect(() => {
    if (user) {
      fetchUserPoints();
      
      // Listen for real-time updates
      const channel = supabase
        .channel('user-points-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_points',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('User points updated:', payload);
            if (payload.new && typeof payload.new === 'object') {
              const newData = payload.new as any;
              setUserPoints(newData.total_points || 0);
              setUserLevel(newData.level || 1);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchUserPoints = async () => {
    if (!user) return;

    try {
      const { data: pointsData, error: pointsError } = await supabase
        .from('user_points')
        .select('total_points, level')
        .eq('user_id', user.id)
        .single();
      
      if (pointsData && !pointsError) {
        setUserPoints(pointsData.total_points || 0);
        setUserLevel(pointsData.level || 1);
        return;
      }

      // If no user_points record exists, default to 0
      if (pointsError && pointsError.code === 'PGRST116') {
        setUserPoints(0);
        setUserLevel(1);
      }
    } catch (error) {
      console.error('Error fetching user points:', error);
      setUserPoints(0);
      setUserLevel(1);
    }
  };

  const awardAchievement = async (achievementName: string) => {
    if (!user) return false;

    try {

      // Award the achievement via secure RPC
      const { data: awarded, error: awardError } = await supabase
        .rpc('award_achievement', {
          user_id_param: user.id,
          achievement_name_param: achievementName
        });

      if (awardError) {
        console.error('Error awarding achievement:', awardError);
        return false;
      }

      if (!awarded) {
        return false;
      }

      // Refresh points from server
      await fetchUserPoints();

      return true;
    } catch (error) {
      console.error('Error awarding achievement:', error);
      return false;
    }
  };

  return {
    userPoints,
    userLevel,
    awardAchievement,
    refreshPoints: fetchUserPoints
  };
};
