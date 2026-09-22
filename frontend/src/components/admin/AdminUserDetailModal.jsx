import React, { useState, useEffect } from 'react';
import {
  X, User, Mail, Shield, ShieldOff, Lock, Trash2,
  Dumbbell, Scale, Utensils, Camera, Trophy, Ruler,
  Activity, Calendar, CheckCircle2, XCircle, RefreshCw,
} from 'lucide-react';
import { adminApi } from '../../services/adminApi';
import { useToast } from '../../context/ToastContext';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Badge } from '../common/Badge';

// ── Small stat tile ────────────────────────────────────────────────────────
const Tile = ({ label, value, icon: Icon, color = 'emerald' }) => {
  const colors = {
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    cyan:    'text-cyan-400    bg-cyan-500/10    border-cyan-500/20',
    amber:   'text-amber-400   bg-amber-500/10   border-amber-500/20',
    rose:    'text-rose-400    bg-rose-500/10    border-rose-500/20',
    violet:  'text-violet-400  bg-violet-500/10  border-violet-500/20',
  };
  return (
    <div className={`flex flex-col gap-1 p-3 rounded-xl border ${colors[color]}`}>
      <div className="flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5" />
        <span className="text-[10px] font-semibold uppercase tracking-wider opacity-70">{label}</span>
      </div>
      <span className="text-lg font-black text-white">{value ?? '–'}</span>
    </div>
  );
};

