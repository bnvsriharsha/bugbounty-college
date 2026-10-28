import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  ShieldAlert,
  Users,
  CheckCircle,
  AlertTriangle,
  Clock,
  Layers,
  ArrowRight,
  UserCheck,
  Tag,
  Activity,
} from 'lucide-react';
import { Button, Badge } from '../components/ui';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending'); // pending | unassigned | critical | overdue | staffWorkload

  const fetchAdminData = async () => {
    try {
      const res = await api.get('/dashboard/admin');
      if (res?.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleReviewAction = async (reportId, action) => {
    try {
      const res = await api.post(`/reports/${reportId}/review`, { action });
      if (res?.success) {
        fetchAdminData();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const counts = data?.counts || {
    pendingVerification: 0,
    unassignedVerified: 0,
    criticalReports: 0,
    overdueReports: 0,
    flaggedReports: 0,
    totalUsers: 0,
    totalReports: 0,
    totalResolved: 0,
  };

  return (
    <div className="space-y-8">
      {/* Admin Header */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-slate-900">Campus Oversight & Administration</h1>
            <Badge variant="critical">Dean / Administrator</Badge>
          </div>
          <p className="text-xs text-slate-500">
            {user?.name} ({user?.email}) • Overall system health & infrastructure governance
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/admin/users">
            <Button variant="secondary" size="sm" className="gap-1.5">
              <Users className="h-4 w-4" />
              Manage Users
            </Button>
          </Link>
          <Link to="/admin/categories">
            <Button variant="secondary" size="sm" className="gap-1.5">
              <Tag className="h-4 w-4" />
              Categories & SLA
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-semibold uppercase">Pending Verification</div>
          <div className="text-2xl sm:text-3xl font-bold text-amber-600 mt-2">
            {counts.pendingVerification}
          </div>
          <div className="text-xs text-slate-400 mt-1">Needs admin review</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-semibold uppercase">Unassigned Verified</div>
          <div className="text-2xl sm:text-3xl font-bold text-indigo-600 mt-2">
            {counts.unassignedVerified}
          </div>
          <div className="text-xs text-slate-400 mt-1">Ready for staff assignment</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-semibold uppercase">Critical Open Hazards</div>
          <div className="text-2xl sm:text-3xl font-bold text-rose-600 mt-2">
            {counts.criticalReports}
          </div>
          <div className="text-xs text-slate-400 mt-1">Immediate life/safety risk</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-semibold uppercase">Overdue Resolution</div>
          <div className="text-2xl sm:text-3xl font-bold text-orange-600 mt-2">
            {counts.overdueReports}
          </div>
          <div className="text-xs text-slate-400 mt-1">Breached standard SLA</div>
        </div>
      </div>

      {/* Management Navigation Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="flex flex-wrap border-b border-slate-200 bg-slate-50/50">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-5 py-3.5 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'pending'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Review Queue ({data?.pendingVerification?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('unassigned')}
            className={`px-5 py-3.5 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'unassigned'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Awaiting Assignment ({data?.unassignedVerified?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('critical')}
            className={`px-5 py-3.5 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'critical'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Critical Hazards ({data?.criticalReports?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('staffWorkload')}
            className={`px-5 py-3.5 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'staffWorkload'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Staff Workload ({data?.staffWorkload?.length || 0})
          </button>
        </div>

        <div className="p-6">
          {/* Review Queue */}
          {activeTab === 'pending' && (
            <div className="space-y-4">
              {data?.pendingVerification?.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-400">
                  No issues pending verification review.
                </div>
              ) : (
                data?.pendingVerification?.map((r) => (
                  <div
                    key={r._id}
                    className="p-4 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-indigo-200 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={r.priority}>{r.priority}</Badge>
                        <span className="text-xs text-slate-500">{r.building} • {r.locationDetail}</span>
                        <span className="text-[11px] text-indigo-600 font-semibold">
                          ({r.verificationCount} votes)
                        </span>
                      </div>
                      <Link to={`/issues/${r._id}`} className="font-bold text-slate-900 text-sm hover:underline">
                        {r.title}
                      </Link>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-1">{r.description}</p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleReviewAction(r._id, 'reject')}
                        className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                      >
                        Reject
                      </Button>
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => handleReviewAction(r._id, 'approve')}
                        className="text-xs"
                      >
                        Approve & Verify
                      </Button>
                      <Link to={`/issues/${r._id}`}>
                        <Button variant="ghost" size="sm" className="text-xs">
                          Inspect
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Unassigned Verified */}
          {activeTab === 'unassigned' && (
            <div className="space-y-4">
              {data?.unassignedVerified?.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-400">
                  No verified issues awaiting staff assignment.
                </div>
              ) : (
                data?.unassignedVerified?.map((r) => (
                  <div
                    key={r._id}
                    className="p-4 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={r.priority}>{r.priority}</Badge>
                        <span className="text-xs font-semibold text-slate-700">{r.category}</span>
                      </div>
                      <Link to={`/issues/${r._id}`} className="font-bold text-slate-900 text-sm hover:underline">
                        {r.title}
                      </Link>
                      <div className="text-xs text-slate-500 mt-1">
                        Location: {r.building} ({r.locationDetail})
                      </div>
                    </div>

                    <Link to={`/issues/${r._id}`}>
                      <Button variant="primary" size="sm" className="text-xs whitespace-nowrap">
                        Assign Staff &rarr;
                      </Button>
                    </Link>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Critical reports */}
          {activeTab === 'critical' && (
            <div className="space-y-4">
              {data?.criticalReports?.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-400">
                  No critical hazards open right now.
                </div>
              ) : (
                data?.criticalReports?.map((r) => (
                  <div
                    key={r._id}
                    className="p-4 border-2 border-rose-200 bg-rose-50/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="critical">CRITICAL HAZARD</Badge>
                        <Badge variant={r.status}>{r.status}</Badge>
                        <span className="text-xs font-bold text-slate-700">{r.building}</span>
                      </div>
                      <Link to={`/issues/${r._id}`} className="font-bold text-rose-950 text-sm hover:underline">
                        {r.title}
                      </Link>
                      <div className="text-xs text-slate-600 mt-1">{r.locationDetail}</div>
                    </div>

                    <Link to={`/issues/${r._id}`}>
                      <Button variant="danger" size="sm" className="text-xs">
                        Emergency Review
                      </Button>
                    </Link>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Staff Workload overview */}
          {activeTab === 'staffWorkload' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="p-3">Staff Name</th>
                    <th className="p-3">Department</th>
                    <th className="p-3">Active Assigned Tasks</th>
                    <th className="p-3">Completed Repairs</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data?.staffWorkload?.map((s) => (
                    <tr key={s._id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-semibold text-slate-900">{s.name}</td>
                      <td className="p-3">{s.department}</td>
                      <td className="p-3">
                        <span className="font-bold text-indigo-600">{s.activeTasks}</span> active
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-emerald-600">{s.completedTasks}</span> resolved
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Recent Audit History */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Activity className="h-4 w-4 text-slate-500" />
          Recent Administrative Audit Logs
        </h3>
        <div className="divide-y divide-slate-100 text-xs">
          {data?.recentAuditLogs?.length === 0 ? (
            <div className="py-4 text-slate-400 text-center">No audit records yet.</div>
          ) : (
            data?.recentAuditLogs?.map((log) => (
              <div key={log._id} className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800">{log.action}</span> by{' '}
                  <span className="text-indigo-600">{log.performedBy?.name}</span> ({log.performedBy?.role})
                </div>
                <span className="text-[10px] text-slate-400">
                  {new Date(log.createdAt).toLocaleString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
