import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Settings, User, Lock, Download, Trash2, 
  CheckCircle2, ShieldAlert, LogOut, Moon, Save 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useUnits } from '../context/UnitContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { Card, CardHeader } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Modal } from '../components/common/Modal';

export const SettingsPage = () => {
  const { user, refreshUser, logout } = useAuth();
  const { unitSystem, setUnitSystem } = useUnits();
  const toast = useToast();
  const navigate = useNavigate();

  // Account form
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [isUpdatingAccount, setIsUpdatingAccount] = useState(false);

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Delete modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleUpdateAccount = async (e) => {
    e.preventDefault();
    setIsUpdatingAccount(true);
    try {
      await api.put('/settings/profile', { name, email });
      await refreshUser();
      toast.success('Account information updated successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to update account.');
    } finally {
      setIsUpdatingAccount(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }

    setIsChangingPassword(true);
    try {
      await api.post('/settings/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      toast.success('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.message || 'Failed to change password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleExportData = async () => {
    try {
      toast.info('Preparing your complete personal fitness data export...');
      const data = await api.get('/settings/export-data');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fittrack_export_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Fitness data downloaded successfully!');
    } catch (err) {
      toast.error('Failed to export data.');
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmationText !== 'DELETE') {
      toast.error('Please type DELETE to confirm account removal.');
      return;
    }

    setIsDeleting(true);
    try {
      await api.delete('/settings/account');
      toast.info('Your account and all associated data have been permanently deleted.');
      logout();
      navigate('/login');
    } catch (err) {
      toast.error(err.message || 'Failed to delete account.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">Settings & Data Management</h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage account security, display units, GDPR data export, and session controls.
        </p>
      </div>

      {/* 1. Account Info Card */}
      <Card className="p-6">
        <CardHeader
          title="Account Details"
          subtitle="Update your identity and login email"
        />
        <form onSubmit={handleUpdateAccount} className="space-y-4 max-w-lg">
          <Input
            label="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            icon={User}
            required
          />

          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isUpdatingAccount}
            icon={Save}
          >
            Save Account Info
          </Button>
        </form>
      </Card>

      {/* 2. Units & Preferences */}
      <Card className="p-6">
        <CardHeader
          title="Measurement & Unit Preferences"
          subtitle="Select standard system for weights, distances, and body circumferences"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
          <div
            onClick={() => setUnitSystem('metric')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              unitSystem === 'metric'
                ? 'border-emerald-500 bg-emerald-500/10 shadow-glow-emerald text-emerald-400'
                : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-sm font-bold">Metric System</h4>
              {unitSystem === 'metric' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            </div>
            <p className="text-xs text-slate-500">Kilograms (kg), Centimeters (cm)</p>
          </div>

          <div
            onClick={() => setUnitSystem('imperial')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              unitSystem === 'imperial'
                ? 'border-cyan-500 bg-cyan-500/10 shadow-glow-cyan text-cyan-400'
                : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-sm font-bold">Imperial System</h4>
              {unitSystem === 'imperial' && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
            </div>
            <p className="text-xs text-slate-500">Pounds (lbs), Inches (in), Feet (ft)</p>
          </div>
        </div>
      </Card>

      {/* 3. Password & Security */}
      <Card className="p-6">
        <CardHeader
          title="Change Password"
          subtitle="Ensure your account is protected with a secure password"
        />

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
          <Input
            label="Current Password"
            type="password"
            placeholder="••••••••"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            icon={Lock}
            required
          />

          <Input
            label="New Password"
            type="password"
            placeholder="••••••••"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            icon={Lock}
            required
          />

          <Input
            label="Confirm New Password"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            icon={Lock}
            required
          />

          <Button
            type="submit"
            variant="secondary"
            size="md"
            isLoading={isChangingPassword}
          >
            Update Password
          </Button>
        </form>
      </Card>

      {/* 4. Data Export (GDPR) */}
      <Card className="p-6">
        <CardHeader
          title="Data Portability & Export"
          subtitle="Download a complete copy of all your workouts, weight logs, measurements, and nutrition"
        />

        <p className="text-xs text-slate-400 max-w-xl mb-4">
          You own your fitness data. You can export your full historical archive as a standardized JSON package at any time.
        </p>

        <Button
          variant="outline"
          size="md"
          icon={Download}
          onClick={handleExportData}
        >
          Export All Personal Data (JSON)
        </Button>
      </Card>

      {/* 5. Danger Zone */}
      <Card className="p-6 border-rose-500/30 bg-slate-900/60">
        <div className="flex items-center gap-2 text-rose-400 mb-2">
          <ShieldAlert className="w-5 h-5" />
          <h3 className="font-bold text-base text-white">Danger Zone</h3>
        </div>

        <p className="text-xs text-slate-400 max-w-xl mb-4 leading-relaxed">
          Permanently delete your FitTrack account and all recorded history. This action is irreversible and wipes all workouts, measurements, and progress photos.
        </p>

        <Button
          variant="danger"
          size="md"
          icon={Trash2}
          onClick={() => setIsDeleteModalOpen(true)}
        >
          Delete FitTrack Account
        </Button>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Account Deletion"
        subtitle="This action is permanent and cannot be undone."
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-300">
            To confirm deletion, please type <span className="font-mono font-bold text-rose-400">DELETE</span> in the field below:
          </p>

          <Input
            value={deleteConfirmationText}
            onChange={(e) => setDeleteConfirmationText(e.target.value)}
            placeholder="DELETE"
            autoFocus
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <Button
              variant="ghost"
              size="md"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="md"
              isLoading={isDeleting}
              disabled={deleteConfirmationText !== 'DELETE'}
              onClick={handleDeleteAccount}
            >
              Permanently Delete Account
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
