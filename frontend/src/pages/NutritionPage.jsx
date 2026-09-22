import React, { useState, useEffect } from 'react';
import { 
  Utensils, Plus, Calendar, Trash2, PieChart as PieIcon, 
  Flame, Activity, Apple, Coffee, Pizza, Cookie 
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { Card, CardHeader } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';

export const NutritionPage = () => {
  const toast = useToast();

  const [currentDate, setCurrentDate] = useState(new Date().toISOString().slice(0, 10));
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Quick Food Log Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [foodName, setFoodName] = useState('');
  const [mealType, setMealType] = useState('lunch');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSummary = async (dateStr = currentDate) => {
    setIsLoading(true);
    try {
      const data = await api.get('/nutrition/summary', { log_date: dateStr });
      setSummary(data);
    } catch (err) {
      toast.error('Failed to load nutrition summary.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary(currentDate);
  }, [currentDate]);

  const handleAddFood = async (e) => {
    e.preventDefault();
    if (!foodName || !calories) {
      toast.error('Please specify food name and calories.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/nutrition', {
        food_name: foodName,
        meal_type: mealType,
        calories: parseFloat(calories) || 0,
        protein: parseFloat(protein) || 0,
        carbs: parseFloat(carbs) || 0,
        fat: parseFloat(fat) || 0,
        date: currentDate,
      });
      toast.success(`${foodName} logged successfully!`);
      setIsModalOpen(false);
      setFoodName('');
      setCalories('');
      setProtein('');
      setCarbs('');
      setFat('');
      await fetchSummary(currentDate);
    } catch (err) {
      toast.error(err.message || 'Failed to log food.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLog = async (id) => {
    try {
      await api.delete(`/nutrition/${id}`);
      toast.success('Food log removed.');
      await fetchSummary(currentDate);
    } catch (err) {
      toast.error('Failed to delete food entry.');
    }
  };

  const mealIcons = {
    breakfast: Coffee,
    lunch: Utensils,
    dinner: Pizza,
    snack: Cookie,
  };

  const macroData = [
    { name: 'Protein', value: summary ? summary.total_protein * 4 : 0, color: '#06b6d4', grams: summary?.total_protein || 0 },
    { name: 'Carbs', value: summary ? summary.total_carbs * 4 : 0, color: '#10b981', grams: summary?.total_carbs || 0 },
    { name: 'Fat', value: summary ? summary.total_fat * 9 : 0, color: '#f59e0b', grams: summary?.total_fat || 0 },
  ];

  const totalCals = summary?.total_calories || 0;
  const targetCals = summary?.target_calories || 2200;
  const remainingCals = Math.max(0, targetCals - totalCals);

  // Group logs by meal type
  const logsByMeal = {
    breakfast: [],
    lunch: [],
    dinner: [],
    snack: [],
  };
  summary?.logs?.forEach((l) => {
    if (logsByMeal[l.meal_type]) {
      logsByMeal[l.meal_type].push(l);
    } else {
      logsByMeal.lunch.push(l);
    }
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Daily Nutrition & Macros</h1>
          <p className="text-sm text-slate-400 mt-1">
            Log meals, balance macronutrients, and monitor remaining caloric energy budgets.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="date"
            value={currentDate}
            onChange={(e) => setCurrentDate(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
          />
          <Button
            variant="primary"
            size="md"
            icon={Plus}
            onClick={() => setIsModalOpen(true)}
          >
            Log Food
          </Button>
        </div>
      </div>

      {/* Top Calorie Budget & Macro Rings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calories Ring / Overview (1 Col) */}
        <Card className="p-6 flex flex-col justify-between">
          <CardHeader
            title="Energy Budget"
            subtitle="Target calories vs consumed"
          />

          <div className="flex items-center justify-around my-2">
            <div className="text-center">
              <span className="text-xs text-slate-400 font-semibold uppercase">Consumed</span>
              <p className="text-3xl font-black text-white mt-1">{Math.round(totalCals)}</p>
              <p className="text-[10px] text-slate-500">kcal</p>
            </div>

            <div className="h-14 w-[1px] bg-slate-800" />

            <div className="text-center">
              <span className="text-xs text-emerald-400 font-semibold uppercase">Remaining</span>
              <p className="text-3xl font-black text-emerald-400 mt-1">{Math.round(remainingCals)}</p>
              <p className="text-[10px] text-slate-500">kcal / {Math.round(targetCals)} target</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-emerald-400 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (totalCals / targetCals) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-500 mt-1.5">
              <span>0 kcal</span>
              <span>{Math.round((totalCals / targetCals) * 100)}% of goal</span>
              <span>{Math.round(targetCals)} kcal</span>
            </div>
          </div>
        </Card>

        {/* Macro Distribution Donut (1 Col) */}
        <Card className="p-6 flex flex-col justify-between">
          <CardHeader
            title="Macro Breakdown"
            subtitle="Caloric contribution from protein, carbs, and fat"
          />

          <div className="h-44 w-full flex items-center justify-center">
            {totalCals > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#1e293b',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: '#f8fafc',
                    }}
                    formatter={(val, name, entry) => [
                      `${Math.round(val)} kcal (${entry.payload.grams}g)`,
                      name,
                    ]}
                  />
                  <Pie
                    data={macroData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {macroData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-500 text-center">No foods logged today</p>
            )}
          </div>

          <div className="flex justify-around text-xs pt-3 border-t border-slate-800/80">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              <span className="text-slate-400">Protein:</span>
              <span className="font-bold text-white">{Math.round(summary?.total_protein || 0)}g</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span className="text-slate-400">Carbs:</span>
              <span className="font-bold text-white">{Math.round(summary?.total_carbs || 0)}g</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="text-slate-400">Fat:</span>
              <span className="font-bold text-white">{Math.round(summary?.total_fat || 0)}g</span>
            </div>
          </div>
        </Card>

        {/* Macro Progress Bars (1 Col) */}
        <Card className="p-6 space-y-4">
          <CardHeader
            title="Targets & Compliance"
            subtitle="Adherence to personalized metabolic goals"
          />

          {/* Protein Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-slate-300">Protein Target</span>
              <span className="text-cyan-400 font-bold">
                {Math.round(summary?.total_protein || 0)} / {Math.round(summary?.target_protein || 150)}g
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-cyan-400 h-2 rounded-full"
                style={{
                  width: `${Math.min(100, ((summary?.total_protein || 0) / (summary?.target_protein || 150)) * 100)}%`,
                }}
              />
            </div>
          </div>

          {/* Carbs Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-slate-300">Carbohydrates Target</span>
              <span className="text-emerald-400 font-bold">
                {Math.round(summary?.total_carbs || 0)} / {Math.round(summary?.target_carbs || 250)}g
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-400 h-2 rounded-full"
                style={{
                  width: `${Math.min(100, ((summary?.total_carbs || 0) / (summary?.target_carbs || 250)) * 100)}%`,
                }}
              />
            </div>
          </div>

          {/* Fat Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-slate-300">Fats Target</span>
              <span className="text-amber-400 font-bold">
                {Math.round(summary?.total_fat || 0)} / {Math.round(summary?.target_fat || 65)}g
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-amber-400 h-2 rounded-full"
                style={{
                  width: `${Math.min(100, ((summary?.total_fat || 0) / (summary?.target_fat || 65)) * 100)}%`,
                }}
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Meal Breakdown List */}
      <div className="space-y-4">
        {['breakfast', 'lunch', 'dinner', 'snack'].map((mType) => {
          const Icon = mealIcons[mType];
          const logs = logsByMeal[mType];
          const mealCals = logs.reduce((sum, item) => sum + item.calories, 0);

          return (
            <Card key={mType} className="p-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-emerald-400 capitalize">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100 capitalize">{mType}</h3>
                    <p className="text-[11px] text-slate-400">{logs.length} items logged</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm font-black text-white">{Math.round(mealCals)} kcal</span>
                  <button
                    onClick={() => {
                      setMealType(mType);
                      setIsModalOpen(true);
                    }}
                    className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                    title={`Add food to ${mType}`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {logs.length === 0 ? (
                <p className="text-xs text-slate-600 italic py-3">No foods recorded for {mType}.</p>
              ) : (
                <div className="divide-y divide-slate-800/40">
                  {logs.map((log) => (
                    <div key={log.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-slate-200">{log.food_name}</p>
                        <p className="text-[11px] text-slate-400">
                          {log.protein}g P • {log.carbs}g C • {log.fat}g F
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-bold text-white">{Math.round(log.calories)} kcal</span>
                        <button
                          onClick={() => handleDeleteLog(log.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Log Food Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Log Food & Nutrition"
        subtitle="Record meal items with macronutrient totals"
      >
        <form onSubmit={handleAddFood} className="space-y-4">
          <Input
            label="Food / Meal Description"
            placeholder="e.g. 200g Grilled Chicken Breast & Brown Rice"
            value={foodName}
            onChange={(e) => setFoodName(e.target.value)}
            required
            autoFocus
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Meal Type</label>
              <select
                value={mealType}
                onChange={(e) => setMealType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white capitalize focus:outline-none focus:border-emerald-500"
              >
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
              </select>
            </div>

            <Input
              label="Calories (kcal)"
              type="number"
              min="0"
              placeholder="e.g. 450"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Protein (g)"
              type="number"
              step="0.5"
              min="0"
              placeholder="0"
              value={protein}
              onChange={(e) => setProtein(e.target.value)}
            />
            <Input
              label="Carbs (g)"
              type="number"
              step="0.5"
              min="0"
              placeholder="0"
              value={carbs}
              onChange={(e) => setCarbs(e.target.value)}
            />
            <Input
              label="Fat (g)"
              type="number"
              step="0.5"
              min="0"
              placeholder="0"
              value={fat}
              onChange={(e) => setFat(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button variant="ghost" size="md" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" isLoading={isSubmitting}>
              Log Item
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
