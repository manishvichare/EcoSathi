import Card from '../common/Card';
import PointsBadge from './PointsBadge';

const RANK_STYLES = {
  1: { medal: '🥇', ring: 'ring-2 ring-yellow-400', bg: 'bg-yellow-50' },
  2: { medal: '🥈', ring: 'ring-2 ring-gray-300', bg: 'bg-gray-50' },
  3: { medal: '🥉', ring: 'ring-2 ring-amber-600', bg: 'bg-amber-50' },
};

/**
 * Leaderboard Component
 *
 * Displays a ranked list of users for the current city, highlighting
 * the top 3 and calling out the signed-in user's own rank.
 *
 * Props:
 * - entries: [{ userId, rank, name, points }]
 * - currentUser: { userId, rank, name, points } | null
 * - isLoading: boolean
 * - error: string | null
 */
export default function Leaderboard({
  entries = [],
  currentUser = null,
  isLoading = false,
  error = null,
}) {
  // Loading state
  if (isLoading) {
    return (
      <Card>
        <div className="space-y-3 animate-pulse">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 bg-gray-100 rounded-lg" />
          ))}
        </div>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <div className="text-center py-10">
          <div className="text-4xl mb-3">⚠️</div>
          <p className="text-red-700 font-bold">Couldn't load the leaderboard</p>
          <p className="text-gray-500 text-sm mt-1">{error}</p>
        </div>
      </Card>
    );
  }

  // Empty state
  if (entries.length === 0) {
    return (
      <Card>
        <div className="text-center py-12">
          <div className="text-4xl mb-3">🏆</div>
          <p className="text-gray-600 font-medium">No rankings yet</p>
          <p className="text-gray-500 text-sm mt-2">
            Complete eco tasks to be the first on the leaderboard
          </p>
        </div>
      </Card>
    );
  }

  const topThree = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <div className="space-y-6">
      {/* Your rank callout */}
      {currentUser && (
        <Card className="bg-primary-50 border border-primary-200">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-xs uppercase font-bold text-primary-700">
                Your Rank
              </p>
              <p className="text-2xl font-bold text-primary-800">
                #{currentUser.rank}
              </p>
            </div>
            <PointsBadge points={currentUser.points} size="lg" />
          </div>
        </Card>
      )}

      {/* Top 3 podium */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {topThree.map((entry) => {
          const style = RANK_STYLES[entry.rank] || {};
          return (
            <Card
              key={entry.userId}
              className={`text-center ${style.ring || ''} ${style.bg || ''}`}
            >
              <div className="text-3xl mb-2">{style.medal}</div>
              <p className="font-bold text-gray-800 truncate">{entry.name}</p>
              <p className="text-xs text-gray-500 mb-2">Rank #{entry.rank}</p>
              <PointsBadge points={entry.points} size="sm" />
            </Card>
          );
        })}
      </div>

      {/* Rest of the list */}
      {rest.length > 0 && (
        <Card>
          <ul className="divide-y divide-gray-100">
            {rest.map((entry) => (
              <li
                key={entry.userId}
                className={`flex items-center justify-between gap-3 py-3 ${
                  currentUser && entry.userId === currentUser.userId
                    ? 'bg-primary-50 -mx-4 px-4 rounded-lg'
                    : ''
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-gray-400 font-bold w-8 shrink-0">
                    #{entry.rank}
                  </span>
                  <span className="text-gray-800 font-medium truncate">
                    {entry.name}
                  </span>
                </div>
                <PointsBadge points={entry.points} size="sm" />
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}