import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Dumbbell,
  Scale,
  Ruler,
  Utensils,
  Droplets,
  Trophy,
  Camera,
  Calculator,
  BarChart3,
  Milestone,
  Award,
  Settings,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { path: '/dashboard',    label: 'Dashboard',          icon: LayoutDashboard },
  { path: '/workouts',     label: 'Workouts & Live',    icon: Dumbbell },
  { path: '/weights',      label: 'Weight Tracking',    icon: Scale },
  { path: '/measurements', label: 'Measurements',       icon: Ruler },
  { path: '/nutrition',    label: 'Nutrition & Macros', icon: Utensils },
  { path: '/habits',       label: 'Water & Habits',     icon: Droplets },
  { path: '/prs',          label: 'PRs & Strength',     icon: Trophy },
  { path: '/photos',       label: 'Progress Photos',    icon: Camera },
  { path: '/calculators',  label: 'Fitness Calculators',icon: Calculator },
  { path: '/analytics',    label: 'Analytics Hub',      icon: BarChart3 },
  { path: '/journey',      label: 'My Journey',         icon: Milestone },
  { path: '/achievements', label: 'Achievements',       icon: Award },
  { path: '/settings',     label: 'Settings',           icon: Settings },
];

export const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-950/95 lg:bg-slate-950/60 lg:backdrop-blur-xl border-r border-slate-800/80 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header in mobile drawer */}
        <div className="flex items-center justify-between p-4 lg:hidden border-b border-slate-800">
          <span className="font-bold text-base text-slate-100">FitTrack Menu</span>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => { if (window.innerWidth < 1024) onClose(); }}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 group ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-glow-emerald'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300'
                      }`}
                    />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Admin panel link — only visible to admins */}
        {user?.is_admin && (
          <div className="px-3 pb-2">
            <NavLink
              to="/admin"
              onClick={() => { if (window.innerWidth < 1024) onClose(); }}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                  isActive
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                    : 'text-slate-400 hover:text-rose-300 hover:bg-rose-500/10'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <ShieldCheck className={`w-4 h-4 ${isActive ? 'text-rose-400' : 'text-slate-500 group-hover:text-rose-400'}`} />
                  <span>Admin Panel</span>
                </>
              )}
            </NavLink>
          </div>
        )}

        {/* Footer info badge */}
        <div className="p-4 border-t border-slate-900">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/60 text-center">
            <p className="text-[11px] font-semibold text-slate-300">FitTrack v1.0 Production</p>
            <p className="text-[10px] text-slate-500 mt-0.5">SaaS Fitness Engine</p>
          </div>
        </div>
      </aside>
    </>
  );
};
