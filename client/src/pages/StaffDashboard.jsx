import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Wrench,
  AlertTriangle,
  Clock,
  CheckCircle2,
  MapPin,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { Button, Badge } from '../components/ui';

const StaffDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('assigned'); // assigned | overdue | completed

  useEffect(() => {
    const fetchStaffData = async () => {
      try {
        const res = await api.get('/dashboard/staff');
        if (res?.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStaffData();
  }, []);

  if (loading) {
    return (
      <div className="py-24 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const summary = data?.summary || { totalAssigned: 0, overdueCount: 0, criticalCount: 0, completedCount: 0 };
  const currentList =
    activeTab === 'assigned'
      ? data?.assignedTasks || []
      : activeTab === 'overdue'
      ? data?.overdueTasks || []
      : data?.completedTasks || [];

  return (
    <div className="space-y-8">
      {/* Staff Header */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-slate-900">{user?.name}</h1>
            <Badge variant="assigned">Maintenance Staff</Badge>
          </div>
          <p className="text-xs text-slate-500">
            {user?.department} • ID: {user?.studentId || 'STAFF'}
          </p>
        </div>

        <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200">
          <span>Active Tasks: </span>
          <strong className="text-indigo-600">{summary.totalAssigned}</strong>
          <span className="mx-2">•</span>
          <span>Critical: </span>
          <strong className="text-rose-600">{summary.criticalCount}</strong>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-semibold uppercase">Total Assigned</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{summary.totalAssigned}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-semibold uppercase">Critical Attention</div>
          <div className="text-2xl font-bold text-rose-600 mt-1">{summary.criticalCount}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-semibold uppercase">Overdue Tasks</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">{summary.overdueCount}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-semibold uppercase">Completed Repairs</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{summary.completedCount}</div>
        </div>
      </div>

      {/* Tasks Queue */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="flex border-b border-slate-200 bg-slate-50/50">
          <button
            onClick={() => setActiveTab('assigned')}
            className={`px-5 py-3.5 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'assigned'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Assigned Work Orders ({data?.assignedTasks?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('overdue')}
            className={`px-5 py-3.5 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'overdue'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Overdue SLA ({data?.overdueTasks?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-5 py-3.5 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'completed'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Resolved History ({data?.completedTasks?.length || 0})
          </button>
        </div>

        <div className="p-6">
          {currentList.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-400">
              No tasks currently in this queue. Great job!
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {currentList.map((task) => (
                <div
                  key={task._id}
                  className="py-4 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 px-2 rounded-lg transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={task.status}>{task.status}</Badge>
                      <Badge variant={task.priority}>{task.priority}</Badge>
                      <span className="text-[11px] font-semibold text-slate-500 uppercase">
                        {task.category}
                      </span>
                    </div>
                    <Link
                      to={`/issues/${task._id}`}
                      className="font-bold text-slate-900 text-sm hover:text-indigo-600 transition-colors block"
                    >
                      {task.title}
                    </Link>
                    <div className="flex items-center text-xs text-slate-500 gap-2">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-slate-400" />
                        {task.building} ({task.locationDetail})
                      </span>
                      {task.expectedResolutionTime && (
                        <span className="flex items-center gap-1 text-slate-400">
                          <Clock className="h-3 w-3" />
                          SLA Target: {new Date(task.expectedResolutionTime).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <Link to={`/issues/${task._id}`}>
                    <Button variant="primary" size="sm" className="gap-1.5 whitespace-nowrap">
                      Open Task Details
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;
