import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, LogIn, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password);
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'staff') navigate('/staff');
      else navigate('/student');
    } catch (err) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('Password@123');
  };

  return (
    <div className="max-w-md mx-auto my-8 sm:my-14">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <div className="text-center mb-6">
          <div className="inline-flex bg-indigo-50 text-indigo-600 p-3 rounded-2xl mb-3">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Sign in to BugBounty</h1>
          <p className="text-sm text-slate-500 mt-1">Spot It. Verify It. Fix It.</p>
        </div>

        {error && (
          <div className="mb-5 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm flex items-start gap-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Campus Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. aditi.student@campus.edu"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <Button type="submit" variant="primary" className="w-full py-2.5 mt-2" isLoading={loading}>
            <LogIn className="h-4 w-4 mr-2" />
            Sign In
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-100 text-center text-sm text-slate-500">
          Don't have an account?{' '}
          <Link to="/register" className="text-indigo-600 font-semibold hover:underline">
            Register here
          </Link>
        </div>

        {/* Quick Demo Logins for instant evaluation */}
        <div className="mt-6 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
          <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
            Quick Demo Accounts:
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => handleQuickLogin('admin@campus.edu')}
              className="text-xs bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 px-2 py-1 rounded shadow-2xs font-medium"
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('staff.electrical@campus.edu')}
              className="text-xs bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 px-2 py-1 rounded shadow-2xs font-medium"
            >
              Staff (Electrical)
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('staff.civil@campus.edu')}
              className="text-xs bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 px-2 py-1 rounded shadow-2xs font-medium"
            >
              Staff (Civil)
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('aditi.student@campus.edu')}
              className="text-xs bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 px-2 py-1 rounded shadow-2xs font-medium"
            >
              Student (Aditi)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
