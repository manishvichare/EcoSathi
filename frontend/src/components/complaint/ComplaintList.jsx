import { getMockComplaints } from '../../services/complaintService';
import { formatDate } from '../../utils/formatters';
import Card from '../common/Card';
import SeverityBadge from './SeverityBadge';

/**
 * ComplaintList Component
 * 
 * Displays submitted complaints with:
 * - Category and description
 * - Photo thumbnail
 * - AI severity badge
 * - Status indicator
 * - AI assessment label
 * 
 * Props:
 * - complaints: Array of complaint objects
 */
export default function ComplaintList({ complaints = [] }) {
  // Use provided complaints or mock for development
  const displayComplaints = complaints.length > 0 ? complaints : getMockComplaints();

  if (displayComplaints.length === 0) {
    return (
      <Card>
        <div className="text-center py-12">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-gray-600 font-medium">No complaints submitted yet</p>
          <p className="text-gray-500 text-sm mt-2">
            Submit your first complaint to help improve your city
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {displayComplaints.map((complaint) => (
        <Card
          key={complaint.id}
          className="hover:shadow-lg transition-shadow"
        >
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <h3 className="font-bold text-gray-800 text-lg">
                  {complaint.category.replace('-', ' ').toUpperCase()}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {formatDate(complaint.createdAt)}
                </p>
              </div>

              {complaint.aiAnalysis && (
                <SeverityBadge
                  severity={complaint.aiAnalysis.severity}
                  size="sm"
                />
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200"></div>

            {/* Description */}
            <p className="text-gray-700 text-sm leading-relaxed">
              {complaint.description}
            </p>

            {/* Photo */}
            {complaint.photo && (
              <div>
                <img
                  src={complaint.photo}
                  alt="Complaint evidence"
                  className="w-full h-32 object-cover rounded-lg border border-gray-200"
                />
              </div>
            )}

            {/* AI Assessment */}
            {complaint.aiAnalysis && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm">🤖</span>
                  <p className="text-xs font-bold text-gray-700">
                    AI-Generated Assessment
                  </p>
                </div>
                <p className="text-xs text-gray-700">
                  {complaint.aiAnalysis.summary}
                </p>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-200">
              <span className="text-xs font-bold text-gray-600">
                ID: {complaint.id}
              </span>
              <span
                className="px-3 py-1 rounded-full text-white text-xs font-bold"
                style={{
                  backgroundColor:
                    complaint.status === 'pending'
                      ? '#f59e0b'
                      : complaint.status === 'assigned'
                      ? '#3b82f6'
                      : '#22c55e',
                }}
              >
                {complaint.status.toUpperCase()}
              </span>
            </div>

            {/* Location */}
            <p className="text-xs text-gray-600">
              📍 {complaint.location || 'Unknown'}
            </p>
          </div>
        </Card>
      ))}
    </div>
  );
}