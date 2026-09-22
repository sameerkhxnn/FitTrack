import React, { useState, useEffect } from 'react';
import {
  Users, Dumbbell, Scale, Utensils, Camera, Trophy,
  UserPlus, ShieldCheck, Activity, TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import { adminApi } from '../../services/adminApi';
import { useToast } from '../../context/ToastContext';
import { Card, CardHeader } from '../../components/common/Card';

// ── Stat card ──────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, icon: Icon, color = 'emerald' }) => {
  const clr = {
    emerald: { ring: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    cyan:    { ring: 'text-cyan-400',    bg: 'bg-cyan-500/10    border-cyan-500/20'    },
    amber:   { ring: 'text-amber-400',   bg: 'bg-amber-500/10   border-amber-500/20'   },
    rose:    { ring: 'text-rose-400',    bg: 'bg-rose-500/10    border-rose-500/20'    },
    violet:  { ring: 'text-violet-400',  bg: 'bg-violet-500/10  border-violet-500/20'  },
  }[color];

  return (
    <Card hoverEffect className="p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400">{label}</span>
        <div className={`w-8 h-8 rounded-xl ${clr.bg} border flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${clr.ring}`} />
        </div>
      </div>
      <p className="text-3xl font-black text-white">{value ?? <Skeleton />}</p>
      {sub && <p className="text-[11px] text-slate-500">{sub}</p>}
    </Card>
  );
};

const Skeleton = () => (
  <span className="inline-block w-16 h-7 bg-slate-800 rounded animate-pulse" />
);

const tooltipStyle = {
  backgroundColor: '#0f172a',
  borderColor: '#1e293b',
  borderRadius: '12px',
  fontSize: '12px',
  color: '#f8fafc',
};

// ── Page ───────────────────────────────────────────────────────────────────
export const AdminOverviewPage = () => {
  const toast = useToast();

  const [stats,    setStats]    = useState(null);
  const [growth,   setGrowth]   = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [growthDays, setGrowthDays] = useState(30);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [s, g, a] = await Promise.all([
          adminApi.getStats(),
          adminApi.getGrowth(growthDays),
          adminApi.getActivity(14),
        ]);
        setStats(s);
        setGrowth(g.data ?? []);
        setActivity(a.data ?? []);
      } catch (_err) {
        toast.error('Failed to load admin statistics.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [growthDays]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">
          Platform Overview
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Real-time aggregate metrics across all FitTrack users and their data.
        </p>
      </div>

      {/* Primary stat grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Users"    value={stats?.total_users}        icon={Users}      color="emerald" sub={`${stats?.active_users ?? '–'} active`} />
        <StatCard label="New Today"      value={stats?.new_users_today}    icon={UserPlus}   color="cyan"    sub={`${stats?.new_users_this_week ?? '–'} this week`} />
        <StatCard label="Admins"         value={stats?.admin_users}        icon={ShieldCheck}color="rose"    />
        <StatCard label="Total Workouts" value={stats?.total_workouts}     icon={Dumbbell}   color="emerald" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Weight Entries" value={stats?.total_weight_entries} icon={Scale}   color="cyan"    />
        <StatCard label="Nutrition Logs" value={stats?.total_nutrition_logs} icon={Utensils}color="amber"   />
        <StatCard label="Progress Photos"value={stats?.total_photos}         icon={Camera}  color="violet"  />
        <StatCard label="Personal Records"value={stats?.total_prs}          icon={Trophy}  color="amber"   />
      </div>

      {/* Growth chart */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <CardHeader
            title="User Registration Growth"
            subtitle="New signups and cumulative user base"
            className="mb-0"
          />
          <div className="inline-flex p-1 rounded-xl bg-slate-950 border border-slate-800 self-start">
            {[14, 30, 90].map(d => (
              <button
                key={d}
                onClick={() => setGrowthDays(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  growthDays === d
                    ? 'bg-rose-500 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>

        <div className="h-64">
          {growth.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#f43f5e" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="cumulGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#06b6d4" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="cumulative" stroke="#06b6d4" strokeWidth={2} fill="url(#cumulGrad)" name="Total Users" />
                <Area type="monotone" dataKey="new_users"  stroke="#f43f5e" strokeWidth={2} fill="url(#growthGrad)" name="New Signups" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-500">
              {loading ? 'Loading…' : 'No registration data available.'}
            </div>
          )}
        </div>
      </Card>

      {/* Daily activity chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <CardHeader
            title="Daily Workout Sessions"
            subtitle="Platform-wide training sessions per day (14 days)"
          />
          <div className="h-52">
            {activity.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activity} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="workout_sessions" fill="#10b981" radius={[4, 4, 0, 0]} name="Sessions" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No session data yet.
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <CardHeader
            title="Daily Nutrition Logs"
            subtitle="Food entries logged platform-wide per day (14 days)"
          />
          <div className="h-52">
            {activity.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activity} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="nutrition_logs" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Logs" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No nutrition data yet.
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Quick summary table */}
      {stats && (
        <Card className="p-6">
          <CardHeader title="Platform Health Summary" subtitle="Quick snapshot of all tracked data types" />
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase font-semibold tracking-wider">
                  <th className="py-2 px-3">Metric</th>
                  <th className="py-2 px-3">Count</th>
                  <th className="py-2 px-3">Avg per User</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {[
                  { name: 'Workout Sessions',  val: stats.total_workouts,       icon: '🏋️' },
                  { name: 'Weight Entries',    val: stats.total_weight_entries, icon: '⚖️' },
                  { name: 'Nutrition Logs',    val: stats.total_nutrition_logs, icon: '🥗' },
                  { name: 'Progress Photos',   val: stats.total_photos,         icon: '📷' },
                  { name: 'Personal Records',  val: stats.total_prs,            icon: '🏆' },
                  { name: 'Body Measurements', val: stats.total_measurements,   icon: '📏' },
                ].map(row => (
                  <tr key={row.name} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 px-3 font-medium text-slate-200">{row.icon} {row.name}</td>
                    <td className="py-2.5 px-3 font-bold text-white">{row.val.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-slate-400">
                      {stats.total_users > 0
                        ? (row.val / stats.total_users).toFixed(1)
                        : '–'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};
