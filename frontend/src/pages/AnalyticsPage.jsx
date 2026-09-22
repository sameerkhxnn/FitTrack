import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Scale, Dumbbell, Activity, Utensils, 
  TrendingUp, Calendar, Trophy, ChevronRight, Zap 
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line, 
  XAxis, YAxis, Tooltip, CartesianGrid, Legend 
} from 'recharts';
import { useUnits } from '../context/UnitContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { Card, CardHeader } from '../components/common/Card';
import { Badge } from '../components/common/Badge';

export const AnalyticsPage = () => {
  const { formatWeight, weightUnit, lengthUnit } = useUnits();
  const toast = useToast();

  const [timeframe, setTimeframe] = useState('30d');
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true);
      try {
        const res = await api.get('/analytics/dashboard', { timeframe });
        setData(res);
      } catch (_err) {
        toast.error('Failed to load analytics dashboard.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [timeframe]);

  const timeframes = [
    { key: '7d', label: '7 Days' },
    { key: '30d', label: '30 Days' },
    { key: '90d', label: '3 Months' },
    { key: '180d', label: '6 Months' },
    { key: '365d', label: '1 Year' },
    { key: 'all', label: 'All Time' },
  ];

  const tooltipStyle = {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
    borderRadius: '12px',
    fontSize: '12px',
    color: '#f8fafc',
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header and Timeframe Picker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Advanced Analytics & Performance</h1>
          <p className="text-sm text-slate-400 mt-1">
            Deep cross-domain correlations across weight, strength volume, body circumference, and nutrition.
          </p>
        </div>

        {/* Timeframe pill selector */}
        <div className="inline-flex p-1 rounded-2xl bg-slate-900 border border-slate-800 self-start sm:self-auto overflow-x-auto">
          {timeframes.map((tf) => (
            <button
              key={tf.key}
              onClick={() => setTimeframe(tf.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                timeframe === tf.key
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-glow-emerald'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* Aggregate Overview Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card hoverEffect className="p-4">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">Total Sessions</span>
            <Dumbbell className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-white">{data?.total_workouts || 0}</p>
          <p className="text-[11px] text-slate-500 mt-1">Completed workouts in timeframe</p>
        </Card>

        <Card hoverEffect className="p-4">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">Volume Moved</span>
            <Zap className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-black text-cyan-400">
            {formatWeight(data?.total_volume_lifted || 0)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Cumulative session tonnage</p>
        </Card>

        <Card hoverEffect className="p-4">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">Calories Expended</span>
            <Activity className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-400">
            {data?.total_calories_burned || 0}{' '}
            <span className="text-xs font-normal text-slate-400">kcal</span>
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Workout energy expenditure</p>
        </Card>

        <Card hoverEffect className="p-4">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">Personal Records</span>
            <Trophy className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400">{data?.prs?.length || 0}</p>
          <p className="text-[11px] text-slate-500 mt-1">Lifetime 1RM milestones</p>
        </Card>
      </div>

      {/* Row 1: Weight Trend & Workout Volume Progression */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weight Trend Chart */}
        <Card className="p-6">
          <CardHeader
            title="Weight Trend & Goal Progress"
            subtitle="Recorded body mass over the selected period"
          />
          <div className="h-64 w-full mt-2">
            {data?.weight_history?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.weight_history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="analyticsWeightGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} domain={['dataMin - 1', 'dataMax + 1']} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(val) => [`${val} ${weightUnit}`, 'Weight']} />
                  <Area type="monotone" dataKey="weight" stroke="#10b981" strokeWidth={3} fill="url(#analyticsWeightGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No weight records in this timeframe.
              </div>
            )}
          </div>
        </Card>

        {/* Workout Volume Progression */}
        <Card className="p-6">
          <CardHeader
            title="Workout Volume Progression"
            subtitle="Total kg lifted per session"
          />
          <div className="h-64 w-full mt-2">
            {data?.workout_history?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.workout_history} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(val) => [`${val} ${weightUnit}`, 'Volume']} />
                  <Bar dataKey="total_volume" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No workout sessions logged in this timeframe.
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Row 2: Body Measurements & Nutrition Consistency */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Circumference Evolution */}
        <Card className="p-6">
          <CardHeader
            title="Circumference Progression"
            subtitle="Key anatomical sites evolution"
          />
          <div className="h-64 w-full mt-2">
            {data?.measurement_history?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.measurement_history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Line type="monotone" dataKey="waist" stroke="#10b981" strokeWidth={2} name="Waist" connectNulls />
                  <Line type="monotone" dataKey="chest" stroke="#06b6d4" strokeWidth={2} name="Chest" connectNulls />
                  <Line type="monotone" dataKey="arms" stroke="#f59e0b" strokeWidth={2} name="Arms" connectNulls />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No body measurements recorded in this timeframe.
              </div>
            )}
          </div>
        </Card>

        {/* Nutrition Calorie Consistency */}
        <Card className="p-6">
          <CardHeader
            title="Nutrition & Macro Adherence"
            subtitle="Daily caloric intake across time"
          />
          <div className="h-64 w-full mt-2">
            {data?.nutrition_history?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.nutrition_history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(val) => [`${val} kcal`, 'Calories']} />
                  <Bar dataKey="calories" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No nutrition logs in this timeframe.
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
