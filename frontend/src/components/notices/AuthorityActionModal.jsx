import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Upload, 
  Building2, 
  MapPin
} from 'lucide-react';
import { takeAuthorityAction } from '../../services/complaintService';

const STATUS_OPTIONS = [
  { value: 'action_in_progress', label: 'Action in Progress (Squad Dispatched)' },
  { value: 'investigating', label: 'Under Investigation / Site Inspection' },
  { value: 'resolved', label: 'Resolved (Violation Cleared & Compliant)' },
  { value: 'authority_notified', label: 'Notice Issued / Violator Penalized' },
  { value: 'rejected', label: 'Dismissed / Inadmissible Report' },
];

const DEPARTMENTS = [
  'Solid Waste Management & Sanitation Dept',
  'State Pollution Control Board (Enforcement Wing)',
  'Tree Authority & Urban Forestry Division',
  'Water Quality & River Pollution Cell',
  'Municipal Health & Anti-Dumping Squad',
  'Town Planning & Environmental Compliance Unit',
];

export default function AuthorityActionModal({ complaint, onClose, onSuccess }) {
  if (!complaint) return null;

  const [status, setStatus] = useState(complaint.status || 'action_in_progress');
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [actionNotes, setActionNotes] = useState('');
  const [referenceNumber, setReferenceNumber] = useState(`MUN-${Date.now().toString().slice(-6)}`);
  const [actionType, setActionType] = useState('Site Inspection & Enforcement');
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!actionNotes.trim()) {
      setError('Please provide official action notes or inspection findings.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await takeAuthorityAction(complaint.id, {
        status,
        department,
        action_notes: actionNotes.trim(),
        reference_number: referenceNumber,
        action_type: actionType,
        photo,
      });

      if (res.success) {
        onSuccess && onSuccess(res);
        onClose();
      } else {
        setError(res.message || 'Action recording failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to submit authority action.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 bg-gradient-to-r from-purple-800 to-indigo-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white shrink-0">
              <ShieldCheck className="w-5 h-5 text-purple-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base">Municipal Enforcement Action</h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-purple-500/50 rounded-md">
                  Official
                </span>
              </div>
              <p className="text-xs text-purple-200 truncate flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-purple-300 shrink-0" />
                <span>{complaint.address || complaint.city?.name || 'Report Location'}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Complaint Brief */}
        <div className="px-6 py-3 bg-purple-50/70 border-b border-purple-100 flex items-center justify-between gap-3 text-xs text-purple-900">
          <p className="font-medium truncate">
            <strong>Target Issue:</strong> {complaint.description}
          </p>
          <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-200 text-purple-900">
            {complaint.category || 'Environmental Issue'}
          </span>
        </div>

        {/* Action Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Status Decision */}
          <div className="space-y-1.5">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
              Enforcement Status Decision *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatus(opt.value)}
                  className={`p-2.5 rounded-xl text-xs font-bold text-left border transition-all ${
                    status === opt.value
                      ? 'bg-purple-900 text-white border-purple-900 shadow-xs'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Department */}
          <div className="space-y-1.5">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
              Responsible Municipal Department *
            </label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600 cursor-pointer"
            >
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Reference Number & Action Type */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-600">Case Reference #</label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-600">Action Type</label>
              <input
                type="text"
                value={actionType}
                onChange={(e) => setActionType(e.target.value)}
                placeholder="e.g. Site Clearance, Fine Issued"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
              />
            </div>
          </div>

          {/* Official Action Notes / Remarks */}
          <div className="space-y-1.5">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
              Official Findings & Action Taken *
            </label>
            <textarea
              rows={3}
              value={actionNotes}
              onChange={(e) => setActionNotes(e.target.value)}
              placeholder="e.g. Inspection squad visited the location. 3.5 tons of illegal debris cleared. Notice served to premises owner with 48h deadline..."
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600 leading-relaxed"
            />
          </div>

          {/* Optional Action Proof Photo */}
          <div className="space-y-1.5">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
              Attach Site Clearance / Inspection Proof (Optional)
            </label>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer px-4 py-2 bg-slate-100 hover:bg-slate-200/80 rounded-xl text-xs font-bold text-slate-700 border border-slate-200 flex items-center gap-1.5 transition-colors">
                <Upload className="w-3.5 h-3.5 text-slate-500" />
                <span>Choose Photo</span>
                <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
              </label>
              {preview && (
                <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-slate-300">
                  <img src={preview} alt="Action proof" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => { setPhoto(null); setPreview(null); }}
                    className="absolute inset-0 bg-slate-900/60 text-white flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity text-[10px]"
                  >
                    ✕
                  </button>
                </div>
              )}
              <span className="text-[11px] text-slate-400">
                {photo ? photo.name : 'PNG, JPG up to 10MB'}
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-purple-800 to-indigo-800 hover:from-purple-900 hover:to-indigo-900 disabled:opacity-50 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-md shadow-purple-800/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Recording Official Action...' : 'Confirm Action & Notify Citizen'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
