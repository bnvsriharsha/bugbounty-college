import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldX } from 'lucide-react';
import { Button } from '../components/ui';

const UnauthorizedPage = () => {
  return (
    <div className="max-w-md mx-auto my-20 bg-white p-8 rounded-2xl border border-slate-200 text-center shadow-xs">
      <ShieldX className="h-12 w-12 text-rose-500 mx-auto mb-3" />
      <h1 className="text-xl font-bold text-slate-900">Access Denied</h1>
      <p className="text-xs text-slate-500 mt-2">
        You do not have the required role permissions to view this campus management resource.
      </p>
      <div className="mt-6">
        <Link to="/">
          <Button variant="primary" size="sm">
            Return to Safety
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
