import React, { useState, useEffect } from 'react';
import { 
  Milestone, Trophy, Scale, Dumbbell, Award, 
  Crown, Sparkles, Compass, TrendingDown, TrendingUp, Calendar 
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';

export const JourneyTimelinePage = () => {
  const toast = useToast();
  const [timeline, setTimeline] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTimeline = async () => {
      setIsLoading(true);
      try {
        const data = await api.get('/achievements/timeline');
        setTimeline(data || []);
      } catch (_err) {
        toast.error('Failed to load journey timeline.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTimeline();
  }, []);

  const iconMap = {
    Compass,
    Scale,
    Trophy,
    Dumbbell,
    Award,
    Crown,
    TrendingDown,
    TrendingUp,
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">My Fitness Journey</h1>
        <p className="text-sm text-slate-400 mt-1">
          A living, chronological milestone storyline of your workouts, weight transformations, and personal records.
        </p>
      </div>

      {/* Timeline Stream */}
      <div className="relative pl-6 sm:pl-8 border-l-2 border-emerald-500/30 space-y-8 max-w-3xl mx-auto my-6">
        {timeline.length === 0 ? (
          <Card className="p-8 text-center border-dashed border-slate-800">
            <Compass className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-300">Journey begins with your first log</p>
            <p className="text-xs text-slate-500 mt-1">
              Start by logging your baseline weight or completing a workout routine!
            </p>
          </Card>
        ) : (
          timeline.map((item, idx) => {
            const IconComponent = iconMap[item.icon] || Award;
            return (
              <div key={idx} className="relative group">
                {/* Node icon marker */}
                <div className="absolute -left-[37px] sm:-left-[45px] top-1.5 w-8 h-8 rounded-full bg-slate-950 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 shadow-glow-emerald group-hover:scale-110 transition-transform">
                  <IconComponent className="w-4 h-4" />
                </div>

                {/* Milestone Card */}
                <Card hoverEffect className="p-5 border-slate-800 bg-slate-900/90 shadow-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                    <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>{item.date}</span>
                    </span>
                    <Badge variant="default" size="xs" className="self-start sm:self-auto capitalize">
                      {item.type.replace(/_/g, ' ')}
                    </Badge>
                  </div>

                  <h3 className="text-base font-bold text-white mt-1">{item.title}</h3>
                  <p className="text-xs text-slate-400 mt-1">{item.detail}</p>
                </Card>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
