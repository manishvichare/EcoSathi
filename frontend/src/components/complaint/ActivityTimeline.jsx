import React from 'react';
import {
  FileText, Users, HandHeart, Upload, Shield, CheckCircle2, XCircle,
  AlertTriangle, Clock, MapPin, Sparkles, UserCheck, Bell
} from 'lucide-react';

const EVENT_META = {
  report_submitted:      { icon: FileText,      color: 'bg-emerald-100 text-emerald-700', label: 'Report Submitted' },
  support_added:         { icon: Users,          color: 'bg-teal-100 text-teal-700',      label: 'Community Support' },
  help_offered:          { icon: HandHeart,      color: 'bg-sky-100 text-sky-700',        label: 'Help Offered' },
  evidence_uploaded:     { icon: Upload,         color: 'bg-indigo-100 text-indigo-700',  label: 'Evidence Added' },
  action_assigned:       { icon: UserCheck,      color: 'bg-amber-100 text-amber-700',    label: 'Action Assigned' },
  assignment_updated:    { icon: Clock,          color: 'bg-orange-100 text-orange-700',  label: 'Assignment Updated' },
  authority_notified:    { icon: Bell,           color: 'bg-purple-100 text-purple-700',  label: 'Authority Notified' },
  authority_response:    { icon: Shield,         color: 'bg-violet-100 text-violet-700',  label: 'Authority Response' },
  resolution_submitted:  { icon: CheckCircle2,   color: 'bg-green-100 text-green-700',    label: 'Resolution Submitted' },
  resolution_approved:   { icon: CheckCircle2,   color: 'bg-emerald-100 text-emerald-800', label: 'Resolution Approved' },
  resolution_rejected:   { icon: XCircle,        color: 'bg-rose-100 text-rose-700',      label: 'Resolution Rejected' },
};

const getRelativeTime = (iso) => {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

export default function ActivityTimeline({ activity = [] }) {
  if (activity.length === 0) {
    return (
      <div className="py-8 text-center text-slate-400 text-sm">
        <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
        No activity recorded yet.
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {activity.map((event, idx) => {
        const meta = EVENT_META[event.event_type] || {
          icon: AlertTriangle,
          color: 'bg-slate-100 text-slate-600',
          label: event.event_type,
        };
        const Icon = meta.icon;
        const isLast = idx === activity.length - 1;

        return (
          <div key={event.id} className="flex gap-3 relative">
            {/* Vertical connector line */}
            {!isLast && (
              <div className="absolute left-[18px] top-10 bottom-0 w-0.5 bg-slate-100" />
            )}

            {/* Icon bubble */}
            <div className={`shrink-0 mt-1 w-9 h-9 rounded-full flex items-center justify-center z-10 ${meta.color}`}>
              <Icon className="w-4 h-4" />
            </div>

            {/* Content */}
            <div className="flex-1 pb-5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
                  {meta.label}
                </span>
                <span className="text-[11px] text-slate-400 shrink-0">
                  {getRelativeTime(event.created_at)}
                </span>
              </div>
              <p className="text-sm text-slate-600 mt-0.5 leading-relaxed">
                {event.description}
              </p>
              {event.actor_name && (
                <span className="text-[11px] text-slate-400 font-medium">
                  — {event.actor_name}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
