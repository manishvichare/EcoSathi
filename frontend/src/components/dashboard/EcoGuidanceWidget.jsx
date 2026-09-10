import { useState, useEffect } from 'react';
import Card from '../common/Card';
import { getCitySuggestions } from '../../services/suggestionService';

export default function EcoGuidanceWidget({ selectedCity = 'Pune' }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSuggestions() {
      setLoading(true);
      const res = await getCitySuggestions(selectedCity);
      if (res && res.suggestions) {
        setSuggestions(res.suggestions);
      }
      setLoading(false);
    }
    loadSuggestions();
  }, [selectedCity]);

  if (loading) {
    return (
      <Card title="Daily Eco Guidance & AI Suggestions">
        <div className="h-40 bg-gray-100 rounded animate-pulse"></div>
      </Card>
    );
  }

  return (
    <Card title="Daily Eco Guidance & AI Suggestions">
      <div className="space-y-4">
        <p className="text-xs text-gray-500">
          AI-generated environmental recommendations tailored for <strong>{selectedCity}</strong>
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {suggestions.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-xl border border-gray-100 bg-emerald-50/50 hover:bg-emerald-50 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-gray-800 text-sm">{item.title}</span>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-200 text-emerald-800">
                  {item.impact} Impact
                </span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
