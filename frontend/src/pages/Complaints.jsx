import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCity } from '../hooks/useCity';
import { useAuth } from '../context/AuthContext';
import { 
  getComplaints, 
  supportComplaint, 
  getUserSupportedIds,
  getComplaintCategories 
} from '../services/complaintService';

import ReportCard from '../components/complaint/ReportCard';
import ReportMap from '../components/complaint/ReportMap';
import ComplaintForm from '../components/complaint/ComplaintForm';
import HelpModal from '../components/complaint/HelpModal';
import { SkeletonCard } from '../components/common/SkeletonLoader';

import { 
  Plus, 
  Search, 
  MapPin, 
  Grid, 
  Map as MapIcon, 
  Filter, 
  AlertTriangle,
  TreePine,
  CheckCircle2,
  Sparkles,
  RefreshCw
} from 'lucide-react';

/**
 * Local Reports Page — Centerpiece Environmental Hub
 */
export default function Complaints() {
  const { selectedCity } = useCity();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Reports data & state
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'map'

  // Modals & User Actions
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [helpModalComplaintId, setHelpModalComplaintId] = useState(null);
  const [supportedReports, setSupportedReports] = useState(new Set());
  const [volunteeredReports, setVolunteeredReports] = useState(new Set());

  // Check query params on mount to auto-open create modal
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('action') === 'new') {
      setIsCreateOpen(true);
    }
  }, [location.search]);

  // Load supported reports from backend for logged in user
  useEffect(() => {
    if (isAuthenticated) {
      getUserSupportedIds()
        .then((ids) => setSupportedReports(new Set(ids)))
        .catch(() => {});
    }
  }, [isAuthenticated]);

  // Load real reports from Supabase backend
  const fetchReports = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getComplaints({
        city: selectedCity,
        category: selectedCategory,
        status: selectedStatus,
        search: searchQuery,
      });
      setReports(data || []);
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError('Could not load reports from database.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [selectedCity, selectedCategory, selectedStatus]);

  // Handle local search submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchReports();
  };

  // Support handler backed by real DB deduplication
  const handleSupport = async (id) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      const res = await supportComplaint(id);
      if (res.alreadySupported) {
        setSupportedReports((prev) => new Set([...prev, id]));
      } else if (res.success) {
        setSupportedReports((prev) => new Set([...prev, id]));
        setReports((prev) =>
          prev.map((r) =>
            r.id === id ? { ...r, supportCount: res.supportCount ?? (r.supportCount || 0) + 1 } : r
          )
        );
      }
    } catch (e) {
      console.warn('Support action error:', e.message);
    }
  };

  // Volunteer / I Can Help handler
  const handleVolunteer = (id) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setHelpModalComplaintId(id);
  };

  const handleHelpSuccess = (result) => {
    if (helpModalComplaintId) {
      setVolunteeredReports((prev) => new Set([...prev, helpModalComplaintId]));
      setReports((prev) =>
        prev.map((r) =>
          r.id === helpModalComplaintId
            ? { ...r, helpCount: result.helpCount ?? (r.helpCount || 0) + 1, volunteerCount: result.helpCount ?? (r.volunteerCount || 0) + 1 }
            : r
        )
      );
    }
  };

  const categories = getComplaintCategories();

  // Status Filter options
  const statusFilters = [
    { value: 'all', label: 'All Statuses' },
    { value: 'open', label: 'Open' },
    { value: 'action_in_progress', label: 'In Progress' },
    { value: 'assigned', label: 'Assigned' },
    { value: 'authority_notified', label: 'Authority Notified' },
    { value: 'resolution_pending', label: 'Pending Verify' },
    { value: 'resolved', label: 'Resolved' },
  ];

  // City center coordinates for map view
  const cityCoordinates = {
    Pune: [18.5204, 73.8567],
    Delhi: [28.6139, 77.209],
    Mumbai: [19.076, 72.8777],
    Bangalore: [12.9716, 77.5946],
  };

  const mapCenter = cityCoordinates[selectedCity] || [18.5204, 73.8567];

  return (
    <div className="bg-slate-50/50 min-h-screen pb-20">
      
      {/* ========================================================================
          HERO BANNER & HEADER
          ======================================================================== */}
      <section className="bg-gradient-to-b from-emerald-50/70 via-white to-slate-50 border-b border-slate-200/80 py-12 lg:py-16">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            
            <div className="space-y-3 max-w-2xl">
              {/* Location Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-emerald-200 shadow-2xs">
                <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                <span className="text-xs font-black uppercase tracking-wider text-emerald-800">
                  {selectedCity} Municipal Area
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs font-bold text-slate-500">
                  {reports.length} Environmental Issues Monitored
                </span>
              </div>

              {/* Title & Subtitle */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
                Local Environmental Reports
              </h1>
              <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed">
                See what's happening around your community. Report violations with photo proof. Help resolve them together.
              </p>
            </div>

            {/* Primary Action Button */}
            <div className="shrink-0">
              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="flex items-center gap-2.5 px-6 py-3.5 bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-md shadow-emerald-700/25 hover:scale-[1.02] transition-all"
              >
                <Plus className="w-5 h-5" />
                <span>Report an Issue</span>
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================
          FILTER BAR & VIEW TOGGLE CONTROLS
          ======================================================================== */}
      <section className="container mx-auto px-4 sm:px-6 -mt-6">
        <div className="glass-card p-4 rounded-3xl border border-slate-200/90 shadow-md space-y-4">
          
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            
            {/* Search Input Form */}
            <form onSubmit={handleSearchSubmit} className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search issues by street, landmark or keyword in ${selectedCity}...`}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50/90 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </form>

            {/* View Switcher: Grid vs Map */}
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white text-emerald-800 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span>Cards Grid</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('map')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  viewMode === 'map'
                    ? 'bg-white text-emerald-800 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <MapIcon className="w-3.5 h-3.5" />
                <span>Interactive Map</span>
              </button>
            </div>

          </div>

          {/* Category & Status Filter Pills */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
            
            {/* Category Filter Chips */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mr-1">
                Category:
              </span>
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    selectedCategory === cat.value
                      ? 'bg-emerald-700 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Status Filter Chips */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mr-1">
                Status:
              </span>
              {statusFilters.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setSelectedStatus(s.value)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    selectedStatus === s.value
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================
          MAIN CONTENT VIEW (Grid vs Map View)
          ======================================================================== */}
      <main className="container mx-auto px-4 sm:px-6 mt-8">
        
        {/* Loading Skeletons */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <SkeletonCard hasImage lines={3} />
            <SkeletonCard hasImage lines={3} />
            <SkeletonCard hasImage lines={3} />
          </div>
        ) : error ? (
          /* Error State */
          <div className="p-8 text-center glass-card rounded-3xl border border-rose-200 max-w-md mx-auto space-y-4">
            <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
            <div>
              <h3 className="font-extrabold text-slate-900">Unable to load community reports</h3>
              <p className="text-xs text-slate-500 mt-1">{error}</p>
            </div>
            <button
              onClick={fetchReports}
              className="px-5 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 mx-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        ) : reports.length === 0 ? (
          /* Empty State */
          <div className="py-16 px-4 text-center glass-card rounded-3xl border border-slate-200 max-w-lg mx-auto space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto text-2xl">
              🌱
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">
                No environmental issues reported in {selectedCity} yet!
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                Be the first EcoSathi citizen to map a pollution hotspot, illegal waste dump, or tree felling in your neighborhood.
              </p>
            </div>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-2xl text-xs shadow-md shadow-emerald-700/20 inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Submit First Report</span>
            </button>
          </div>
        ) : viewMode === 'map' ? (
          /* Map View */
          <div className="space-y-4">
            <ReportMap
              reports={reports}
              center={mapCenter}
              onViewReport={(rep) => navigate(`/complaints/${rep.id}`)}
            />
          </div>
        ) : (
          /* Cards Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                onView={(rep) => navigate(`/complaints/${rep.id}`)}
                onSupport={(id) => handleSupport(id)}
                onVolunteer={(id) => handleVolunteer(id)}
                hasSupported={supportedReports.has(report.id)}
                hasVolunteered={volunteeredReports.has(report.id)}
              />
            ))}
          </div>
        )}

      </main>

      {/* ========================================================================
          CREATE REPORT MODAL
          ======================================================================== */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-2xl my-8">
            <ComplaintForm
              onSubmitSuccess={(newRep) => {
                setReports((prev) => [newRep, ...prev]);
                fetchReports();
              }}
              onCancel={() => setIsCreateOpen(false)}
              onViewReport={(rep) => {
                setIsCreateOpen(false);
                navigate(`/complaints/${rep.id}`);
              }}
            />
          </div>
        </div>
      )}

      {/* ========================================================================
          I CAN HELP MODAL
          ======================================================================== */}
      {helpModalComplaintId && (
        <HelpModal
          complaintId={helpModalComplaintId}
          onClose={() => setHelpModalComplaintId(null)}
          onSuccess={handleHelpSuccess}
        />
      )}

    </div>
  );
}