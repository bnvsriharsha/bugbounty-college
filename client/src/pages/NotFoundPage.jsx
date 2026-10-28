import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle } from 'lucide-react';
import { Button } from '../components/ui';

const NotFoundPage = () => {
  return (
    <div className="max-w-md mx-auto my-20 bg-white p-8 rounded-2xl border border-slate-200 text-center shadow-xs">
      <HelpCircle className="h-12 w-12 text-indigo-400 mx-auto mb-3" />
      <h1 className="text-xl font-bold text-slate-900">404 - Page Not Found</h1>
      <p className="text-xs text-slate-500 mt-2">
        The campus resource or report URL you requested could not be found.
      </p>
      <div className="mt-6">
        <Link to="/">
          <Button variant="primary" size="sm">
            Go to Homepage
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
