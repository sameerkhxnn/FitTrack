import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend,
} from 'recharts';
import { adminApi } from '../../services/adminApi';
import { useToast } from '../../context/ToastContext';
import { Card, CardHeader } from '../../components/common/Card';

const tooltipStyle = {
  backgroundColor: '#0f172a',
  borderColor: '#1e293b',
  borderRadius: '12px',
  fontSize: '12px',
  color: '#f8fafc',
};

export const AdminActivityPage = () => {
  const toast = useToast();
  const [activityDays, setActivityDays] = useState(14);
  const [growthDays,   setGrowthDays]   = useState(30);
  const [activity, setActivity] = useState([]);
  const [growth,   setGrowth]   = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      adminApi.getActivity(activityDays),
      adminApi.getGrowth(growthDays),
    ]).then(([a, g]) => {
      setActivity(a.data ?? []);
      setGrowth(g.data ?? []);
    }).catch(() => toast.error('Failed to load activity data.'))
      .finally(() => setLoading(false));
  }, [activityDays, growthDays]); // eslint-disable-line react-hooks/exhaustive-deps

  const DayPicker = ({ value, onChange, options }) => (
    <div className="inline-flex p-1 rounded-xl bg-slate-950 border border-slate-800">
      {options.map(d => (
        <button
          key={d}
          onClick={() => onChange(d)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            value === d ? 'bg-rose-500 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          {d}d
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">Platform Activity</h1>
        <p className="text-sm text-slate-400 mt-1">
          Daily engagement metrics across all users — workouts, nutrition logs, and registration growth.
        </p>
      </div>

      {/* Combined daily activity */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <CardHeader
            title="Daily Engagement"
            subtitle="Workout sessions and nutrition logs per day"
            className="mb-0"
          />
          <DayPicker value={activityDays} onChange={setActivityDays} options={[7, 14, 30]} />
        </div>
        <div className="h-72">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : activity.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="workout_sessions" name="Workouts"    fill="#10b981" radius={[4,4,0,0]} />
                <Bar dataKey="nutrition_logs"   name="Nutrition"   fill="#f59e0b" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-500">
              No activity data in this period.
            </div>
          )}
        </div>
      </Card>

      {/* Growth */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <CardHeader
            title="User Registration Growth"
            subtitle="New signups and cumulative total"
            className="mb-0"
          />
          <DayPicker value={growthDays} onChange={setGrowthDays} options={[14, 30, 90]} />
        </div>
        <div className="h-72">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : growth.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="actCumul" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}   />
                  </linearGradient>
                  <linearGradient id="actNew" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#f43f5e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="cumulative" name="Total Users"  stroke="#06b6d4" strokeWidth={2} fill="url(#actCumul)" />
                <Area type="monotone" dataKey="new_users"  name="New Signups" stroke="#f43f5e" strokeWidth={2} fill="url(#actNew)"   />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-500">
              No growth data in this period.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
