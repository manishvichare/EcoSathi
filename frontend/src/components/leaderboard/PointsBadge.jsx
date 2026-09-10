/**
 * PointsBadge Component
 *
 * Displays a points value as a rounded badge.
 *
 * Props:
 * - points: number
 * - size: 'sm', 'md', or 'lg' (default: 'md')
 */
export default function PointsBadge({ points = 0, size = 'md' }) {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1 rounded-full font-bold
        bg-primary-100 text-primary-700
        ${sizeClasses[size]}
      `}
    >
      <span aria-hidden="true">🌱</span>
      {points.toLocaleString()} pts
    </span>
  );
}