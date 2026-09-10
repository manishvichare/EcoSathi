import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCity } from '../../hooks/useCity';
import { useNotifications } from '../../hooks/useNotifications';
import { 
  Home, 
  MapPin, 
  Activity, 
  AlertTriangle, 
  FileText, 
  Trophy, 
  Scale, 
  Bell, 
  User, 
  LogOut, 
  ChevronDown, 
  Sparkles,
  Menu,
  X,
  ShieldCheck
} from 'lucide-react';

/**
 * Modern Global Navigation - EcoSathi Redesign
 * 
 * Features:
 * - Desktop: Translucent glassmorphic header with active pill indicator, notification drawer, profile popup, and live city switch.
 * - Mobile: Top brand bar + ergonomic bottom navigation for thumb-friendly quick navigation.
 */
export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const { user, logout, isAuthenticated } = useAuth();
  const { selectedCity, changeCity } = useCity();
  const { notifications, unreadCount, loading: notifLoading, markAllRead, refresh: refreshNotifs } = useNotifications(selectedCity);
  const location = useLocation();
  const navigate = useNavigate();

  const isAuthority = user?.role === 'admin' || user?.role === 'authority' || user?.email === 'authority@ecosathi.gov.in';

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/complaints', label: 'Local Reports', icon: AlertTriangle, badge: 'Active' },
    { path: '/dashboard', label: 'Weather & AQI', icon: Activity },
    { 
      path: '/notices', 
      label: isAuthority ? 'Authority Center' : 'Notices', 
      icon: isAuthority ? ShieldCheck : FileText, 
      badge: isAuthority ? 'Official' : undefined 
    },
    { path: '/leaderboard', label: 'Community', icon: Trophy },
    { path: '/compare', label: 'Compare', icon: Scale },
  ];

  const isActive = (path) => {
    if (path === '/' && location.pathname !== '/') return false;
    return location.pathname.startsWith(path);
  };


  return (
    <>
      {/* ========================================================================
          DESKTOP & TABLET STICKY TOP NAVBAR
          ======================================================================== */}
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 shadow-xs transition-all">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-20">
            
            {/* Left: Brand Identity */}
            <Link to="/" className="flex items-center gap-3 group shrink-0">
              <div className="relative">
                <img
                  src="/ecosathi-logo.jpg"
                  alt="EcoSathi Logo"
                  className="h-11 w-11 rounded-2xl object-contain shadow-xs border border-emerald-100 group-hover:scale-105 transition-all duration-300"
                />
                <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full animate-pulse" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-black bg-gradient-to-r from-emerald-800 via-teal-700 to-emerald-600 bg-clip-text text-transparent tracking-tight">
                  EcoSathi
                </span>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 -mt-1 flex items-center gap-1">
                  <span>Urban Eco Intelligence</span>
                </span>
              </div>
            </Link>

            {/* Middle: Desktop Nav Links (Modern Pill Container) */}
            <div className="hidden lg:flex items-center gap-1 bg-slate-100/90 p-1.5 rounded-full border border-slate-200/70 shadow-2xs">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.path);
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-xs tracking-wide transition-all duration-200 ${
                      active
                        ? 'bg-gradient-to-r from-emerald-700 to-teal-700 text-white shadow-sm glow-emerald'
                        : 'text-slate-600 hover:text-emerald-800 hover:bg-white/80'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${active ? 'text-white' : 'text-slate-400'}`} />
                    <span>{link.label}</span>
                    {link.badge && !active && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-0.5" />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Right: City Selector, Notifications & Auth Profile */}
            <div className="hidden sm:flex items-center gap-3">
              
              {/* Dynamic City Switcher */}
              <div className="relative flex items-center gap-2 bg-emerald-50/80 hover:bg-emerald-100/70 transition-colors px-3 py-1.5 rounded-2xl border border-emerald-200/80 shadow-2xs">
                <MapPin className="w-4 h-4 text-emerald-700" />
                <div className="flex flex-col text-left">
                  <span className="text-[9px] font-black uppercase tracking-wider text-emerald-800">
                    City Location
                  </span>
                  <select
                    value={selectedCity}
                    onChange={(e) => changeCity(e.target.value)}
                    className="bg-transparent font-bold text-xs text-slate-900 focus:outline-none cursor-pointer pr-3"
                  >
                    <option value="Pune">Pune, MH</option>
                    <option value="Delhi">Delhi, NCR</option>
                    <option value="Mumbai">Mumbai, MH</option>
                    <option value="Bangalore">Bangalore, KA</option>
                  </select>
                </div>
              </div>

              {/* Notification Drawer Button */}
              <div className="relative" ref={notifRef}>
                <button
                  type="button"
                  onClick={() => {
                    setNotifOpen(!notifOpen);
                    if (!notifOpen) markAllRead();
                  }}
                  className="relative p-2.5 rounded-2xl text-slate-600 hover:text-emerald-700 hover:bg-slate-100 transition-colors"
                  aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 ? (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-rose-500 text-white text-[9px] font-black rounded-full ring-2 ring-white flex items-center justify-center px-1">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  ) : (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white" />
                  )}
                </button>

                {/* Notifications Dropdown */}
                {notifOpen && (
                  <div className="absolute right-0 mt-3 w-84 bg-white rounded-3xl border border-slate-200 shadow-xl p-4 z-50 animate-in fade-in slide-in-from-top-2" style={{ width: '340px' }}>
                    {/* Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <span className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
                        Live Notifications
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => refreshNotifs()}
                          className="text-[10px] font-bold text-slate-400 hover:text-emerald-700 transition-colors"
                          title="Refresh notifications"
                        >
                          ↻
                        </button>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          {notifLoading ? 'Loading…' : `${notifications.length} updates`}
                        </span>
                      </div>
                    </div>

                    {/* Notification list */}
                    <div className="divide-y divide-slate-100 mt-2 max-h-72 overflow-y-auto">
                      {notifLoading && notifications.length === 0 ? (
                        /* Loading skeleton */
                        <div className="py-4 space-y-3">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="animate-pulse">
                              <div className="h-3 bg-slate-100 rounded w-3/4 mb-1.5" />
                              <div className="h-2 bg-slate-100 rounded w-full" />
                              <div className="h-2 bg-slate-100 rounded w-2/3 mt-1" />
                            </div>
                          ))}
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-400 font-medium">
                          <Bell className="w-8 h-8 mx-auto mb-2 text-slate-200" />
                          No notifications for {selectedCity}
                        </div>
                      ) : (
                        notifications.map((n) => {
                          const typeEmoji = n.type === 'aqi' ? '🌬️' : n.type === 'notice' ? '📋' : '⚠️';
                          const severityDot =
                            n.severity === 'critical' ? 'bg-rose-500' :
                            n.severity === 'high' ? 'bg-orange-500' :
                            n.severity === 'medium' ? 'bg-yellow-500' :
                            'bg-emerald-500';

                          return (
                            <Link
                              key={n.id}
                              to={n.link || '/'}
                              onClick={() => setNotifOpen(false)}
                              className="block py-3 hover:bg-slate-50/80 rounded-xl px-2 transition-colors cursor-pointer"
                            >
                              <div className="flex justify-between items-start gap-2">
                                <div className="flex items-start gap-1.5 min-w-0">
                                  <span className="text-sm shrink-0 mt-0.5">{typeEmoji}</span>
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold text-slate-900 leading-tight truncate">{n.title}</p>
                                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed line-clamp-2">{n.desc}</p>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-1 shrink-0">
                                  <span className="text-[10px] text-slate-400">{n.time}</span>
                                  <span className={`w-1.5 h-1.5 rounded-full ${severityDot}`} title={`Severity: ${n.severity}`} />
                                </div>
                              </div>
                              {n.isLive && (
                                <span className="inline-block mt-1 text-[9px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                                  Live Data
                                </span>
                              )}
                            </Link>
                          );
                        })
                      )}
                    </div>

                    {/* Footer */}
                    <div className="pt-3 border-t border-slate-100 mt-2 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">
                        Auto-refreshes every 90s
                      </span>
                      <Link
                        to="/complaints"
                        onClick={() => setNotifOpen(false)}
                        className="text-[10px] font-bold text-emerald-700 hover:underline"
                      >
                        View all reports →
                      </Link>
                    </div>
                  </div>
                )}
              </div>


              {/* Profile / Auth Area */}
              {isAuthenticated ? (
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className={`flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-2xl transition-colors border ${
                      isAuthority 
                        ? 'bg-purple-50 hover:bg-purple-100 border-purple-200' 
                        : 'bg-slate-100 hover:bg-slate-200/80 border-slate-200/80'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-xl text-white flex items-center justify-center font-black text-xs shadow-2xs ${
                      isAuthority ? 'bg-gradient-to-tr from-purple-700 to-indigo-600' : 'bg-gradient-to-tr from-emerald-600 to-teal-500'
                    }`}>
                      {isAuthority ? '🛡️' : (user?.name?.[0]?.toUpperCase() || 'U')}
                    </div>
                    <span className="text-xs font-bold text-slate-800 max-w-[110px] truncate">
                      {isAuthority ? 'Gov Authority' : (user?.name || 'Citizen')}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 mt-3 w-64 bg-white rounded-3xl border border-slate-200 shadow-xl p-3 z-50 animate-in fade-in slide-in-from-top-2">
                      <div className={`p-3 rounded-2xl mb-2 ${isAuthority ? 'bg-purple-50/80 border border-purple-100' : 'bg-emerald-50/70'}`}>
                        <div className="flex items-center justify-between">
                          <p className={`text-xs font-extrabold truncate ${isAuthority ? 'text-purple-950' : 'text-emerald-900'}`}>{user?.name}</p>
                          {isAuthority && (
                            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-purple-200 text-purple-800 shrink-0">
                              Officer
                            </span>
                          )}
                        </div>
                        <p className={`text-[10px] truncate ${isAuthority ? 'text-purple-700 font-mono' : 'text-emerald-700'}`}>{user?.email}</p>
                        
                        {isAuthority ? (
                          <div className="mt-2 flex items-center gap-1.5 text-[10px] font-extrabold text-purple-800 bg-white/90 px-2 py-0.5 rounded-lg w-fit border border-purple-200">
                            <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                            <span>Municipal Action Rights</span>
                          </div>
                        ) : (
                          <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-emerald-800 bg-white/80 px-2 py-0.5 rounded-lg w-fit">
                            <Sparkles className="w-3 h-3 text-emerald-600" />
                            <span>{user?.points || 50} Eco Points</span>
                          </div>
                        )}
                      </div>

                      {isAuthority && (
                        <Link
                          to="/notices"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-purple-800 hover:bg-purple-50 rounded-xl transition-colors mb-1"
                        >
                          <ShieldCheck className="w-4 h-4 text-purple-600" />
                          <span>Authority Action Center</span>
                        </Link>
                      )}

                      <Link
                        to="/leaderboard"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 hover:text-emerald-700 hover:bg-slate-50 rounded-xl transition-colors"
                      >
                        <Trophy className="w-4 h-4 text-emerald-600" />
                        <span>Community Impact & Ranks</span>
                      </Link>
                      <button
                        onClick={() => {
                          logout();
                          setProfileOpen(false);
                          navigate('/');
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors mt-1"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-emerald-700 transition-colors"
                  >
                    Log In
                  </Link>
                  <Link
                    to="/signup"
                    className="px-5 py-2.5 bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white rounded-2xl text-xs font-bold shadow-md shadow-emerald-700/20 hover:scale-[1.02] transition-all"
                  >
                    Join Platform
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Hamburger Button */}
            <div className="flex items-center gap-2 lg:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-slate-700 hover:bg-slate-100 rounded-2xl transition-colors"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile Dropdown Menu Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-100 bg-white/95 backdrop-blur-xl px-4 py-5 space-y-4 shadow-xl animate-in slide-in-from-top duration-200">
            {/* City Selector in Mobile Drawer */}
            <div className="p-3 bg-emerald-50 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-700" />
                <span className="text-xs font-bold text-emerald-900">Current City:</span>
              </div>
              <select
                value={selectedCity}
                onChange={(e) => {
                  changeCity(e.target.value);
                  setMobileMenuOpen(false);
                }}
                className="bg-white px-3 py-1.5 rounded-xl font-bold text-xs text-slate-900 border border-emerald-200"
              >
                <option value="Pune">Pune, MH</option>
                <option value="Delhi">Delhi, NCR</option>
                <option value="Mumbai">Mumbai, MH</option>
                <option value="Bangalore">Bangalore, KA</option>
              </select>
            </div>

            {/* Navigation links */}
            <div className="space-y-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.path);
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-colors ${
                      active
                        ? 'bg-gradient-to-r from-emerald-700 to-teal-700 text-white'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Mobile Auth action buttons */}
            <div className="pt-3 border-t border-slate-100">
              {isAuthenticated ? (
                <div className="flex items-center justify-between px-2">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-900">{user?.name}</span>
                    <span className="text-[11px] text-emerald-700">{user?.points || 0} Points</span>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                      navigate('/');
                    }}
                    className="text-xs font-bold text-rose-600 hover:underline"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-2.5 text-center text-xs font-bold text-slate-700 bg-slate-100 rounded-xl"
                  >
                    Log In
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-2.5 text-center text-xs font-bold text-white bg-gradient-to-r from-emerald-700 to-teal-700 rounded-xl shadow-xs"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* ========================================================================
          MOBILE BOTTOM NAVIGATION BAR (Thumb-friendly modern consumer app standard)
          ======================================================================== */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/80 px-2 py-1.5 shadow-lg flex justify-around items-center">
        <Link
          to="/"
          className={`flex flex-col items-center py-1 px-3 rounded-xl text-[10px] font-bold ${
            isActive('/') ? 'text-emerald-700' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span>Home</span>
        </Link>
        <Link
          to="/complaints"
          className={`flex flex-col items-center py-1 px-3 rounded-xl text-[10px] font-bold relative ${
            isActive('/complaints') ? 'text-emerald-700' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <AlertTriangle className="w-5 h-5 mb-0.5" />
          <span>Reports</span>
          <span className="absolute top-1 right-2 w-1.5 h-1.5 bg-emerald-500 rounded-full" />
        </Link>
        <Link
          to="/dashboard"
          className={`flex flex-col items-center py-1 px-3 rounded-xl text-[10px] font-bold ${
            isActive('/dashboard') ? 'text-emerald-700' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Activity className="w-5 h-5 mb-0.5" />
          <span>Weather</span>
        </Link>
        <Link
          to="/leaderboard"
          className={`flex flex-col items-center py-1 px-3 rounded-xl text-[10px] font-bold ${
            isActive('/leaderboard') ? 'text-emerald-700' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Trophy className="w-5 h-5 mb-0.5" />
          <span>Impact</span>
        </Link>
      </div>
    </>
  );
}