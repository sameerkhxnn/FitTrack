import React, { useState, useEffect } from 'react';
import { 
  Dumbbell, Plus, Play, Clock, CheckCircle2, Trophy, 
  Trash2, Edit3, ChevronDown, ChevronUp, Timer, X
} from 'lucide-react';
import { useUnits } from '../context/UnitContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';

export const WorkoutsPage = () => {
  const { formatWeight, weightUnit } = useUnits();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('routines'); // 'routines' | 'history'
  const [routines, setRoutines] = useState([]);
  const [sessions, setSessions] = useState([]);

  // Routine Create / Edit Modal
  const [isRoutineModalOpen, setIsRoutineModalOpen] = useState(false);
  const [editingRoutineId, setEditingRoutineId] = useState(null);
  const [routineName, setRoutineName] = useState('');
  const [routineDesc, setRoutineDesc] = useState('');
  const [routineExercises, setRoutineExercises] = useState([]);

  // Live Workout Session Modal
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [liveSessionName, setLiveSessionName] = useState('');
  const [liveRoutineId, setLiveRoutineId] = useState(null);
  const [liveSeconds, setLiveSeconds] = useState(0);
  const [liveSets, setLiveSets] = useState([]);
  const [liveNotes, setLiveNotes] = useState('');

  // Active Rest Timer
  const [restTimerSeconds, setRestTimerSeconds] = useState(0);
  const [isRestTimerRunning, setIsRestTimerRunning] = useState(false);

  // Expandable sessions
  const [expandedSessionId, setExpandedSessionId] = useState(null);

  // Fetch routines and history
  const fetchData = async () => {
    try {
      const [routinesData, sessionsData] = await Promise.all([
        api.get('/workouts/routines'),
        api.get('/workouts/sessions'),
      ]);
      setRoutines(routinesData || []);
      setSessions(sessionsData || []);
    } catch (_err) {
      toast.error('Failed to load workout data.');
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Workout Session Timer
  useEffect(() => {
    let interval = null;
    if (isLiveActive) {
      interval = setInterval(() => {
        setLiveSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isLiveActive]);

  // Rest Countdown Timer
  useEffect(() => {
    let restInterval = null;
    if (isRestTimerRunning && restTimerSeconds > 0) {
      restInterval = setInterval(() => {
        setRestTimerSeconds((prev) => {
          if (prev <= 1) {
            setIsRestTimerRunning(false);
            toast.info('Rest time completed! Ready for your next set.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(restInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRestTimerRunning, restTimerSeconds]);

  const formatTimer = (totalSec) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // --- Routine Builder Handlers ---
  const handleOpenNewRoutine = () => {
    setEditingRoutineId(null);
    setRoutineName('');
    setRoutineDesc('');
    setRoutineExercises([
      { name: 'Barbell Bench Press', target_sets: 3, target_reps: 10, target_weight: 60, rest_time_seconds: 90 },
    ]);
    setIsRoutineModalOpen(true);
  };

  const handleOpenEditRoutine = (r) => {
    setEditingRoutineId(r.id);
    setRoutineName(r.name);
    setRoutineDesc(r.description || '');
    setRoutineExercises(
      r.exercises.map((e) => ({
        name: e.name,
        target_sets: e.target_sets,
        target_reps: e.target_reps,
        target_weight: e.target_weight,
        rest_time_seconds: e.rest_time_seconds,
      }))
    );
    setIsRoutineModalOpen(true);
  };

  const handleAddExerciseToRoutine = () => {
    setRoutineExercises((prev) => [
      ...prev,
      { name: '', target_sets: 3, target_reps: 10, target_weight: 20, rest_time_seconds: 90 },
    ]);
  };

  const handleSaveRoutine = async (e) => {
    e.preventDefault();
    if (!routineName.trim()) {
      toast.error('Please give your routine a name.');
      return;
    }

    try {
      const payload = {
        name: routineName,
        description: routineDesc,
        exercises: routineExercises.filter((ex) => ex.name.trim().length > 0),
      };

      if (editingRoutineId) {
        await api.put(`/workouts/routines/${editingRoutineId}`, payload);
        toast.success('Routine updated successfully!');
      } else {
        await api.post('/workouts/routines', payload);
        toast.success('New workout routine created!');
      }
      setIsRoutineModalOpen(false);
      await fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to save routine.');
    }
  };

  const handleDeleteRoutine = async (id) => {
    if (!window.confirm('Are you sure you want to delete this routine?')) return;
    try {
      await api.delete(`/workouts/routines/${id}`);
      toast.success('Routine deleted.');
      await fetchData();
    } catch (err) {
      toast.error('Failed to delete routine.');
    }
  };

  // --- Live Workout Session Handlers ---
  const handleStartWorkout = (routine = null) => {
    setLiveRoutineId(routine ? routine.id : null);
    setLiveSessionName(routine ? routine.name : 'Custom Workout Session');
    setLiveSeconds(0);
    setLiveNotes('');
    setRestTimerSeconds(0);
    setIsRestTimerRunning(false);

    if (routine && routine.exercises?.length > 0) {
      const initialSets = [];
      routine.exercises.forEach((ex) => {
        for (let s = 1; s <= ex.target_sets; s++) {
          initialSets.push({
            exercise_name: ex.name,
            set_number: s,
            reps: ex.target_reps,
            weight: ex.target_weight,
            completed: false,
            rest_time: ex.rest_time_seconds || 90,
          });
        }
      });
      setLiveSets(initialSets);
    } else {
      setLiveSets([
        { exercise_name: 'Bench Press', set_number: 1, reps: 10, weight: 60, completed: false, rest_time: 90 },
      ]);
    }

    setIsLiveActive(true);
  };

  const handleToggleSetCompleted = (index) => {
    const updated = [...liveSets];
    const isNowDone = !updated[index].completed;
    updated[index].completed = isNowDone;
    setLiveSets(updated);

    if (isNowDone) {
      // Trigger rest timer
      const restDuration = updated[index].rest_time || 90;
      setRestTimerSeconds(restDuration);
      setIsRestTimerRunning(true);
      toast.success(`Set ${updated[index].set_number} done! Starting ${restDuration}s rest timer.`);
    }
  };

  const handleAddLiveSet = (exerciseName) => {
    const existing = liveSets.filter((s) => s.exercise_name === exerciseName);
    const nextSetNum = existing.length + 1;
    const lastSet = existing[existing.length - 1];

    setLiveSets((prev) => [
      ...prev,
      {
        exercise_name: exerciseName,
        set_number: nextSetNum,
        reps: lastSet ? lastSet.reps : 10,
        weight: lastSet ? lastSet.weight : 50,
        completed: false,
        rest_time: 90,
      },
    ]);
  };

  const handleFinishLiveWorkout = async () => {
    const completedSets = liveSets.filter((s) => s.completed);
    if (completedSets.length === 0) {
      if (!window.confirm('No sets are marked as completed. Finish anyway?')) return;
    }

    try {
      const payload = {
        routine_id: liveRoutineId,
        name: liveSessionName,
        date: new Date().toISOString().slice(0, 10),
        duration_seconds: liveSeconds,
        notes: liveNotes,
        sets: liveSets.map((s) => ({
          exercise_name: s.exercise_name,
          set_number: s.set_number,
          reps: parseInt(s.reps) || 0,
          weight: parseFloat(s.weight) || 0,
          completed: s.completed,
          notes: '',
        })),
      };

      const recorded = await api.post('/workouts/sessions', payload);
      toast.success(
        `Workout logged! ${recorded.total_volume} kg lifted across ${Math.round(liveSeconds / 60)} minutes.`
      );
      setIsLiveActive(false);
      await fetchData();
      setActiveTab('history');
    } catch (err) {
      toast.error(err.message || 'Failed to finish workout.');
    }
  };

  // Group live sets by exercise name
  const groupedLiveExercises = liveSets.reduce((acc, curr, index) => {
    if (!acc[curr.exercise_name]) {
      acc[curr.exercise_name] = [];
    }
    acc[curr.exercise_name].push({ ...curr, globalIndex: index });
    return acc;
  }, {});

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Workouts & Training</h1>
          <p className="text-sm text-slate-400 mt-1">
            Build routines, launch active workout tracking with rest timers, and view session history.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="md"
            icon={Plus}
            onClick={handleOpenNewRoutine}
          >
            Create Routine
          </Button>
          <Button
            variant="primary"
            size="md"
            icon={Play}
            onClick={() => handleStartWorkout(null)}
          >
            Quick Start
          </Button>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-800 gap-6">
        <button
          onClick={() => setActiveTab('routines')}
          className={`pb-3 text-sm font-bold transition-all relative ${
            activeTab === 'routines'
              ? 'text-emerald-400 border-b-2 border-emerald-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Workout Routines ({routines.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 text-sm font-bold transition-all relative ${
            activeTab === 'history'
              ? 'text-emerald-400 border-b-2 border-emerald-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Session History ({sessions.length})
        </button>
      </div>

      {/* TAB 1: Routines */}
      {activeTab === 'routines' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {routines.map((routine) => (
            <Card key={routine.id} hoverEffect className="p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Dumbbell className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditRoutine(routine)}
                      className="p-1.5 text-slate-400 hover:text-emerald-400 rounded-lg hover:bg-slate-800 transition-colors"
                      title="Edit Routine"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteRoutine(routine.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                      title="Delete Routine"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-100">{routine.name}</h3>
                {routine.description && (
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{routine.description}</p>
                )}

                {/* Exercises preview list */}
                <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-2">
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    {routine.exercises?.length || 0} Exercises
                  </p>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {routine.exercises?.map((ex, i) => (
                      <div key={ex.id || i} className="flex items-center justify-between text-xs py-1 text-slate-300">
                        <span className="truncate max-w-[160px] font-medium">{ex.name}</span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {ex.target_sets} × {ex.target_reps} @ {formatWeight(ex.target_weight)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800">
                <Button
                  variant="primary"
                  size="md"
                  icon={Play}
                  className="w-full"
                  onClick={() => handleStartWorkout(routine)}
                >
                  Start Workout
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* TAB 2: History */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {sessions.length === 0 ? (
            <Card className="p-12 text-center border-dashed border-slate-800">
              <Dumbbell className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-200">No workout sessions logged yet</h3>
              <p className="text-xs text-slate-400 mt-1">
                Start a session or choose a routine above to log your training history!
              </p>
            </Card>
          ) : (
            sessions.map((sess) => {
              const isExpanded = expandedSessionId === sess.id;
              const durationMins = Math.round(sess.duration_seconds / 60);

              return (
                <Card key={sess.id} className="p-5">
                  <div
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer"
                    onClick={() => setExpandedSessionId(isExpanded ? null : sess.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-emerald-400">
                        <Dumbbell className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-slate-100">{sess.name}</h4>
                        <p className="text-xs text-slate-400">
                          {sess.date} • {durationMins} mins duration • {sess.estimated_calories} kcal burned
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-black text-emerald-400">
                          {formatWeight(sess.total_volume)}
                        </p>
                        <p className="text-[10px] text-slate-500 uppercase font-semibold">Total Volume</p>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Sets Detail Table */}
                  {isExpanded && (
                    <div className="mt-5 pt-5 border-t border-slate-800/80 animate-in fade-in duration-150">
                      <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                        Completed Sets & Lifts
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {sess.sets?.map((s) => (
                          <div
                            key={s.id}
                            className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                              s.is_pr
                                ? 'bg-amber-500/10 border-amber-500/30'
                                : 'bg-slate-950/60 border-slate-800'
                            }`}
                          >
                            <div>
                              <p className="font-bold text-slate-200">{s.exercise_name}</p>
                              <p className="text-slate-400 text-[11px]">
                                Set {s.set_number}: {s.reps} reps × {formatWeight(s.weight)}
                              </p>
                            </div>
                            {s.is_pr && (
                              <Badge variant="amber" size="xs" icon={Trophy}>
                                New PR!
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                      {sess.notes && (
                        <p className="text-xs text-slate-400 mt-4 italic">
                          Session notes: "{sess.notes}"
                        </p>
                      )}
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* Routine Builder Modal */}
      <Modal
        isOpen={isRoutineModalOpen}
        onClose={() => setIsRoutineModalOpen(false)}
        title={editingRoutineId ? 'Edit Routine' : 'Create Workout Routine'}
        subtitle="Configure exercise sequence, target sets, reps, and weights"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSaveRoutine} className="space-y-5">
          <Input
            label="Routine Name"
            placeholder="e.g. Chest & Triceps (Push)"
            value={routineName}
            onChange={(e) => setRoutineName(e.target.value)}
            required
            autoFocus
          />

          <Input
            label="Description (Optional)"
            placeholder="Focus on high-intensity pressing..."
            value={routineDesc}
            onChange={(e) => setRoutineDesc(e.target.value)}
          />

          {/* Exercises list in builder */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Exercises ({routineExercises.length})
              </label>
              <button
                type="button"
                onClick={handleAddExerciseToRoutine}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Exercise</span>
              </button>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {routineExercises.map((ex, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-center gap-3"
                >
                  <div className="flex-1 w-full">
                    <input
                      type="text"
                      placeholder="Exercise Name (e.g. Incline Bench)"
                      value={ex.name}
                      onChange={(e) => {
                        const copy = [...routineExercises];
                        copy[idx].name = e.target.value;
                        setRoutineExercises(copy);
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="w-20">
                      <input
                        type="number"
                        min="1"
                        placeholder="Sets"
                        value={ex.target_sets}
                        onChange={(e) => {
                          const copy = [...routineExercises];
                          copy[idx].target_sets = parseInt(e.target.value) || 1;
                          setRoutineExercises(copy);
                        }}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-center text-white"
                      />
                    </div>
                    <span className="text-slate-500 text-xs">×</span>
                    <div className="w-20">
                      <input
                        type="number"
                        min="1"
                        placeholder="Reps"
                        value={ex.target_reps}
                        onChange={(e) => {
                          const copy = [...routineExercises];
                          copy[idx].target_reps = parseInt(e.target.value) || 1;
                          setRoutineExercises(copy);
                        }}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-center text-white"
                      />
                    </div>
                    <div className="w-24">
                      <input
                        type="number"
                        step="0.5"
                        placeholder={weightUnit}
                        value={ex.target_weight}
                        onChange={(e) => {
                          const copy = [...routineExercises];
                          copy[idx].target_weight = parseFloat(e.target.value) || 0;
                          setRoutineExercises(copy);
                        }}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-center text-white"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setRoutineExercises(routineExercises.filter((_, i) => i !== idx));
                      }}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button variant="ghost" size="md" onClick={() => setIsRoutineModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md">
              {editingRoutineId ? 'Save Routine' : 'Create Routine'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* LIVE WORKOUT FULL MODAL / DRAWER */}
      <Modal
        isOpen={isLiveActive}
        onClose={() => {
          if (window.confirm('Leave active workout? Elapsed time will be lost.')) {
            setIsLiveActive(false);
          }
        }}
        title={`Live: ${liveSessionName}`}
        subtitle="Log sets live, complete reps, and monitor resting intervals"
        maxWidth="max-w-3xl"
      >
        <div className="space-y-6">
          {/* Top Live Timer Bar & Rest Countdown */}
          <div className="grid grid-cols-2 gap-4">
            {/* Workout Stopwatch */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-400" />
                <span className="text-xs font-semibold text-slate-400 uppercase">Duration</span>
              </div>
              <span className="text-2xl font-black text-white font-mono">{formatTimer(liveSeconds)}</span>
            </div>

            {/* Rest Countdown Timer */}
            <div className={`p-4 rounded-2xl border flex items-center justify-between transition-colors ${
              isRestTimerRunning ? 'bg-cyan-500/10 border-cyan-500/40 animate-pulse' : 'bg-slate-950 border-slate-800'
            }`}>
              <div className="flex items-center gap-2">
                <Timer className={`w-5 h-5 ${isRestTimerRunning ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span className="text-xs font-semibold text-slate-400 uppercase">Rest Timer</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-2xl font-black font-mono ${isRestTimerRunning ? 'text-cyan-400' : 'text-slate-500'}`}>
                  {formatTimer(restTimerSeconds)}
                </span>
                {isRestTimerRunning && (
                  <button
                    onClick={() => {
                      setIsRestTimerRunning(false);
                      setRestTimerSeconds(0);
                    }}
                    className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Grouped Exercises and Sets Table */}
          <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-2">
            {Object.entries(groupedLiveExercises).map(([exName, sets]) => (
              <div key={exName} className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Dumbbell className="w-4 h-4 text-emerald-400" />
                    <span>{exName}</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => handleAddLiveSet(exName)}
                    className="text-xs text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Set</span>
                  </button>
                </div>

                {/* Sets Rows */}
                <div className="space-y-2">
                  {sets.map((s) => (
                    <div
                      key={s.globalIndex}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                        s.completed
                          ? 'bg-emerald-500/10 border-emerald-500/30'
                          : 'bg-slate-900/90 border-slate-800'
                      }`}
                    >
                      <span className="text-xs font-bold text-slate-400 w-12">Set {s.set_number}</span>

                      {/* Reps Input */}
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="0"
                          value={s.reps}
                          onChange={(e) => {
                            const copy = [...liveSets];
                            copy[s.globalIndex].reps = parseInt(e.target.value) || 0;
                            setLiveSets(copy);
                          }}
                          className="w-16 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-center font-bold text-white"
                        />
                        <span className="text-[11px] text-slate-500">reps</span>
                      </div>

                      {/* Weight Input */}
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={s.weight}
                          onChange={(e) => {
                            const copy = [...liveSets];
                            copy[s.globalIndex].weight = parseFloat(e.target.value) || 0;
                            setLiveSets(copy);
                          }}
                          className="w-16 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-center font-bold text-white"
                        />
                        <span className="text-[11px] text-slate-500">{weightUnit}</span>
                      </div>

                      {/* Complete Checkbox Button */}
                      <button
                        type="button"
                        onClick={() => handleToggleSetCompleted(s.globalIndex)}
                        className={`p-2 rounded-xl border transition-all ${
                          s.completed
                            ? 'bg-emerald-500 border-emerald-400 text-slate-950 shadow-glow-emerald'
                            : 'border-slate-700 bg-slate-950 text-slate-500 hover:text-emerald-400'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Session Notes */}
          <div>
            <textarea
              rows={2}
              placeholder="Session notes (e.g. felt strong on bench press, good energy levels)..."
              value={liveNotes}
              onChange={(e) => setLiveNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Finish Button */}
          <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              icon={CheckCircle2}
              onClick={handleFinishLiveWorkout}
            >
              Finish Workout & Save Session
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
