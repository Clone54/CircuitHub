import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import ToolsLayout from '../components/calculators/ToolsLayout';

export default function ToolsView() {
  return (
    <div id="tools-view" className="min-h-screen bg-navy-dark text-slate-100 pb-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-xs font-mono tracking-wide transition-all"
        >
          <ArrowLeft className="h-4 w-4" /> BACK TO HOME
        </Link>
      </div>
      <ToolsLayout />
    </div>
  );
}
