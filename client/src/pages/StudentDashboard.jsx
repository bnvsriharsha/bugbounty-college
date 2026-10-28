import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  FileText,
  CheckCircle,
  Clock,
  Award,
  PlusCircle,
  ThumbsUp,
  MapPin,
  AlertCircle,
} from 'lucide-react';
import { Button, Badge } from '../components/ui';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('myReports'); // myReports | verifiedByMe | awaitingVerification

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/dashboard/student');
        if (res?.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="py-24 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const counts = data?.counts || { submitted: 0, resolved: 0, inProgress: 0, votesGiven: 0 };
  const currentList =
    activeTab === 'myReports'
      ? data?.myReports || []
      : activeTab === 'verifiedByMe'
      ? data?.verifiedByMe || []
      : data?.awaitingVerification || [];

  return (
    <div className="space-y-8">
      {/* Student Profile & Reputation Hero */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-slate-900">{user?.name}</h1>
            <Badge variant="verified">Student</Badge>
          </div>
          <p className="text-xs text-slate-500">
            {user?.studentId ? `ID: ${user.studentId} • ` : ''}
            {user?.department} • {user?.email}
          </p>
        </div>

        {/* Reputation Score Card */}
        <div className="flex items-center gap-4 bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-xl border border-indigo-100">
          <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-xs">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-indigo-950">{user?.reputation || 0} pts</div>
            <div className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wider">
              Contribution Reputation
            </div>
          </div>
          <Link to="/report/new" className="ml-2">
            <Button variant="primary" size="sm" className="gap-1.5">
              <PlusCircle className="h-4 w-4" />
              New Report
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="text-xs text-slate-500 font-semibold uppercase">Reports Submitted</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{counts.submitted}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="text-xs text-slate-500 font-semibold uppercase">In Progress</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">{counts.inProgress}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="text-xs text-slate-500 font-semibold uppercase">Resolved</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{counts.resolved}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="text-xs text-slate-500 font-semibold uppercase">Community Verifications</div>
          <div className="text-2xl font-bold text-indigo-600 mt-1">{counts.votesGiven}</div>
        </div>
      </div>

      {/* Tabs & Content */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="flex border-b border-slate-200 bg-slate-50/50">
          <button
            onClick={() => setActiveTab('myReports')}
            className={`px-5 py-3.5 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'myReports'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            My Reports ({data?.myReports?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('awaitingVerification')}
            className={`px-5 py-3.5 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'awaitingVerification'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Awaiting Verification ({data?.awaitingVerification?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('verifiedByMe')}
            className={`px-5 py-3.5 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'verifiedByMe'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Issues I Verified ({data?.verifiedByMe?.length || 0})
          </button>
        </div>

        <div className="p-6">
          {currentList.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-400">
              No reports in this category.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {currentList.map((item) => (
                <div
                  key={item._id}
                  className="py-4 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 px-2 rounded-lg transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={item.status}>{item.status}</Badge>
                      <Badge variant={item.priority}>{item.priority}</Badge>
                      <span className="text-[11px] font-semibold text-slate-500 uppercase">
                        {item.category}
                      </span>
                    </div>
                    <Link
                      to={`/issues/${item._id}`}
                      className="font-bold text-slate-900 text-sm hover:text-indigo-600 transition-colors block"
                    >
                      {item.title}
                    </Link>
                    <div className="flex items-center text-xs text-slate-500 gap-1.5">
                      <MapPin className="h-3 w-3 text-slate-400" />
                      <span>{item.building} • {item.locationDetail}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                    <Link to={`/issues/${item._id}`}>
                      <Button variant="secondary" size="sm">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
