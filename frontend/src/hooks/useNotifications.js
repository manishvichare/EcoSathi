import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchNotifications } from '../services/notificationService';

const POLL_INTERVAL_MS = 90 * 1000; // Poll every 90 seconds
const READ_KEY = 'ecosathi_notifications_read'; // localStorage key for read IDs

/**
 * useNotifications hook
 * Fetches real notifications (AQI, complaints, notices) for the selected city.
 * Manages read/unread state persisted in localStorage.
 *
 * @param {string} city - Currently selected city
 * @returns {{ notifications, unreadCount, loading, error, markAllRead, refresh }}
 */
export function useNotifications(city = 'Pune') {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [readIds, setReadIds] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem(READ_KEY) || '[]'));
    } catch {
      return new Set();
    }
  });

  const intervalRef = useRef(null);
  const mountedRef = useRef(true);

  const loadNotifications = useCallback(async () => {
    try {
      const data = await fetchNotifications(city);
      if (!mountedRef.current) return;
      setNotifications(data);
      setError(null);
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err.message);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [city]);

  // Initial load + re-load when city changes
  useEffect(() => {
    mountedRef.current = true;
    setLoading(true);
    loadNotifications();

    // Start polling
    intervalRef.current = setInterval(loadNotifications, POLL_INTERVAL_MS);

    return () => {
      mountedRef.current = false;
      clearInterval(intervalRef.current);
    };
  }, [loadNotifications]);

  // Mark all as read — persist to localStorage
  const markAllRead = useCallback(() => {
    const allIds = new Set(notifications.map((n) => n.id));
    setReadIds(allIds);
    try {
      localStorage.setItem(READ_KEY, JSON.stringify([...allIds]));
    } catch {}
  }, [notifications]);

  // Expose manual refresh
  const refresh = useCallback(() => {
    setLoading(true);
    loadNotifications();
  }, [loadNotifications]);

  // AQI notifications are always "live" — never counted as stale-unread
  const unreadCount = notifications.filter((n) => {
    if (n.type === 'aqi') return false; // AQI is ambient info, not an "alert" to dismiss
    return !readIds.has(n.id);
  }).length;

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAllRead,
    refresh,
    readIds,
  };
}
