import React, { useState } from 'react';
import { X, UserCheck, Calendar, ClipboardList, CheckCircle2 } from 'lucide-react';
import { assignAction } from '../../services/complaintService';

const ACTION_TYPES = [
  { value: 'site_verification', label: 'Site Verification' },
  { value: 'evidence_collection', label: 'Evidence Collection' },
  { value: 'additional_investigation', label: 'Additional Investigation' },
  { value: 'cleanup', label: 'Cleanup Operation' },
  { value: 'community_outreach', label: 'Community Outreach' },
  { value: 'authority_contact', label: 'Authority Contact' },
  { value: 'on_ground_action', label: 'On-Ground Action' },
  { value: 'follow_up_inspection', label: 'Follow-up Inspection' },
  { value: 'resolution_verification', label: 'Resolution Verification' },
];

export default function AssignActionModal({ complaintId, onClose, onSuccess }) {
  const [form, setForm] = useState({
    action_type: '',
    instructions: '',
    deadline: '',
    assignee_name: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.action_type) { setError('Please select an action type.'); return; }
    setSubmitting(true);
    setError('');
    try {
      const result = await assignAction(complaintId, form);
      onSuccess && onSuccess(result);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to assign action.');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-amber-100 flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-sm">Assign Action</h3>
              <p className="text-[11px] text-slate-500">Admin: dispatch a field task</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Action Type */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">Action Type *</label>
            <select
              value={form.action_type}
              onChange={e => setForm(p => ({ ...p, action_type: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">Select action type...</option>
              {ACTION_TYPES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
          </div>

          {/* Assignee Name */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">Assign To</label>
            <input
              type="text"
              value={form.assignee_name}
              onChange={e => setForm(p => ({ ...p, assignee_name: e.target.value }))}
              placeholder="Volunteer name or team..."
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Deadline */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">Deadline</label>
            <input
              type="date"
              value={form.deadline}
              onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Instructions */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">Instructions</label>
            <textarea
              value={form.instructions}
              onChange={e => setForm(p => ({ ...p, instructions: e.target.value }))}
              placeholder="Specific instructions for this assignment..."
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold rounded-2xl text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" />
            {submitting ? 'Assigning...' : 'Assign Action'}
          </button>
        </form>
      </div>
    </div>
  );
}
