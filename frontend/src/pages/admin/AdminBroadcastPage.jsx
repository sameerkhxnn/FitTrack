import React, { useState } from 'react';
import { Bell, Send, Users, User, AlertCircle } from 'lucide-react';
import { adminApi } from '../../services/adminApi';
import { useToast } from '../../context/ToastContext';
import { Card, CardHeader } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';

export const AdminBroadcastPage = () => {
  const toast = useToast();

  const [title,      setTitle]      = useState('');
  const [message,    setMessage]    = useState('');
  const [targetMode, setTargetMode] = useState('all');  // 'all' | 'user'
  const [userId,     setUserId]     = useState('');
  const [isSending,  setIsSending]  = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast.error('Title and message are required.'); return;
    }
    if (targetMode === 'user' && (!userId || isNaN(Number(userId)))) {
      toast.error('Please enter a valid numeric user ID.'); return;
    }

    setIsSending(true);
    try {
      const res = await adminApi.broadcast(
        title.trim(),
        message.trim(),
        targetMode === 'user' ? Number(userId) : null,
      );
      setLastResult(res);
      toast.success(`Notification sent to ${res.recipients} user(s).`);
      setTitle('');
      setMessage('');
      setUserId('');
    } catch (err) {
      toast.error(err.message || 'Failed to send broadcast.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200 max-w-2xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">Broadcast Notifications</h1>
        <p className="text-sm text-slate-400 mt-1">
          Send in-app notifications to a single user or all active users at once.
        </p>
      </div>

      {/* Compose form */}
      <Card className="p-6">
        <CardHeader
          title="Compose Notification"
          subtitle="Notifications appear in the user's in-app notification bell"
        />

        <form onSubmit={handleSend} className="space-y-5">
          {/* Target selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
              Target Audience
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div
                onClick={() => setTargetMode('all')}
                className={`flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  targetMode === 'all'
                    ? 'border-rose-500 bg-rose-500/10 text-rose-300'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Users className="w-5 h-5 shrink-0" />
                <div>
                  <p className="text-xs font-bold">All Active Users</p>
                  <p className="text-[10px] text-slate-500">Platform-wide broadcast</p>
                </div>
              </div>

              <div
                onClick={() => setTargetMode('user')}
                className={`flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  targetMode === 'user'
                    ? 'border-rose-500 bg-rose-500/10 text-rose-300'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                <User className="w-5 h-5 shrink-0" />
                <div>
                  <p className="text-xs font-bold">Specific User</p>
                  <p className="text-[10px] text-slate-500">Target by user ID</p>
                </div>
              </div>
            </div>
          </div>

          {/* User ID input (conditional) */}
          {targetMode === 'user' && (
            <Input
              label="User ID"
              type="number"
              placeholder="e.g. 42"
              value={userId}
              onChange={e => setUserId(e.target.value)}
              icon={User}
              required
            />
          )}

          {/* Title */}
          <Input
            label="Notification Title"
            placeholder="e.g. New Feature Available!"
            value={title}
            onChange={e => setTitle(e.target.value)}
            icon={Bell}
            required
          />

          {/* Message */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Message</label>
            <textarea
              rows={4}
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Write the notification message…"
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 resize-none"
              required
            />
          </div>

          {/* Preview */}
          {(title || message) && (
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-700 space-y-1">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Preview</p>
              <p className="text-sm font-bold text-white">{title || '—'}</p>
              <p className="text-xs text-slate-400">{message || '—'}</p>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2 border-t border-slate-800">
            <Button type="submit" variant="primary" size="md" icon={Send} isLoading={isSending}
              className="bg-rose-500 hover:bg-rose-400 text-white shadow-none focus:ring-rose-400"
            >
              {targetMode === 'all' ? 'Broadcast to All Users' : 'Send to User'}
            </Button>

            {targetMode === 'all' && (
              <div className="flex items-center gap-1.5 text-xs text-amber-400">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>This will notify every active user</span>
              </div>
            )}
          </div>
        </form>
      </Card>

      {/* Last result */}
      {lastResult && (
        <Card className="p-4 border-emerald-500/30 bg-emerald-500/5">
          <div className="flex items-center gap-2 text-emerald-400">
            <Bell className="w-4 h-4" />
            <p className="text-sm font-bold">
              "{lastResult.title}" sent to <span className="text-white">{lastResult.recipients}</span> user(s).
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};
