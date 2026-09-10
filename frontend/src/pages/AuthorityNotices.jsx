import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCity } from '../hooks/useCity';
import { useAuth } from '../context/AuthContext';
import { getCityNotices } from '../services/noticeService';
import { getComplaints } from '../services/complaintService';
import NoticeCard from '../components/notices/NoticeCard';
import AuthorityActionModal from '../components/notices/AuthorityActionModal';
import { resolveImageUrl } from '../utils/imageUrl';
import { SkeletonCard } from '../components/common/SkeletonLoader';
import { 
  FileText, 
  ShieldCheck, 
  MapPin, 
  AlertTriangle, 
  CheckCircle2, 
  Clock3, 
  Building2, 
  ArrowRight,
  RefreshCw,
  Clock,
  Shield,
  ExternalLink
} from 'lucide-react';

/**
 * Modern Authority Notices & Municipal Action Center
 */
export default function AuthorityNotices() {
  const { selectedCity, changeCity } = useCity();
  const { user, isAuthenticated } = useAuth();
  
  const isAuthorityOrAdmin = 
    user?.role === 'admin' || 
    user?.role === 'authority' || 
    user?.email?.toLowerCase().trim() === 'authority@ecosathi.gov.in' ||
    user?.email?.toLowerCase().trim() === 'vicharemanish717@gmail.com';

  const [activeTab, setActiveTab] = useState('complaints'); // 'complaints' | 'notices'
  const [notices, setNotices] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaintForAction, setSelectedComplaintForAction] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [noticeRes, compData] = await Promise.all([
        getCityNotices(selectedCity),
        getComplaints({ city: selectedCity }),
      ]);
      if (noticeRes && noticeRes.notices) {
        setNotices(noticeRes.notices);
      }
      setComplaints(compData || []);
    } catch (err) {
      console.error('Error loading authority data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCity]);

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Resolved</span>
          </span>
        );
      case 'action_in_progress':
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-300">
            <Clock3 className="w-3 h-3 text-blue-600" />
            <span>Action in Progress</span>
          </span>
        );
      case 'authority_notified':
      case 'notice_issued':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-300">
            <Shield className="w-3 h-3 text-purple-600" />
            <span>Notice Issued</span>
          </span>
        );
      case 'investigating':
      case 'under_review':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300">
            <Clock3 className="w-3 h-3 text-amber-600" />
            <span>Investigating</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-300">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            <span>Open Issue</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-50/50 min-h-screen pb-20">
      {/* Header Banner */}
      <section className="bg-gradient-to-b from-purple-50/70 via-white to-slate-50 border-b border-slate-200/80 py-12 lg:py-14">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-purple-200 shadow-2xs">
                <ShieldCheck className="w-4 h-4 text-purple-700" />
                <span className="text-xs font-black uppercase tracking-wider text-purple-800">
                  Municipal Action & Enforcement Portal
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
                Authority Action Center
              </h1>
              <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed">
                Review citizen-reported environmental violations, dispatch municipal teams, issue official orders, and track site clearance in <strong>{selectedCity}</strong>.
              </p>
            </div>

            {/* City Selector */}
            <div className="glass-card p-2 rounded-2xl border border-slate-200/90 shadow-sm flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-1.5 pl-3">
                <MapPin className="w-4 h-4 text-purple-700" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-500">City:</span>
              </div>
              <select
                value={selectedCity}
                onChange={(e) => changeCity(e.target.value)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200/80 rounded-xl font-extrabold text-slate-900 text-xs focus:outline-none cursor-pointer border border-slate-200 transition-colors"
              >
                <option value="Bangalore">Bangalore, KA</option>
                <option value="Pune">Pune, MH</option>
                <option value="Delhi">Delhi, NCR</option>
                <option value="Mumbai">Mumbai, MH</option>
              </select>
            </div>
          </div>

          {/* Authority Session Status Banner */}
          {isAuthorityOrAdmin ? (
            <div className="mt-6 p-4 rounded-2xl bg-purple-100/70 border border-purple-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-extrabold text-purple-900">
                    Authority Session Active: {user?.name || user?.email}
                  </p>
                  <p className="text-[11px] text-purple-700">
                    You have enforcement privileges to update status, dispatch sanitation teams, and record inspection findings.
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 bg-purple-700 text-white text-xs font-bold rounded-xl shrink-0 self-start sm:self-auto">
                Authorized Officer
              </span>
            </div>
          ) : (
            <div className="mt-6 p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-purple-700" />
                </div>
                <div>
                  <p className="text-xs font-extrabold text-slate-800">
                    Are you an authorized municipal officer or pollution control inspector?
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Log in with your official authority account to update complaint statuses, dispatch site inspections, and clear violations.
                  </p>
                </div>
              </div>
              <Link
                to="/login"
                className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-xl shrink-0 transition-colors shadow-2xs text-center"
              >
                Log In as Authority →
              </Link>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-8 border-b border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab('complaints')}
              className={`pb-3 px-4 text-xs sm:text-sm font-black transition-all border-b-2 ${
                activeTab === 'complaints'
                  ? 'border-purple-700 text-purple-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Uploaded Citizen Reports ({complaints.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('notices')}
              className={`pb-3 px-4 text-xs sm:text-sm font-black transition-all border-b-2 ${
                activeTab === 'notices'
                  ? 'border-purple-700 text-purple-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Municipal AI Dispatches ({notices.length})
            </button>
          </div>

        </div>
      </section>

      {/* Main Content Area */}
      <main className="container mx-auto px-4 sm:px-6 mt-8">
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SkeletonCard lines={4} />
            <SkeletonCard lines={4} />
          </div>
        ) : activeTab === 'complaints' ? (
          /* TAB 1: Real Uploaded Complaints Awaiting Authority Action */
          complaints.length === 0 ? (
            <div className="py-16 px-4 text-center glass-card rounded-3xl border border-slate-200 max-w-lg mx-auto space-y-4">
              <div className="w-16 h-16 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center mx-auto text-2xl">
                🌱
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  No citizen complaints registered in {selectedCity} yet!
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                  When residents submit photographic pollution reports, they will be listed here for immediate municipal review.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {complaints.map((comp) => {
                const photoUrl = resolveImageUrl(comp.photo || comp.photo_url);
                return (
                  <div
                    key={comp.id}
                    className="glass-card rounded-3xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Photo Thumbnail */}
                      <div className="relative h-48 sm:h-52 bg-slate-100 overflow-hidden">
                        {photoUrl ? (
                          <img
                            src={photoUrl}
                            alt="Complaint proof"
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                            No photo attached
                          </div>
                        )}
                        <div className="absolute top-3 left-3 flex items-center gap-1.5">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-900/80 text-white backdrop-blur-md">
                            {comp.category || 'Environmental Issue'}
                          </span>
                        </div>
                        <div className="absolute top-3 right-3">
                          {getStatusBadge(comp.status)}
                        </div>
                      </div>

                      {/* Details */}
                      <div className="p-5 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-extrabold text-slate-900 text-sm sm:text-base line-clamp-2">
                            {comp.description}
                          </h4>
                          <span className="shrink-0 text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-200">
                            {comp.severity || 'Medium'}
                          </span>
                        </div>

                        {comp.ai_summary && (
                          <p className="text-xs text-slate-600 bg-purple-50/60 p-3 rounded-2xl border border-purple-100/80 italic leading-relaxed">
                            "{comp.ai_summary}"
                          </p>
                        )}

                        <div className="space-y-1 text-xs text-slate-500">
                          {comp.address && (
                            <p className="flex items-center gap-1.5 truncate text-slate-700 font-medium">
                              <MapPin className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                              <span className="truncate">{comp.address}</span>
                            </p>
                          )}
                          <p className="flex items-center gap-1.5 text-[11px] text-slate-400">
                            <Clock className="w-3 h-3" />
                            <span>Submitted: {new Date(comp.created_at).toLocaleDateString()}</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Authority Action Footer */}
                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
                      <Link
                        to={`/complaints/${comp.id}`}
                        className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1"
                      >
                        <span>Inspect Case</span>
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                      </Link>

                      {isAuthorityOrAdmin ? (
                        <button
                          type="button"
                          onClick={() => setSelectedComplaintForAction(comp)}
                          className="px-4 py-2 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm hover:scale-[1.02] transition-all cursor-pointer"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Take Official Action</span>
                        </button>
                      ) : (
                        <Link
                          to="/login"
                          className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1 transition-colors"
                        >
                          <span>Authority Login</span>
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          /* TAB 2: Municipal AI Dispatches */
          notices.length === 0 ? (
            <div className="py-16 px-4 text-center glass-card rounded-3xl border border-slate-200 max-w-lg mx-auto space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto text-2xl">
                📜
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  No Action Notices Filed for {selectedCity} Yet
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                  Once photographic complaints are submitted and verified, formal municipal enforcement notices appear here.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {notices.map((notice, idx) => (
                <NoticeCard key={notice.id || notice._id || idx} notice={notice} />
              ))}
            </div>
          )
        )}

      </main>

      {/* Authority Action Modal */}
      {selectedComplaintForAction && (
        <AuthorityActionModal
          complaint={selectedComplaintForAction}
          onClose={() => setSelectedComplaintForAction(null)}
          onSuccess={(result) => {
            loadData();
          }}
        />
      )}

    </div>
  );
}
