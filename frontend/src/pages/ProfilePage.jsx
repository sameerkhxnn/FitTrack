import React, { useState, useEffect } from 'react';
import { 
  User, Target, Activity, Flame, Shield, Scale, Ruler, 
  Calendar, Check, Save, Sparkles 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useUnits } from '../context/UnitContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { Card, CardHeader } from '../components/common/Card';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';

export const ProfilePage = () => {
  const { user, refreshUser } = useAuth();
  const { unitSystem, formatWeight, formatHeight, weightUnit, lengthUnit } = useUnits();
  const toast = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [height, setHeight] = useState(175);
  const [gender, setGender] = useState('male');
  const [currentWeight, setCurrentWeight] = useState(75);
  const [goalWeight, setGoalWeight] = useState(72);
  const [fitnessGoal, setFitnessGoal] = useState('maintain');
  const [activityLevel, setActivityLevel] = useState('moderate');
  const [trainingDays, setTrainingDays] = useState(4);

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const data = await api.get('/profile');
        setProfile(data);
        if (user) {
          setName(user.name || '');
          setDateOfBirth(user.date_of_birth ? user.date_of_birth.slice(0, 10) : '');
          setHeight(user.height || 175);
          setGender(user.gender || 'male');
        }
        if (data) {
          setCurrentWeight(data.current_weight || 75);
          setGoalWeight(data.goal_weight || 72);
          setFitnessGoal(data.fitness_goal || 'maintain');
          setActivityLevel(data.activity_level || 'moderate');
          setTrainingDays(data.training_days_per_week || 4);
        }
      } catch (err) {
        toast.error('Failed to load profile details.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // 1. Update User basic account info
      await api.put('/settings/profile', {
        name,
        date_of_birth: dateOfBirth || null,
        height: parseFloat(height) || null,
        gender,
      });

      // 2. Update Profile & fitness goals
      const updatedProfile = await api.put('/profile', {
        current_weight: parseFloat(currentWeight) || null,
        goal_weight: parseFloat(goalWeight) || null,
        fitness_goal: fitnessGoal,
        activity_level: activityLevel,
        training_days_per_week: parseInt(trainingDays),
      });

      setProfile(updatedProfile);
      await refreshUser();
      toast.success('Fitness profile and metabolic targets updated successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const goals = [
    { key: 'lose_fat', label: 'Lose Fat', desc: 'Sustained calorie deficit with high protein retention' },
    { key: 'maintain', label: 'Maintain', desc: 'Energy equilibrium to sustain current muscle & weight' },
    { key: 'build_muscle', label: 'Build Muscle', desc: 'Controlled caloric surplus optimized for hypertrophy' },
    { key: 'recomposition', label: 'Body Recomposition', desc: 'Burn fat and build strength simultaneously' },
  ];

  const activityLevels = [
    { key: 'sedentary', label: 'Sedentary', desc: 'Little or no exercise, desk job (1.2x)' },
    { key: 'light', label: 'Light Activity', desc: 'Light exercise or sports 1-3 days/week (1.375x)' },
    { key: 'moderate', label: 'Moderate Activity', desc: 'Moderate training 3-5 days/week (1.55x)' },
    { key: 'active', label: 'Very Active', desc: 'Hard training 6-7 days/week (1.725x)' },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-slate-800 rounded-xl w-1/3" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-96 bg-slate-900 rounded-2xl lg:col-span-2" />
          <div className="h-96 bg-slate-900 rounded-2xl" />
        </div>
      </div>
    );
  }

  const calculated = profile?.calculated;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">Profile & Fitness Goals</h1>
        <p className="text-sm text-slate-400 mt-1">
          Configure your physical metrics to generate scientific metabolic calculations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Form (2 Cols) */}
        <form onSubmit={handleSave} className="lg:col-span-2 space-y-6">
          {/* Section 1: Biometrics */}
          <Card className="p-6 space-y-5">
            <CardHeader
              title="Personal Biometrics"
              subtitle="Fundamental metrics used for basal metabolic rate (BMR)"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                icon={User}
                required
              />

              <Input
                label="Date of Birth"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                icon={Calendar}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label={`Height (${lengthUnit})`}
                type="number"
                step="0.5"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                icon={Ruler}
                required
              />

              <Input
                label={`Current Weight (${weightUnit})`}
                type="number"
                step="0.1"
                value={currentWeight}
                onChange={(e) => setCurrentWeight(e.target.value)}
                icon={Scale}
                required
              />

              <Input
                label={`Goal Weight (${weightUnit})`}
                type="number"
                step="0.1"
                value={goalWeight}
                onChange={(e) => setGoalWeight(e.target.value)}
                icon={Target}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Biological Gender</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {['male', 'female', 'other', 'prefer_not_to_say'].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(g)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all capitalize ${
                      gender === g
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {g.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Section 2: Fitness Goal */}
          <Card className="p-6 space-y-4">
            <CardHeader
              title="Primary Fitness Goal"
              subtitle="Determines calorie surplus, deficit, and macronutrient distribution"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {goals.map((g) => (
                <div
                  key={g.key}
                  onClick={() => setFitnessGoal(g.key)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    fitnessGoal === g.key
                      ? 'border-emerald-500 bg-emerald-500/10 shadow-glow-emerald'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <h4 className={`text-sm font-bold ${fitnessGoal === g.key ? 'text-emerald-400' : 'text-slate-200'}`}>
                      {g.label}
                    </h4>
                    {fitnessGoal === g.key && <Check className="w-4 h-4 text-emerald-400" />}
                  </div>
                  <p className="text-xs text-slate-400">{g.desc}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Section 3: Activity & Training */}
          <Card className="p-6 space-y-4">
            <CardHeader
              title="Physical Activity Level"
              subtitle="Calculates Total Daily Energy Expenditure (TDEE)"
            />

            <div className="space-y-2.5">
              {activityLevels.map((act) => (
                <div
                  key={act.key}
                  onClick={() => setActivityLevel(act.key)}
                  className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    activityLevel === act.key
                      ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300'
                      : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <h5 className="text-xs font-bold">{act.label}</h5>
                    <p className="text-[11px] text-slate-400">{act.desc}</p>
                  </div>
                  {activityLevel === act.key && <Check className="w-4 h-4 text-cyan-400 shrink-0" />}
                </div>
              ))}
            </div>

            <div className="pt-3">
              <label className="block text-xs font-medium text-slate-300 mb-2">
                Planned Training Days / Week ({trainingDays} days)
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setTrainingDays(num)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                      trainingDays === num
                        ? 'border-emerald-500 bg-emerald-500 text-slate-950 shadow-glow-emerald'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSaving}
            icon={Save}
            className="w-full sm:w-auto"
          >
            Save Profile & Targets
          </Button>
        </form>

        {/* Right Panel: Live Calculated Metabolic Report (1 Col) */}
        <div className="space-y-6">
          <Card className="p-6 bg-gradient-to-b from-slate-900 to-slate-950 border-emerald-500/20">
            <div className="flex items-center gap-2 text-emerald-400 mb-4">
              <Sparkles className="w-5 h-5" />
              <h3 className="font-bold text-base text-white">Calculated Metabolism</h3>
            </div>

            {/* BMI Card */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Body Mass Index (BMI)</span>
                <Badge
                  variant={
                    calculated?.bmi_category === 'Normal weight'
                      ? 'emerald'
                      : calculated?.bmi_category === 'Overweight'
                      ? 'amber'
                      : 'rose'
                  }
                  size="xs"
                >
                  {calculated?.bmi_category || 'Normal'}
                </Badge>
              </div>
              <div className="text-3xl font-black text-white mt-2">
                {calculated?.bmi || '--'}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Standard healthy range is between 18.5 and 24.9.
              </p>
            </div>

            {/* BMR and TDEE */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400">BMR</span>
                <p className="text-xl font-black text-white mt-1">{calculated?.bmr || '--'}</p>
                <p className="text-[10px] text-slate-500">Base calories at rest</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-cyan-400">TDEE</span>
                <p className="text-xl font-black text-cyan-400 mt-1">{calculated?.tdee || '--'}</p>
                <p className="text-[10px] text-slate-500">Daily maintenance</p>
              </div>
            </div>

            {/* Target Daily Calories */}
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 mb-4">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">
                Target Daily Calories
              </span>
              <p className="text-3xl font-black text-white mt-1">
                {calculated?.target_calories || '--'}{' '}
                <span className="text-sm font-normal text-emerald-300">kcal</span>
              </p>
              <p className="text-[11px] text-emerald-200/70 mt-1">
                Adjusted for your <span className="font-semibold">{fitnessGoal.replace('_', ' ')}</span> goal.
              </p>
            </div>

            {/* Recommended Protein Range */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-slate-300">Recommended Protein</span>
                <span className="text-cyan-400 font-bold">
                  {calculated?.protein_min_g || 140} - {calculated?.protein_max_g || 175}g
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Optimal range calculated at 1.8g to 2.2g per kg of bodyweight to maximize muscle retention and hypertrophy.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
