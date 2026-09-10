import React from 'react';
import { FileText, ShieldCheck, Clock, CheckCircle2 } from 'lucide-react';

/**
 * Modern NoticeCard Component
 */
export default function NoticeCard({ notice }) {
  const text = notice.notice_text || notice.noticeText || 'Official Notice';
  const createdAt = notice.created_at || notice.createdAt;
  const status = notice.status || 'draft';
  const severity = notice.complaint?.severity || 'High';

  return (
    <div className="glass-card p-6 sm:p-7 rounded-3xl border border-slate-200/80 card-hover space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <FileText className="w-4 h-4" />
          </div>
          <span className="text-xs font-black uppercase tracking-wider text-emerald-800 bg-emerald-100/70 px-2.5 py-1 rounded-full">
            Municipal AI Action Notice
          </span>
        </div>
        <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
          {severity} Priority
        </span>
      </div>

      {/* Notice Text Content */}
      <div className="bg-slate-50/90 p-4 sm:p-5 rounded-2xl border border-slate-200/80">
        <pre className="font-sans text-xs sm:text-sm text-slate-800 whitespace-pre-wrap leading-relaxed font-normal">
          {text}
        </pre>
      </div>

      {/* Footer Details */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
        <div className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{createdAt ? new Date(createdAt).toLocaleDateString() : 'Active Dispatch'}</span>
        </div>
        <span className="inline-flex items-center gap-1 font-extrabold text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
          <CheckCircle2 className="w-3 h-3" />
          <span className="capitalize">{status}</span>
        </span>
      </div>
    </div>
  );
}
