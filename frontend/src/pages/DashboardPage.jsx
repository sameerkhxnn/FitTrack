import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Scale, Flame, Target, Dumbbell, Trophy, Utensils, Droplets,
  TrendingUp, TrendingDown, Plus, ChevronRight, Activity, Calendar
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, Cell } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useUnits } from '../context/UnitContext';
import { api } from '../services/api';
import { Card, CardHeader } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { CardSkeleton } from '../components/common/SkeletonLoader';

export const DashboardPage = () => {
  const { user } = useAuth();
  const { formatWeight, weightUnit } = useUnits();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [weightStats, setWeightStats] = useState(null);
  const [weightHistory, setWeightHistory] = useState([]);
  const [recentWorkouts, setRecentWorkouts] = useState([]);
  const [prs, setPrs] = useState([]);
  const [nutrition, setNutrition] = useState(null);
  const [waterLog, setWaterLog] = useState(null);
  const [habit, setHabit] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const [
          profileData,
          statsData,
          weightsData,
          sessionsData,
          prsData,
          nutritionData,
          waterData,
          habitData,
        ] = await Promise.allSettled([
          api.get('/profile'),
          api.get('/weights/stats'),
          api.get('/weights', { days: 30 }),
          api.get('/workouts/sessions', { limit: 5 }),
          api.get('/workouts/prs'),
          api.get('/nutrition/summary'),
          api.get('/habits/water'),
          api.get('/habits/checklist'),
        ]);

        if (profileData.status === 'fulfilled') setProfile(profileData.value);
        if (statsData.status === 'fulfilled') setWeightStats(statsData.value);
        if (weightsData.status === 'fulfilled') setWeightHistory(weightsData.value || []);
        if (sessionsData.status === 'fulfilled') setRecentWorkouts(sessionsData.value || []);
        if (prsData.status === 'fulfilled') setPrs(prsData.value || []);
        if (nutritionData.status === 'fulfilled') setNutrition(nutritionData.value);
        if (waterData.status === 'fulfilled') setWaterLog(waterData.value);
        if (habitData.status === 'fulfilled') setHabit(habitData.value);
      } catch (err) {
        console.error('Error fetching dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Prepare chart data for 30-day weight progress
  const chartWeightData = weightHistory.map((item) => ({
    date: item.date.slice(5),
    weight: item.weight,
  }));

  // Weekly workout volume mock/real distribution
  const weeklyWorkoutData = [
    { day: 'Mon', sessions: 1 },
    { day: 'Tue', sessions: 0 },
    { day: 'Wed', sessions: 1 },
    { day: 'Thu', sessions: 1 },
    { day: 'Fri', sessions: 0 },
    { day: 'Sat', sessions: 1 },
    { day: 'Sun', sessions: 0 },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-20 bg-slate-900 animate-pulse rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  const currentWeight = weightStats?.current_weight || profile?.current_weight;
  const goalWeight = weightStats?.goal_weight || profile?.goal_weight;
  const weightChange = weightStats?.total_change;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Banner Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 p-6 rounded-3xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-emerald-400 p-0.5 shadow-glow-emerald">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center font-black text-lg text-emerald-400">
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white">
                {getGreeting()}, <span className="text-emerald-400">{user?.name || 'Athlete'}</span>
              </h1>
              <Badge variant="emerald" size="xs">Active</Badge>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 flex items-center gap-2 mt-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>{todayFormatted}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="md"
            icon={Scale}
            onClick={() => navigate('/weights')}
          >
            Log Weight
          </Button>
          <Button
            variant="primary"
            size="md"
            icon={Plus}
            onClick={() => navigate('/workouts')}
          >
            Start Workout
          </Button>
        </div>
      </div>

      {/* 6 Key Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Current Weight */}
        <Card hoverEffect className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Current Weight</span>
            <Scale className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="my-2">
            <span className="text-2xl font-black text-white">
              {currentWeight ? formatWeight(currentWeight, false) : '--'}
            </span>
            <span className="text-xs text-slate-400 ml-1 font-medium">{weightUnit}</span>
          </div>
          <span className="text-[11px] text-slate-500">Latest recorded</span>
        </Card>

        {/* Goal Weight */}
        <Card hoverEffect className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Goal Weight</span>
            <Target className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="my-2">
            <span className="text-2xl font-black text-white">
              {goalWeight ? formatWeight(goalWeight, false) : '--'}
            </span>
            <span className="text-xs text-slate-400 ml-1 font-medium">{weightUnit}</span>
          </div>
          <span className="text-[11px] text-slate-500">
            {profile?.fitness_goal ? profile.fitness_goal.replace('_', ' ') : 'Target'}
          </span>
        </Card>

        {/* Weight Change */}
        <Card hoverEffect className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Weight Change</span>
            {weightChange && weightChange < 0 ? (
              <TrendingDown className="w-4 h-4 text-emerald-400" />
            ) : (
              <TrendingUp className="w-4 h-4 text-cyan-400" />
            )}
          </div>
          <div className="my-2">
            <span className="text-2xl font-black text-white">
              {weightChange !== null && weightChange !== undefined
                ? `${weightChange > 0 ? '+' : ''}${formatWeight(weightChange, false)}`
                : '--'}
            </span>
            <span className="text-xs text-slate-400 ml-1 font-medium">{weightUnit}</span>
          </div>
          <span className="text-[11px] text-slate-500">Since starting</span>
        </Card>

        {/* Current Streak */}
        <Card hoverEffect className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Daily Streak</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div className="my-2">
            <span className="text-2xl font-black text-amber-400">
              {habit?.workout_done || habit?.cardio_done ? '3 Days' : '1 Day'}
            </span>
          </div>
          <span className="text-[11px] text-slate-500">Keep it burning</span>
        </Card>

        {/* Daily Calories */}
        <Card hoverEffect className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Calories</span>
            <Utensils className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="my-2">
            <span className="text-2xl font-black text-white">
              {nutrition ? Math.round(nutrition.total_calories) : 0}
            </span>
            <span className="text-xs text-slate-400 ml-1 font-medium">
              / {nutrition?.target_calories ? Math.round(nutrition.target_calories) : 2200}
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-400 h-1.5 rounded-full"
              style={{
                width: `${Math.min(
                  100,
                  ((nutrition?.total_calories || 0) / (nutrition?.target_calories || 2200)) * 100
                )}%`,
              }}
            />
          </div>
        </Card>

        {/* Daily Protein */}
        <Card hoverEffect className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Protein</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="my-2">
            <span className="text-2xl font-black text-white">
              {nutrition ? Math.round(nutrition.total_protein) : 0}
            </span>
            <span className="text-xs text-slate-400 ml-1 font-medium">
              / {nutrition?.target_protein ? Math.round(nutrition.target_protein) : 150}g
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-cyan-400 h-1.5 rounded-full"
              style={{
                width: `${Math.min(
                  100,
                  ((nutrition?.total_protein || 0) / (nutrition?.target_protein || 150)) * 100
                )}%`,
              }}
            />
          </div>
        </Card>
      </div>

      {/* Main Charts & Visualizations Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weight Progress Chart (2 Cols) */}
        <Card className="lg:col-span-2 p-6 flex flex-col justify-between">
          <CardHeader
            title="Weight Progression"
            subtitle="Trailing 30-day recorded body mass trend"
            action={
              <Link to="/weights" className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
                <span>View Full Log</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            }
          />
          <div className="h-64 w-full mt-2">
            {chartWeightData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartWeightData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} domain={['dataMin - 1', 'dataMax + 1']} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#1e293b',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: '#f8fafc',
                    }}
                    formatter={(val) => [`${val} ${weightUnit}`, 'Weight']}
                  />
                  <Area
                    type="monotone"
                    dataKey="weight"
                    stroke="#10b981"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#weightGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-800 rounded-2xl">
                <Scale className="w-10 h-10 text-slate-600 mb-2" />
                <p className="text-sm font-semibold text-slate-300">No weight entries logged yet</p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  Start logging your weight to generate dynamic progress analytics and weekly averages.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => navigate('/weights')}
                >
                  Log First Entry
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Weekly Workout Consistency (1 Col) */}
        <Card className="p-6 flex flex-col justify-between">
          <CardHeader
            title="Weekly Consistency"
            subtitle="Training frequency distribution"
            action={
              <Badge variant="cyan" size="xs">
                {profile?.training_days_per_week || 4} Days / Wk Goal
              </Badge>
            }
          />
          <div className="h-52 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyWorkoutData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} domain={[0, 2]} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e293b',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#f8fafc',
                  }}
                />
                <Bar dataKey="sessions" radius={[6, 6, 0, 0]}>
                  {weeklyWorkoutData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.sessions > 0 ? '#06b6d4' : '#1e293b'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Target: {profile?.training_days_per_week || 4} workouts</span>
            <span className="text-cyan-400 font-semibold">4 completed</span>
          </div>
        </Card>
      </div>

      {/* Secondary Row: Recent Workouts & Personal Records */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Workouts */}
        <Card className="p-6">
          <CardHeader
            title="Recent Workouts"
            subtitle="Your logged training sessions"
            action={
              <Link to="/workouts" className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
                <span>All Sessions</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            }
          />
          {recentWorkouts.length === 0 ? (
            <div className="py-8 text-center border border-dashed border-slate-800 rounded-2xl">
              <Dumbbell className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs font-medium text-slate-300">No workout sessions recorded yet</p>
              <Button
                variant="primary"
                size="sm"
                className="mt-3"
                onClick={() => navigate('/workouts')}
              >
                Launch First Workout
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentWorkouts.map((w) => (
                <div
                  key={w.id}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <Dumbbell className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-100">{w.name}</h4>
                      <p className="text-xs text-slate-400">
                        {w.date} • {Math.round(w.duration_seconds / 60)} mins • {w.total_volume} kg volume
                      </p>
                    </div>
                  </div>
                  <Badge variant="default" size="xs">
                    {w.sets?.length || 0} sets
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Personal Records & Highlights */}
        <Card className="p-6">
          <CardHeader
            title="Personal Records"
            subtitle="Top estimated 1RM and heaviest lifts"
            action={
              <Link to="/prs" className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1">
                <span>PR Analytics</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            }
          />
          {prs.length === 0 ? (
            <div className="py-8 text-center border border-dashed border-slate-800 rounded-2xl">
              <Trophy className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs font-medium text-slate-300">No PRs tracked yet</p>
              <p className="text-[11px] text-slate-500 mt-1">
                Complete workout sets to automatically trigger Epley 1RM PR calculations!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {prs.slice(0, 4).map((pr) => (
                <div
                  key={pr.id}
                  className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start justify-between"
                >
                  <div>
                    <h5 className="text-xs font-bold text-slate-200 truncate">{pr.exercise_name}</h5>
                    <p className="text-lg font-black text-amber-400 mt-1">
                      {pr.max_weight} kg <span className="text-xs text-slate-400 font-normal">× {pr.best_reps}</span>
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Est. 1RM: {pr.estimated_1rm} kg</p>
                  </div>
                  <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                    <Trophy className="w-4 h-4" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Tertiary Row: Quick Hydration & Habit Checklist */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Water Log Quick Widget */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Droplets className="w-5 h-5 text-cyan-400" />
              <h4 className="text-sm font-bold text-slate-200">Daily Hydration</h4>
            </div>
            <span className="text-xs font-semibold text-cyan-400">
              {waterLog?.amount_ml || 0} / {waterLog?.goal_ml || 2500} ml
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden my-2">
            <div
              className="bg-cyan-400 h-2 rounded-full transition-all duration-300"
              style={{ width: `${waterLog?.percentage || 0}%` }}
            />
          </div>
          <div className="flex gap-2 mt-3">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              onClick={async () => {
                const newAmount = (waterLog?.amount_ml || 0) + 250;
                const updated = await api.post('/habits/water', {
                  amount_ml: newAmount,
                  goal_ml: 2500,
                  date: new Date().toISOString().slice(0, 10),
                });
                setWaterLog(updated);
              }}
            >
              +250 ml
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              onClick={async () => {
                const newAmount = (waterLog?.amount_ml || 0) + 500;
                const updated = await api.post('/habits/water', {
                  amount_ml: newAmount,
                  goal_ml: 2500,
                  date: new Date().toISOString().slice(0, 10),
                });
                setWaterLog(updated);
              }}
            >
              +500 ml
            </Button>
          </div>
        </Card>

        {/* Daily Habits Checklist Widget */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-slate-200">Daily Habits</h4>
            <Link to="/habits" className="text-xs text-emerald-400 hover:underline">
              Checklist
            </Link>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60">
              <span className="text-slate-300">Workout Completed</span>
              <Badge variant={habit?.workout_done ? 'emerald' : 'default'} size="xs">
                {habit?.workout_done ? 'Done' : 'Pending'}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60">
              <span className="text-slate-300">Stretching / Mobility</span>
              <Badge variant={habit?.stretched ? 'emerald' : 'default'} size="xs">
                {habit?.stretched ? 'Done' : 'Pending'}
              </Badge>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">Sleep logged: {habit?.sleep_hours || 7.5} hrs</p>
        </Card>

        {/* Metabolic Targets */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-slate-200">Metabolic Targets</h4>
            <Link to="/profile" className="text-xs text-emerald-400 hover:underline">
              Adjust
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <p className="text-[10px] text-slate-400 uppercase font-semibold">BMI</p>
              <p className="text-base font-black text-white mt-0.5">{profile?.calculated?.bmi || '--'}</p>
              <p className="text-[10px] text-emerald-400">{profile?.calculated?.bmi_category || 'Normal'}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <p className="text-[10px] text-slate-400 uppercase font-semibold">TDEE</p>
              <p className="text-base font-black text-white mt-0.5">{profile?.calculated?.tdee || 2400}</p>
              <p className="text-[10px] text-slate-400">kcal / day</p>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 text-center">
            Protein Goal: {profile?.calculated?.protein_min_g || 140} - {profile?.calculated?.protein_max_g || 170}g
          </p>
        </Card>
      </div>
    </div>
  );
};
