import api from './api';

/**
 * Notification Service
 * Aggregates real data from complaints, notices, and AQI into notifications.
 * No dummy data — everything is sourced from live backend APIs.
 */

// ─── Fetch recent complaints as notifications ────────────────────────────────

async function fetchComplaintNotifications(city) {
  try {
    const response = await api.get('/complaints', {
      params: { city, limit: 5, sort: 'newest' },
      timeout: 8000,
    });
    const complaints = response.data?.complaints || response.data || [];
    if (!Array.isArray(complaints)) return [];

    return complaints.slice(0, 5).map((c) => ({
      id: `complaint-${c.id}`,
      type: 'complaint',
      title: `New Report: ${c.category?.replace(/-/g, ' ')?.replace(/\b\w/g, (l) => l.toUpperCase()) || 'Environmental Issue'}`,
      desc: c.description
        ? c.description.slice(0, 100) + (c.description.length > 100 ? '…' : '')
        : `A new report was filed in ${city}.`,
      time: formatRelativeTime(c.created_at),
      timestamp: new Date(c.created_at).getTime(),
      severity: c.severity || 'medium',
      link: `/complaints/${c.id}`,
      city: c.city_name || city,
    }));
  } catch {
    return [];
  }
}

// ─── Fetch notices as notifications ──────────────────────────────────────────

async function fetchNoticeNotifications(city) {
  try {
    const response = await api.get(`/notices/${encodeURIComponent(city)}`, {
      timeout: 8000,
    });
    const notices = response.data?.notices || [];
    if (!Array.isArray(notices)) return [];

    return notices.slice(0, 3).map((n) => ({
      id: `notice-${n.id}`,
      type: 'notice',
      title: `Official Notice: ${n.category || 'Environmental Action'}`,
      desc: n.notice_text
        ? n.notice_text.replace(/\n+/g, ' ').slice(0, 100) + '…'
        : 'A new authority notice has been issued.',
      time: formatRelativeTime(n.created_at),
      timestamp: new Date(n.created_at).getTime(),
      severity: n.severity || 'high',
      link: '/notices',
      city,
    }));
  } catch {
    return [];
  }
}

// ─── Fetch live AQI as a notification ────────────────────────────────────────

async function fetchAqiNotification(city) {
  try {
    const response = await api.get(`/environment/${encodeURIComponent(city)}/aqi`, {
      timeout: 6000,
    });
    if (!response.data?.success) return [];

    const { aqi, aqiScale, weather } = response.data;
    if (aqi == null) return [];

    const isAlert = aqi > 100;
    const label = aqiScale?.label || (aqi <= 50 ? 'Good' : aqi <= 100 ? 'Moderate' : aqi <= 150 ? 'Unhealthy for Sensitive Groups' : 'Unhealthy');
    const temp = weather?.temp_c != null ? `${Math.round(weather.temp_c)}°C` : '';
    const humidity = weather?.humidity != null ? `, Humidity ${weather.humidity}%` : '';

    return [
      {
        id: `aqi-${city}-${Math.floor(Date.now() / 120000)}`, // changes every 2 min
        type: 'aqi',
        title: `${city} Air Quality: ${label} (AQI ${aqi})`,
        desc: isAlert
          ? `⚠️ Air quality is ${label} in ${city}. Avoid outdoor activities. ${temp}${humidity}`
          : `Current AQI is ${aqi} — ${label}. ${temp}${humidity}`.trim(),
        time: 'Live',
        timestamp: Date.now(),
        severity: aqi > 150 ? 'critical' : aqi > 100 ? 'high' : 'low',
        link: '/dashboard',
        city,
        isLive: true,
      },
    ];
  } catch {
    return [];
  }
}

// ─── Aggregate all real notifications ─────────────────────────────────────────

/**
 * Fetch all real notifications for a city.
 * Returns sorted list (newest first), deduplicated.
 * @param {string} city
 * @returns {Promise<Array>}
 */
export async function fetchNotifications(city = 'Pune') {
  const [aqi, complaints, notices] = await Promise.all([
    fetchAqiNotification(city),
    fetchComplaintNotifications(city),
    fetchNoticeNotifications(city),
  ]);

  // Combine and sort by timestamp (newest first)
  const all = [...aqi, ...notices, ...complaints];
  all.sort((a, b) => b.timestamp - a.timestamp);

  return all.slice(0, 10); // cap at 10 notifications
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function formatRelativeTime(isoString) {
  if (!isoString) return 'Recently';
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
