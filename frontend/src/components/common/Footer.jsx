import { Link } from 'react-router-dom';
import { ShieldCheck, Heart, TreePine, MapPin } from 'lucide-react';

/**
 * Modern Footer Component - EcoSathi Redesign
 */
export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 pb-20 lg:pb-12 pt-16">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-12">
          
          {/* Brand Col */}
          <div className="md:col-span-4 space-y-4">
            <div className="flex items-center gap-3">
              <img
                src="/ecosathi-logo.jpg"
                alt="EcoSathi Logo"
                className="h-10 w-10 rounded-xl object-contain shadow-xs border border-slate-700"
              />
              <span className="text-2xl font-black text-white tracking-tight">EcoSathi</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-normal max-w-sm">
              AI-GIS Urban Environmental Platform. Empowering communities with live air telemetry, satellite green canopy tracking, and citizen action.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Real-time WAQI & Supabase Data Active</span>
            </div>
          </div>

          {/* Nav Links */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">
              Platform Features
            </h4>
            <ul className="space-y-2 text-xs font-bold">
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  Home Overview
                </Link>
              </li>
              <li>
                <Link to="/complaints" className="hover:text-white transition-colors">
                  Local Reports & Hotspot Map
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-white transition-colors">
                  Live Environmental Dashboard
                </Link>
              </li>
              <li>
                <Link to="/leaderboard" className="hover:text-white transition-colors">
                  Community Impact & Leaderboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Civic Action Links */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">
              Civic & Legal AI
            </h4>
            <ul className="space-y-2 text-xs font-bold">
              <li>
                <Link to="/notices" className="hover:text-white transition-colors">
                  Authority Action Notices
                </Link>
              </li>
              <li>
                <Link to="/compare" className="hover:text-white transition-colors">
                  City Environmental Comparison
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white transition-colors">
                  About the Project
                </Link>
              </li>
            </ul>
          </div>

          {/* Cities Monitored */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">
              Active Cities
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {['Pune', 'Delhi', 'Mumbai', 'Bangalore'].map((c) => (
                <span
                  key={c}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 text-[11px] font-bold text-slate-300 border border-slate-700"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>

        </div>

        <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {currentYear} EcoSathi. All rights reserved. Built for community environmental action.</p>
          <div className="flex items-center gap-1 font-medium">
            <span>Powered by</span>
            <span className="text-slate-300 font-bold">Supabase PostgreSQL & WAQI</span>
          </div>
        </div>

      </div>
    </footer>
  );
}