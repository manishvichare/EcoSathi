/**
 * SeverityBadge Component
 * 
 * Displays colored badge for complaint severity level.
 * 
 * Props:
 * - severity: 'Low', 'Medium', 'High', or 'Critical'
 * - size: 'sm', 'md', or 'lg' (default: 'md')
 */
export default function SeverityBadge({ severity = 'Medium', size = 'md' }) {
  const severityConfig = {
    Low: {
      color: '#3b82f6',
      bgColor: '#dbeafe',
      icon: '🟢',
    },
    Medium: {
      color: '#f59e0b',
      bgColor: '#fef3c7',
      icon: '🟡',
    },
    High: {
      color: '#f97316',
      bgColor: '#ffedd5',
      icon: '🟠',
    },
    Critical: {
      color: '#ef4444',
      bgColor: '#fee2e2',
      icon: '🔴',
    },
  };

  const config = severityConfig[severity] || severityConfig.Medium;

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full font-bold
        ${sizeClasses[size]}
      `}
      style={{
        backgroundColor: config.bgColor,
        color: config.color,
      }}
    >
      <span className="text-lg">{config.icon}</span>
      {severity}
    </span>
  );
}