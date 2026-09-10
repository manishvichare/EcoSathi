import React, { useState, useEffect } from 'react';
import { 
  X, 
  Upload, 
  MapPin, 
  Calendar, 
  AlertCircle, 
  ShieldCheck, 
  Sparkles, 
  FileText, 
  Camera,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import { submitTaskProof, resubmitTaskProof, getUserReportsForLinking } from '../../services/leaderboardSservice';

export default function TaskProofModal({ 
  task, 
  existingSubmission, 
  onClose, 
  onSuccess 
}) {
  if (!task) return null;

  const config = task.verificationConfig || {
    requiresBeforeAfter: false,
    requiresPhoto: true,
    requiresLocation: false,
    allowsReportLink: false,
    label: 'Eco Action',
    instruction: 'Upload a photo showing your completed eco action.',
  };

  const isCleanup = config.requiresBeforeAfter;
  const isReporting = config.allowsReportLink;
  const isResubmission = existingSubmission && 
    (existingSubmission.status === 'rejected' || existingSubmission.status === 'more_evidence_required');

  // Form State
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [beforeFile, setBeforeFile] = useState(null);
  const [evidencePreview, setEvidencePreview] = useState(null);
  const [beforePreview, setBeforePreview] = useState(null);
  const [description, setDescription] = useState(existingSubmission?.description || '');
  
  // Reporting Task: Link existing complaint option
  const [reportMode, setReportMode] = useState('upload'); // 'link' | 'upload'
  const [userReports, setUserReports] = useState([]);
  const [selectedReportId, setSelectedReportId] = useState('');
  const [loadingReports, setLoadingReports] = useState(false);

  // Location State
  const [location, setLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('idle'); // 'idle' | 'capturing' | 'captured' | 'denied'

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Load user's complaints if task allows linking
  useEffect(() => {
    if (isReporting) {
      setLoadingReports(true);
      getUserReportsForLinking()
        .then((reports) => {
          setUserReports(reports);
          if (reports.length > 0) {
            setReportMode('link');
            setSelectedReportId(reports[0].id);
          }
        })
        .catch(() => {})
        .finally(() => setLoadingReports(false));
    }
  }, [isReporting]);

  // Handle Location Capture
  const handleCaptureLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('denied');
      return;
    }

    setLocationStatus('capturing');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          timestamp: new Date().toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
        });
        setLocationStatus('captured');
      },
      (err) => {
        console.warn('Geolocation denied/unavailable:', err.message);
        setLocationStatus('denied');
      },
      { timeout: 10000 }
    );
  };

  // File Input Handlers
  const handleEvidenceChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEvidenceFile(file);
      setEvidencePreview(URL.createObjectURL(file));
      setErrorMessage('');
    }
  };

  const handleBeforeChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBeforeFile(file);
      setBeforePreview(URL.createObjectURL(file));
      setErrorMessage('');
    }
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    // Validation
    if (isCleanup) {
      if (!beforeFile || !evidenceFile) {
        setErrorMessage('Please upload both BEFORE and AFTER photos for cleanup verification.');
        return;
      }
    } else if (isReporting) {
      if (reportMode === 'link' && !selectedReportId) {
        setErrorMessage('Please select an existing report to link, or switch to photo upload.');
        return;
      }
      if (reportMode === 'upload' && !evidenceFile) {
        setErrorMessage('Please upload evidence before submitting this action.');
        return;
      }
    } else {
      if (!evidenceFile && !existingSubmission?.evidence_url) {
        setErrorMessage('Please upload evidence before submitting this action.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('description', description);

      if (evidenceFile) {
        formData.append('evidence', evidenceFile);
        formData.append('after_evidence', evidenceFile);
      }
      if (beforeFile) {
        formData.append('before_evidence', beforeFile);
      }
      if (isReporting && reportMode === 'link' && selectedReportId) {
        formData.append('linked_complaint_id', selectedReportId);
      }
      if (location) {
        formData.append('location_lat', location.lat);
        formData.append('location_lng', location.lng);
        formData.append('location_address', `Captured GPS (${location.lat.toFixed(4)}, ${location.lng.toFixed(4)})`);
      }

      let res;
      if (isResubmission && existingSubmission.id) {
        res = await resubmitTaskProof(existingSubmission.id, formData);
      } else {
        res = await submitTaskProof(task.id, formData);
      }

      if (res.success) {
        onSuccess(res.submission);
        onClose();
      } else {
        setErrorMessage(res.message || 'Failed to submit evidence.');
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const currentDateFormatted = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
              +{task.points} Eco Points
            </span>
            <h3 className="text-xl font-black text-slate-900 mt-1">Complete Eco Action</h3>
            <p className="text-xs text-slate-500 font-medium">{task.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Resubmission Context Warning if applicable */}
        {isResubmission && existingSubmission.review_notes && (
          <div className="mx-6 mt-4 p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-1">
            <p className="font-bold flex items-center gap-1.5 text-amber-800">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>Moderator Feedback on Previous Evidence:</span>
            </p>
            <p className="text-amber-700 italic">"{existingSubmission.review_notes}"</p>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          
          {/* Instruction Box */}
          <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-900">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              To receive Eco Points, submit proof that you actually completed this action. Your evidence will be reviewed by a community moderator.
            </p>
          </div>

          {/* ====================================================================
              EVIDENCE UPLOAD SECTION
              ==================================================================== */}
          
          {/* SPECIAL CASE 1: CLEANUP BEFORE + AFTER */}
          {isCleanup ? (
            <div className="space-y-3">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500">
                Cleanup Evidence (Before + After Required)
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* BEFORE PHOTO */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-black uppercase text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    1. BEFORE Photo *
                  </span>
                  {beforePreview ? (
                    <div className="relative h-36 rounded-2xl overflow-hidden border border-slate-200 group">
                      <img src={beforePreview} alt="Before cleanup" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => { setBeforeFile(null); setBeforePreview(null); }}
                        className="absolute top-2 right-2 p-1.5 bg-rose-600 text-white rounded-xl shadow-md hover:bg-rose-700 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <label className="h-36 border-2 border-dashed border-slate-200 hover:border-emerald-400 rounded-2xl flex flex-col items-center justify-center p-3 text-center cursor-pointer transition-colors bg-slate-50/50">
                      <Camera className="w-6 h-6 text-slate-400 mb-1" />
                      <span className="text-xs font-bold text-slate-700">Upload Before</span>
                      <span className="text-[10px] text-slate-400 mt-0.5">Littered state</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleBeforeChange} />
                    </label>
                  )}
                </div>

                {/* AFTER PHOTO */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-black uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    2. AFTER Photo *
                  </span>
                  {evidencePreview ? (
                    <div className="relative h-36 rounded-2xl overflow-hidden border border-slate-200 group">
                      <img src={evidencePreview} alt="After cleanup" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => { setEvidenceFile(null); setEvidencePreview(null); }}
                        className="absolute top-2 right-2 p-1.5 bg-rose-600 text-white rounded-xl shadow-md hover:bg-rose-700 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <label className="h-36 border-2 border-dashed border-slate-200 hover:border-emerald-400 rounded-2xl flex flex-col items-center justify-center p-3 text-center cursor-pointer transition-colors bg-slate-50/50">
                      <CheckCircle2 className="w-6 h-6 text-emerald-600 mb-1" />
                      <span className="text-xs font-bold text-slate-700">Upload After</span>
                      <span className="text-[10px] text-slate-400 mt-0.5">Restored / Cleaned</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleEvidenceChange} />
                    </label>
                  )}
                </div>
              </div>
            </div>
          ) : isReporting ? (
            /* SPECIAL CASE 2: REPORT POLLUTION (Link existing or upload new) */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Pollution Report Proof
                </label>
                {userReports.length > 0 && (
                  <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setReportMode('link')}
                      className={`px-2.5 py-1 rounded-lg transition-all ${
                        reportMode === 'link' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-500'
                      }`}
                    >
                      Link Existing Report
                    </button>
                    <button
                      type="button"
                      onClick={() => setReportMode('upload')}
                      className={`px-2.5 py-1 rounded-lg transition-all ${
                        reportMode === 'upload' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-500'
                      }`}
                    >
                      Upload New
                    </button>
                  </div>
                )}
              </div>

              {reportMode === 'link' && userReports.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-[11px] text-slate-500">
                    Select a pollution report you have previously submitted on EcoSathi:
                  </p>
                  <select
                    value={selectedReportId}
                    onChange={(e) => setSelectedReportId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  >
                    {userReports.map((rep) => (
                      <option key={rep.id} value={rep.id}>
                        [{rep.category}] {rep.description?.slice(0, 45)}... ({new Date(rep.created_at).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                  <span className="inline-block text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    ✓ Existing report photo and location will be automatically linked
                  </span>
                </div>
              ) : (
                <div className="space-y-2">
                  {evidencePreview ? (
                    <div className="relative h-44 rounded-2xl overflow-hidden border border-slate-200 group">
                      <img src={evidencePreview} alt="Pollution proof" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => { setEvidenceFile(null); setEvidencePreview(null); }}
                        className="absolute top-2 right-2 p-1.5 bg-rose-600 text-white rounded-xl shadow-md hover:bg-rose-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="h-36 border-2 border-dashed border-slate-200 hover:border-emerald-400 rounded-2xl flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-colors bg-slate-50/50">
                      <Upload className="w-6 h-6 text-slate-400 mb-1" />
                      <span className="text-xs font-bold text-slate-700">Upload Pollution Evidence</span>
                      <span className="text-[10px] text-slate-400 mt-0.5">Photo or screenshot of report</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleEvidenceChange} />
                    </label>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* STANDARD TASK (Plant Tree, Cycle, Reduce Plastic, Rainwater, Solar, etc.) */
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Upload Evidence *
                </label>
                <span className="text-[10px] text-slate-400 font-medium">JPEG, PNG, WEBP</span>
              </div>

              {evidencePreview ? (
                <div className="relative h-48 rounded-2xl overflow-hidden border border-slate-200 group">
                  <img src={evidencePreview} alt="Task proof" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => { setEvidenceFile(null); setEvidencePreview(null); }}
                    className="absolute top-2 right-2 p-1.5 bg-rose-600 text-white rounded-xl shadow-md hover:bg-rose-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="h-40 border-2 border-dashed border-slate-200 hover:border-emerald-400 rounded-2xl flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-colors bg-slate-50/50">
                  <Camera className="w-8 h-8 text-slate-400 mb-2" />
                  <span className="text-xs font-bold text-slate-700">Select Photo Proof</span>
                  <span className="text-[10px] text-slate-500 max-w-xs mt-1">
                    {config.instruction || 'Take a clear photo showing your completed action'}
                  </span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleEvidenceChange} />
                </label>
              )}
            </div>
          )}

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-wider text-slate-500">
              Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell us what you did and where..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 resize-none"
            />
          </div>

          {/* Location Verification */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                <span>GPS Location Verification</span>
              </div>
              <button
                type="button"
                onClick={handleCaptureLocation}
                disabled={locationStatus === 'capturing' || locationStatus === 'captured'}
                className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 transition-colors"
              >
                {locationStatus === 'capturing'
                  ? 'Capturing...'
                  : locationStatus === 'captured'
                  ? '✓ Captured'
                  : 'Capture Location'}
              </button>
            </div>

            {locationStatus === 'captured' && location && (
              <div className="text-[11px] text-slate-600 bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-200/60 space-y-0.5">
                <p className="font-semibold text-emerald-800">📍 Evidence Location Verified</p>
                <p>Lat: {location.lat.toFixed(5)}, Lng: {location.lng.toFixed(5)}</p>
                <p className="text-slate-400 text-[10px]">Captured: {location.timestamp}</p>
              </div>
            )}

            {locationStatus === 'denied' && (
              <p className="text-[11px] text-slate-400 italic">
                Location verification unavailable (permission denied or unsupported).
              </p>
            )}
          </div>

          {/* Date Stamp */}
          <div className="flex items-center justify-between text-xs text-slate-500 px-1 font-medium">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Submission Date:</span>
            </span>
            <span className="font-bold text-slate-700">{currentDateFormatted}</span>
          </div>

          {/* Error display */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-xs text-rose-700 font-medium">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-md shadow-emerald-700/20 hover:scale-[1.01] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{submitting ? 'Submitting Evidence...' : 'Submit for Verification'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
