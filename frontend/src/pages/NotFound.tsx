import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[500px] flex items-center justify-center p-6">
      <div className="glass-panel p-8 max-w-md w-full text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-amber-400">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-100">404 — Page Not Found</h2>
        <p className="text-xs text-slate-400">
          The requested route does not exist in the EcoTwin AI console.
        </p>
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-slate-950 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Overview
        </button>
      </div>
    </div>
  );
};
