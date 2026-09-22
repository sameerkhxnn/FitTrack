import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, BarChart3, Bell, X, ShieldCheck,
} from 'lucide-react';

const NAV = [
  { path: '/admin',          label: 'Overview',    icon: LayoutDashboard, exact: true },
  { path: '/admin/users',    label: 'Users',       icon: Users },
  { path: '/admin/activity', label: 'Activity',    icon: BarChart3 },
  { path: '/admin/broadcast',label: 'Broadcast',   icon: Bell },
];

export const AdminSidebar = ({ isOpen, onClose }) => (
  <>
    {isOpen && (
      <div
        className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden"
        onClick={onClose}
      />
    )}

    <aside className={`
      fixed top-0 bottom-0 left-0 z-40 w-60
      bg-slate-950 border-r border-slate-800/80 flex flex-col
      transition-transform duration-200 ease-in-out
      lg:translate-x-0
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    `}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-rose-600 to-rose-400 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <span className="font-black text-sm text-white">Admin Panel</span>
        </div>
        <button onClick={onClose} className="lg:hidden p-1 text-slate-400 hover:text-white rounded-lg">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {NAV.map(({ path, label, icon: Icon, exact }) => (
          <NavLink
            key={path}
            to={path}
            end={exact}
            onClick={() => { if (window.innerWidth < 1024) onClose(); }}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={`w-4 h-4 ${isActive ? 'text-rose-400' : 'text-slate-500'}`} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Back link */}
      <div className="p-4 border-t border-slate-800/60">
        <NavLink
          to="/dashboard"
          className="flex items-center gap-2 text-xs text-slate-500 hover:text-emerald-400 transition-colors"
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          Back to App
        </NavLink>
      </div>
    </aside>
  </>
);
