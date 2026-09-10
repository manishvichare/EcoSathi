import React, { useState } from 'react';
import { Shield, Plus, ChevronDown, ChevronUp, Calendar, Hash } from 'lucide-react';
import { setAuthority, addAuthorityResponse } from '../../services/complaintService';

const STATUS_COLORS = {
  not_submitted: 'bg-slate-100 text-slate-600 border-slate-200',
  submitted:     'bg-blue-100 text-blue-700 border-blue-200',
  acknowledged:  'bg-indigo-100 text-indigo-700 border-indigo-200',
  in_progress:   'bg-amber-100 text-amber-700 border-amber-200',
  closed:        'bg-emerald-100 text-emerald-700 border-emerald-200',
};

const STATUS_LABELS = {
  not_submitted: 'Not Submitted',
  submitted:     'Submitted',
  acknowledged:  'Acknowledged',
  in_progress:   'In Progress',
  closed:        'Closed',
};

export default function AuthoritySection({ complaintId, authority, isAdmin, onUpdate }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [form, setForm] = useState({
    department: '',
    reference_number: '',
    submitted_date: '',
    submission_status: 'not_submitted',
    notes: '',
  });
  const [responseText, setResponseText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSetAuthority = async (e) => {
    e.preventDefault();
    if (!form.department) { setError('Department is required.'); return; }
    setSubmitting(true);
    setError('');
    try {
      const result = await setAuthority(complaintId, form);
      onUpdate && onUpdate(result.authority);
      setShowAddForm(false);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to set authority.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddResponse = async (e) => {
    e.preventDefault();
    if (!responseText.trim()) { setError('Response text is required.'); return; }
    setSubmitting(true);
    setError('');
    try {
      const result = await addAuthorityResponse(complaintId, { response_text: responseText });
      onUpdate && onUpdate(null, result.response);
      setResponseText('');
      setShowResponseForm(false);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to add response.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!authority && !isAdmin) {
    return (
      <p className="text-sm text-slate-400 py-4 text-center">
        No authority case has been opened yet.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {/* Authority Case Info */}
      {authority ? (
        <div className="p-4 bg-purple-50/60 rounded-2xl border border-purple-200 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-700 shrink-0" />
              <span className="text-sm font-black text-purple-900">{authority.department}</span>
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
              STATUS_COLORS[authority.submission_status] || STATUS_COLORS.not_submitted
            }`}>
              {STATUS_LABELS[authority.submission_status] || authority.submission_status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs text-slate-600">
            {authority.reference_number && (
              <div className="flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-slate-400" />
                <span>Ref: <strong>{authority.reference_number}</strong></span>
              </div>
            )}
            {authority.submitted_date && (
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Submitted: {new Date(authority.submitted_date).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          {authority.notes && (
            <p className="text-xs text-slate-600 leading-relaxed border-t border-purple-200 pt-2">{authority.notes}</p>
          )}

          {/* Authority Responses */}
          {authority.responses && authority.responses.length > 0 && (
            <div className="space-y-2 border-t border-purple-200 pt-3">
              <h6 className="text-[11px] font-black uppercase tracking-wider text-purple-700">Authority Responses</h6>
              {authority.responses.map(r => (
                <div key={r.id} className="p-3 bg-white rounded-xl border border-purple-100 space-y-1">
                  <p className="text-xs text-slate-700 leading-relaxed">{r.response_text}</p>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{r.recorded_by_name || 'Admin'}</span>
                    <span>{new Date(r.response_date || r.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-slate-400 py-2">No authority case opened yet.</p>
      )}

      {/* Admin Controls */}
      {isAdmin && (
        <div className="space-y-3">
          {/* Set/Update Authority */}
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 font-bold rounded-xl text-xs transition-colors"
          >
            {showAddForm ? <ChevronUp className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            {authority ? 'Update Authority Case' : 'Open Authority Case'}
          </button>

          {showAddForm && (
            <form onSubmit={handleSetAuthority} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <input type="text" required value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))}
                placeholder="Department / Authority name *" className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500" />
              <input type="text" value={form.reference_number} onChange={e => setForm(p => ({ ...p, reference_number: e.target.value }))}
                placeholder="Case reference number" className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500" />
              <input type="date" value={form.submitted_date} onChange={e => setForm(p => ({ ...p, submitted_date: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500" />
              <select value={form.submission_status} onChange={e => setForm(p => ({ ...p, submission_status: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                placeholder="Internal notes..." rows={2}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-purple-500" />
              {error && <p className="text-xs text-rose-600">{error}</p>}
              <button type="submit" disabled={submitting}
                className="w-full py-2.5 bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-colors">
                {submitting ? 'Saving...' : 'Save Authority Case'}
              </button>
            </form>
          )}

          {/* Add Response */}
          {authority && (
            <>
              <button
                onClick={() => setShowResponseForm(!showResponseForm)}
                className="flex items-center gap-2 px-4 py-2 bg-violet-50 hover:bg-violet-100 text-violet-800 border border-violet-200 font-bold rounded-xl text-xs transition-colors"
              >
                {showResponseForm ? <ChevronUp className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                Record Authority Response
              </button>

              {showResponseForm && (
                <form onSubmit={handleAddResponse} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <textarea value={responseText} onChange={e => setResponseText(e.target.value)}
                    placeholder="Authority's response or reply..." rows={3} required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-violet-500" />
                  {error && <p className="text-xs text-rose-600">{error}</p>}
                  <button type="submit" disabled={submitting}
                    className="w-full py-2.5 bg-violet-700 hover:bg-violet-800 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-colors">
                    {submitting ? 'Saving...' : 'Save Response'}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
