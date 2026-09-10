import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  RefreshCw, 
  Calendar, 
  MapPin, 
  User, 
  Sparkles, 
  Clock,
  Filter,
  MessageSquare,
  ExternalLink
} from 'lucide-react';
import { resolveImageUrl } from '../../utils/imageUrl';
import { getAdminSubmissions, reviewTaskSubmission } from '../../services/leaderboardSservice';

export default function AdminTaskVerification({ onPointsAwarded }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [selectedStatus, setSelectedStatus] = useState('pending'); // default shows actionable items
  const [reviewModal, setReviewModal] = useState({ open: false, submission: null, action: null, note: '' });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchSubmissions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminSubmissions({ status: selectedStatus });
      setSubmissions(data || []);
    } catch (err) {
      console.error('Failed to fetch submissions for verification:', err);
      setError('Could not load pending verification requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [selectedStatus]);

  const handleOpenReviewModal = (submission, action) => {
    setReviewModal({
      open: true,
      submission,
      action,
      note: action === 'approve' ? 'Verified by community moderator.' : '',
    });
  };

  const handleConfirmReview = async () => {
    if (!reviewModal.submission || !reviewModal.action) return;

    if (
      (reviewModal.action === 'reject' || reviewModal.action === 'request_more_evidence') &&
      !reviewModal.note.trim()
    ) {
      alert('Please provide a reason or instruction note for the user.');
      return;
    }

    setActionLoading(true);
    try {
      const result = await reviewTaskSubmission(
        reviewModal.submission.id,
        reviewModal.action,
        reviewModal.note
      );

      if (result.success) {
        if (reviewModal.action === 'approve' && onPointsAwarded) {
          onPointsAwarded(reviewModal.submission.task?.points || 20);
        }
        setReviewModal({ open: false, submission: null, action: null, note: '' });
        fetchSubmissions();
      } else {
        alert(result.message || 'Action failed');
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Review failed');
    } finally {
      setActionLoading(false);
    }
  };

  const filterTabs = [
    { value: 'pending', label: 'Pending' },
    { value: 'under_review', label: 'Under Review' },
    { value: 'more_evidence_required', label: 'More Evidence' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'all', label: 'All' },
  ];

  return (
    <section id="moderator-queue" className="space-y-6 pt-8 border-t border-slate-200">
      
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-300">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
              <span>Moderator Action Panel</span>
            </span>
          </div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">
            Pending Eco Action Verification
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            Review user-submitted evidence, approve valid micro-actions, and distribute verified Eco Points.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchSubmissions}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {filterTabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setSelectedStatus(tab.value)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedStatus === tab.value
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Verification Queue List */}
      {loading ? (
        <div className="p-12 text-center glass-card rounded-3xl border border-slate-200">
          <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-medium">Loading verification queue...</p>
        </div>
      ) : submissions.length === 0 ? (
        <div className="py-12 px-4 text-center glass-card rounded-3xl border border-slate-200 space-y-2">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
          <h4 className="text-sm font-extrabold text-slate-800">
            No submissions in "{selectedStatus}" state
          </h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            All user actions in this category have been processed, or none have been submitted yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {submissions.map((sub) => {
            const evidenceUrl = resolveImageUrl(sub.evidence_url);
            const beforeUrl = resolveImageUrl(sub.before_evidence_url);
            const isCleanup = !!beforeUrl;

            return (
              <div
                key={sub.id}
                className="glass-card rounded-3xl border border-slate-200 overflow-hidden shadow-xs flex flex-col justify-between"
              >
                <div className="p-5 space-y-4">
                  {/* Card Header: Task & User Meta */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                          +{sub.task?.points || 20} Eco Points
                        </span>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                          sub.status === 'approved'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : sub.status === 'rejected'
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : sub.status === 'more_evidence_required'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-yellow-50 text-yellow-800 border-yellow-200'
                        }`}>
                          {sub.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <h4 className="text-base font-black text-slate-900 mt-1">
                        {sub.task?.title || 'Eco Action'}
                      </h4>
                    </div>

                    <div className="text-right text-xs">
                      <p className="font-bold text-slate-800">{sub.user?.name || 'Citizen'}</p>
                      <p className="text-[11px] text-slate-400">{sub.user?.email}</p>
                    </div>
                  </div>

                  {/* Evidence Photos: Side-by-side for cleanup, or single */}
                  {isCleanup ? (
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                        Cleanup Comparison (Before vs After)
                      </p>
                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="space-y-1">
                          <span className="text-[10px] font-black uppercase text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            BEFORE
                          </span>
                          <img
                            src={beforeUrl}
                            alt="Before cleanup"
                            className="w-full h-36 object-cover rounded-2xl border border-slate-200"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            AFTER
                          </span>
                          <img
                            src={evidenceUrl}
                            alt="After cleanup"
                            className="w-full h-36 object-cover rounded-2xl border border-slate-200"
                          />
                        </div>
                      </div>
                    </div>
                  ) : sub.linked_complaint ? (
                    <div className="space-y-2 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                      <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                        Linked EcoSathi Report
                      </span>
                      <div className="flex gap-3 items-center">
                        <img
                          src={sub.linked_complaint.photo_url}
                          alt="Linked complaint"
                          className="w-20 h-20 object-cover rounded-xl border border-slate-200 shrink-0"
                        />
                        <div className="space-y-1 text-xs">
                          <p className="font-extrabold text-slate-800 capitalize">
                            {sub.linked_complaint.category}
                          </p>
                          <p className="text-slate-500 line-clamp-2 leading-relaxed">
                            {sub.linked_complaint.description}
                          </p>
                          <p className="text-[10px] text-slate-400">{sub.linked_complaint.address}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="relative h-48 w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
                      {evidenceUrl ? (
                        <img
                          src={evidenceUrl}
                          alt="Task evidence"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                          No photo submitted
                        </div>
                      )}
                    </div>
                  )}

                  {/* Description & Location */}
                  {sub.description && (
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs text-slate-700">
                      <p className="font-semibold text-slate-500 text-[10px] uppercase">User Note:</p>
                      <p className="mt-0.5 leading-relaxed">{sub.description}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{new Date(sub.submitted_at).toLocaleString('en-IN')}</span>
                    </span>
                    {sub.location_address && (
                      <span className="flex items-center gap-1 text-emerald-800 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        <span>{sub.location_address}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Footer: Action Buttons (Only actionable if not already approved) */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
                  {sub.status === 'approved' ? (
                    <div className="w-full text-center text-xs font-bold text-emerald-700 flex items-center justify-center gap-1.5 py-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approved • +{sub.points_awarded || sub.task?.points} Points Awarded</span>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => handleOpenReviewModal(sub, 'approve')}
                        className="flex-1 py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenReviewModal(sub, 'request_more_evidence')}
                        className="py-2.5 px-3 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold rounded-xl text-xs flex items-center justify-center gap-1 transition-colors border border-amber-300"
                        title="Request clearer photo or additional proof"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>More Evidence</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenReviewModal(sub, 'reject')}
                        className="py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1 transition-colors border border-rose-200"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Modal Dialog */}
      {reviewModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-black text-slate-900">
                {reviewModal.action === 'approve'
                  ? 'Approve Action & Award Points'
                  : reviewModal.action === 'reject'
                  ? 'Reject Evidence'
                  : 'Request More Evidence'}
              </h4>
              <button
                onClick={() => setReviewModal({ open: false, submission: null, action: null, note: '' })}
                className="p-1 rounded-full hover:bg-slate-100"
              >
                <XCircle className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {reviewModal.action === 'approve'
                ? `Confirming this action will award +${reviewModal.submission.task?.points || 20} Eco Points to ${reviewModal.submission.user?.name}.`
                : reviewModal.action === 'reject'
                ? 'Please specify why this evidence was rejected so the user can understand and optionally resubmit.'
                : 'Describe what additional or clearer proof the user needs to upload.'}
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                {reviewModal.action === 'approve' ? 'Review Note (Optional)' : 'Message to Citizen *'}
              </label>
              <textarea
                rows={3}
                value={reviewModal.note}
                onChange={(e) => setReviewModal((prev) => ({ ...prev, note: e.target.value }))}
                placeholder={
                  reviewModal.action === 'reject'
                    ? 'e.g., Photo does not clearly show the planted sapling or appears to be a generic stock image...'
                    : reviewModal.action === 'request_more_evidence'
                    ? 'e.g., Please upload a wider angle photo showing the surrounding area and your location...'
                    : 'Notes...'
                }
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 resize-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReviewModal({ open: false, submission: null, action: null, note: '' })}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmReview}
                className={`flex-1 py-2.5 text-white font-bold rounded-xl text-xs transition-all shadow-xs ${
                  reviewModal.action === 'approve'
                    ? 'bg-emerald-700 hover:bg-emerald-800'
                    : reviewModal.action === 'reject'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {actionLoading ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

    </section>
  );
}
