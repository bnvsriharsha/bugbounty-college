import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Users, Search, ShieldCheck, UserX, AlertCircle } from 'lucide-react';
import { Button, Badge } from '../components/ui';

const UserManagementPage = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (roleFilter !== 'all') params.role = roleFilter;

      const res = await api.get('/users', { params });
      if (res?.success) {
        setUsers(res.data.users || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const handleRoleChange = async (userId, newRole) => {
    try {
      const res = await api.patch(`/users/${userId}`, { role: newRole });
      if (res?.success) {
        setUsers((prev) => prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u)));
      }
    } catch (err) {
      alert(err.message || 'Failed to update user role');
    }
  };

  const handleStatusToggle = async (userId, currentStatus) => {
    try {
      const res = await api.patch(`/users/${userId}`, { isActive: !currentStatus });
      if (res?.success) {
        setUsers((prev) => prev.map((u) => (u._id === userId ? { ...u, isActive: !currentStatus } : u)));
      }
    } catch (err) {
      alert(err.message || 'Failed to toggle status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-indigo-600" />
            User Management & Permissions
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Grant maintenance roles, audit campus contributors, and manage account statuses.
          </p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search by name, email, or department..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-3.5 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <Button variant="secondary" size="sm" onClick={fetchUsers}>
          Filter
        </Button>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="text-xs p-2 border border-slate-300 rounded-lg bg-slate-50"
        >
          <option value="all">All Roles</option>
          <option value="student">Students</option>
          <option value="staff">Maintenance Staff</option>
          <option value="admin">Administrators</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="p-3.5">User</th>
                  <th className="p-3.5">Department / Roll</th>
                  <th className="p-3.5">Reputation</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/50">
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">{u.name}</div>
                      <div className="text-[11px] text-slate-400">{u.email}</div>
                    </td>
                    <td className="p-3.5">
                      <div>{u.department}</div>
                      <div className="text-[11px] text-slate-400">{u.studentId || 'N/A'}</div>
                    </td>
                    <td className="p-3.5 font-bold text-amber-600">{u.reputation} pts</td>
                    <td className="p-3.5">
                      <select
                        value={u.role}
                        disabled={currentUser._id === u._id}
                        onChange={(e) => handleRoleChange(u._id, e.target.value)}
                        className="text-xs p-1.5 border border-slate-200 rounded-md bg-white capitalize font-medium"
                      >
                        <option value="student">Student</option>
                        <option value="staff">Staff</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="p-3.5">
                      <Badge variant={u.isActive ? 'resolved' : 'rejected'}>
                        {u.isActive ? 'Active' : 'Suspended'}
                      </Badge>
                    </td>
                    <td className="p-3.5 text-right">
                      {currentUser._id !== u._id && (
                        <button
                          onClick={() => handleStatusToggle(u._id, u.isActive)}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-md border ${
                            u.isActive
                              ? 'text-rose-600 border-rose-200 hover:bg-rose-50'
                              : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'
                          }`}
                        >
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagementPage;
