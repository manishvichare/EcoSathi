import Card from '../common/Card';
import PointsBadge from './PointsBadge';

/**
 * EcoTaskCard Component
 *
 * Displays a single eco task with title, description, points,
 * and a complete button that reflects completed / loading state.
 *
 * Props:
 * - task: { id, title, description, points, completed }
 * - onComplete: (taskId) => void
 * - isCompleting: boolean — true while this task's completion request is in flight
 */
export default function EcoTaskCard({ task, onComplete, isCompleting = false }) {
  const { id, title, description, points, completed } = task;

  return (
    <Card
      className={`h-full flex flex-col justify-between ${
        completed ? 'border-l-4 border-l-primary-600' : ''
      }`}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-bold text-gray-800 text-lg">{title}</h3>
          <PointsBadge points={points} size="sm" />
        </div>

        <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
      </div>

      <div className="mt-4">
        {completed ? (
          <div className="flex items-center gap-2 text-primary-700 font-bold text-sm">
            <span aria-hidden="true">✅</span>
            Completed
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onComplete?.(id)}
            disabled={isCompleting}
            className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isCompleting ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                Completing...
              </>
            ) : (
              'Mark as Complete'
            )}
          </button>
        )}
      </div>
    </Card>
  );
}