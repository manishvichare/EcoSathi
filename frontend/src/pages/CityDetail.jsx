import { useParams } from 'react-router-dom';
import Card from '../components/common/Card';

/**
 * City Detail Page
 * 
 * Shows detailed environmental data for a specific city.
 * Route: /city/:name
 * 
 * TODO: Implement detailed analytics in Stage 3
 */
export default function CityDetail() {
  const { name } = useParams();

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          {name || 'City'} - Detailed Analysis
        </h1>
        <p className="text-gray-600">
          Comprehensive environmental health report for {name}
        </p>
      </div>

      {/* Overview */}
      <Card className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Overview</h2>
            <div className="space-y-3">
              <p className="text-gray-600">
                <span className="font-medium">City:</span> {name}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Status:</span> Data loading...
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Last Updated:</span> Just now
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Quick Stats</h2>
            <div className="space-y-3">
              <p className="text-gray-600">
                <span className="font-medium">Environmental Health:</span> Loading...
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Air Quality:</span> Loading...
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Green Coverage:</span> Loading...
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Card title="Air Quality Details">
          <div className="space-y-4">
            <div>
              <p className="text-gray-600 mb-2">AQI Level</p>
              <div className="h-12 bg-gray-100 rounded flex items-center justify-center text-gray-400">
                Loading...
              </div>
            </div>
            <div>
              <p className="text-gray-600 mb-2">Air Quality Trend</p>
              <div className="h-40 bg-gray-100 rounded flex items-center justify-center text-gray-400">
                Chart loading...
              </div>
            </div>
          </div>
        </Card>

        <Card title="Environmental Health">
          <div className="space-y-4">
            <div>
              <p className="text-gray-600 mb-2">Health Score</p>
              <div className="h-12 bg-gray-100 rounded flex items-center justify-center text-gray-400">
                Loading...
              </div>
            </div>
            <div>
              <p className="text-gray-600 mb-2">Score Breakdown</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Green Cover</span>
                  <span>-- %</span>
                </div>
                <div className="h-2 bg-gray-200 rounded overflow-hidden">
                  <div className="h-full bg-green-500" style={{ width: '0%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Complaints & Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card title="Recent Complaints">
          <div className="text-center py-8 text-gray-400">
            No complaints recorded yet for {name}
          </div>
        </Card>

        <Card title="Eco Tasks">
          <div className="text-center py-8 text-gray-400">
            Eco tasks for {name} loading...
          </div>
        </Card>
      </div>
    </div>
  );
}