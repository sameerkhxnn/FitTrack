import React, { useState, useEffect } from 'react';
import { 
  Scale, Plus, Calendar, TrendingDown, TrendingUp, Edit2, 
  Trash2 
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useUnits } from '../context/UnitContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { Card, CardHeader } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import { TableSkeleton } from '../components/common/SkeletonLoader';

export const WeightPage = () => {
  const { formatWeight, weightUnit } = useUnits();
  const toast = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [entries, setEntries] = useState([]);
  const [stats, setStats] = useState(null);
  const [filterDays, setFilterDays] = useState(30);

  // Modal for adding / editing
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [modalWeight, setModalWeight] = useState('');
  const [modalDate, setModalDate] = useState(new Date().toISOString().slice(0, 10));
  const [modalNotes, setModalNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchWeights = async (days = filterDays) => {
    setIsLoading(true);
    try {
      const [entriesData, statsData] = await Promise.all([
        api.get('/weights', days ? { days } : {}),
        api.get('/weights/stats'),
      ]);
      setEntries(entriesData || []);
      setStats(statsData);
    } catch (err) {
      toast.error('Failed to load weight tracking data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWeights(filterDays);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterDays]);

  const handleOpenAddModal = () => {
    setEditingId(null);
    setModalWeight(stats?.current_weight || '');
    setModalDate(new Date().toISOString().slice(0, 10));
    setModalNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (entry) => {
    setEditingId(entry.id);
    setModalWeight(entry.weight);
    setModalDate(entry.date);
    setModalNotes(entry.notes || '');
    setIsModalOpen(true);
  };

  const handleSaveEntry = async (e) => {
    e.preventDefault();
    if (!modalWeight || parseFloat(modalWeight) <= 0) {
      toast.error('Please enter a valid weight.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        await api.put(`/weights/${editingId}`, {
          weight: parseFloat(modalWeight),
          date: modalDate,
          notes: modalNotes,
        });
        toast.success('Weight entry updated successfully!');
      } else {
        await api.post('/weights', {
          weight: parseFloat(modalWeight),
          date: modalDate,
          notes: modalNotes,
        });
        toast.success('Weight entry recorded!');
      }
      setIsModalOpen(false);
      await fetchWeights(filterDays);
    } catch (err) {
      toast.error(err.message || 'Failed to save weight entry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEntry = async (id) => {
    if (!window.confirm('Are you sure you want to delete this weight entry?')) return;

    try {
      await api.delete(`/weights/${id}`);
      toast.success('Weight entry deleted.');
      await fetchWeights(filterDays);
    } catch (err) {
      toast.error('Failed to delete weight entry.');
    }
  };

  // Recharts data
  const chartData = entries.map((entry) => ({
    date: entry.date,
    weight: entry.weight,
    notes: entry.notes,
  }));

  const currentWeight = stats?.current_weight;
  const startingWeight = stats?.starting_weight;
  const goalWeight = stats?.goal_weight;
  const totalChange = stats?.total_change;
  const avgWeekly = stats?.average_weekly_change;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Weight Tracking</h1>
          <p className="text-sm text-slate-400 mt-1">
            Log body mass, evaluate trends, and monitor your goal delta.
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          icon={Plus}
          onClick={handleOpenAddModal}
        >
          Log Weight Entry
        </Button>
      </div>

      {/* Summary Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Current Weight */}
        <Card hoverEffect className="p-4">
          <p className="text-xs font-semibold text-slate-400">Current Weight</p>
          <div className="my-2">
            <span className="text-2xl font-black text-white">
              {currentWeight ? formatWeight(currentWeight, false) : '--'}
            </span>
            <span className="text-xs text-slate-400 ml-1 font-medium">{weightUnit}</span>
          </div>
          <p className="text-[11px] text-slate-500">Most recent log</p>
        </Card>

        {/* Starting Weight */}
        <Card hoverEffect className="p-4">
          <p className="text-xs font-semibold text-slate-400">Starting Weight</p>
          <div className="my-2">
            <span className="text-2xl font-black text-slate-300">
              {startingWeight ? formatWeight(startingWeight, false) : '--'}
            </span>
            <span className="text-xs text-slate-400 ml-1 font-medium">{weightUnit}</span>
          </div>
          <p className="text-[11px] text-slate-500">First recorded baseline</p>
        </Card>

        {/* Goal Weight */}
        <Card hoverEffect className="p-4">
          <p className="text-xs font-semibold text-slate-400">Goal Weight</p>
          <div className="my-2">
            <span className="text-2xl font-black text-cyan-400">
              {goalWeight ? formatWeight(goalWeight, false) : '--'}
            </span>
            <span className="text-xs text-slate-400 ml-1 font-medium">{weightUnit}</span>
          </div>
          <p className="text-[11px] text-slate-500">Target milestone</p>
        </Card>

        {/* Total Change */}
        <Card hoverEffect className="p-4">
          <p className="text-xs font-semibold text-slate-400">Total Change</p>
          <div className="my-2 flex items-baseline">
            <span className={`text-2xl font-black ${totalChange && totalChange < 0 ? 'text-emerald-400' : 'text-cyan-400'}`}>
              {totalChange !== null && totalChange !== undefined
                ? `${totalChange > 0 ? '+' : ''}${formatWeight(totalChange, false)}`
                : '--'}
            </span>
            <span className="text-xs text-slate-400 ml-1 font-medium">{weightUnit}</span>
          </div>
          <p className="text-[11px] text-slate-500">Overall delta</p>
        </Card>

        {/* Average Weekly Change */}
        <Card hoverEffect className="p-4 col-span-2 md:col-span-1">
          <p className="text-xs font-semibold text-slate-400">Weekly Rate</p>
          <div className="my-2">
            <span className="text-2xl font-black text-white">
              {avgWeekly !== null && avgWeekly !== undefined
                ? `${avgWeekly > 0 ? '+' : ''}${formatWeight(avgWeekly, false)}`
                : '--'}
            </span>
            <span className="text-xs text-slate-400 ml-1 font-medium">{weightUnit}/wk</span>
          </div>
          <p className="text-[11px] text-slate-500">Safe rate: ~0.5kg/wk</p>
        </Card>
      </div>

      {/* Weight Progress Chart Card with Time Filters */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-100">Weight Progression Graph</h3>
            <p className="text-xs text-slate-400 mt-0.5">Interactive area trend of recorded values</p>
          </div>

          {/* Timeframe filters: 7d, 30d, 90d, All Time */}
          <div className="inline-flex p-1 rounded-xl bg-slate-950 border border-slate-800 self-start sm:self-auto">
            {[
              { label: '7 Days', val: 7 },
              { label: '30 Days', val: 30 },
              { label: '90 Days', val: 90 },
              { label: 'All Time', val: null },
            ].map((f) => (
              <button
                key={f.label}
                onClick={() => setFilterDays(f.val)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filterDays === f.val
                    ? 'bg-emerald-500 text-slate-950 shadow-glow-emerald'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chart View */}
        <div className="h-72 w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="weightPageGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} domain={['dataMin - 1', 'dataMax + 1']} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e293b',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#f8fafc',
                  }}
                  formatter={(val) => [`${val} ${weightUnit}`, 'Weight']}
                  labelFormatter={(lbl) => `Date: ${lbl}`}
                />
                <Area
                  type="monotone"
                  dataKey="weight"
                  stroke="#10b981"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#weightPageGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-2xl p-6 text-center">
              <Scale className="w-10 h-10 text-slate-600 mb-2" />
              <p className="text-sm font-semibold text-slate-300">No entries in this time range</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={handleOpenAddModal}
              >
                Log Entry
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Weight History Table */}
      <Card className="p-6">
        <CardHeader
          title="Weight Log History"
          subtitle={`${entries.length} recorded entries`}
        />

        {isLoading ? (
          <TableSkeleton rows={5} />
        ) : entries.length === 0 ? (
          <p className="text-center py-8 text-xs text-slate-500">No weight records found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Weight ({weightUnit})</th>
                  <th className="py-3 px-4">Delta</th>
                  <th className="py-3 px-4">Notes</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {entries.map((entry, idx) => {
                  const prevEntry = idx > 0 ? entries[idx - 1] : null;
                  const delta = prevEntry ? roundDelta(entry.weight - prevEntry.weight) : null;

                  return (
                    <tr key={entry.id} className="hover:bg-slate-850/50 transition-colors">
                      <td className="py-3 px-4 font-medium text-slate-200">
                        {entry.date}
                      </td>
                      <td className="py-3 px-4 font-bold text-white">
                        {formatWeight(entry.weight, false)}
                      </td>
                      <td className="py-3 px-4">
                        {delta !== null ? (
                          <span className={delta > 0 ? 'text-cyan-400' : delta < 0 ? 'text-emerald-400' : 'text-slate-500'}>
                            {delta > 0 ? `+${delta}` : delta} {weightUnit}
                          </span>
                        ) : (
                          <span className="text-slate-600">--</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-400 max-w-xs truncate">
                        {entry.notes || <span className="text-slate-600 italic">No notes</span>}
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEditModal(entry)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
                          title="Edit Entry"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteEntry(entry.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                          title="Delete Entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add / Edit Entry Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit Weight Entry' : 'Log New Weight'}
        subtitle="Record your body mass with optional date and notes"
      >
        <form onSubmit={handleSaveEntry} className="space-y-4">
          <Input
            label={`Weight (${weightUnit})`}
            type="number"
            step="0.1"
            min="20"
            max="400"
            value={modalWeight}
            onChange={(e) => setModalWeight(e.target.value)}
            icon={Scale}
            required
            autoFocus
          />

          <Input
            label="Date"
            type="date"
            value={modalDate}
            onChange={(e) => setModalDate(e.target.value)}
            icon={Calendar}
            required
          />

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Notes (Optional)</label>
            <textarea
              rows={3}
              value={modalNotes}
              onChange={(e) => setModalNotes(e.target.value)}
              placeholder="e.g., Weighed fasted after waking up, pre-workout."
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <Button
              variant="ghost"
              size="md"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
            >
              {editingId ? 'Save Changes' : 'Save Entry'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

function roundDelta(val) {
  return Math.round(val * 10) / 10;
}
