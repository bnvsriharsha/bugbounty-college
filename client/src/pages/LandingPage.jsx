import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import {
  ShieldAlert,
  CheckCircle2,
  Clock,
  Wrench,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  MapPin,
  Users,
} from 'lucide-react';
import { Button, Badge } from '../components/ui';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const LandingPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPublicMetrics = async () => {
      try {
        const res = await api.get('/dashboard/public');
        if (res?.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPublicMetrics();
  }, []);

  const metrics = data?.metrics || {
    totalReports: 0,
    openReports: 0,
    verifiedAwaitingAssignment: 0,
    inProgress: 0,
    resolved: 0,
    criticalOpen: 0,
  };

  return (
    <div className="space-y-12 pb-8">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-8 sm:p-14 overflow-hidden shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">
            <ShieldAlert className="h-4 w-4" />
            Campus Transparency & Accountability
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Spot It. Verify It. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-teal-300 to-emerald-300">
              Fix It Together.
            </span>
          </h1>
          <p className="text-slate-300 text-base sm:text-lg max-w-2xl leading-relaxed">
            Report broken campus infrastructure, faulty electrical equipment, unhygienic washrooms, and safety hazards. Community verification ensures transparency while university maintenance teams fix issues quickly.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link to="/report/new">
              <Button size="lg" variant="primary" className="bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg">
                Report Campus Issue
              </Button>
            </Link>
            <Link to="/issues">
              <Button size="lg" variant="secondary" className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm">
                Explore Campus Issues
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Ambient background blur glow */}
        <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
      </section>

      {/* Real-time Status Metric Cards */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Reports</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-bold text-slate-900">{metrics.totalReports}</div>
          <div className="text-xs text-slate-500 mt-1">Recorded across campus</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Under Action</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Wrench className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-bold text-amber-600">
            {metrics.inProgress + metrics.verifiedAwaitingAssignment}
          </div>
          <div className="text-xs text-slate-500 mt-1">{metrics.inProgress} currently being repaired</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Resolved</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-bold text-emerald-600">{metrics.resolved}</div>
          <div className="text-xs text-slate-500 mt-1">With completion evidence</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Critical Hazards</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-bold text-rose-600">{metrics.criticalOpen}</div>
          <div className="text-xs text-slate-500 mt-1">Urgent immediate focus</div>
        </div>
      </section>

      {/* Analytics Charts Section */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 mb-1">Reports by Campus Building</h2>
          <p className="text-xs text-slate-500 mb-4">Top locations with reported facility issues</p>
          <div className="h-64">
            {data?.buildingStats?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.buildingStats}>
                  <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No location data yet
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 mb-1">Issue Category Breakdown</h2>
          <p className="text-xs text-slate-500 mb-4">Distribution by equipment and facility types</p>
          <div className="h-64 flex items-center justify-center">
            {data?.categoryStats?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.categoryStats}
                    dataKey="count"
                    nameKey="_id"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={(entry) => entry._id.slice(0, 12)}
                  >
                    {data.categoryStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-400">No category breakdown yet</div>
            )}
          </div>
        </div>
      </section>

      {/* Recent Issues Feed */}
      <section className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-2">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Recent Campus Reports</h2>
            <p className="text-xs text-slate-500 mt-0.5">Live reports verified and updated by community members</p>
          </div>
          <Link to="/issues">
            <Button variant="outline" size="sm">
              View All Issues
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
          {data?.recentReports?.length > 0 ? (
            data.recentReports.map((report) => (
              <Link
                key={report._id}
                to={`/issues/${report._id}`}
                className="group border border-slate-200 rounded-xl p-4 hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <Badge variant={report.status}>{report.status}</Badge>
                    <Badge variant={report.priority}>{report.priority}</Badge>
                  </div>
                  <h3 className="font-semibold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors line-clamp-2">
                    {report.title}
                  </h3>
                  <div className="flex items-center text-xs text-slate-500 mt-2 gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    <span>{report.building} • {report.locationDetail}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="font-medium text-slate-700">
                    {report.verificationCount} verification{report.verificationCount === 1 ? '' : 's'}
                  </span>
                  <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full py-8 text-center text-xs text-slate-400">
              No reports found. Be the first to spot and report an issue!
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
