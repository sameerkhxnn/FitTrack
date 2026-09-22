import React, { useState, useEffect } from 'react';
import { 
  Ruler, Plus, Calendar, Edit2, Trash2, ArrowRightLeft, 
  TrendingDown, TrendingUp, Check, Info 
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { useUnits } from '../context/UnitContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { Card, CardHeader } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';

export const MeasurementsPage = () => {
  const { formatCircumference, lengthUnit } = useUnits();
  const toast = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [measurements, setMeasurements] = useState([]);

  // Modal for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    waist: '',
    chest: '',
    arms: '',
    shoulders: '',
    thighs: '',
    hips: '',
    neck: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Compare Tool states
  const [compareDate1, setCompareDate1] = useState('');
  const [compareDate2, setCompareDate2] = useState('');
  const [comparisonResult, setComparisonResult] = useState(null);
  const [isComparing, setIsComparing] = useState(false);

  const fetchMeasurements = async () => {
    setIsLoading(true);
    try {
      const data = await api.get('/measurements');
      setMeasurements(data || []);
      if (data && data.length >= 2) {
        setCompareDate1(data[data.length - 1].date);
        setCompareDate2(data[0].date);
      }
    } catch (err) {
      toast.error('Failed to load body measurements.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMeasurements();
  }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      date: new Date().toISOString().slice(0, 10),
      waist: '',
      chest: '',
      arms: '',
      shoulders: '',
      thighs: '',
      hips: '',
      neck: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (m) => {
    setEditingId(m.id);
    setFormData({
      date: m.date,
      waist: m.waist || '',
      chest: m.chest || '',
      arms: m.arms || '',
      shoulders: m.shoulders || '',
      thighs: m.thighs || '',
      hips: m.hips || '',
      neck: m.neck || '',
      notes: m.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      date: formData.date,
      waist: formData.waist ? parseFloat(formData.waist) : null,
      chest: formData.chest ? parseFloat(formData.chest) : null,
      arms: formData.arms ? parseFloat(formData.arms) : null,
      shoulders: formData.shoulders ? parseFloat(formData.shoulders) : null,
      thighs: formData.thighs ? parseFloat(formData.thighs) : null,
      hips: formData.hips ? parseFloat(formData.hips) : null,
      neck: formData.neck ? parseFloat(formData.neck) : null,
      notes: formData.notes || null,
    };

    try {
      if (editingId) {
        await api.put(`/measurements/${editingId}`, payload);
        toast.success('Measurements updated successfully!');
      } else {
        await api.post('/measurements', payload);
        toast.success('Measurements recorded!');
      }
      setIsModalOpen(false);
      await fetchMeasurements();
    } catch (err) {
      toast.error(err.message || 'Failed to save measurements.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this measurement entry?')) return;
    try {
      await api.delete(`/measurements/${id}`);
      toast.success('Measurement entry deleted.');
      await fetchMeasurements();
    } catch (err) {
      toast.error('Failed to delete measurement.');
    }
  };

  const handleRunComparison = async () => {
    if (!compareDate1 || !compareDate2) {
      toast.error('Please select two dates to compare.');
      return;
    }
    setIsComparing(true);
    try {
      const res = await api.get('/measurements/compare', {
        date1: compareDate1,
        date2: compareDate2,
      });
      setComparisonResult(res);
    } catch (err) {
      toast.error(err.message || 'Could not compare selected dates.');
    } finally {
      setIsComparing(false);
    }
  };

  // Chronological chart data
  const chartData = [...measurements]
    .reverse()
    .map((m) => ({
      date: m.date.slice(5),
      Waist: m.waist,
      Chest: m.chest,
      Arms: m.arms,
      Shoulders: m.shoulders,
      Thighs: m.thighs,
      Hips: m.hips,
    }));

  const sites = [
    { key: 'waist', label: 'Waist' },
    { key: 'chest', label: 'Chest' },
    { key: 'arms', label: 'Arms' },
    { key: 'shoulders', label: 'Shoulders' },
    { key: 'thighs', label: 'Thighs' },
    { key: 'hips', label: 'Hips' },
    { key: 'neck', label: 'Neck' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Body Measurements</h1>
          <p className="text-sm text-slate-400 mt-1">
            Track anatomical circumference changes across 7 key body landmarks.
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          icon={Plus}
          onClick={handleOpenAdd}
        >
          Add Measurement
        </Button>
      </div>

      {/* Date Comparison Utility Card */}
      <Card className="p-6 bg-gradient-to-r from-slate-900 to-slate-950 border-cyan-500/20">
        <div className="flex items-center gap-2 mb-4">
          <ArrowRightLeft className="w-5 h-5 text-cyan-400" />
          <h3 className="font-bold text-base text-white">Date-to-Date Comparison Engine</h3>
        </div>

        <div className="flex flex-col sm:flex-row items-end gap-4">
          <div className="flex-1 w-full">
            <label className="block text-xs font-medium text-slate-400 mb-1">Baseline Date</label>
            <select
              value={compareDate1}
              onChange={(e) => setCompareDate1(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
            >
              <option value="">Select date</option>
              {measurements.map((m) => (
                <option key={`d1-${m.id}`} value={m.date}>
                  {m.date}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 w-full">
            <label className="block text-xs font-medium text-slate-400 mb-1">Target Date</label>
            <select
              value={compareDate2}
              onChange={(e) => setCompareDate2(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
            >
              <option value="">Select date</option>
              {measurements.map((m) => (
                <option key={`d2-${m.id}`} value={m.date}>
                  {m.date}
                </option>
              ))}
            </select>
          </div>

          <Button
            variant="cyan"
            size="md"
            onClick={handleRunComparison}
            isLoading={isComparing}
            className="w-full sm:w-auto"
          >
            Compare Dates
          </Button>
        </div>

        {/* Comparison Result Badges */}
        {comparisonResult && (
          <div className="mt-6 pt-5 border-t border-slate-800">
            <div className="text-xs font-semibold text-slate-300 mb-3">
              Delta from {comparisonResult.first_date} to {comparisonResult.second_date}:
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {Object.entries(comparisonResult.diffs).map(([site, diff]) => (
                <div key={site} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400">{site}</span>
                  <div className="mt-1">
                    {diff !== null ? (
                      <span
                        className={`text-base font-black ${
                          diff < 0
                            ? 'text-emerald-400'
                            : diff > 0
                            ? 'text-cyan-400'
                            : 'text-slate-400'
                        }`}
                      >
                        {diff > 0 ? `+${diff}` : diff} {lengthUnit}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-600">--</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Progression Multi-Line Chart */}
      <Card className="p-6">
        <CardHeader
          title="Measurement Trajectory"
          subtitle="Circumference trends across recording dates"
        />

        <div className="h-72 w-full mt-2">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} domain={['dataMin - 2', 'dataMax + 2']} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e293b',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#f8fafc',
                  }}
                  formatter={(val, name) => [`${val} ${lengthUnit}`, name]}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="Waist" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                <Line type="monotone" dataKey="Chest" stroke="#06b6d4" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                <Line type="monotone" dataKey="Arms" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                <Line type="monotone" dataKey="Thighs" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-2xl p-6 text-center">
              <Ruler className="w-10 h-10 text-slate-600 mb-2" />
              <p className="text-sm font-semibold text-slate-300">No body measurements recorded yet</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={handleOpenAdd}
              >
                Log First Measurements
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Measurement History Table */}
      <Card className="p-6">
        <CardHeader
          title="Measurement Log Entries"
          subtitle={`${measurements.length} total entries`}
        />

        {measurements.length === 0 ? (
          <p className="text-center py-8 text-xs text-slate-500">No measurement records logged yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Waist</th>
                  <th className="py-3 px-3">Chest</th>
                  <th className="py-3 px-3">Arms</th>
                  <th className="py-3 px-3">Shoulders</th>
                  <th className="py-3 px-3">Thighs</th>
                  <th className="py-3 px-3">Hips</th>
                  <th className="py-3 px-3">Neck</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {measurements.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-200">{m.date}</td>
                    <td className="py-3 px-3 font-bold text-white">{formatCircumference(m.waist)}</td>
                    <td className="py-3 px-3 text-slate-300">{formatCircumference(m.chest)}</td>
                    <td className="py-3 px-3 text-slate-300">{formatCircumference(m.arms)}</td>
                    <td className="py-3 px-3 text-slate-300">{formatCircumference(m.shoulders)}</td>
                    <td className="py-3 px-3 text-slate-300">{formatCircumference(m.thighs)}</td>
                    <td className="py-3 px-3 text-slate-300">{formatCircumference(m.hips)}</td>
                    <td className="py-3 px-3 text-slate-300">{formatCircumference(m.neck)}</td>
                    <td className="py-3 px-3 text-right space-x-1.5">
                      <button
                        onClick={() => handleOpenEdit(m)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
                        title="Edit Entry"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(m.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                        title="Delete Entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal for Logging / Editing */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit Body Measurements' : 'Log Body Measurements'}
        subtitle="Leave any fields empty that you do not wish to track"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Date of Measurement"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            icon={Calendar}
            required
          />

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {sites.map((s) => (
              <Input
                key={s.key}
                label={`${s.label} (${lengthUnit})`}
                type="number"
                step="0.1"
                placeholder="Optional"
                value={formData[s.key]}
                onChange={(e) => setFormData({ ...formData, [s.key]: e.target.value })}
              />
            ))}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Notes (Optional)</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g. Measured in morning before breakfast."
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
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
              {editingId ? 'Save Changes' : 'Save Measurements'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
