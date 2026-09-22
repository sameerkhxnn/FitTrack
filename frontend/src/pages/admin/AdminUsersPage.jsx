import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Filter, ChevronLeft, ChevronRight, Shield, ShieldOff,
  CheckCircle2, XCircle, Trash2, Eye, UserPlus, RefreshCw,
  ChevronUp, ChevronDown,
} from 'lucide-react';
import { adminApi } from '../../services/adminApi';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { Card, CardHeader } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { AdminUserDetailModal } from '../../components/admin/AdminUserDetailModal';

// ── Sortable column header ─────────────────────────────────────────────────
const SortTh = ({ label, field, sortBy, sortDir, onSort }) => (
  <th
    className="py-3 px-4 text-slate-400 font-semibold uppercase tracking-wider text-left cursor-pointer select-none hover:text-slate-200 transition-colors"
    onClick={() => onSort(field)}
  >
    <span className="flex items-center gap-1">
      {label}
      {sortBy === field
        ? sortDir === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />
        : <span className="w-3 h-3" />}
    </span>
  </th>
);

// ── Page ───────────────────────────────────────────────────────────────────
export const AdminUsersPage = () => {
  const toast = useToast();
  const { user: adminUser } = useAuth();

  // Table state
  const [users,    setUsers]    = useState([]);
  const [total,    setTotal]    = useState(0);
  const [pages,    setPages]    = useState(1);
  const [page,     setPage]     = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search,     setSearch]     = useState('');
  const [filterRole, setFilterRole] = useState('all');   // all | admin | user
  const [filterStatus, setFilterStatus] = useState('all'); // all | active | suspended
  const [sortBy,     setSortBy]     = useState('created_at');
  const [sortDir,    setSortDir]    = useState('desc');

  // Detail modal
  const [selectedUserId, setSelectedUserId] = useState(null);

  // ── Fetch ────────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async (p = page) => {
    setIsLoading(true);
    try {
      const params = {
        page: p,
        per_page: 15,
        sort_by: sortBy,
        sort_dir: sortDir,
      };
      if (search.trim())          params.search    = search.trim();
      if (filterRole === 'admin') params.is_admin  = true;
      if (filterRole === 'user')  params.is_admin  = false;
      if (filterStatus === 'active')    params.is_active = true;
      if (filterStatus === 'suspended') params.is_active = false;

      const res = await adminApi.listUsers(params);
      setUsers(res.users  ?? []);
      setTotal(res.total  ?? 0);
      setPages(res.pages  ?? 1);
      setPage(res.page    ?? 1);
    } catch (_err) {
      toast.error('Failed to load users.');
    } finally {
      setIsLoading(false);
    }
  }, [page, search, filterRole, filterStatus, sortBy, sortDir]); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-fetch when sort/filter changes
  useEffect(() => { fetchUsers(1); }, [sortBy, sortDir, filterRole, filterStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  // Search debounce
  useEffect(() => {
    const t = setTimeout(() => fetchUsers(1), 350);
    return () => clearTimeout(t);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sort handler ─────────────────────────────────────────────────────
  const handleSort = (field) => {
    if (sortBy === field) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortBy(field); setSortDir('asc'); }
  };

  // ── Quick toggle active/admin ─────────────────────────────────────────
  const toggleField = async (userId, field, current) => {
    if (userId === adminUser?.id && field === 'is_admin' && current) {
      toast.error('Cannot remove your own admin privileges.'); return;
    }
    try {
      await adminApi.updateUser(userId, { [field]: !current });
      toast.success(`User ${field.replace('is_', '')} ${!current ? 'enabled' : 'disabled'}.`);
      fetchUsers(page);
    } catch (err) {
      toast.error(err.message || 'Update failed.');
    }
  };

  // ── Quick delete ──────────────────────────────────────────────────────
  const handleDelete = async (u) => {
    if (u.id === adminUser?.id) { toast.error('Cannot delete your own account.'); return; }
    if (!window.confirm(`Delete ${u.name}? This is irreversible.`)) return;
    try {
      await adminApi.deleteUser(u.id);
      toast.success('User deleted.');
      fetchUsers(page);
    } catch (err) {
      toast.error(err.message || 'Delete failed.');
    }
  };

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-in fade-in duration-200">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">User Management</h1>
          <p className="text-sm text-slate-400 mt-1">
            {total.toLocaleString()} total users — search, filter, and manage accounts.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          icon={RefreshCw}
          onClick={() => fetchUsers(page)}
        >
          Refresh
        </Button>
      </div>

      {/* Filters bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3 flex-wrap items-end">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Search name or email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              icon={Search}
            />
          </div>

          {/* Role filter */}
          <div>
            <label className="block text-[10px] text-slate-500 mb-1 uppercase font-semibold">Role</label>
            <div className="inline-flex p-1 rounded-xl bg-slate-950 border border-slate-800">
              {[['all','All'],['admin','Admins'],['user','Users']].map(([v, l]) => (
                <button
                  key={v}
                  onClick={() => setFilterRole(v)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    filterRole === v ? 'bg-rose-500 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Status filter */}
          <div>
            <label className="block text-[10px] text-slate-500 mb-1 uppercase font-semibold">Status</label>
            <div className="inline-flex p-1 rounded-xl bg-slate-950 border border-slate-800">
              {[['all','All'],['active','Active'],['suspended','Suspended']].map(([v, l]) => (
                <button
                  key={v}
                  onClick={() => setFilterStatus(v)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    filterStatus === v ? 'bg-rose-500 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60">
                <SortTh label="Name"     field="name"       sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                <SortTh label="Email"    field="email"      sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                <th className="py-3 px-4 text-slate-400 font-semibold uppercase tracking-wider text-left">Role</th>
                <th className="py-3 px-4 text-slate-400 font-semibold uppercase tracking-wider text-left">Status</th>
                <SortTh label="Joined"   field="created_at" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                <th className="py-3 px-4 text-slate-400 font-semibold uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="py-3 px-4">
                        <div className="h-3.5 bg-slate-800 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No users match the current filters.
                  </td>
                </tr>
              ) : users.map(u => (
                <tr
                  key={u.id}
                  className="hover:bg-slate-800/30 transition-colors group"
                >
                  {/* Name */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-black text-slate-300 shrink-0">
                        {u.name[0].toUpperCase()}
                      </div>
                      <span className="font-semibold text-slate-200 truncate max-w-[120px]">
                        {u.name}
                        {u.id === adminUser?.id && (
                          <span className="ml-1 text-[10px] text-rose-400">(you)</span>
                        )}
                      </span>
                    </div>
                  </td>

                  {/* Email */}
                  <td className="py-3 px-4 text-slate-400 truncate max-w-[180px]">
                    {u.email}
                  </td>

                  {/* Role */}
                  <td className="py-3 px-4">
                    <Badge variant={u.is_admin ? 'amber' : 'default'} size="xs">
                      {u.is_admin ? 'Admin' : 'User'}
                    </Badge>
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4">
                    <Badge variant={u.is_active ? 'emerald' : 'rose'} size="xs">
                      {u.is_active ? 'Active' : 'Suspended'}
                    </Badge>
                  </td>

                  {/* Joined */}
                  <td className="py-3 px-4 text-slate-500">
                    {u.created_at?.slice(0, 10)}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* View detail */}
                      <button
                        onClick={() => setSelectedUserId(u.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                        title="View detail"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {/* Toggle admin */}
                      <button
                        onClick={() => toggleField(u.id, 'is_admin', u.is_admin)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          u.is_admin
                            ? 'text-amber-400 hover:text-rose-400 hover:bg-rose-500/10'
                            : 'text-slate-400 hover:text-amber-400 hover:bg-amber-500/10'
                        }`}
                        title={u.is_admin ? 'Revoke admin' : 'Grant admin'}
                      >
                        {u.is_admin ? <ShieldOff className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                      </button>

                      {/* Toggle active */}
                      <button
                        onClick={() => toggleField(u.id, 'is_active', u.is_active)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          u.is_active
                            ? 'text-slate-400 hover:text-rose-400 hover:bg-rose-500/10'
                            : 'text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10'
                        }`}
                        title={u.is_active ? 'Suspend' : 'Reactivate'}
                      >
                        {u.is_active ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      </button>

                      {/* Delete */}
                      {u.id !== adminUser?.id && (
                        <button
                          onClick={() => handleDelete(u)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Delete user"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800 text-xs">
            <span className="text-slate-400">
              Page <span className="font-bold text-white">{page}</span> of {pages} &nbsp;·&nbsp; {total} users
            </span>
            <div className="flex gap-2">
              <Button
                variant="ghost" size="sm" icon={ChevronLeft}
                disabled={page <= 1}
                onClick={() => { setPage(p => p - 1); fetchUsers(page - 1); }}
              >
                Prev
              </Button>
              <Button
                variant="ghost" size="sm"
                disabled={page >= pages}
                onClick={() => { setPage(p => p + 1); fetchUsers(page + 1); }}
              >
                Next <ChevronRight className="w-4 h-4 ml-0.5" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Detail modal */}
      {selectedUserId && (
        <AdminUserDetailModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
          onUserUpdated={() => fetchUsers(page)}
        />
      )}
    </div>
  );
};
