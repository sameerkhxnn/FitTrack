import React, { useState } from 'react';
import { 
  Calculator, Activity, Flame, Target, Trophy, 
  Scale, PieChart, Calendar, ChevronRight, CheckCircle2 
} from 'lucide-react';
import { useUnits } from '../context/UnitContext';
import { Card, CardHeader } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Badge } from '../components/common/Badge';

export const CalculatorsPage = () => {
  const { weightUnit, lengthUnit } = useUnits();
  const [selectedCalc, setSelectedCalc] = useState('bmi');

  // Calculator states
  // 1. BMI
  const [bmiWeight, setBmiWeight] = useState(75);
  const [bmiHeight, setBmiHeight] = useState(175);
  const [bmiResult, setBmiResult] = useState(null);

  // 2. BMR
  const [bmrWeight, setBmrWeight] = useState(75);
  const [bmrHeight, setBmrHeight] = useState(175);
  const [bmrAge, setBmrAge] = useState(25);
  const [bmrGender, setBmrGender] = useState('male');
  const [bmrResult, setBmrResult] = useState(null);

  // 3. TDEE
  const [tdeeBmr, setTdeeBmr] = useState(1750);
  const [tdeeActivity, setTdeeActivity] = useState('moderate');
  const [tdeeResult, setTdeeResult] = useState(null);

  // 4. Calorie Goal
  const [goalTdee, setGoalTdee] = useState(2400);
  const [goalChoice, setGoalChoice] = useState('lose_fat');
  const [calorieResult, setCalorieResult] = useState(null);

  // 5. Protein
  const [proteinWeight, setProteinWeight] = useState(75);
  const [proteinGoal, setProteinGoal] = useState('build_muscle');
  const [proteinResult, setProteinResult] = useState(null);

  // 6. 1RM
  const [oneRmWeight, setOneRmWeight] = useState(100);
  const [oneRmReps, setOneRmReps] = useState(6);
  const [oneRmResult, setOneRmResult] = useState(null);

  // 7. Macro Split
  const [macroCalories, setMacroCalories] = useState(2200);
  const [macroSplit, setMacroSplit] = useState('balanced');
  const [macroResult, setMacroResult] = useState(null);

  // 8. Goal Timeline
  const [timelineCurrent, setTimelineCurrent] = useState(80);
  const [timelineGoal, setTimelineGoal] = useState(72);
  const [timelineRate, setTimelineRate] = useState(0.5);
  const [timelineResult, setTimelineResult] = useState(null);

  // Calculation Handlers
  const calculateBMI = () => {
    const hM = bmiHeight / 100.0;
    const bmi = parseFloat((bmiWeight / (hM * hM)).toFixed(1));
    let cat = 'Normal weight';
    if (bmi < 18.5) cat = 'Underweight';
    else if (bmi >= 25 && bmi < 30) cat = 'Overweight';
    else if (bmi >= 30) cat = 'Obese';
    setBmiResult({ bmi, category: cat });
  };

  const calculateBMR = () => {
    const base = 10 * bmrWeight + 6.25 * bmrHeight - 5 * bmrAge;
    const bmr = Math.round(bmrGender === 'female' ? base - 161 : base + 5);
    setBmrResult({ bmr });
  };

  const calculateTDEE = () => {
    const mults = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9 };
    const tdee = Math.round(tdeeBmr * (mults[tdeeActivity] || 1.55));
    setTdeeResult({ tdee });
  };

  const calculateCalorieGoal = () => {
    let target = goalTdee;
    if (goalChoice === 'lose_fat') target -= 500;
    else if (goalChoice === 'build_muscle') target += 300;
    else if (goalChoice === 'recomposition') target -= 200;
    setCalorieResult({ targetCalories: target, delta: target - goalTdee });
  };

  const calculateProtein = () => {
    const multipliers = {
      lose_fat: [2.0, 2.4],
      build_muscle: [1.8, 2.2],
      maintain: [1.4, 1.8],
      recomposition: [2.0, 2.4],
    };
    const [minMult, maxMult] = multipliers[proteinGoal] || [1.6, 2.0];
    const minG = Math.round(proteinWeight * minMult);
    const maxG = Math.round(proteinWeight * maxMult);
    setProteinResult({ minG, maxG, avgG: Math.round((minG + maxG) / 2) });
  };

  const calculateOneRM = () => {
    const epley = Math.round(oneRmWeight * (1 + oneRmReps / 30.0) * 10) / 10;
    const percentages = [
      { reps: 1, pct: 100, weight: Math.round(epley) },
      { reps: 2, pct: 95, weight: Math.round(epley * 0.95) },
      { reps: 4, pct: 90, weight: Math.round(epley * 0.90) },
      { reps: 6, pct: 85, weight: Math.round(epley * 0.85) },
      { reps: 8, pct: 80, weight: Math.round(epley * 0.80) },
      { reps: 10, pct: 75, weight: Math.round(epley * 0.75) },
    ];
    setOneRmResult({ epley, percentages });
  };

  const calculateMacroSplit = () => {
    let pPct = 0.3, cPct = 0.45, fPct = 0.25;
    if (macroSplit === 'high_protein') { pPct = 0.4; cPct = 0.35; fPct = 0.25; }
    else if (macroSplit === 'low_carb') { pPct = 0.35; cPct = 0.2; fPct = 0.45; }
    else if (macroSplit === 'keto') { pPct = 0.25; cPct = 0.05; fPct = 0.70; }

    const pG = Math.round((macroCalories * pPct) / 4);
    const cG = Math.round((macroCalories * cPct) / 4);
    const fG = Math.round((macroCalories * fPct) / 9);
    setMacroResult({ pG, cG, fG, pPct: pPct * 100, cPct: cPct * 100, fPct: fPct * 100 });
  };

  const calculateTimeline = () => {
    const diff = Math.abs(timelineCurrent - timelineGoal);
    const weeks = Math.round((diff / Math.max(0.1, timelineRate)) * 10) / 10;
    const days = Math.round(weeks * 7);
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);

    setTimelineResult({
      totalKg: diff.toFixed(1),
      direction: timelineCurrent > timelineGoal ? 'Weight Loss' : 'Weight Gain',
      weeks,
      days,
      targetDate: targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    });
  };

  const calculatorsList = [
    { key: 'bmi', label: 'BMI Calculator', icon: Scale, desc: 'Body Mass Index and healthy range classification' },
    { key: 'bmr', label: 'BMR Calculator', icon: Flame, desc: 'Mifflin-St Jeor basal metabolic rate at rest' },
    { key: 'tdee', label: 'TDEE Calculator', icon: Activity, desc: 'Daily energy expenditure adjusted for activity' },
    { key: 'calorie_goal', label: 'Calorie Target', icon: Target, desc: 'Surplus or deficit calories for your specific goal' },
    { key: 'protein', label: 'Protein Optimizer', icon: CheckCircle2, desc: 'Optimal daily protein intake (g/day)' },
    { key: '1rm', label: '1RM Strength', icon: Trophy, desc: 'Epley estimated one-rep maximum and percentages' },
    { key: 'macros', label: 'Macro Split', icon: PieChart, desc: 'Carb, protein, and fat grams from calories' },
    { key: 'timeline', label: 'Goal Timeline', icon: Calendar, desc: 'Target date calculation based on safe weekly delta' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">Fitness Calculators Suite</h1>
        <p className="text-sm text-slate-400 mt-1">
          Evidence-based scientific calculators for body composition, metabolism, and strength capacity.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left: Calculator Selector Menu (1 Col) */}
        <div className="space-y-2 lg:col-span-1">
          {calculatorsList.map((calc) => {
            const Icon = calc.icon;
            const isSelected = selectedCalc === calc.key;
            return (
              <div
                key={calc.key}
                onClick={() => setSelectedCalc(calc.key)}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                  isSelected
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 shadow-glow-emerald'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  <div className="text-left">
                    <p className="text-xs font-bold">{calc.label}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 opacity-70" />
              </div>
            );
          })}
        </div>

        {/* Right: Active Calculator Form & Result Card (3 Cols) */}
        <div className="lg:col-span-3">
          {/* 1. BMI CALCULATOR */}
          {selectedCalc === 'bmi' && (
            <Card className="p-6 space-y-5">
              <CardHeader
                title="Body Mass Index (BMI) Calculator"
                subtitle="Calculates body mass normalized for height according to World Health Organization criteria."
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label={`Weight (${weightUnit})`}
                  type="number"
                  step="0.5"
                  value={bmiWeight}
                  onChange={(e) => setBmiWeight(parseFloat(e.target.value))}
                />
                <Input
                  label={`Height (${lengthUnit})`}
                  type="number"
                  step="1"
                  value={bmiHeight}
                  onChange={(e) => setBmiHeight(parseFloat(e.target.value))}
                />
              </div>
              <Button variant="primary" size="md" onClick={calculateBMI}>
                Calculate BMI
              </Button>
              {bmiResult && (
                <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-semibold">Your BMI</span>
                    <Badge variant={bmiResult.category === 'Normal weight' ? 'emerald' : 'amber'}>
                      {bmiResult.category}
                    </Badge>
                  </div>
                  <div className="text-4xl font-black text-white my-2">{bmiResult.bmi}</div>
                  <p className="text-xs text-slate-400">
                    A BMI of 18.5 – 24.9 indicates healthy body weight for your height.
                  </p>
                </div>
              )}
            </Card>
          )}

          {/* 2. BMR CALCULATOR */}
          {selectedCalc === 'bmr' && (
            <Card className="p-6 space-y-5">
              <CardHeader
                title="Basal Metabolic Rate (BMR)"
                subtitle="Calculates resting energy expenditure via the Mifflin-St Jeor formula."
              />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Input
                  label={`Weight (${weightUnit})`}
                  type="number"
                  value={bmrWeight}
                  onChange={(e) => setBmrWeight(parseFloat(e.target.value))}
                />
                <Input
                  label={`Height (${lengthUnit})`}
                  type="number"
                  value={bmrHeight}
                  onChange={(e) => setBmrHeight(parseFloat(e.target.value))}
                />
                <Input
                  label="Age"
                  type="number"
                  value={bmrAge}
                  onChange={(e) => setBmrAge(parseInt(e.target.value))}
                />
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Gender</label>
                  <select
                    value={bmrGender}
                    onChange={(e) => setBmrGender(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>
              <Button variant="primary" size="md" onClick={calculateBMR}>
                Calculate BMR
              </Button>
              {bmrResult && (
                <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 animate-in fade-in text-center">
                  <span className="text-xs text-slate-400 font-semibold uppercase">Basal Metabolic Rate</span>
                  <div className="text-4xl font-black text-emerald-400 my-2">
                    {bmrResult.bmr} <span className="text-sm text-slate-300">kcal / day</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    The number of calories your body burns at complete bed rest without movement.
                  </p>
                </div>
              )}
            </Card>
          )}

          {/* 3. TDEE CALCULATOR */}
          {selectedCalc === 'tdee' && (
            <Card className="p-6 space-y-5">
              <CardHeader
                title="Total Daily Energy Expenditure (TDEE)"
                subtitle="Daily calories burned including exercise and non-exercise physical activity."
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Basal Metabolic Rate (BMR in kcal)"
                  type="number"
                  value={tdeeBmr}
                  onChange={(e) => setTdeeBmr(parseInt(e.target.value))}
                />
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Activity Multiplier</label>
                  <select
                    value={tdeeActivity}
                    onChange={(e) => setTdeeActivity(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                  >
                    <option value="sedentary">Sedentary (Desk Job, 1.2x)</option>
                    <option value="light">Light Activity (1-3 days/wk, 1.375x)</option>
                    <option value="moderate">Moderate Activity (3-5 days/wk, 1.55x)</option>
                    <option value="active">Active (6-7 days/wk, 1.725x)</option>
                    <option value="very_active">Very Active (Athlete, 1.9x)</option>
                  </select>
                </div>
              </div>
              <Button variant="primary" size="md" onClick={calculateTDEE}>
                Calculate TDEE
              </Button>
              {tdeeResult && (
                <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 animate-in fade-in text-center">
                  <span className="text-xs text-slate-400 font-semibold uppercase">Daily Maintenance Energy</span>
                  <div className="text-4xl font-black text-cyan-400 my-2">
                    {tdeeResult.tdee} <span className="text-sm text-slate-300">kcal / day</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Consuming this exact caloric intake will maintain your current body weight.
                  </p>
                </div>
              )}
            </Card>
          )}

          {/* 4. CALORIE GOAL CALCULATOR */}
          {selectedCalc === 'calorie_goal' && (
            <Card className="p-6 space-y-5">
              <CardHeader
                title="Calorie Target Deficit / Surplus"
                subtitle="Calculates optimal caloric budgets based on your exact training objective."
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Current TDEE (kcal/day)"
                  type="number"
                  value={goalTdee}
                  onChange={(e) => setGoalTdee(parseInt(e.target.value))}
                />
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Primary Objective</label>
                  <select
                    value={goalChoice}
                    onChange={(e) => setGoalChoice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                  >
                    <option value="lose_fat">Fat Loss (-500 kcal)</option>
                    <option value="build_muscle">Lean Muscle Gain (+300 kcal)</option>
                    <option value="recomposition">Body Recomposition (-200 kcal)</option>
                    <option value="maintain">Weight Maintenance (0 kcal)</option>
                  </select>
                </div>
              </div>
              <Button variant="primary" size="md" onClick={calculateCalorieGoal}>
                Calculate Target Calories
              </Button>
              {calorieResult && (
                <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 animate-in fade-in text-center">
                  <span className="text-xs text-slate-400 font-semibold uppercase">Target Daily Caloric Intake</span>
                  <div className="text-4xl font-black text-emerald-400 my-2">
                    {calorieResult.targetCalories} <span className="text-sm text-slate-300">kcal</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Adjustment of {calorieResult.delta > 0 ? `+${calorieResult.delta}` : calorieResult.delta} kcal from your maintenance level.
                  </p>
                </div>
              )}
            </Card>
          )}

          {/* 5. PROTEIN CALCULATOR */}
          {selectedCalc === 'protein' && (
            <Card className="p-6 space-y-5">
              <CardHeader
                title="Optimal Protein Intake Calculator"
                subtitle="Determines daily protein requirements to optimize muscle protein synthesis."
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label={`Body Weight (${weightUnit})`}
                  type="number"
                  value={proteinWeight}
                  onChange={(e) => setProteinWeight(parseFloat(e.target.value))}
                />
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Goal</label>
                  <select
                    value={proteinGoal}
                    onChange={(e) => setProteinGoal(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                  >
                    <option value="build_muscle">Hypertrophy (1.8 - 2.2 g/kg)</option>
                    <option value="lose_fat">Fat Loss / Retention (2.0 - 2.4 g/kg)</option>
                    <option value="maintain">Maintenance (1.4 - 1.8 g/kg)</option>
                  </select>
                </div>
              </div>
              <Button variant="primary" size="md" onClick={calculateProtein}>
                Calculate Protein
              </Button>
              {proteinResult && (
                <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 animate-in fade-in text-center">
                  <span className="text-xs text-slate-400 font-semibold uppercase">Recommended Range</span>
                  <div className="text-4xl font-black text-cyan-400 my-2">
                    {proteinResult.minG}g – {proteinResult.maxG}g
                  </div>
                  <p className="text-xs text-slate-400">
                    Optimal sweet-spot recommendation: <span className="font-bold text-white">{proteinResult.avgG}g protein</span> per day.
                  </p>
                </div>
              )}
            </Card>
          )}

          {/* 6. 1RM CALCULATOR */}
          {selectedCalc === '1rm' && (
            <Card className="p-6 space-y-5">
              <CardHeader
                title="One-Rep Max (1RM) Calculator"
                subtitle="Epley formula estimation with full rep-max percentage distribution table."
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label={`Weight Lifted (${weightUnit})`}
                  type="number"
                  value={oneRmWeight}
                  onChange={(e) => setOneRmWeight(parseFloat(e.target.value))}
                />
                <Input
                  label="Repetitions Completed"
                  type="number"
                  min="1"
                  max="30"
                  value={oneRmReps}
                  onChange={(e) => setOneRmReps(parseInt(e.target.value))}
                />
              </div>
              <Button variant="primary" size="md" onClick={calculateOneRM}>
                Calculate 1RM
              </Button>
              {oneRmResult && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
                    <span className="text-xs text-slate-400 uppercase font-bold">Estimated 1RM</span>
                    <div className="text-4xl font-black text-amber-400 my-1">
                      {oneRmResult.epley} {weightUnit}
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="border-b border-slate-800 text-slate-400 uppercase">
                        <tr>
                          <th className="py-2 px-3">Reps</th>
                          <th className="py-2 px-3">% 1RM</th>
                          <th className="py-2 px-3">Est. Weight ({weightUnit})</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {oneRmResult.percentages.map((p) => (
                          <tr key={p.reps}>
                            <td className="py-2 px-3 font-semibold text-slate-300">{p.reps} Reps</td>
                            <td className="py-2 px-3 text-slate-400">{p.pct}%</td>
                            <td className="py-2 px-3 font-bold text-white">{p.weight} {weightUnit}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* 7. MACRO SPLIT CALCULATOR */}
          {selectedCalc === 'macros' && (
            <Card className="p-6 space-y-5">
              <CardHeader
                title="Macronutrient Split Calculator"
                subtitle="Calculates protein, carbs, and fat gram distributions based on custom caloric budgets."
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Daily Calories (kcal)"
                  type="number"
                  value={macroCalories}
                  onChange={(e) => setMacroCalories(parseInt(e.target.value))}
                />
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Dietary Profile</label>
                  <select
                    value={macroSplit}
                    onChange={(e) => setMacroSplit(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                  >
                    <option value="balanced">Balanced (30% P / 45% C / 25% F)</option>
                    <option value="high_protein">High Protein (40% P / 35% C / 25% F)</option>
                    <option value="low_carb">Low Carb (35% P / 20% C / 45% F)</option>
                    <option value="keto">Ketogenic (25% P / 5% C / 70% F)</option>
                  </select>
                </div>
              </div>
              <Button variant="primary" size="md" onClick={calculateMacroSplit}>
                Calculate Macro Split
              </Button>
              {macroResult && (
                <div className="grid grid-cols-3 gap-3 animate-in fade-in text-center">
                  <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
                    <span className="text-[10px] text-cyan-400 font-bold uppercase">Protein</span>
                    <p className="text-2xl font-black text-white mt-1">{macroResult.pG}g</p>
                    <p className="text-[10px] text-slate-400">{macroResult.pPct}% of calories</p>
                  </div>
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                    <span className="text-[10px] text-emerald-400 font-bold uppercase">Carbs</span>
                    <p className="text-2xl font-black text-white mt-1">{macroResult.cG}g</p>
                    <p className="text-[10px] text-slate-400">{macroResult.cPct}% of calories</p>
                  </div>
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                    <span className="text-[10px] text-amber-400 font-bold uppercase">Fat</span>
                    <p className="text-2xl font-black text-white mt-1">{macroResult.fG}g</p>
                    <p className="text-[10px] text-slate-400">{macroResult.fPct}% of calories</p>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* 8. WEIGHT GOAL TIMELINE */}
          {selectedCalc === 'timeline' && (
            <Card className="p-6 space-y-5">
              <CardHeader
                title="Weight Goal Timeline Calculator"
                subtitle="Calculates an achievable target date based on safe weekly weight progression rates."
              />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label={`Current Weight (${weightUnit})`}
                  type="number"
                  step="0.5"
                  value={timelineCurrent}
                  onChange={(e) => setTimelineCurrent(parseFloat(e.target.value))}
                />
                <Input
                  label={`Goal Weight (${weightUnit})`}
                  type="number"
                  step="0.5"
                  value={timelineGoal}
                  onChange={(e) => setTimelineGoal(parseFloat(e.target.value))}
                />
                <Input
                  label={`Rate (${weightUnit} / week)`}
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="1.5"
                  value={timelineRate}
                  onChange={(e) => setTimelineRate(parseFloat(e.target.value))}
                />
              </div>
              <Button variant="primary" size="md" onClick={calculateTimeline}>
                Calculate Completion Date
              </Button>
              {timelineResult && (
                <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 animate-in fade-in text-center space-y-2">
                  <Badge variant="emerald" size="sm">
                    {timelineResult.direction} of {timelineResult.totalKg} {weightUnit}
                  </Badge>
                  <div className="text-3xl font-black text-white">
                    Estimated Target: <span className="text-emerald-400">{timelineResult.targetDate}</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Approximately <span className="font-bold text-white">{timelineResult.weeks} weeks</span> ({timelineResult.days} days) of steady, sustainable progress.
                  </p>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
