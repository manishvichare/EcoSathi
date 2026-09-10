import React from 'react';
import { Award, Lock, CheckCircle2, Sparkles } from 'lucide-react';

/**
 * Collectible Eco Badges Showcase Component
 */
export default function BadgeShowcase({ userPoints = 50, reportsCount = 1, tasksCount = 2 }) {
  const badges = [
    {
      id: 'eco-starter',
      icon: '🌱',
      name: 'Eco Starter',
      desc: 'Joined the platform and initiated local environmental monitoring.',
      unlocked: true,
      criteria: 'Account created',
      progress: 100,
    },
    {
      id: 'eco-watcher',
      icon: '🔎',
      name: 'Eco Watcher',
      desc: 'Filed at least 1 verified photographic environmental issue report.',
      unlocked: reportsCount >= 1,
      criteria: `${Math.min(reportsCount, 1)} / 1 report submitted`,
      progress: Math.min(100, (reportsCount / 1) * 100),
    },
    {
      id: 'community-helper',
      icon: '🤝',
      name: 'Community Helper',
      desc: 'Supported or volunteered to resolve 3 local environmental issues.',
      unlocked: tasksCount >= 3,
      criteria: `${Math.min(tasksCount, 3)} / 3 actions completed`,
      progress: Math.min(100, (tasksCount / 3) * 100),
    },
    {
      id: 'green-guardian',
      icon: '🌿',
      name: 'Green Guardian',
      desc: 'Achieved 200+ eco impact points across verified civic actions.',
      unlocked: userPoints >= 200,
      criteria: `${Math.min(userPoints, 200)} / 200 Eco Points`,
      progress: Math.min(100, (userPoints / 200) * 100),
    },
    {
      id: 'eco-champion',
      icon: '🏆',
      name: 'Eco Champion',
      desc: 'Achieved 500+ points and helped resolve critical urban hotspots.',
      unlocked: userPoints >= 500,
      criteria: `${Math.min(userPoints, 500)} / 500 Eco Points`,
      progress: Math.min(100, (userPoints / 500) * 100),
    },
    {
      id: 'ecosathi-hero',
      icon: '🌍',
      name: 'EcoSathi Hero',
      desc: 'Ranked in the top 3 contributors in your municipal district.',
      unlocked: false,
      criteria: 'Reach Top 3 in district',
      progress: 40,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">
            Collectible Eco Badges
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Earn official badges as you contribute to a cleaner, greener community.
          </p>
        </div>
        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          {badges.filter((b) => b.unlocked).length} of {badges.length} Unlocked
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {badges.map((badge) => (
          <div
            key={badge.id}
            className={`p-5 rounded-3xl border transition-all ${
              badge.unlocked
                ? 'bg-white border-emerald-200/90 shadow-sm hover:shadow-md'
                : 'bg-slate-50/70 border-slate-200/70 opacity-80'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-xs ${
                  badge.unlocked
                    ? 'bg-gradient-to-tr from-emerald-100 to-teal-50 border border-emerald-200'
                    : 'bg-slate-200 text-slate-400'
                }`}
              >
                {badge.icon}
              </div>

              {badge.unlocked ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Earned</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  <Lock className="w-3 h-3" />
                  <span>Locked</span>
                </span>
              )}
            </div>

            <h4 className="font-extrabold text-sm text-slate-900">{badge.name}</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">
              {badge.desc}
            </p>

            <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
              <div className="flex justify-between items-center text-[10px] font-bold">
                <span className="text-slate-400">Milestone</span>
                <span className={badge.unlocked ? 'text-emerald-700' : 'text-slate-500'}>
                  {badge.criteria}
                </span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    badge.unlocked ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}
                  style={{ width: `${badge.progress}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
