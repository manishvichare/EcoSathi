import React, { useState } from 'react';
import { 
  X, 
  MapPin, 
  Calendar, 
  Clock, 
  User, 
  CheckCircle2, 
  AlertTriangle, 
  Clock3, 
  AlertCircle,
  ShieldCheck,
  ExternalLink,
  RotateCcw
} from 'lucide-react';
import { resolveImageUrl } from '../../utils/imageUrl';
import { reviewTaskSubmission } from '../../services/leaderboardSservice';

export default function TaskEvidenceModal({ 
  submission, 
  isAdmin = false,
  onClose, 
  onResubmit,
  onReviewed,
}) {
  if (!submission) return null;

  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewNote, setReviewNote] = useState('');

  const [imgErr1, setImgErr1] = useState(false);
  const [imgErr2, setImgErr2] = useState(false);

  const evidenceUrl = resolveImageUrl(submission.evidence_url);
  const beforeUrl = resolveImageUrl(submission.before_evidence_url);

  // Status Meta
  const getStatusMeta = (status) => {
    switch (status) {
      case 'approved':
        return {
          label: 'Verified',
          subLabel: '✓ Completed — Eco Points Awarded',
          badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          icon: CheckCircle2,
          iconColor: 'text-emerald-600',
        };
      case 'under_review':
        return {
          label: 'Under Review',
          subLabel: 'Moderator is inspecting submitted evidence',
          badge: 'bg-blue-100 text-blue-800 border-blue-300',
          icon: Clock3,
          iconColor: 'text-blue-600',
        };
      case 'more_evidence_required':
        return {
          label: 'More Evidence Required',
          subLabel: 'Moderator requested additional verification proof',
          badge: 'bg-amber-100 text-amber-800 border-amber-300',
          icon: AlertCircle,
          iconColor: 'text-amber-600',
        };
      case 'rejected':
        return {
          label: 'Evidence Rejected',
          subLabel: 'Evidence did not meet verification criteria',
          badge: 'bg-rose-100 text-rose-800 border-rose-300',
          icon: AlertTriangle,
          iconColor: 'text-rose-600',
        };
      case 'pending':
      default:
        return {
          label: 'Pending Verification',
          subLabel: 'Awaiting review by an authorized moderator',
          badge: 'bg-yellow-100 text-yellow-800 border-yellow-300',
          icon: Clock,
          iconColor: 'text-yellow-600',
        };
    }
  };

  const statusMeta = getStatusMeta(submission.status);
  const StatusIcon = statusMeta.icon;

  const formattedSubmittedAt = submission.submitted_at
    ? new Date(submission.submitted_at).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Recently';

  const isCleanup = !!beforeUrl;
  const canResubmit = submission.status === 'rejected' || submission.status === 'more_evidence_required';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${statusMeta.badge}`}>
                <StatusIcon className="w-3 h-3" />
                <span>{statusMeta.label}</span>
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                +{submission.task?.points || submission.points_awarded || 20} Points
              </span>
            </div>
            <h3 className="text-xl font-black text-slate-900 mt-1">Evidence Details</h3>
            <p className="text-xs text-slate-500 font-medium">{submission.task?.title || 'Eco Action'}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          
          {/* Status Alert Banner */}
          <div className={`p-4 rounded-2xl border flex items-start gap-3 ${
            submission.status === 'approved'
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
              : submission.status === 'rejected'
              ? 'bg-rose-50/80 border-rose-200 text-rose-900'
              : submission.status === 'more_evidence_required'
              ? 'bg-amber-50/80 border-amber-200 text-amber-900'
              : 'bg-yellow-50/80 border-yellow-200 text-yellow-900'
          }`}>
            <StatusIcon className={`w-5 h-5 shrink-0 mt-0.5 ${statusMeta.iconColor}`} />
            <div className="space-y-0.5 text-xs">
              <p className="font-extrabold">{statusMeta.label}</p>
              <p className="text-slate-600 leading-relaxed">{statusMeta.subLabel}</p>
              {submission.status === 'approved' && (
                <p className="font-bold text-emerald-700 pt-1">
                  ✓ +{submission.points_awarded || submission.task?.points} Eco Points added to your profile!
                </p>
              )}
            </div>
          </div>

          {/* Moderator Feedback if rejected or more evidence required */}
          {submission.review_notes && (
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
              <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                Moderator Review Notes:
              </p>
              <p className="text-xs text-slate-700 italic leading-relaxed">
                "{submission.review_notes}"
              </p>
              {submission.reviewed_by_name && (
                <p className="text-[10px] text-slate-400 pt-0.5">
                  Reviewed by {submission.reviewed_by_name} • {new Date(submission.reviewed_at || Date.now()).toLocaleDateString()}
                </p>
              )}
            </div>
          )}

          {/* Evidence Photos Display */}
          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
              Submitted Photo Evidence
            </h4>

            {isCleanup ? (
              /* Side-by-side Before and After Photos */
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                    Before Cleanup
                  </span>
                  <div className="relative h-44 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
                    {beforeUrl && !imgErr1 ? (
                      <img
                        src={beforeUrl}
                        alt="Before evidence"
                        className="w-full h-full object-cover"
                        onError={() => setImgErr1(true)}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                        Image Unavailable
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                    After Cleanup
                  </span>
                  <div className="relative h-44 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
                    {evidenceUrl && !imgErr2 ? (
                      <img
                        src={evidenceUrl}
                        alt="After evidence"
                        className="w-full h-full object-cover"
                        onError={() => setImgErr2(true)}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                        Image Unavailable
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Single Photo Evidence */
              <div className="relative h-56 w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
                {evidenceUrl && !imgErr1 ? (
                  <img
                    src={evidenceUrl}
                    alt="Task evidence"
                    className="w-full h-full object-cover"
                    onError={() => setImgErr1(true)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                    No image uploaded
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Description */}
          {submission.description && (
            <div className="space-y-1">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                User Field Notes
              </h4>
              <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-2xl border border-slate-200/80 leading-relaxed">
                {submission.description}
              </p>
            </div>
          )}

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs text-slate-600 bg-slate-50/60 p-3.5 rounded-2xl border border-slate-200/80">
            <div className="flex items-center gap-1.5 truncate">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">Date: {submission.task_date}</span>
            </div>
            <div className="flex items-center gap-1.5 truncate">
              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{formattedSubmittedAt}</span>
            </div>
            {submission.location_address && (
              <div className="col-span-2 flex items-center gap-1.5 truncate text-[11px] text-emerald-800 font-medium">
                <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span className="truncate">{submission.location_address}</span>
              </div>
            )}
          </div>

          {/* Admin Verification Controls */}
          {isAdmin && (submission.status === 'pending' || submission.status === 'under_review') && (
            <div className="pt-3 border-t border-slate-200 space-y-3 bg-purple-50/60 -mx-6 -mb-6 p-6 rounded-b-3xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-black uppercase text-purple-900">
                  <ShieldCheck className="w-4 h-4 text-purple-700" />
                  <span>Admin Verification Decision</span>
                </div>
                <span className="text-[11px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md">
                  +{submission.points_awarded || submission.task?.points || 20} Pts
                </span>
              </div>

              <input
                type="text"
                placeholder="Optional review note (required for rejection)..."
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              />

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  disabled={isReviewing}
                  onClick={async () => {
                    setIsReviewing(true);
                    try {
                      await reviewTaskSubmission(submission.id, 'approve', reviewNote || 'Verified by Admin.');
                      if (onReviewed) onReviewed();
                      onClose();
                    } catch (err) {
                      alert(err.response?.data?.message || err.message || 'Verification failed');
                    } finally {
                      setIsReviewing(false);
                    }
                  }}
                  className="py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isReviewing ? 'Processing...' : 'Approve & Award Points'}</span>
                </button>

                <button
                  type="button"
                  disabled={isReviewing}
                  onClick={async () => {
                    if (!reviewNote.trim()) {
                      alert('Please provide a reason in the note field before rejecting.');
                      return;
                    }
                    setIsReviewing(true);
                    try {
                      await reviewTaskSubmission(submission.id, 'reject', reviewNote);
                      if (onReviewed) onReviewed();
                      onClose();
                    } catch (err) {
                      alert(err.response?.data?.message || err.message || 'Action failed');
                    } finally {
                      setIsReviewing(false);
                    }
                  }}
                  className="py-2.5 px-3 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                >
                  <X className="w-4 h-4" />
                  <span>Reject</span>
                </button>
              </div>
            </div>
          )}

          {/* Resubmit button if rejected or more evidence needed */}
          {canResubmit && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onResubmit(submission);
                }}
                className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-md shadow-amber-600/20 flex items-center justify-center gap-2 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                <span>
                  {submission.status === 'rejected' ? 'Submit New Evidence' : 'Upload More Evidence'}
                </span>
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
