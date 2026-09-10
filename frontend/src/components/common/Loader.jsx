/**
 * Loader Component
 * 
 * Shows a spinning loader with optional message.
 * Used when data is being fetched from API.
 * 
 * Props:
 * - message: Optional text to display below spinner
 * - fullScreen: If true, takes full screen height
 */
export default function Loader({ message = 'Loading...', fullScreen = false }) {
  const containerClass = fullScreen 
    ? 'fixed inset-0 flex items-center justify-center bg-gray-100/50' 
    : 'flex items-center justify-center py-12';

  return (
    <div className={containerClass}>
      <div className="text-center">
        {/* Spinner */}
        <div className="inline-flex">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-primary-300 rounded-full animate-spin"></div>
        </div>
        
        {/* Message */}
        {message && (
          <p className="mt-4 text-gray-600 font-medium">{message}</p>
        )}
      </div>
    </div>
  );
}