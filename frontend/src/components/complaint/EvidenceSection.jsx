import React, { useState } from 'react';
import { resolveImageUrl } from '../../utils/imageUrl';
import { Upload, Image as ImageIcon, Plus, X, ChevronDown, ChevronUp } from 'lucide-react';
import { addEvidence } from '../../services/complaintService';

const EVIDENCE_TYPE_META = {
  original:     { label: 'Original Evidence',     color: 'bg-slate-100 text-slate-700 border-slate-200' },
  additional:   { label: 'Additional Evidence',   color: 'bg-blue-50 text-blue-700 border-blue-200' },
  verification: { label: 'Verification Evidence', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  action:       { label: 'Action Evidence',       color: 'bg-amber-50 text-amber-700 border-amber-200' },
  resolution:   { label: 'Resolution Evidence',   color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
};

function EvidenceCard({ evidence }) {
  const [imgError, setImgError] = useState(false);
  const resolved = resolveImageUrl(evidence.photo_url);
  const meta = EVIDENCE_TYPE_META[evidence.evidence_type] || EVIDENCE_TYPE_META.additional;

  return (
    <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white group">
      <div className="relative h-36 bg-slate-100">
        {resolved && !imgError ? (
          <img
            src={resolved}
            alt={evidence.description || 'Evidence'}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-8 h-8 text-slate-300" />
          </div>
        )}
        <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${meta.color}`}>
          {meta.label}
        </span>
      </div>
      <div className="p-3 space-y-1">
        {evidence.description && (
          <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">{evidence.description}</p>
        )}
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-slate-400">{evidence.uploader_name || 'Citizen'}</span>
          <span className="text-[11px] text-slate-400">
            {new Date(evidence.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
}

const EVIDENCE_ORDER = ['original', 'additional', 'verification', 'action', 'resolution'];
const UPLOADABLE_TYPES = [
  { value: 'additional', label: 'Additional Evidence' },
  { value: 'verification', label: 'Verification Evidence' },
  { value: 'action', label: 'Action Evidence' },
  { value: 'resolution', label: 'Resolution Evidence' },
];

export default function EvidenceSection({ complaintId, evidence = [], isAuthenticated, onEvidenceAdded }) {
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [form, setForm] = useState({ photo: null, evidence_type: 'additional', description: '' });
  const [preview, setPreview] = useState(null);

  // Group evidence by type
  const grouped = {};
  EVIDENCE_ORDER.forEach(t => {
    const items = evidence.filter(e => e.evidence_type === t);
    if (items.length > 0) grouped[t] = items;
  });

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setForm(prev => ({ ...prev, photo: file }));
    setPreview(URL.createObjectURL(file));
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!form.photo) { setUploadError('Please select a photo.'); return; }
    setUploading(true);
    setUploadError('');
    try {
      const result = await addEvidence(complaintId, form.photo, form.evidence_type, form.description);
      if (result.success && result.evidence) {
        onEvidenceAdded && onEvidenceAdded(result.evidence);
        setForm({ photo: null, evidence_type: 'additional', description: '' });
        setPreview(null);
        setShowUpload(false);
      }
    } catch (err) {
      setUploadError(err.response?.data?.message || err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Grouped evidence sections */}
      {EVIDENCE_ORDER.map(type => {
        const items = grouped[type];
        if (!items) return null;
        const meta = EVIDENCE_TYPE_META[type];
        return (
          <div key={type} className="space-y-2">
            <h5 className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border ${meta.color}`}>
              {meta.label} ({items.length})
            </h5>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {items.map(ev => <EvidenceCard key={ev.id} evidence={ev} />)}
            </div>
          </div>
        );
      })}

      {evidence.length === 0 && (
        <p className="text-sm text-slate-400 py-4 text-center">No evidence uploaded yet.</p>
      )}

      {/* Upload form */}
      {isAuthenticated && (
        <div className="pt-2">
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold rounded-xl text-xs transition-colors"
          >
            {showUpload ? <ChevronUp className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            {showUpload ? 'Cancel Upload' : 'Upload Additional Evidence'}
          </button>

          {showUpload && (
            <form onSubmit={handleUpload} className="mt-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <h5 className="text-xs font-black uppercase tracking-wider text-slate-500">Add Evidence Photo</h5>

              <select
                value={form.evidence_type}
                onChange={e => setForm(prev => ({ ...prev, evidence_type: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                {UPLOADABLE_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>

              <label className="block">
                <div className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-colors ${
                  preview ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 hover:border-emerald-300'
                }`}>
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
                      <p className="text-xs text-slate-500 font-medium">Click to select a photo</p>
                    </div>
                  )}
                </div>
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePhotoChange} />
              </label>

              <textarea
                value={form.description}
                onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what this photo shows..."
                rows={2}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />

              {uploadError && <p className="text-xs text-rose-600 font-medium">{uploadError}</p>}

              <button
                type="submit"
                disabled={uploading || !form.photo}
                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                {uploading ? 'Uploading...' : 'Submit Evidence'}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
