import { useState } from 'react';
import Card from '../common/Card';

/**
 * Mock news data.
 * No backend endpoint exists for news yet, so this feed is static
 * for now — swap MOCK_NEWS for a real fetch once an API is defined.
 */
const MOCK_NEWS = [
  {
    id: 'news-1',
    headline: 'City Launches Rooftop Solar Subsidy for Households',
    summary:
      'A new municipal scheme covers up to 40% of rooftop solar installation costs for residential buildings, aiming to cut grid demand during peak summer months.',
    category: 'Renewable Energy',
    location: 'Pune',
    date: '2026-08-12',
  },
  {
    id: 'news-2',
    headline: 'Air Quality Improves After Construction Dust Rules Enforced',
    summary:
      'Stricter enforcement of dust-control norms at construction sites has coincided with a measurable drop in PM2.5 readings across the eastern wards.',
    category: 'Air Quality',
    location: 'Mumbai',
    date: '2026-08-10',
  },
  {
    id: 'news-3',
    headline: 'Volunteers Plant 5,000 Saplings Along River Restoration Site',
    summary:
      'A weekend community drive added native tree species to a stretch of riverside land that had been degraded by years of unregulated dumping.',
    category: 'Green Cover',
    location: 'Bangalore',
    date: '2026-08-08',
  },
  {
    id: 'news-4',
    headline: 'New E-Waste Collection Points Open Across the City',
    summary:
      'Twelve new drop-off centers now accept old electronics for safe recycling, part of a wider push to reduce hazardous landfill waste.',
    category: 'Waste Management',
    location: 'Hyderabad',
    date: '2026-08-05',
  },
  {
    id: 'news-5',
    headline: 'Water Body Restoration Project Enters Second Phase',
    summary:
      'Desilting and shoreline replanting work has begun on a long-neglected lake, with officials targeting improved water quality by next monsoon.',
    category: 'Water Conservation',
    location: 'Chennai',
    date: '2026-08-02',
  },
  {
    id: 'news-6',
    headline: 'Public Transport Ridership Rises After Fare Restructuring',
    summary:
      'A revised fare structure and expanded bus routes have contributed to a noticeable increase in daily ridership, easing peak-hour congestion.',
    category: 'Sustainable Transport',
    location: 'Delhi',
    date: '2026-07-29',
  },
];

const CATEGORY_STYLES = {
  'Renewable Energy': 'bg-amber-100 text-amber-700',
  'Air Quality': 'bg-blue-100 text-blue-700',
  'Green Cover': 'bg-primary-100 text-primary-700',
  'Waste Management': 'bg-purple-100 text-purple-700',
  'Water Conservation': 'bg-teal-100 text-teal-700',
  'Sustainable Transport': 'bg-orange-100 text-orange-700',
};

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * NewsFeed Component
 *
 * Displays environmental news as a responsive grid of cards:
 * headline, summary, category, location, date, and a "Read more"
 * toggle that expands the full summary in place.
 *
 * Uses static mock data — no backend endpoint exists for news yet.
 */
export default function NewsFeed() {
  const [expandedId, setExpandedId] = useState(null);

  const toggleExpanded = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  if (MOCK_NEWS.length === 0) {
    return (
      <Card>
        <div className="text-center py-12">
          <div className="text-4xl mb-3">📰</div>
          <p className="text-gray-600 font-medium">No news to show right now</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {MOCK_NEWS.map((item) => {
        const isExpanded = expandedId === item.id;
        const categoryClass =
          CATEGORY_STYLES[item.category] || 'bg-gray-100 text-gray-700';

        return (
          <Card key={item.id} className="h-full flex flex-col">
            <div className="flex-1 space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span
                  className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${categoryClass}`}
                >
                  {item.category}
                </span>
                <span className="text-xs text-gray-500">{formatDate(item.date)}</span>
              </div>

              <h3 className="font-bold text-gray-800 text-lg leading-snug">
                {item.headline}
              </h3>

              <p
                className={`text-gray-600 text-sm leading-relaxed ${
                  isExpanded ? '' : 'line-clamp-3'
                }`}
              >
                {item.summary}
              </p>

              <p className="text-xs text-gray-500">📍 {item.location}</p>
            </div>

            <button
              type="button"
              onClick={() => toggleExpanded(item.id)}
              className="mt-4 self-start text-sm font-bold text-primary-600 hover:text-primary-700 transition-colors"
            >
              {isExpanded ? 'Show less' : 'Read more'}
            </button>
          </Card>
        );
      })}
    </div>
  );
}