// ── Main component ─────────────────────────────────────────────────────────
export const AdminUserDetailModal = ({ userId, onClose, onUserUpdated }) => {
  const toast = useToast();
  const [detail, setDetail]         = useState(null);
  const [activity, setActivity]     = useState(null);
  const [isLoading, setIsLoading]   = useState(true);
  const [activeTab, setActiveTab]   = useState('overview'); // overview | activity | actions
  const [newPassword, setNewPassword] = useState('');
  const [isSaving, setIsSaving]     = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;
    setIsLoading(true);
    Promise.all([
      adminApi.getUser(userId),
      adminApi.getUserActivity(userId, 30),
    ]).then(([d, a]) => {
      setDetail(d);
      setActivity(a);
    }).catch(() => toast.error('Failed to load user detail.'))
      .finally(() => setIsLoading(false));
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Toggle admin / active ──────────────────────────────────────────────
  const toggleField = async (field) => {
    if (!detail) return;
    const current = detail.user[field];
    try {
      await adminApi.updateUser(userId, { [field]: !current });
      setDetail(prev => ({ ...prev, user: { ...prev.user, [field]: !current } }));
      toast.success(`User ${field.replace('is_', '')} ${!current ? 'enabled' : 'disabled'}.`);
      onUserUpdated?.();
    } catch (err) {
      toast.error(err.message || 'Update failed.');
    }
  };

  // ── Reset password ─────────────────────────────────────────────────────
  const handleResetPassword = async () => {
    if (newPassword.length < 6) { toast.error('Password must be at least 6 chars.'); return; }
    setIsSaving(true);
    try {
      await adminApi.resetPassword(userId, newPassword);
      toast.success('Password reset successfully.');
      setNewPassword('');
    } catch (err) {
      toast.error(err.message || 'Reset failed.');
    } finally { setIsSaving(false); }
  };

  // ── Delete ─────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!window.confirm(`Permanently delete ${detail?.user?.name}? This cannot be undone.`)) return;
    try {
      await adminApi.deleteUser(userId);
      toast.success('User deleted.');
      onUserUpdated?.();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Delete failed.');
    }
  };

  // ── Escape key ─────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />

      {/* Dialog */}
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-10 overflow-hidden flex flex-col max-h-[90vh]">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 font-black text-base">
              {detail?.user?.name?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div>
              <h2 className="text-base font-bold text-white">{detail?.user?.name ?? 'Loading…'}</h2>
              <p className="text-xs text-slate-400">{detail?.user?.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Status badges ── */}
        {detail && (
          <div className="flex items-center gap-2 px-6 pt-3 shrink-0">
            <Badge variant={detail.user.is_active ? 'emerald' : 'rose'} size="xs">
              {detail.user.is_active ? 'Active' : 'Suspended'}
            </Badge>
            {detail.user.is_admin && <Badge variant="amber" size="xs">Admin</Badge>}
            <span className="ml-auto text-[11px] text-slate-500">
              Joined {detail.user.created_at?.slice(0, 10)}
            </span>
          </div>
        )}

        {/* ── Tabs ── */}
        <div className="flex gap-5 px-6 pt-3 border-b border-slate-800 shrink-0">
          {['overview', 'activity', 'actions'].map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`pb-2.5 text-xs font-semibold capitalize transition-all border-b-2 ${
                activeTab === t
                  ? 'border-rose-400 text-rose-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-8 h-8 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !detail ? (
            <p className="text-center text-slate-500 text-sm py-10">Failed to load user data.</p>
          ) : (

            /* ── OVERVIEW TAB ── */
            activeTab === 'overview' ? (
              <div className="space-y-6">
                {/* Biometrics */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Biometrics</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                      <p className="text-slate-500 mb-0.5">Height</p>
                      <p className="font-bold text-white">{detail.user.height ? `${detail.user.height} cm` : '–'}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                      <p className="text-slate-500 mb-0.5">Current Weight</p>
                      <p className="font-bold text-white">{detail.latest_weight ? `${detail.latest_weight.weight} kg` : '–'}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                      <p className="text-slate-500 mb-0.5">Gender</p>
                      <p className="font-bold text-white capitalize">{detail.user.gender ?? '–'}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                      <p className="text-slate-500 mb-0.5">Fitness Goal</p>
                      <p className="font-bold text-white capitalize">{detail.profile?.fitness_goal?.replace('_', ' ') ?? '–'}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                      <p className="text-slate-500 mb-0.5">Goal Weight</p>
                      <p className="font-bold text-white">{detail.profile?.goal_weight ? `${detail.profile.goal_weight} kg` : '–'}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                      <p className="text-slate-500 mb-0.5">Training Days/Wk</p>
                      <p className="font-bold text-white">{detail.profile?.training_days_per_week ?? '–'}</p>
                    </div>
                  </div>
                </div>

                {/* Data counts */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Data Overview</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <Tile label="Workouts"    value={detail.stats.workouts}        icon={Dumbbell}  color="emerald" />
                    <Tile label="Weight Logs" value={detail.stats.weight_entries}  icon={Scale}     color="cyan"   />
                    <Tile label="Nutrition"   value={detail.stats.nutrition_logs}  icon={Utensils}  color="amber"  />
                    <Tile label="Photos"      value={detail.stats.photos}          icon={Camera}    color="violet" />
                    <Tile label="PRs"         value={detail.stats.personal_records}icon={Trophy}    color="amber"  />
                    <Tile label="Measurements"value={detail.stats.measurements}    icon={Ruler}     color="cyan"   />
                  </div>
                </div>

                {/* Recent sessions */}
                {detail.recent_sessions?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Recent Workouts</h4>
                    <div className="space-y-2">
                      {detail.recent_sessions.map(s => (
                        <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                          <div>
                            <p className="font-semibold text-slate-200">{s.name}</p>
                            <p className="text-slate-500">{s.date} · {s.duration_minutes} min</p>
                          </div>
                          <span className="font-bold text-emerald-400">{s.total_volume} kg</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Top PRs */}
                {detail.top_prs?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Top Personal Records</h4>
                    <div className="space-y-2">
                      {detail.top_prs.map((p, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs">
                          <p className="font-semibold text-slate-200">{p.exercise_name}</p>
                          <div className="text-right">
                            <p className="font-black text-amber-400">{p.estimated_1rm} kg <span className="text-slate-500 font-normal">1RM</span></p>
                            <p className="text-slate-500">{p.max_weight} kg × {p.best_reps}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            /* ── ACTIVITY TAB ── */
            ) : activeTab === 'activity' ? (
              <div className="space-y-5">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Last 30 Days — Workouts ({activity?.workouts?.length ?? 0})
                  </h4>
                  {activity?.workouts?.length > 0 ? (
                    <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                      {activity.workouts.map(s => (
                        <div key={s.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs">
                          <div>
                            <p className="font-semibold text-slate-200">{s.name}</p>
                            <p className="text-slate-500">{s.date} · {s.duration_minutes} min · {s.calories} kcal</p>
                          </div>
                          <span className="font-bold text-emerald-400 shrink-0">{s.total_volume} kg</span>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-xs text-slate-600 italic">No sessions in last 30 days.</p>}
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Weight Entries ({activity?.weights?.length ?? 0})
                  </h4>
                  {activity?.weights?.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                      {activity.weights.slice(0, 15).map((w, i) => (
                        <div key={i} className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 text-center text-xs">
                          <p className="font-black text-white">{w.weight}</p>
                          <p className="text-[10px] text-slate-500">{w.date}</p>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-xs text-slate-600 italic">No weight logs in last 30 days.</p>}
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Daily Calorie Log ({activity?.nutrition?.length ?? 0} days)
                  </h4>
                  {activity?.nutrition?.length > 0 ? (
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {activity.nutrition.map((n, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800 text-xs">
                          <span className="text-slate-400">{n.date}</span>
                          <span className="font-bold text-amber-400">{n.total_calories} kcal</span>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-xs text-slate-600 italic">No nutrition logs in last 30 days.</p>}
                </div>
              </div>

            /* ── ACTIONS TAB ── */
            ) : (
              <div className="space-y-6">
                {/* Toggle admin */}
                <div className="p-4 rounded-2xl border border-slate-800 bg-slate-950/40 space-y-3">
                  <h4 className="text-sm font-bold text-white">Role & Access</h4>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      variant={detail.user.is_admin ? 'danger' : 'secondary'}
                      size="sm"
                      icon={detail.user.is_admin ? ShieldOff : Shield}
                      onClick={() => toggleField('is_admin')}
                    >
                      {detail.user.is_admin ? 'Revoke Admin' : 'Grant Admin'}
                    </Button>
                    <Button
                      variant={detail.user.is_active ? 'danger' : 'secondary'}
                      size="sm"
                      icon={detail.user.is_active ? XCircle : CheckCircle2}
                      onClick={() => toggleField('is_active')}
                    >
                      {detail.user.is_active ? 'Suspend Account' : 'Reactivate Account'}
                    </Button>
                  </div>
                  {!detail.user.is_active && (
                    <p className="text-xs text-rose-400/80 italic">
                      Suspended users cannot log in until reactivated.
                    </p>
                  )}
                </div>

                {/* Reset password */}
                <div className="p-4 rounded-2xl border border-slate-800 bg-slate-950/40 space-y-3">
                  <h4 className="text-sm font-bold text-white">Force Reset Password</h4>
                  <p className="text-xs text-slate-400">
                    Set a new password for this user. They can change it after logging in.
                  </p>
                  <div className="flex items-end gap-3">
                    <div className="flex-1">
                      <Input
                        label="New Password"
                        type="password"
                        placeholder="Min 6 characters"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        icon={Lock}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="md"
                      isLoading={isSaving}
                      icon={RefreshCw}
                      onClick={handleResetPassword}
                      className="mb-0.5"
                    >
                      Reset
                    </Button>
                  </div>
                </div>

                {/* Delete */}
                <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/5 space-y-3">
                  <h4 className="text-sm font-bold text-rose-300">Danger Zone</h4>
                  <p className="text-xs text-slate-400">
                    Permanently deletes this account and all associated workouts, weights, photos, and data.
                    <span className="font-bold text-rose-400"> This is irreversible.</span>
                  </p>
                  <Button variant="danger" size="sm" icon={Trash2} onClick={handleDelete}>
                    Delete Account Permanently
                  </Button>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};
