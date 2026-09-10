import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { resolveImageUrl } from '../utils/imageUrl';
import { useAuth } from '../context/AuthContext';
import {
  getComplaintDetail,
  supportComplaint,
  unsupportComplaint,
} from '../services/complaintService';
import ActivityTimeline from '../components/complaint/ActivityTimeline';
import EvidenceSection from '../components/complaint/EvidenceSection';
import HelpModal from '../components/complaint/HelpModal';
import AssignActionModal from '../components/complaint/AssignActionModal';
import AuthoritySection from '../components/complaint/AuthoritySection';
import ResolutionSection from '../components/complaint/ResolutionSection';
import AuthorityActionModal from '../components/notices/AuthorityActionModal';
import {
  ArrowLeft, MapPin, Clock, Users, HandHeart, Sparkles, ShieldAlert,
  CheckCircle2, Clock3, AlertTriangle, UserCheck, Shield, FileText,
  RefreshCw, ExternalLink, ShieldCheck,
} from 'lucide-react';

// ─── Status Badge ─────────────────────────────────────────────────────────────

const STATUS_META = {
  open:                { label: 'Open',                     color: 'bg-rose-100 text-rose-800 border-rose-300',       icon: AlertTriangle },
  under_review:        { label: 'Under Review',             color: 'bg-indigo-100 text-indigo-800 border-indigo-300', icon: Clock3 },
  verified:            { label: 'Verified',                 color: 'bg-sky-100 text-sky-800 border-sky-300',          icon: CheckCircle2 },
  action_required:     { label: 'Action Required',          color: 'bg-orange-100 text-orange-800 border-orange-300', icon: AlertTriangle },
  assigned:            { label: 'Assigned',                 color: 'bg-amber-100 text-amber-800 border-amber-300',    icon: UserCheck },
  authority_notified:  { label: 'Authority Notified',       color: 'bg-purple-100 text-purple-800 border-purple-300', icon: Shield },
  action_in_progress:  { label: 'Action In Progress',       color: 'bg-blue-100 text-blue-800 border-blue-300',       icon: Clock3 },
  resolution_pending:  { label: 'Resolution Pending Verify',color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: Clock },
  resolved:            { label: 'Resolved ✓',               color: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: CheckCircle2 },
  rejected:            { label: 'Rejected',                 color: 'bg-slate-100 text-slate-700 border-slate-300',    icon: AlertTriangle },
  duplicate:           { label: 'Duplicate',                color: 'bg-slate-100 text-slate-700 border-slate-300',    icon: AlertTriangle },
  analyzed:            { label: 'Open',                     color: 'bg-rose-100 text-rose-800 border-rose-300',       icon: AlertTriangle },
};

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.open;
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border ${meta.color}`}>
      <Icon className="w-3.5 h-3.5" />
      {meta.label}
    </span>
  );
}

// ─── Section Wrapper ─────────────────────────────────────────────────────────

function Section({ title, children, icon: Icon, iconColor = 'text-slate-700', badge }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          {Icon && <Icon className={`w-4 h-4 ${iconColor}`} />}
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">{title}</h3>
        </div>
        {badge}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ReportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const isAuthority = user?.role === 'admin' || user?.role === 'authority' || user?.email === 'authority@ecosathi.gov.in';
  const isAdmin = isAuthority;

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Interaction state
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showAuthorityActionModal, setShowAuthorityActionModal] = useState(false);
  const [supportLoading, setSupportLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  const [activeTab, setActiveTab] = useState('overview'); // overview | evidence | timeline | admin

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getComplaintDetail(id);
      setReport(data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load report.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  const handleSupport = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setSupportLoading(true);
    try {
      if (report.userHasSupported) {
        const res = await unsupportComplaint(id);
        setReport(prev => ({ ...prev, userHasSupported: false, supportCount: res.supportCount }));
      } else {
        const res = await supportComplaint(id);
        if (res.alreadySupported) {
          setReport(prev => ({ ...prev, userHasSupported: true }));
        } else if (res.success) {
          setReport(prev => ({ ...prev, userHasSupported: true, supportCount: res.supportCount }));
        }
      }
    } catch (e) {
      console.error('Support error:', e.message);
    } finally {
      setSupportLoading(false);
    }
  };

  const handleHelpSuccess = (result) => {
    setReport(prev => ({
      ...prev,
      helpCount: result.helpCount ?? (prev.helpCount || 0) + 1,
      userHelpAction: result.helpAction || prev.userHelpAction,
    }));
  };

  const handleEvidenceAdded = (newEvidence) => {
    setReport(prev => ({ ...prev, evidence: [newEvidence, ...(prev.evidence || [])] }));
  };

  const handleAssignSuccess = (result) => {
    setReport(prev => ({
      ...prev,
      assignments: [result.assignment, ...(prev.assignments || [])],
      status: 'assigned',
    }));
  };

  const handleAuthorityUpdate = (newAuthority, newResponse) => {
    setReport(prev => {
      if (newAuthority) return { ...prev, authority: newAuthority };
      if (newResponse && prev.authority) {
        return {
          ...prev,
          authority: {
            ...prev.authority,
            responses: [...(prev.authority.responses || []), newResponse],
          },
        };
      }
      return prev;
    });
  };

  const handleResolutionUpdate = () => {
    fetchDetail(); // Reload all data after resolution action
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-500 font-medium">Loading report details...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="text-center space-y-4 max-w-sm">
          <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-lg font-black text-slate-900">Report Not Found</h2>
          <p className="text-sm text-slate-500">{error || 'This report does not exist.'}</p>
          <button onClick={() => navigate('/complaints')}
            className="px-5 py-2.5 bg-emerald-700 text-white font-bold rounded-xl text-sm inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Reports
          </button>
        </div>
      </div>
    );
  }

  const resolvedPhoto = resolveImageUrl(report.photo || report.photo_url);
  const supportCount = report.supportCount || 0;
  const helpCount = report.helpCount || 0;

  const getRelativeTime = (iso) => {
    if (!iso) return '';
    const diff = Date.now() - new Date(iso).getTime();
    const hrs = Math.floor(diff / 3600000);
    if (hrs < 1) return 'just now';
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'evidence', label: `Evidence (${(report.evidence || []).length})` },
    { id: 'timeline', label: `Timeline (${(report.activity || []).length})` },
    ...(isAdmin ? [{ id: 'admin', label: '⚡ Admin' }] : []),
  ];

  return (
    <div className="bg-slate-50 min-h-screen pb-20">

      {/* ── Back Button ── */}
      <div className="container mx-auto px-4 sm:px-6 pt-6">
        <button
          onClick={() => navigate('/complaints')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs transition-colors shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Reports
        </button>
      </div>

      {/* ── Hero Image ── */}
      <div className="container mx-auto px-4 sm:px-6 mt-4">
        <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-slate-900 rounded-3xl">
          {resolvedPhoto && !imageError ? (
            <img
              src={resolvedPhoto}
              alt={report.title || 'Report evidence'}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center gap-3 text-white">
              <AlertTriangle className="w-14 h-14 text-emerald-400 opacity-60" />
              <p className="text-sm font-bold text-slate-300 capitalize">
                {report.category?.replace('-', ' ') || 'Environmental Report'}
              </p>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-black/10 to-transparent" />

          {/* Bottom info overlay */}
          <div className="absolute bottom-5 left-5 right-5 space-y-2">
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-white/20 backdrop-blur-md text-white border border-white/30">
                {report.category?.replace('-', ' ') || 'Report'}
              </span>
              <StatusBadge status={report.status} />
            </div>
            <h1 className="text-lg sm:text-2xl font-black text-white leading-tight">
              {report.title || report.ai_summary || 'Environmental Issue'}
            </h1>
          </div>
        </div>
      </div>

      {/* ── Meta Bar + Action Buttons ── */}
      <div className="container mx-auto px-4 sm:px-6 mt-4">
        <div className="bg-white rounded-3xl border border-slate-200 p-4 space-y-4">
          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-600">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span>{report.location || report.address || report.city?.name || 'Local Area'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Reported {getRelativeTime(report.created_at)}</span>
            </div>
            {report.severity && (
              <div className="flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="capitalize">{report.severity} Priority</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <span>{supportCount} Supporting</span>
            </div>
            <div className="flex items-center gap-1.5">
              <HandHeart className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{helpCount} Helping</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Support Button */}
            <button
              onClick={handleSupport}
              disabled={supportLoading}
              className={`flex-1 py-3 font-bold rounded-2xl text-sm flex items-center justify-center gap-2 transition-all ${
                report.userHasSupported
                  ? 'bg-teal-700 text-white shadow-md'
                  : 'bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200'
              }`}
            >
              <Users className="w-4 h-4" />
              {supportLoading
                ? 'Updating...'
                : report.userHasSupported
                ? `✓ You Supported (${supportCount})`
                : `Support this Report (${supportCount})`}
            </button>

            {/* Help Button */}
            <button
              onClick={() => isAuthenticated ? setShowHelpModal(true) : navigate('/login')}
              className={`flex-1 py-3 font-bold rounded-2xl text-sm flex items-center justify-center gap-2 transition-all ${
                report.userHelpAction
                  ? 'bg-emerald-700 text-white shadow-md'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}
            >
              <HandHeart className="w-4 h-4" />
              {report.userHelpAction ? `✓ You're Helping (${helpCount})` : `I Can Help (${helpCount})`}
            </button>

            {/* Official Authority Action Button */}
            {isAuthority && (
              <button
                type="button"
                onClick={() => setShowAuthorityActionModal(true)}
                className="py-3 px-5 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-bold rounded-2xl text-sm flex items-center justify-center gap-2 shadow-md hover:scale-[1.01] transition-all cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-purple-200" />
                <span>Take Official Municipal Action</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="container mx-auto px-4 sm:px-6 mt-6">
        <div className="flex gap-1 bg-white border border-slate-200 rounded-2xl p-1 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
          <button
            onClick={fetchDetail}
            className="ml-auto shrink-0 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Tab Content ── */}
      <div className="container mx-auto px-4 sm:px-6 mt-4 space-y-4">

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <>
            {/* Description */}
            <Section title="Field Observation" icon={FileText} iconColor="text-slate-500">
              <p className="text-sm text-slate-700 leading-relaxed">{report.description}</p>
            </Section>

            {/* AI Analysis */}
            {report.ai_summary && (
              <Section title="EcoSathi AI Analysis" icon={Sparkles} iconColor="text-emerald-700">
                <div className="space-y-2">
                  <p className="text-sm text-emerald-900 leading-relaxed">{report.ai_summary}</p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {report.severity && (
                      <span className="px-2.5 py-1 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold capitalize">
                        {report.severity} Severity
                      </span>
                    )}
                    {report.category && (
                      <span className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold capitalize">
                        {report.category.replace('-', ' ')}
                      </span>
                    )}
                  </div>
                </div>
              </Section>
            )}

            {/* Active Help Actions */}
            {(report.helpActions || []).length > 0 && (
              <Section title="Community Helpers" icon={HandHeart} iconColor="text-emerald-700"
                badge={<span className="text-xs font-black text-emerald-700">{report.helpActions.length} active</span>}>
                <div className="space-y-2">
                  {report.helpActions.map(h => (
                    <div key={h.id} className="flex items-center justify-between p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
                      <span className="text-xs font-bold text-slate-700 capitalize">{h.help_type.replace(/_/g, ' ')}</span>
                      <span className="text-[11px] text-slate-400">{new Date(h.created_at).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Assignments */}
            {(report.assignments || []).length > 0 && (
              <Section title="Field Assignments" icon={UserCheck} iconColor="text-amber-600"
                badge={<span className="text-xs font-black text-amber-700">{report.assignments.length}</span>}>
                <div className="space-y-3">
                  {report.assignments.map(a => (
                    <div key={a.id} className="p-3 bg-amber-50/60 rounded-xl border border-amber-100 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-black text-slate-800 capitalize">{a.action_type.replace(/_/g, ' ')}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                          a.status === 'completed' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                          a.status === 'in_progress' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                          'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>{a.status}</span>
                      </div>
                      {a.assignee_name && <p className="text-xs text-slate-600">→ {a.assignee_name}</p>}
                      {a.deadline && <p className="text-[11px] text-slate-400">Deadline: {new Date(a.deadline).toLocaleDateString()}</p>}
                      {a.instructions && <p className="text-xs text-slate-500 leading-relaxed">{a.instructions}</p>}
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Authority */}
            <Section title="Authority Case" icon={Shield} iconColor="text-purple-700">
              <AuthoritySection
                complaintId={id}
                authority={report.authority}
                isAdmin={isAdmin}
                onUpdate={handleAuthorityUpdate}
              />
            </Section>

            {/* Resolution */}
            <Section title="Resolution" icon={CheckCircle2} iconColor="text-emerald-700">
              <ResolutionSection
                complaintId={id}
                resolutions={report.resolutions || []}
                isAdmin={isAdmin}
                currentStatus={report.status}
                onUpdate={handleResolutionUpdate}
              />
            </Section>
          </>
        )}

        {/* EVIDENCE TAB */}
        {activeTab === 'evidence' && (
          <Section title="Evidence Photos" icon={FileText} iconColor="text-slate-500">
            <EvidenceSection
              complaintId={id}
              evidence={report.evidence || []}
              isAuthenticated={isAuthenticated}
              onEvidenceAdded={handleEvidenceAdded}
            />
          </Section>
        )}

        {/* TIMELINE TAB */}
        {activeTab === 'timeline' && (
          <Section title="Activity Timeline" icon={Clock} iconColor="text-slate-500">
            <ActivityTimeline activity={report.activity || []} />
          </Section>
        )}

        {/* ADMIN TAB */}
        {activeTab === 'admin' && isAdmin && (
          <>
            <Section title="Assign Field Action" icon={UserCheck} iconColor="text-amber-600">
              <button
                onClick={() => setShowAssignModal(true)}
                className="flex items-center gap-2 px-5 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-2xl text-sm transition-colors"
              >
                <UserCheck className="w-4 h-4" />
                Assign New Action
              </button>
            </Section>

            <Section title="Authority Integration" icon={Shield} iconColor="text-purple-700">
              <AuthoritySection
                complaintId={id}
                authority={report.authority}
                isAdmin={true}
                onUpdate={handleAuthorityUpdate}
              />
            </Section>

            <Section title="Resolution Verification" icon={CheckCircle2} iconColor="text-emerald-700">
              <ResolutionSection
                complaintId={id}
                resolutions={report.resolutions || []}
                isAdmin={true}
                currentStatus={report.status}
                onUpdate={handleResolutionUpdate}
              />
            </Section>
          </>
        )}
      </div>

      {/* ── Modals ── */}
      {showHelpModal && (
        <HelpModal
          complaintId={id}
          existingHelp={report.userHelpAction}
          onClose={() => setShowHelpModal(false)}
          onSuccess={handleHelpSuccess}
        />
      )}

      {showAssignModal && (
        <AssignActionModal
          complaintId={id}
          onClose={() => setShowAssignModal(false)}
          onSuccess={handleAssignSuccess}
        />
      )}

      {showAuthorityActionModal && (
        <AuthorityActionModal
          complaint={report}
          onClose={() => setShowAuthorityActionModal(false)}
          onSuccess={() => {
            fetchDetail();
          }}
        />
      )}
    </div>
  );
}
