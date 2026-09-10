import React, { useState } from 'react';
import { resolveImageUrl } from '../../utils/imageUrl';
import { Upload, CheckCircle2, XCircle, Clock, X } from 'lucide-react';
import { submitResolution, verifyResolution } from '../../services/complaintService';

const RESOLUTION_TYPES = [
  'Waste Removed / Area Cleaned',
  'Tree Planting / Restoration',
  'Pollution Source Stopped',
  'Authority Action Completed',
  'Community Cleanup Done',
  'Site Inspection Completed',
  'Other Resolution',
];

function ResolutionCard({ resolution }) {
  const evidenceUrl = resolveImageUrl(resolution.evidence_url);
  const [imgErr, setImgErr] = useState(false);

  const statusMeta = {
    pending:  { label: 'Pending Verification', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock },
    approved: { label: 'Approved — Resolved',  color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
    rejected: { label: 'Rejected',             color: 'bg-rose-100 text-rose-700 border-rose-200', icon: XCircle },
  }[resolution.status] || { label: resolution.status, color: 'bg-slate-100 text-slate-600', icon: Clock };

  const StatusIcon = statusMeta.icon;

  return (
    <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-black text-slate-900">{resolution.resolution_type}</p>
          <p className="text-[11px] text-slate-500">{resolution.submitted_by_name || 'Citizen'} • {new Date(resolution.created_at).toLocaleDateString()}</p>
        </div>
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${statusMeta.color}`}>
          <StatusIcon className="w-3 h-3" />
          {statusMeta.label}
        </span>
      </div>

      <p className="text-xs text-slate-700 leading-relaxed">{resolution.description}</p>

      {evidenceUrl && !imgErr && (
        <img
          src={evidenceUrl}
          alt="Resolution evidence"
          className="w-full h-32 object-cover rounded-xl"
          onError={() => setImgErr(true)}
        />
      )}

      {resolution.status === 'rejected' && resolution.review_notes && (
        <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-100 text-xs text-rose-700">
          <strong>Rejection reason:</strong> {resolution.review_notes}
        </div>
      )}
    </div>
  );
}

export default function ResolutionSection({ complaintId, resolutions = [], isAdmin, currentStatus, onUpdate }) {
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ resolution_type: '', description: '', notes: '', photo: null });
  const [preview, setPreview] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [verifying, setVerifying] = useState(null); // 'approve' | 'reject' | null

  const pendingResolution = resolutions.find(r => r.status === 'pending');
  const isAlreadyResolved = currentStatus === 'resolved';

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setForm(p => ({ ...p, photo: file }));
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmitResolution = async (e) => {
    e.preventDefault();
    if (!form.photo) { setError('Photo evidence is required.'); return; }
    if (!form.resolution_type || !form.description) { setError('Resolution type and description are required.'); return; }
    setSubmitting(true);
    setError('');
    try {
      const result = await submitResolution(complaintId, form);
      onUpdate && onUpdate(result);
      setShowSubmitForm(false);
      setForm({ resolution_type: '', description: '', notes: '', photo: null });
      setPreview(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async (approved) => {
    if (!reviewNotes.trim() && !approved) { setError('Please provide rejection reason.'); return; }
    setVerifying(approved ? 'approve' : 'reject');
    setError('');
    try {
      const result = await verifyResolution(complaintId, approved, reviewNotes);
      onUpdate && onUpdate(result);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Verification failed.');
    } finally {
      setVerifying(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Past resolutions */}
      {resolutions.length > 0 && (
        <div className="space-y-3">
          {resolutions.map(r => <ResolutionCard key={r.id} resolution={r} />)}
        </div>
      )}

      {resolutions.length === 0 && !isAlreadyResolved && (
        <p className="text-sm text-slate-400 py-2">No resolution submitted yet.</p>
      )}

      {isAlreadyResolved && (
        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
          <div>
            <p className="text-sm font-black text-emerald-900">Issue Officially Resolved</p>
            <p className="text-xs text-emerald-700">Resolution has been verified and approved by a coordinator.</p>
          </div>
        </div>
      )}

      {/* Submit Resolution Form */}
      {!isAlreadyResolved && (
        <div>
          <button
            onClick={() => setShowSubmitForm(!showSubmitForm)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold rounded-xl text-xs transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            Submit Resolution Evidence
          </button>

          {showSubmitForm && (
            <form onSubmit={handleSubmitResolution} className="mt-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <p className="text-[11px] text-slate-500 leading-relaxed">
                ⚠️ You must upload a photo proving the issue is resolved. A coordinator will verify before marking it as Resolved.
              </p>

              <select value={form.resolution_type} onChange={e => setForm(p => ({ ...p, resolution_type: e.target.value }))} required
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600">
                <option value="">Select resolution type *</option>
                {RESOLUTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>

              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} required
                placeholder="Describe what was done to resolve this issue *" rows={3}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-emerald-600" />

              {/* Photo upload */}
              <label className="block">
                <div className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-colors ${preview ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 hover:border-emerald-300'}`}>
                  {preview ? (
                    <div className="relative">
                      <img src={preview} alt="Preview" className="mx-auto h-32 object-contain rounded-xl" />
                      <button type="button" onClick={() => { setPreview(null); setForm(p => ({ ...p, photo: null })); }}
                        className="absolute top-1 right-1 p-1 rounded-full bg-rose-500 text-white">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Upload className="w-6 h-6 mx-auto text-slate-400" />
                      <p className="text-xs text-slate-500">Upload resolution proof photo *</p>
                    </div>
                  )}
                </div>
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePhotoChange} />
              </label>

              {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}

              <button type="submit" disabled={submitting || !form.photo}
                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2">
                <Upload className="w-3.5 h-3.5" />
                {submitting ? 'Submitting...' : 'Submit for Verification'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Admin: Verify Resolution */}
      {isAdmin && pendingResolution && (
        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 space-y-3">
          <p className="text-xs font-black text-amber-900 uppercase tracking-wider">⚡ Pending Admin Verification</p>
          <p className="text-xs text-amber-800">Review the resolution evidence above, then approve or reject.</p>

          <textarea value={reviewNotes} onChange={e => setReviewNotes(e.target.value)}
            placeholder="Review notes (required if rejecting)..." rows={2}
            className="w-full px-3 py-2 rounded-xl border border-amber-200 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-amber-500" />

          {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}

          <div className="flex gap-2">
            <button onClick={() => handleVerify(true)} disabled={verifying}
              className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {verifying === 'approve' ? 'Approving...' : 'Approve & Resolve'}
            </button>
            <button onClick={() => handleVerify(false)} disabled={verifying}
              className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors">
              <XCircle className="w-3.5 h-3.5" />
              {verifying === 'reject' ? 'Rejecting...' : 'Reject'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
