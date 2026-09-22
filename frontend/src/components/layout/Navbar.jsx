import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Dumbbell, Bell, User, Menu, X, Plus, LogOut, CheckCircle2, ChevronDown 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useUnits } from '../../context/UnitContext';
import { api } from '../../services/api';

export const Navbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const { unitSystem, toggleUnitSystem } = useUnits();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    if (user) {
      api.get('/achievements/notifications')
        .then((data) => setNotifications(data || []))
        .catch(() => {});
    }
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkRead = async (id) => {
    try {
      await api.post(`/achievements/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {}
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-6 py-3.5 flex items-center justify-between">
      {/* Left brand & mobile hamburger */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/70 transition-colors"
          aria-label="Toggle navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Link to="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center shadow-glow-emerald group-hover:scale-105 transition-transform">
            <Dumbbell className="w-5 h-5 text-slate-950 font-black" />
          </div>
          <span className="font-extrabold text-xl tracking-tight text-white">
            Fit<span className="text-emerald-400">Track</span>
          </span>
        </Link>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Metric / Imperial toggle */}
        <button
          onClick={toggleUnitSystem}
          title={`Switch to ${unitSystem === 'metric' ? 'Imperial (lbs, in)' : 'Metric (kg, cm)'}`}
          className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-900 border border-slate-700/80 text-slate-300 hover:border-emerald-500/50 hover:text-emerald-400 transition-colors"
        >
          <span className={unitSystem === 'metric' ? 'text-emerald-400 font-bold' : 'text-slate-500'}>KG</span>
          <span className="text-slate-600">/</span>
          <span className={unitSystem === 'imperial' ? 'text-emerald-400 font-bold' : 'text-slate-500'}>LB</span>
        </button>

        {/* Quick Action: Start Workout */}
        <button
          onClick={() => navigate('/workouts')}
          className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-glow-emerald transition-all active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Quick Workout</span>
        </button>

        {/* Notifications dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserMenu(false);
            }}
            className="relative p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/70 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-400 rounded-full ring-2 ring-slate-950 animate-pulse" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="font-semibold text-sm text-slate-200">Notifications</span>
                <span className="text-xs text-slate-400">{unreadCount} new</span>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-800/60 mt-2">
                {notifications.length === 0 ? (
                  <p className="text-center py-6 text-xs text-slate-500">No notifications yet</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleMarkRead(n.id)}
                      className={`p-2.5 rounded-xl cursor-pointer transition-colors ${
                        n.is_read ? 'opacity-60' : 'bg-slate-800/40 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-semibold text-slate-200">{n.title}</h4>
                        {!n.is_read && <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full shrink-0 mt-1" />}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User avatar menu */}
        <div className="relative">
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-800/60 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-emerald-400">
              {getInitials(user?.name)}
            </div>
            <span className="hidden lg:inline text-xs font-medium text-slate-300 max-w-[100px] truncate">
              {user?.name || 'Account'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 hidden lg:inline" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-2 border-b border-slate-800/80 mb-1">
                <p className="text-xs font-semibold text-slate-200 truncate">{user?.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
              </div>
              <Link
                to="/profile"
                onClick={() => setShowUserMenu(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <User className="w-4 h-4 text-emerald-400" />
                <span>Profile & Goals</span>
              </Link>
              <Link
                to="/settings"
                onClick={() => setShowUserMenu(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                <span>Settings</span>
              </Link>
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  logout();
                  navigate('/login');
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-colors mt-1"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
