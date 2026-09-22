import React, { useState, useEffect } from 'react';
import { 
  Trophy, TrendingUp, Flame, Dumbbell, Sparkles, 
  Calendar, Award, Activity, Search 
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, CartesianGrid } from 'recharts';
import { useUnits } from '../context/UnitContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { Card, CardHeader } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Input } from '../components/common/Input';

export const PRAnalyticsPage = () => {
  const { formatWeight, weightUnit } = useUnits();
  const toast = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [prs, setPrs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchPRs = async () => {
      setIsLoading(true);
      try {
        const data = await api.get('/workouts/prs');
        setPrs(data || []);
      } catch (_err) {
        toast.error('Failed to load Personal Records.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPRs();
  }, []);

  const filteredPRs = prs.filter((pr) =>
    pr.exercise_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Chart data: 1RM comparison for top lifts
  const chartData = prs.slice(0, 8).map((pr) => ({
    name: pr.exercise_name,
    oneRepMax: pr.estimated_1rm,
    weight: pr.max_weight,
  }));

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Personal Records & 1RM Analytics</h1>
          <p className="text-sm text-slate-400 mt-1">
            Strength milestones and automatic 1RM estimations calculated via the Epley formula: 
            <span className="font-mono text-emerald-400 ml-1">1RM = Weight × (1 + Reps / 30)</span>.
          </p>
        </div>
        <div className="w-full sm:w-64">
          <Input
            placeholder="Search exercises..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={Search}
          />
        </div>
      </div>

      {/* Top 1RM Visualization Bar Chart */}
      <Card className="p-6">
        <CardHeader
          title="Estimated 1RM Strength Overview"
          subtitle="Theoretical maximum single-rep capability by movement"
        />

        <div className="h-64 w-full mt-2">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e293b',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#f8fafc',
                  }}
                  formatter={(val) => [`${val} ${weightUnit}`, 'Estimated 1RM']}
                />
                <Bar dataKey="oneRepMax" radius={[6, 6, 0, 0]}>
                  {chartData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index === 0 ? '#10b981' : index === 1 ? '#06b6d4' : '#f59e0b'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-2xl p-6 text-center">
              <Trophy className="w-10 h-10 text-slate-600 mb-2" />
              <p className="text-sm font-semibold text-slate-300">No PR records achieved yet</p>
              <p className="text-xs text-slate-500 mt-1">
                Log completed workout sets in your sessions to generate automated 1RM records.
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Personal Records Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPRs.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-500">
            No personal records matching "{searchQuery}".
          </div>
        ) : (
          filteredPRs.map((pr) => (
            <Card key={pr.id} hoverEffect className="p-5 flex flex-col justify-between border-slate-800">
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                      <Trophy className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-100">{pr.exercise_name}</h3>
                      <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        <span>Achieved: {pr.achieved_date}</span>
                      </p>
                    </div>
                  </div>
                  <Badge variant="amber" size="xs">PR</Badge>
                </div>

                {/* Primary Metric: Estimated 1RM */}
                <div className="my-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 text-center">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                    Calculated 1RM
                  </span>
                  <div className="text-3xl font-black text-white mt-1">
                    {formatWeight(pr.estimated_1rm)}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">Single repetition maximum</p>
                </div>

                {/* Best Lifted Stats */}
                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-950/50 border border-slate-800">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Heaviest Load</p>
                    <p className="text-base font-bold text-slate-100 mt-0.5">{formatWeight(pr.max_weight)}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950/50 border border-slate-800">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Reps at Load</p>
                    <p className="text-base font-bold text-slate-100 mt-0.5">{pr.best_reps} reps</p>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
