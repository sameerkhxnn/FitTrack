import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Dumbbell, TrendingUp, ShieldCheck, Flame, Scale, Trophy, Utensils, 
  Droplets, LineChart, ChevronRight, CheckCircle2 
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { useAuth } from '../context/AuthContext';

export const LandingPage = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-hidden">
      {/* Decorative gradient orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-emerald-500/15 via-cyan-500/5 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 left-10 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-10 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <nav className="relative z-10 max-w-7xl mx-auto w-full px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center shadow-glow-emerald">
            <Dumbbell className="w-5 h-5 text-slate-950 font-black" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-white">
            Fit<span className="text-emerald-400">Track</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <Link to="/dashboard">
              <Button variant="primary" size="md">Go to Dashboard</Button>
            </Link>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="md">Sign In</Button>
              </Link>
              <Link to="/register">
                <Button variant="primary" size="md">Start Free</Button>
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pt-16 pb-20 text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-6 animate-pulse">
          <Flame className="w-3.5 h-3.5" />
          <span>The Next-Gen SaaS Fitness Intelligence Platform</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.1]">
          Engineered for <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">Peak Performance</span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed">
          Track workouts with live rest timers, log progressive overload, calculate estimated 1RM, analyze body composition, monitor daily macros, and unlock achievements.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center w-full max-w-md">
          <Link to={isAuthenticated ? "/dashboard" : "/register"} className="w-full sm:w-auto">
            <Button variant="primary" size="lg" className="w-full gap-2 text-base">
              <span>{isAuthenticated ? 'Open Dashboard' : 'Claim Your Profile'}</span>
              <ChevronRight className="w-5 h-5" />
            </Button>
          </Link>
          <Link to="/calculators" className="w-full sm:w-auto">
            <Button variant="secondary" size="lg" className="w-full">
              Explore Calculators
            </Button>
          </Link>
        </div>

        {/* Feature badges */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-medium">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Automated 1RM Epley Formula</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
            <span>Interactive Recharts Analytics</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-400" />
            <span>Metric & Imperial Unit Switching</span>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-12 w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card hoverEffect className="bg-slate-900/60 border-slate-800 p-6">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
              <Dumbbell className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-2">Live Workout Logging</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Start routines with active stopwatch timers, enter sets/reps/weight, track resting periods, and automatically calculate total volume.
            </p>
          </Card>

          <Card hoverEffect className="bg-slate-900/60 border-slate-800 p-6">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4">
              <Scale className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-2">Weight & Body Metrics</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Log daily body weights and 7 distinct circumference measurements with trend line charts, average weekly delta, and date comparisons.
            </p>
          </Card>

          <Card hoverEffect className="bg-slate-900/60 border-slate-800 p-6">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
              <Utensils className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-2">Macro & Habit Engine</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Track calories, protein, carbs, and fat alongside daily water hydration goals and habit streaks for complete holistic lifestyle progression.
            </p>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-900 mt-auto py-8 text-center text-xs text-slate-500">
        <p>© 2026 FitTrack SaaS. Precision Fitness Engineering.</p>
      </footer>
    </div>
  );
};
