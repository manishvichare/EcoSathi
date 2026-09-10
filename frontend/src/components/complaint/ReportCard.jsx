import React, { useState } from 'react';
import { resolveImageUrl } from '../../utils/imageUrl';
import { 
  MapPin, 
  Clock, 
  Users, 
  HandHeart, 
  ExternalLink, 
  AlertTriangle,
  CheckCircle2,
  Clock3,
  ShieldAlert,
  Wind,
  Droplets,
  TreePine,
  Trash2,
  ShoppingBag
} from 'lucide-react';

/**
 * Modern Report Card Component - EcoSathi Redesign
 */
export default function ReportCard({ report, onView, onSupport, onVolunteer, hasSupported, hasVolunteered }) {
  // Category styling and icons
  const getCategoryMeta = (cat) => {
    switch (cat?.toLowerCase()) {
      case 'air-pollution':
        return { label: 'Air Pollution', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'water-pollution':
        return { label: 'Water Contamination', bg: 'bg-sky-50 text-sky-700 border-sky-200' };
      case 'tree-cutting':
        return { label: 'Tree Cutting', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'illegal-dumping':
        return { label: 'Garbage / Waste', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'plastic-waste':
        return { label: 'Plastic Waste', bg: 'bg-rose-50 text-rose-700 border-rose-200' };
      default:
        return { label: 'Environmental Issue', bg: 'bg-slate-50 text-slate-700 border-slate-200' };
    }
  };

  // Status badges
  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Resolved</span>
          </span>
        );
      case 'resolution_pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-yellow-100 text-yellow-800 border border-yellow-300">
            <Clock3 className="w-3 h-3 text-yellow-600" />
            <span>Pending Verify</span>
          </span>
        );
      case 'action_in_progress':
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-300">
            <Clock3 className="w-3 h-3 text-blue-600" />
            <span>In Progress</span>
          </span>
        );
      case 'assigned':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300">
            <Clock3 className="w-3 h-3 text-amber-600" />
            <span>Assigned</span>
          </span>
        );
      case 'authority_notified':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-300">
            <ShieldAlert className="w-3 h-3 text-purple-600" />
            <span>Authority Notified</span>
          </span>
        );
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-100 text-sky-800 border border-sky-300">
            <CheckCircle2 className="w-3 h-3 text-sky-600" />
            <span>Verified</span>
          </span>
        );
      case 'under_review':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-800 border border-indigo-300">
            <Clock3 className="w-3 h-3 text-indigo-600" />
            <span>Under Review</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-300">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            <span>Open Issue</span>
          </span>
        );
    }
  };

  // Relative time helper
  const getRelativeTime = (isoString) => {
    if (!isoString) return 'Recently';
    const diffHours = Math.floor((Date.now() - new Date(isoString).getTime()) / (1000 * 60 * 60));
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${Math.floor(diffHours / 24)} days ago`;
  };

  const catMeta = getCategoryMeta(report.category);
  const [imageError, setImageError] = useState(false);
  const resolvedPhoto = resolveImageUrl(report.photo || report.photo_url);

  // Category placeholder icon helper
  const getCategoryIcon = (cat) => {
    switch (cat?.toLowerCase()) {
      case 'air-pollution':
        return <Wind className="w-8 h-8 text-indigo-400" />;
      case 'water-pollution':
        return <Droplets className="w-8 h-8 text-sky-400" />;
      case 'tree-cutting':
        return <TreePine className="w-8 h-8 text-emerald-400" />;
      case 'plastic-waste':
        return <ShoppingBag className="w-8 h-8 text-rose-400" />;
      case 'illegal-dumping':
      default:
        return <Trash2 className="w-8 h-8 text-amber-400" />;
    }
  };

  return (
    <div className="glass-card rounded-3xl border border-slate-200/80 overflow-hidden card-hover flex flex-col justify-between group">
      
      {/* Top Image Banner - Uses actual uploaded photo */}
      <div className="relative h-52 w-full overflow-hidden bg-slate-900 flex items-center justify-center">
        {resolvedPhoto && !imageError ? (
          <img
            src={resolvedPhoto}
            alt={report.title || 'Environmental Issue'}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center gap-2 p-4 text-center">
            <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
              {getCategoryIcon(report.category)}
            </div>
            <span className="text-xs font-bold text-slate-300">
              {catMeta.label}
            </span>
          </div>
        )}
        
        {/* Subtle Dark Gradient Overlay for Badges */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 pointer-events-none" />

        {/* Floating Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-xs border ${catMeta.bg}`}>
            {catMeta.label}
          </span>
          {getStatusBadge(report.status)}
        </div>

        {/* AI Severity Tag (Bottom Left of Image) */}
        {report.severity && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold shadow-xs">
            <ShieldAlert className="w-3 h-3 text-amber-400" />
            <span className="capitalize">{report.severity} Priority</span>
          </div>
        )}
      </div>

      {/* Content Body */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        
        <div className="space-y-2">
          {/* Location & Time */}
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <div className="flex items-center gap-1 max-w-[65%] truncate">
              <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span className="truncate">{report.location || report.address || report.city?.name || 'Local Area'}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>{getRelativeTime(report.createdAt || report.created_at)}</span>
            </div>
          </div>

          {/* Title */}
          <h3 className="font-extrabold text-base text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-2 leading-snug">
            {report.title || report.description?.slice(0, 50) + '...'}
          </h3>

          {/* Short Description */}
          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-normal">
            {report.description}
          </p>
        </div>

        {/* Community Engagement Metrics & Progress - No fake stats */}
        <div className="space-y-3 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs font-bold">
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-teal-600" />
              {Number(report.supportCount) > 0 ? (
                <span className="text-slate-700">{report.supportCount} Supporting</span>
              ) : (
                <span className="text-slate-400 font-normal">0 Supporting</span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <HandHeart className="w-3.5 h-3.5 text-emerald-600" />
              {(Number(report.helpCount) > 0 || Number(report.volunteerCount) > 0) ? (
                <span className="text-slate-700">{report.helpCount || report.volunteerCount} Helping</span>
              ) : (
                <span className="text-slate-400 font-normal">0 Helping</span>
              )}
            </div>
          </div>

          {/* Progress Bar Toward Resolution */}
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                report.status === 'resolved'
                  ? 'bg-emerald-500 w-full'
                  : report.status === 'resolution_pending'
                  ? 'bg-yellow-500 w-[85%]'
                  : report.status === 'action_in_progress' || report.status === 'in_progress'
                  ? 'bg-blue-500 w-3/4'
                  : report.status === 'assigned' || report.status === 'authority_notified'
                  ? 'bg-amber-500 w-1/2'
                  : report.status === 'verified' || report.status === 'under_review'
                  ? 'bg-sky-500 w-1/4'
                  : 'bg-slate-200 w-[8%]'
              }`}
            />
          </div>

          {/* Actions */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <button
              onClick={() => onView(report)}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200/80 text-slate-800 font-bold rounded-xl text-xs flex items-center justify-center gap-1 transition-colors"
            >
              <span>View</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </button>

            <button
              onClick={() => onSupport(report.id)}
              className={`px-3 py-2 font-bold rounded-xl text-xs flex items-center justify-center gap-1 transition-all ${
                hasSupported
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200'
              }`}
            >
              <Users className="w-3 h-3" />
              <span>{hasSupported ? 'Backed' : 'Support'}</span>
            </button>

            <button
              onClick={() => onVolunteer(report.id)}
              className={`px-3 py-2 font-bold rounded-xl text-xs flex items-center justify-center gap-1 transition-all ${
                hasVolunteered
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}
            >
              <HandHeart className="w-3 h-3" />
              <span>{hasVolunteered ? 'Joined' : 'I Can Help'}</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
