import React, { useState } from 'react';
import { X, HandHeart, MapPin, Camera, Info, Trash2, Phone, Star } from 'lucide-react';
import { addHelpAction } from '../../services/complaintService';

const HELP_TYPES = [
  {
    value: 'visit_location',
    icon: MapPin,
    label: 'Visit Location',
    description: 'I will physically visit the site to assess the situation.',
    color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  },
  {
    value: 'provide_photos',
    icon: Camera,
    label: 'Provide Photos',
    description: 'I will capture additional photographic evidence from the area.',
    color: 'text-sky-700 bg-sky-50 border-sky-200',
  },
  {
    value: 'provide_information',
    icon: Info,
    label: 'Share Information',
    description: 'I have additional details, history, or context about this issue.',
    color: 'text-indigo-700 bg-indigo-50 border-indigo-200',
  },
  {
    value: 'help_cleanup',
    icon: Trash2,
    label: 'Help with Cleanup',
    description: 'I can participate in a community cleanup event at this location.',
    color: 'text-amber-700 bg-amber-50 border-amber-200',
  },
  {
    value: 'contact_authority',
    icon: Phone,
    label: 'Contact Authority',
    description: 'I will contact the relevant municipal authority or department.',
    color: 'text-rose-700 bg-rose-50 border-rose-200',
  },
  {
    value: 'volunteer_action',
    icon: Star,
    label: 'General Volunteer',
    description: 'I am available to help in any way needed to resolve this issue.',
    color: 'text-violet-700 bg-violet-50 border-violet-200',
  },
];

export default function HelpModal({ complaintId, onClose, onSuccess, existingHelp }) {
  const [selected, setSelected] = useState(existingHelp?.help_type || '');
  const [notes, setNotes] = useState(existingHelp?.notes || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selected) { setError('Please select how you want to help.'); return; }
    setSubmitting(true);
    setError('');
    try {
      const result = await addHelpAction(complaintId, selected, notes);
      if (result.alreadyHelping) {
        setError('You already have an active help commitment for this report.');
        setSubmitting(false);
        return;
      }
      onSuccess && onSuccess(result);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-emerald-100 flex items-center justify-center">
              <HandHeart className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-sm">I Can Help</h3>
              <p className="text-[11px] text-slate-500">Choose how you want to contribute</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {existingHelp && (
          <div className="mx-6 mt-4 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-medium">
            ✓ You currently have an active help commitment. Submitting a new type will update it.
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Help Type Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {HELP_TYPES.map(type => {
              const Icon = type.icon;
              const isSelected = selected === type.value;
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setSelected(type.value)}
                  className={`text-left p-3.5 rounded-2xl border-2 transition-all ${
                    isSelected ? type.color + ' border-current' : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={`w-4 h-4 ${isSelected ? '' : 'text-slate-400'}`} />
                    <span className={`text-xs font-black ${isSelected ? '' : 'text-slate-700'}`}>{type.label}</span>
                  </div>
                  <p className={`text-[11px] leading-relaxed ${isSelected ? 'opacity-90' : 'text-slate-500'}`}>
                    {type.description}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">
              Additional Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any specific details about when/how you can help..."
              rows={2}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}

          <button
            type="submit"
            disabled={submitting || !selected}
            className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold rounded-2xl text-sm flex items-center justify-center gap-2 transition-colors shadow-md shadow-emerald-700/20"
          >
            <HandHeart className="w-4 h-4" />
            {submitting ? 'Submitting...' : 'Confirm My Help Commitment'}
          </button>
        </form>
      </div>
    </div>
  );
}
