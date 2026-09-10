import React, { useState } from 'react';
import { resolveImageUrl } from '../../utils/imageUrl';
import { 
  X, 
  MapPin, 
  Clock, 
  Users, 
  HandHeart, 
  ShieldCheck, 
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Wind,
  Droplets,
  TreePine,
  Trash2,
  ShoppingBag
} from 'lucide-react';

/**
 * Modern Report Detail Experience Modal
 */
export default function ReportDetailModal({ 
  report, 
  onClose, 
  onSupport, 
  onVolunteer, 
  hasSupported, 
  hasVolunteered 
}) {
  if (!report) return null;

  const [imageError, setImageError] = useState(false);
  const resolvedPhoto = resolveImageUrl(report.photo || report.photo_url);

  const isResolved = report.status === 'resolved' || report.status === 'verified';
  const isInProgress = report.status === 'in_progress' || report.status === 'assigned';
  const supportCount = Number(report.supportCount) || 0;
  const volunteerCount = Number(report.volunteerCount) || 0;

  const timelineSteps = [
    { label: 'Report Submitted', desc: 'Citizen uploaded evidence & GPS location', done: true },
    { 
      label: 'Community Supported', 
      desc: supportCount > 0 ? `${supportCount} local citizen${supportCount > 1 ? 's' : ''} backed this report` : 'Awaiting local community support', 
      done: supportCount > 0 
    },
    { 
      label: 'Volunteer Joined', 
      desc: volunteerCount > 0 ? `${volunteerCount} volunteer${volunteerCount > 1 ? 's' : ''} joined this action` : 'Open for community volunteers', 
      done: volunteerCount > 0 || isInProgress || isResolved 
    },
    { label: 'Municipal Notice Dispatched', desc: 'Official notice queued for municipal ward', done: isInProgress || isResolved },
    { label: 'Resolution Verified', desc: 'Site verified and action validated', done: isResolved },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      
      {/* Modal Card */}
      <div className="relative w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden my-8 space-y-6">
        
        {/* Header Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Large Evidence Image - Uses actual uploaded image */}
        <div className="relative h-72 sm:h-80 w-full overflow-hidden bg-slate-900 flex items-center justify-center">
          {resolvedPhoto && !imageError ? (
            <img
              src={resolvedPhoto}
              alt={report.title || 'Report evidence'}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center gap-2 text-white">
              <div className="p-4 rounded-3xl bg-white/10 border border-white/10">
                <AlertTriangle className="w-12 h-12 text-emerald-400" />
              </div>
              <p className="text-sm font-bold text-slate-300 capitalize">
                {report.category?.replace('-', ' ') || 'Environmental Report'}
              </p>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-black/20 to-transparent" />
          
          <div className="absolute bottom-6 left-6 right-6 text-white space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-white/20 backdrop-blur-md text-white border border-white/30">
                {report.category?.replace('-', ' ') || 'Report'}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider backdrop-blur-md ${
                isResolved ? 'bg-emerald-500/90 text-white' : isInProgress ? 'bg-amber-500/90 text-white' : 'bg-rose-500/90 text-white'
              }`}>
                {report.status?.replace('_', ' ') || 'Open'}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black leading-tight">
              {report.title || 'Untitled Environmental Issue'}
            </h2>
          </div>
        </div>

        {/* Body Content */}
        <div className="px-6 sm:px-8 pb-8 space-y-6">
          
          {/* Metadata Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs font-bold text-slate-600">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>{report.location || report.address || 'Local Community'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Reported {new Date(report.createdAt || report.created_at || Date.now()).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-teal-600 shrink-0" />
              <span>{supportCount > 0 ? `${supportCount} Supporters` : '0 Supporters'}</span>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Citizen Field Observation
            </h4>
            <p className="text-sm text-slate-700 leading-relaxed font-normal">
              {report.description}
            </p>
          </div>

          {/* AI Automated Severity Analysis */}
          {(report.ai_summary || report.aiAnalysis) && (
            <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200/80 space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-700" />
                <span className="text-xs font-black uppercase tracking-wider text-emerald-900">
                  EcoSathi AI Analysis Assessment
                </span>
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed">
                {report.ai_summary || report.aiAnalysis?.summary || 'Particulate matter and ground contamination risk detected.'}
              </p>
            </div>
          )}

          {/* Resolution Timeline */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Resolution Progress Timeline
            </h4>
            
            <div className="space-y-3 pl-2 border-l-2 border-slate-200 ml-2">
              {timelineSteps.map((step, idx) => (
                <div key={idx} className="relative pl-6">
                  <span className={`absolute -left-[17px] top-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    step.done ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                  }`}>
                    {step.done ? '✓' : idx + 1}
                  </span>
                  <p className={`text-xs font-bold ${step.done ? 'text-slate-900' : 'text-slate-400'}`}>
                    {step.label}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Modal Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => onSupport && onSupport(report.id)}
              className={`w-full sm:flex-1 py-3.5 px-4 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition-all ${
                hasSupported
                  ? 'bg-teal-700 text-white shadow-md'
                  : 'bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>{hasSupported ? '✓ You Supported this Report' : 'Support this Issue'}</span>
            </button>

            <button
              type="button"
              onClick={() => onVolunteer && onVolunteer(report.id)}
              className={`w-full sm:flex-1 py-3.5 px-4 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition-all ${
                hasVolunteered
                  ? 'bg-emerald-700 text-white shadow-md'
                  : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-md shadow-emerald-700/20'
              }`}
            >
              <HandHeart className="w-4 h-4" />
              <span>{hasVolunteered ? '✓ You Are a Volunteer' : 'I Can Help Volunteer'}</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
