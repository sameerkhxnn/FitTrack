import React, { useState, useEffect } from 'react';
import { 
  Droplets, Moon, Footprints, Flame, CheckCircle2, 
  Plus, Minus, Sparkles, Calendar, Activity, RotateCcw 
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { Card, CardHeader } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Badge } from '../components/common/Badge';

export const HabitsPage = () => {
  const toast = useToast();

  const [currentDate, setCurrentDate] = useState(new Date().toISOString().slice(0, 10));
  const [waterLog, setWaterLog] = useState(null);
  const [habit, setHabit] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form states for habit checklist
  const [sleepHours, setSleepHours] = useState(7.5);
  const [steps, setSteps] = useState(8000);
  const [stretched, setStretched] = useState(false);
  const [cardioDone, setCardioDone] = useState(false);
  const [workoutDone, setWorkoutDone] = useState(false);
  const [habitNotes, setHabitNotes] = useState('');
  const [isSavingHabit, setIsSavingHabit] = useState(false);

  const fetchData = async (dateStr = currentDate) => {
    setIsLoading(true);
    try {
      const [waterData, habitData] = await Promise.all([
        api.get('/habits/water', { log_date: dateStr }),
        api.get('/habits/checklist', { habit_date: dateStr }),
      ]);
      setWaterLog(waterData);
      setHabit(habitData);
      if (habitData) {
        setSleepHours(habitData.sleep_hours || 7.5);
        setSteps(habitData.steps || 0);
        setStretched(!!habitData.stretched);
        setCardioDone(!!habitData.cardio_done);
        setWorkoutDone(!!habitData.workout_done);
        setHabitNotes(habitData.notes || '');
      }
    } catch (err) {
      toast.error('Failed to load hydration and daily habits.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData(currentDate);
  }, [currentDate]);

  const handleUpdateWater = async (delta) => {
    const currentAmount = waterLog?.amount_ml || 0;
    const newAmount = Math.max(0, currentAmount + delta);

    try {
      const updated = await api.post('/habits/water', {
        amount_ml: newAmount,
        goal_ml: waterLog?.goal_ml || 2500,
        date: currentDate,
      });
      setWaterLog(updated);
      toast.success(`${delta > 0 ? '+' : ''}${delta} ml hydration logged!`);
    } catch (err) {
      toast.error('Failed to update water intake.');
    }
  };

  const handleSaveHabits = async () => {
    setIsSavingHabit(true);
    try {
      const updated = await api.post('/habits/checklist', {
        date: currentDate,
        sleep_hours: parseFloat(sleepHours) || 0,
        steps: parseInt(steps) || 0,
        stretched,
        cardio_done: cardioDone,
        workout_done: workoutDone,
        notes: habitNotes,
      });
      setHabit(updated);
      toast.success('Daily habits saved!');
    } catch (err) {
      toast.error('Failed to save habit checklist.');
    } finally {
      setIsSavingHabit(false);
    }
  };

  const waterPercent = waterLog?.percentage || 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Hydration & Daily Habits</h1>
          <p className="text-sm text-slate-400 mt-1">
            Build compounding consistency through daily sleep, step counts, hydration, and recovery habits.
          </p>
        </div>

        <input
          type="date"
          value={currentDate}
          onChange={(e) => setCurrentDate(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 self-start sm:self-auto"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Water Hydration Command Center */}
        <Card className="p-6 flex flex-col justify-between space-y-6">
          <CardHeader
            title="Daily Hydration Tracker"
            subtitle={`Goal: ${waterLog?.goal_ml || 2500} ml per day`}
            action={
              <Badge variant="cyan" size="xs">
                {waterPercent}% Goal Reached
              </Badge>
            }
          />

          {/* Interactive Hydration Indicator */}
          <div className="flex flex-col items-center justify-center p-8 rounded-3xl bg-slate-950/80 border border-slate-800 relative overflow-hidden">
            <div className="relative z-10 text-center">
              <Droplets className="w-10 h-10 text-cyan-400 mx-auto mb-2 animate-bounce" />
              <div className="text-4xl font-black text-white">
                {waterLog?.amount_ml || 0}{' '}
                <span className="text-lg font-semibold text-cyan-400">ml</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Target: {waterLog?.goal_ml || 2500} ml • Remaining:{' '}
                {Math.max(0, (waterLog?.goal_ml || 2500) - (waterLog?.amount_ml || 0))} ml
              </p>
            </div>

            {/* Fluid level visual backdrop */}
            <div
              className="absolute bottom-0 inset-x-0 bg-cyan-500/15 transition-all duration-500 pointer-events-none"
              style={{ height: `${Math.min(100, waterPercent)}%` }}
            />
          </div>

          {/* Quick Water Action Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Button
              variant="outline"
              size="md"
              onClick={() => handleUpdateWater(250)}
              className="border-cyan-500/30 text-cyan-300 hover:border-cyan-400"
            >
              +250 ml (Glass)
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={() => handleUpdateWater(500)}
              className="border-cyan-500/30 text-cyan-300 hover:border-cyan-400"
            >
              +500 ml (Bottle)
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={() => handleUpdateWater(750)}
              className="border-cyan-500/30 text-cyan-300 hover:border-cyan-400"
            >
              +750 ml (Shaker)
            </Button>
            <Button
              variant="ghost"
              size="md"
              onClick={() => handleUpdateWater(-250)}
              className="text-slate-400 hover:text-rose-400"
            >
              -250 ml
            </Button>
          </div>
        </Card>

        {/* Right: Daily Habits Checklist */}
        <Card className="p-6 space-y-5">
          <CardHeader
            title="Daily Habit Checklist"
            subtitle="Track recovery, mobility, and movement routines"
          />

          <div className="space-y-4">
            {/* Habit Checkboxes */}
            <div
              onClick={() => setWorkoutDone(!workoutDone)}
              className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                workoutDone
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                  : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <Flame className={`w-5 h-5 ${workoutDone ? 'text-emerald-400' : 'text-slate-500'}`} />
                <div>
                  <h4 className="text-sm font-bold">Workout Session Completed</h4>
                  <p className="text-[11px] text-slate-400">Resistance training or planned exercise</p>
                </div>
              </div>
              <CheckCircle2 className={`w-5 h-5 ${workoutDone ? 'text-emerald-400' : 'text-slate-600'}`} />
            </div>

            <div
              onClick={() => setCardioDone(!cardioDone)}
              className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                cardioDone
                  ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300'
                  : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <Activity className={`w-5 h-5 ${cardioDone ? 'text-cyan-400' : 'text-slate-500'}`} />
                <div>
                  <h4 className="text-sm font-bold">Cardio / Conditioning</h4>
                  <p className="text-[11px] text-slate-400">Running, cycling, HIIT, or brisk walk</p>
                </div>
              </div>
              <CheckCircle2 className={`w-5 h-5 ${cardioDone ? 'text-cyan-400' : 'text-slate-600'}`} />
            </div>

            <div
              onClick={() => setStretched(!stretched)}
              className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                stretched
                  ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                  : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <Sparkles className={`w-5 h-5 ${stretched ? 'text-amber-400' : 'text-slate-500'}`} />
                <div>
                  <h4 className="text-sm font-bold">Mobility & Stretching</h4>
                  <p className="text-[11px] text-slate-400">Foam rolling, yoga, or dynamic cooldown</p>
                </div>
              </div>
              <CheckCircle2 className={`w-5 h-5 ${stretched ? 'text-amber-400' : 'text-slate-600'}`} />
            </div>

            {/* Numerical inputs for Sleep and Steps */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <Input
                label="Sleep Duration (Hours)"
                type="number"
                step="0.5"
                min="0"
                max="24"
                value={sleepHours}
                onChange={(e) => setSleepHours(e.target.value)}
                icon={Moon}
              />

              <Input
                label="Daily Steps Count"
                type="number"
                step="500"
                min="0"
                value={steps}
                onChange={(e) => setSteps(e.target.value)}
                icon={Footprints}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Daily Habit Notes</label>
              <textarea
                rows={2}
                value={habitNotes}
                onChange={(e) => setHabitNotes(e.target.value)}
                placeholder="How did you feel today? Any soreness or fatigue?"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <Button
              variant="primary"
              size="md"
              className="w-full"
              isLoading={isSavingHabit}
              onClick={handleSaveHabits}
            >
              Save Habit Checklist
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
