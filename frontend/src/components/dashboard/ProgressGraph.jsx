import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import ChartWrapper from '../common/ChartWrapper';

/**
 * Progress Graph Component
 * 
 * Displays:
 * - 30-day health score trend using line chart
 * - AQI trend overlay
 * - Smooth curve with tooltip on hover
 * 
 * Props:
 * - data: Array of { date, healthScore, aqi }
 * - loading: Show loading state if true
 */
export default function ProgressGraph({ data = [], loading = false }) {
  if (loading) {
    return (
      <ChartWrapper
        title="Environmental Health Trend"
        subtitle="Last 30 days"
        loading={true}
      />
    );
  }

  // Ensure we have data
  if (!data || data.length === 0) {
    return (
      <ChartWrapper
        title="Environmental Health Trend"
        subtitle="Last 30 days"
      >
        <div className="h-64 flex items-center justify-center text-gray-400">
          No historical data available
        </div>
      </ChartWrapper>
    );
  }

  // Format data for chart - keep every 5th day label to avoid crowding
  const chartData = data.map((item, index) => ({
    ...item,
    displayDate: index % 5 === 0 ? item.date.substring(5) : '', // MM-DD format for every 5th
  }));

  return (
    <ChartWrapper
      title="Environmental Health Trend"
      subtitle="Last 30 days"
    >
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
        >
          {/* Grid */}
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#e5e7eb"
            vertical={false}
          />

          {/* Axes */}
          <XAxis
            dataKey="displayDate"
            stroke="#9ca3af"
            style={{ fontSize: '12px' }}
            tick={{ fill: '#9ca3af' }}
          />

          <YAxis
            stroke="#9ca3af"
            domain={[0, 100]}
            style={{ fontSize: '12px' }}
            tick={{ fill: '#9ca3af' }}
            label={{ value: 'Score (0-100)', angle: -90, position: 'insideLeft' }}
          />

          {/* Tooltip */}
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '12px',
            }}
            formatter={(value, name) => {
              if (name === 'healthScore') {
                return [Math.round(value), 'Health Score'];
              }
              if (name === 'aqi') {
                return [Math.round(value), 'AQI'];
              }
              return [value, name];
            }}
            labelFormatter={(label) => {
              const item = data.find((d) => d.date === label);
              return item ? item.date : label;
            }}
            cursor={{ stroke: '#1b6b4a', strokeWidth: 2 }}
          />

          {/* Legend */}
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
            formatter={(value) => {
              if (value === 'healthScore') return 'Health Score';
              if (value === 'aqi') return 'Air Quality (AQI)';
              return value;
            }}
          />

          {/* Health Score Line */}
          <Line
            type="monotone"
            dataKey="healthScore"
            stroke="#1b6b4a"
            strokeWidth={3}
            dot={false}
            isAnimationActive={true}
            animationDuration={500}
            name="Health Score"
          />

          {/* AQI Line (secondary, for context) */}
          <Line
            type="monotone"
            dataKey="aqi"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={false}
            opacity={0.5}
            isAnimationActive={true}
            animationDuration={500}
            name="AQI"
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Chart Info */}
      <div className="mt-4 p-3 bg-gray-50 rounded text-xs text-gray-600">
        <p className="font-bold mb-1">How to Read:</p>
        <p>
          • <strong>Green line:</strong> Environmental Health Score (target: 70+)
        </p>
        <p>
          • <strong>Orange line:</strong> Air Quality Index (lower is better)
        </p>
        <p className="mt-2 text-gray-500">
          Hover over the chart to see daily values
        </p>
      </div>
    </ChartWrapper>
  );
}