/**
 * ChartWrapper Component
 * 
 * Wraps Recharts components with consistent styling and responsive sizing.
 * Provides a card-like container for charts with title and subtitle.
 * 
 * Props:
 * - title: Chart title
 * - subtitle: Optional subtitle
 * - children: Recharts chart component
 * - loading: Show loader if true
 * - className: Additional Tailwind classes
 */
export default function ChartWrapper({ 
  title, 
  subtitle, 
  children, 
  loading = false,
  className = '' 
}) {
  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <h3 className="text-lg font-bold mb-4 text-gray-800">{title}</h3>
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
          <div className="text-gray-400">Loading chart...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-800">{title}</h3>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
      
      <div className="overflow-x-auto">
        {children}
      </div>
    </div>
  );
}