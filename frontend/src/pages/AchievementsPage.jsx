import React, { useState, useEffect } from 'react';
import { 
  Award, Trophy, Flame, Dumbbell, Crown, Zap, 
  Sparkles, Camera, Ruler, Lock, CheckCircle2, Calendar 
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { Card, CardHeader } from '../components/common/Card';
import { Badge } from '../components/common/Badge';

export const AchievementsPage = () => {
  const toast = useToast();
  const [achievements, setAchievements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAchievements = async () => {
      setIsLoading(true);
      try {
        const data = await api.get('/achievements');
        setAchievements(data || []);
      } catch (_err) {
        toast.error('Failed to load achievements.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAchievements();
  }, []);

  const iconMap = {
    Flame,
    Dumbbell,
    Trophy,
    Crown,
    Zap,
    Sparkles,
    Camera,
    Ruler,
  };

  const unlockedCount = achievements.filter((a) => a.is_unlocked).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Badges & Achievements</h1>
          <p className="text-sm text-slate-400 mt-1">
            Unlock trophies as you compound consistency, break personal records, and log workouts.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-2 rounded-2xl">
          <Trophy className="w-5 h-5 text-amber-400" />
          <span className="text-sm font-bold text-white">
            {unlockedCount} / {achievements.length} Unlocked
          </span>
        </div>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {achievements.map((badge) => {
          const IconComponent = iconMap[badge.icon] || Award;
          const isUnlocked = badge.is_unlocked;

          return (
            <Card
              key={badge.key}
              hoverEffect={isUnlocked}
              className={`p-6 flex flex-col justify-between text-center relative overflow-hidden transition-all ${
                isUnlocked
                  ? 'border-emerald-500/30 bg-slate-900/90 shadow-glow-emerald'
                  : 'border-slate-800/80 bg-slate-950/60 opacity-60'
              }`}
            >
              {/* Status pill in corner */}
              <div className="absolute top-3 right-3">
                {isUnlocked ? (
                  <Badge variant="emerald" size="xs">Unlocked</Badge>
                ) : (
                  <Badge variant="default" size="xs">Locked</Badge>
                )}
              </div>

              {/* Badge Icon */}
              <div className="flex flex-col items-center mt-2">
                <div
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-transform ${
                    isUnlocked
                      ? 'bg-gradient-to-tr from-emerald-600 to-emerald-400 text-slate-950 shadow-glow-emerald scale-105'
                      : 'bg-slate-900 border border-slate-800 text-slate-600'
                  }`}
                >
                  {isUnlocked ? (
                    <IconComponent className="w-8 h-8 font-black" />
                  ) : (
                    <Lock className="w-6 h-6 text-slate-600" />
                  )}
                </div>

                <h3 className="text-base font-bold text-white mb-1">{badge.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed max-w-xs">
                  {badge.description}
                </p>
              </div>

              {/* Unlock Date Footer */}
              <div className="mt-6 pt-4 border-t border-slate-800/80 text-[11px] text-slate-500">
                {isUnlocked ? (
                  <span className="text-emerald-400 flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Unlocked: {badge.unlocked_at?.slice(0, 10)}</span>
                  </span>
                ) : (
                  <span>Locked milestone</span>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
