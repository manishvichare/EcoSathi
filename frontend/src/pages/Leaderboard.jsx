import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCity } from '../hooks/useCity';
import { getLeaderboard, getTasks, getUserTaskSubmissions } from '../services/leaderboardSservice';
import BadgeShowcase from '../components/leaderboard/BadgeShowcase';
import TaskProofModal from '../components/leaderboard/TaskProofModal';
import TaskEvidenceModal from '../components/leaderboard/TaskEvidenceModal';
import AdminTaskVerification from '../components/leaderboard/AdminTaskVerification';
import { SkeletonTable, SkeletonCard } from '../components/common/SkeletonLoader';
import { 
  Trophy, 
  Medal, 
  Sparkles, 
  CheckCircle2, 
  Award, 
  Users, 
  TreePine, 
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Zap,
  Clock,
  AlertTriangle,
  AlertCircle,
  Eye,
  RotateCcw
} from 'lucide-react';

/**
 * Modern Community Leaderboard & Gamification Experience - EcoSathi Redesign
 */
export default function Leaderboard() {
  const { user, isAuthenticated } = useAuth();
  const { selectedCity } = useCity();
  const navigate = useNavigate();

  const [leaderboard, setLeaderboard] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [userSubmissions, setUserSubmissions] = useState({}); // { [taskId]: submission }
  const [userPoints, setUserPoints] = useState(user?.points || 0);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [proofModalTask, setProofModalTask] = useState(null);
  const [evidenceModalSubmission, setEvidenceModalSubmission] = useState(null);

  const isAdmin = user?.email?.toLowerCase().trim() === 'vicharemanish717@gmail.com' || user?.role === 'admin' || user?.role === 'moderator';

  // Load real leaderboard, tasks, and user's task submissions
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [lbData, taskData, subData] = await Promise.all([
        getLeaderboard(selectedCity),
        getTasks(),
        isAuthenticated ? getUserTaskSubmissions() : Promise.resolve([]),
      ]);
      setLeaderboard(lbData || []);
      setTasks(taskData || []);

      const subMap = {};
      (subData || []).forEach((s) => {
        // Map today's or latest submission per task
        if (!subMap[s.task_id] || new Date(s.submitted_at) > new Date(subMap[s.task_id].submitted_at)) {
          subMap[s.task_id] = s;
        }
      });
      setUserSubmissions(subMap);
    } catch (err) {
      console.error('Error loading leaderboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCity, isAuthenticated]);

  const handleOpenProofModal = (task, existingSub = null) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setProofModalTask({ task, existingSubmission: existingSub });
  };

  const handleProofSuccess = (newSubmission) => {
    setUserSubmissions((prev) => ({
      ...prev,
      [newSubmission.task_id]: newSubmission,
    }));
  };

  const topThree = leaderboard.slice(0, 3);
  const remainingLeaderboard = leaderboard.slice(3);

  // Determine user rank
  const userRank = isAuthenticated
    ? leaderboard.findIndex((item) => item.userId === user?.id) + 1 || 4
    : null;

  return (
    <div className="bg-slate-50/50 min-h-screen pb-20">
      
      {/* ========================================================================
          HERO BANNER
          ======================================================================== */}
      <section className="bg-gradient-to-b from-emerald-50/70 via-white to-slate-50 border-b border-slate-200/80 py-12 lg:py-16">
        <div className="container mx-auto px-4 sm:px-6 text-center max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-emerald-200 shadow-2xs">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-black uppercase tracking-wider text-emerald-800">
              Civic Gamification & Impact
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
            EcoSathi Community Leaderboard
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto leading-relaxed">
            Every tree planted, pollution report submitted, and green commute earned pushes your community closer to ecological sustainability.
          </p>
        </div>
      </section>

      <main className="container mx-auto px-4 sm:px-6 mt-8 space-y-12">
        
        {/* ========================================================================
            YOUR ECO IMPACT BANNER
            ======================================================================== */}
        <section className="glass-card p-6 sm:p-8 rounded-3xl border border-emerald-200/90 shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-300/10 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            
            {/* Left: User Stat Summary */}
            <div className="md:col-span-7 space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
                  Your Eco Impact
                </span>
                <span className="text-xs font-bold text-slate-400">•</span>
                <span className="text-xs font-bold text-slate-500">{selectedCity} District</span>
              </div>

              <div className="flex items-baseline gap-4">
                <div>
                  <p className="text-xs text-slate-500 font-bold">Total Eco Points</p>
                  <p className="text-3xl sm:text-4xl font-black text-emerald-700">{userPoints}</p>
                </div>
                <div className="pl-4 border-l border-slate-200">
                  <p className="text-xs text-slate-500 font-bold">District Rank</p>
                  <p className="text-3xl sm:text-4xl font-black text-slate-900">
                    {userRank ? `#${userRank}` : 'Unranked'}
                  </p>
                </div>
                <div className="pl-4 border-l border-slate-200">
                  <p className="text-xs text-slate-500 font-bold">Tasks Done</p>
                  <p className="text-3xl sm:text-4xl font-black text-teal-700">
                    {Object.values(userSubmissions).filter((s) => s.status === 'approved').length}
                  </p>
                </div>
              </div>

              {/* Progress to Next Badge */}
              <div className="space-y-1.5 pt-2 max-w-md">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-600">Next Badge: 🌿 Green Guardian</span>
                  <span className="text-emerald-700">{userPoints} / 200 Points</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-600 to-teal-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (userPoints / 200) * 100)}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Earn {Math.max(0, 200 - userPoints)} more points to unlock the official Green Guardian credential.
                </p>
              </div>
            </div>

            {/* Right: Quick Action Callout */}
            <div className="md:col-span-5 bg-emerald-50/70 p-5 rounded-2xl border border-emerald-200/80 space-y-3">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-900">
                <Zap className="w-4 h-4 text-emerald-700" />
                <span>Earn Quick Eco Points Today</span>
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed">
                Take on any active eco-action below to verify your contribution and climb the community leaderboard.
              </p>
              <a
                href="#daily-tasks"
                className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 underline"
              >
                <span>Browse Available Eco Tasks</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>

          </div>
        </section>

        {/* ========================================================================
            TOP 3 PODIUM (🥇 🥈 🥉)
            ======================================================================== */}
        <section className="space-y-6">
          <div className="text-center max-w-md mx-auto space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Community Champions
            </span>
            <h3 className="text-2xl font-black text-slate-900">Top District Contributors</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto items-end pt-4">
            
            {/* Rank 2 - Silver */}
            {topThree[1] && (
              <div className="glass-card p-6 rounded-3xl border border-slate-200 text-center space-y-3 order-2 sm:order-1 card-hover">
                <div className="relative inline-block">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-slate-200 to-slate-100 flex items-center justify-center font-black text-xl text-slate-700 shadow-md mx-auto border-2 border-slate-300">
                    🥈
                  </div>
                  <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-200 text-slate-700 border border-slate-300">
                    Rank 2
                  </span>
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-base">{topThree[1].name}</h4>
                  <p className="text-xs text-slate-500">{topThree[1].city}</p>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl font-black text-slate-800 text-sm">
                  {topThree[1].points} Eco Points
                </div>
              </div>
            )}

            {/* Rank 1 - Gold (Elevated center) */}
            {topThree[0] && (
              <div className="glass-card p-8 rounded-3xl border-2 border-amber-300 shadow-lg text-center space-y-4 order-1 sm:order-2 glow-emerald relative sm:-translate-y-4 card-hover">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-amber-950 shadow-xs">
                  🏆 Top Eco Champion
                </div>
                <div className="relative inline-block mt-2">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-200 to-amber-100 flex items-center justify-center font-black text-3xl shadow-md mx-auto border-2 border-amber-300">
                    🥇
                  </div>
                  <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-200 text-amber-900 border border-amber-300">
                    Rank 1
                  </span>
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-lg">{topThree[0].name}</h4>
                  <p className="text-xs text-slate-500">{topThree[0].city}</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-amber-100 to-amber-50 rounded-xl font-black text-amber-900 text-base border border-amber-200">
                  {topThree[0].points} Eco Points
                </div>
              </div>
            )}

            {/* Rank 3 - Bronze */}
            {topThree[2] && (
              <div className="glass-card p-6 rounded-3xl border border-slate-200 text-center space-y-3 order-3 card-hover">
                <div className="relative inline-block">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-100/60 to-orange-100/60 flex items-center justify-center font-black text-xl text-amber-800 shadow-md mx-auto border-2 border-amber-200">
                    🥉
                  </div>
                  <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-800 border border-amber-200">
                    Rank 3
                  </span>
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-base">{topThree[2].name}</h4>
                  <p className="text-xs text-slate-500">{topThree[2].city}</p>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl font-black text-slate-800 text-sm">
                  {topThree[2].points} Eco Points
                </div>
              </div>
            )}

          </div>
        </section>

        {/* ========================================================================
            FULL LEADERBOARD TABLE
            ======================================================================== */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-slate-900 tracking-tight">
              Community Rankings ({selectedCity})
            </h3>
            <span className="text-xs font-bold text-slate-400">Live Supabase Database</span>
          </div>

          {isLoading ? (
            <SkeletonTable rows={5} />
          ) : (
            <div className="glass-card rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-4 px-6">Rank</th>
                      <th className="py-4 px-6">Eco Contributor</th>
                      <th className="py-4 px-6">Municipal Area</th>
                      <th className="py-4 px-6">Verified Actions</th>
                      <th className="py-4 px-6 text-right">Total Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {leaderboard.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="py-12 text-center text-slate-400">
                          <p className="font-bold text-sm text-slate-600">No community contributors recorded yet.</p>
                          <p className="text-xs text-slate-400 mt-1">Submit an eco-action proof below to be ranked on the leaderboard!</p>
                        </td>
                      </tr>
                    ) : (
                      leaderboard.map((entry, idx) => {
                        const isCurrentUser = user && entry.userId === user.id;
                        return (
                          <tr
                            key={entry.userId || idx}
                            className={`hover:bg-slate-50/80 transition-colors ${
                              isCurrentUser ? 'bg-emerald-50/60 font-bold' : ''
                            }`}
                          >
                            <td className="py-4 px-6 font-extrabold">
                            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-xl text-xs ${
                              entry.rank === 1
                                ? 'bg-amber-100 text-amber-900'
                                : entry.rank === 2
                                ? 'bg-slate-200 text-slate-800'
                                : entry.rank === 3
                                ? 'bg-amber-50 text-amber-800'
                                : 'text-slate-500'
                            }`}>
                              #{entry.rank || idx + 1}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-xs">
                                {entry.name?.[0]?.toUpperCase() || 'U'}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900">
                                  {entry.name} {isCurrentUser && '(You)'}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-slate-600 font-medium">
                            {entry.city || selectedCity}
                          </td>
                          <td className="py-4 px-6 text-slate-600 font-medium">
                            {entry.tasksCompleted || Math.floor((entry.points || 100) / 30)} actions
                          </td>
                          <td className="py-4 px-6 text-right font-black text-emerald-700">
                            {entry.points} pts
                          </td>
                        </tr>
                      );
                    }))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {/* ========================================================================
            COLLECTIBLE BADGE SHOWCASE
            ======================================================================== */}
        <BadgeShowcase
          userPoints={userPoints}
          reportsCount={1}
          tasksCount={Object.values(userSubmissions).filter(s => s.status === 'approved').length + 2}
        />

        {/* ========================================================================
            ACTIVE DAILY ECO TASKS (EVIDENCE-BASED VERIFICATION)
            ======================================================================== */}
        <section id="daily-tasks" className="space-y-6 pt-6 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                Daily Eco Action Tasks
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Complete verifiable micro-actions in your community to boost your impact. Proof is reviewed before points are awarded.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                {tasks.length} Available
              </span>
              {isAdmin && (
                <a
                  href="#moderator-queue"
                  className="text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 px-3 py-1 rounded-full border border-purple-200 flex items-center gap-1.5 transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Review Queue</span>
                </a>
              )}
            </div>
          </div>

          {isAdmin && (
            <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-extrabold text-purple-900">Moderator Verification Enabled ({user?.email})</p>
                  <p className="text-[11px] text-purple-700">Click "Review Evidence & Verify" on any pending task card, or scroll down to the Moderator Panel to approve submissions and distribute points.</p>
                </div>
              </div>
              <a
                href="#moderator-queue"
                className="px-3.5 py-1.5 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-xl shrink-0 transition-colors shadow-2xs self-start sm:self-auto text-center"
              >
                Open Verification Panel ↓
              </a>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tasks.map((task) => {
              const sub = userSubmissions[task.id];

              return (
                <div
                  key={task.id}
                  className="glass-card p-5 rounded-3xl border border-slate-200/80 card-hover flex flex-col justify-between gap-4"
                >
                  <div className="space-y-2">
                    {/* Points & Status Badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                        +{task.points} Eco Points
                      </span>

                      {/* Status Badges */}
                      {sub && sub.status === 'approved' && (
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Verified</span>
                        </span>
                      )}

                      {sub && sub.status === 'pending' && (
                        <span className="text-[10px] font-black uppercase tracking-wider text-yellow-800 bg-yellow-50 px-2 py-0.5 rounded-full border border-yellow-300 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-yellow-600" />
                          <span>Pending Verification</span>
                        </span>
                      )}

                      {sub && sub.status === 'under_review' && (
                        <span className="text-[10px] font-black uppercase tracking-wider text-blue-800 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-300 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-blue-600" />
                          <span>Under Review</span>
                        </span>
                      )}

                      {sub && sub.status === 'rejected' && (
                        <span className="text-[10px] font-black uppercase tracking-wider text-rose-800 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-300 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          <span>Evidence Rejected</span>
                        </span>
                      )}

                      {sub && sub.status === 'more_evidence_required' && (
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-300 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 text-amber-600" />
                          <span>More Evidence Required</span>
                        </span>
                      )}
                    </div>

                    {/* Task Title & Description */}
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900">{task.title}</h4>
                      <p className="text-xs text-slate-500 leading-relaxed font-normal mt-0.5">
                        {task.description}
                      </p>
                    </div>

                    {/* Feedback or Evidence Date Notes */}
                    {sub && sub.status === 'approved' && (
                      <p className="text-[11px] font-bold text-emerald-700">
                        ✓ Completed • +{sub.points_awarded || task.points} Eco Points awarded
                      </p>
                    )}

                    {sub && sub.status === 'pending' && (
                      <p className="text-[11px] text-slate-400">
                        Evidence submitted {new Date(sub.submitted_at).toLocaleDateString()}
                      </p>
                    )}

                    {sub && (sub.status === 'rejected' || sub.status === 'more_evidence_required') && sub.review_notes && (
                      <p className="text-[11px] text-amber-800 bg-amber-50/80 p-2 rounded-xl border border-amber-200 italic">
                        "{sub.review_notes}"
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    {sub ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setEvidenceModalSubmission(sub)}
                          className={`px-3.5 py-2 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-2xs ${
                            isAdmin && sub.status === 'pending'
                              ? 'bg-purple-100 hover:bg-purple-200 text-purple-900 border border-purple-300'
                              : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
                          }`}
                        >
                          {isAdmin && sub.status === 'pending' ? (
                            <ShieldCheck className="w-3.5 h-3.5 text-purple-700" />
                          ) : (
                            <Eye className="w-3.5 h-3.5 text-slate-400" />
                          )}
                          <span>{isAdmin && sub.status === 'pending' ? 'Review & Verify (Admin)' : 'View Evidence'}</span>
                        </button>

                        {(sub.status === 'rejected' || sub.status === 'more_evidence_required') && (
                          <button
                            type="button"
                            onClick={() => handleOpenProofModal(task, sub)}
                            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>{sub.status === 'rejected' ? 'Submit New Evidence' : 'Upload More Evidence'}</span>
                          </button>
                        )}
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenProofModal(task)}
                        className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs hover:scale-[1.01]"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Submit Proof</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ========================================================================
            MODERATOR / ADMIN VERIFICATION PANEL
            ======================================================================== */}
        {isAdmin && (
          <AdminTaskVerification
            onPointsAwarded={(awardedPoints) => {
              loadData();
            }}
          />
        )}

      </main>

      {/* ========================================================================
          SUBMIT PROOF MODAL
          ======================================================================== */}
      {proofModalTask && (
        <TaskProofModal
          task={proofModalTask.task}
          existingSubmission={proofModalTask.existingSubmission}
          onClose={() => setProofModalTask(null)}
          onSuccess={handleProofSuccess}
        />
      )}

      {/* ========================================================================
          VIEW EVIDENCE DETAILS MODAL
          ======================================================================== */}
      {evidenceModalSubmission && (
        <TaskEvidenceModal
          submission={evidenceModalSubmission}
          isAdmin={isAdmin}
          onClose={() => setEvidenceModalSubmission(null)}
          onReviewed={() => loadData()}
          onResubmit={(sub) => {
            const task = tasks.find((t) => t.id === sub.task_id) || sub.task;
            setProofModalTask({ task, existingSubmission: sub });
          }}
        />
      )}

    </div>
  );
}