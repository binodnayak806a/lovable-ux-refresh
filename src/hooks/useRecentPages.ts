import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

interface RecentPage {
  path: string;
  label: string;
  timestamp: number;
}

const STORAGE_KEY = 'hms_recent_pages';
const MAX_RECENT = 5;

const PATH_LABELS: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/patients': 'Patients',
  '/add-patient': 'Add Patient',
  '/appointments': 'Appointments',
  '/opd': 'OPD',
  '/ipd': 'IPD',
  '/doctor/queue': 'Doctor Queue',
  '/lab': 'Laboratory',
  '/pharmacy': 'Pharmacy',
  '/billing': 'Billing',
  '/reports': 'Reports',
  '/analytics': 'Analytics',
  '/emergency': 'Emergency',
  '/ambulance': 'Ambulance',
  '/operation-theatre': 'Operation Theatre',
  '/insurance': 'Insurance',
  '/cash-bank': 'Cash & Bank',
  '/hrms': 'HRMS',
  '/admin': 'Admin',
  '/settings': 'Settings',
  '/profile': 'Profile',
};

function getLabel(path: string): string {
  return PATH_LABELS[path] || path.split('/').pop()?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || path;
}

export function useRecentPages() {
  const location = useLocation();
  const [recentPages, setRecentPages] = useState<RecentPage[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch { return []; }
  });

  useEffect(() => {
    const path = location.pathname;
    // Skip paths with IDs or query params
    if (path === '/' || path.includes('?')) return;

    setRecentPages(prev => {
      const filtered = prev.filter(p => p.path !== path);
      const updated = [{ path, label: getLabel(path), timestamp: Date.now() }, ...filtered].slice(0, MAX_RECENT);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, [location.pathname]);

  return recentPages;
}

const FAVORITES_KEY = 'hms_favorite_pages';

export function useFavoritePages() {
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
    } catch { return []; }
  });

  const toggleFavorite = useCallback((path: string) => {
    setFavorites(prev => {
      const updated = prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path].slice(0, 8);
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const isFavorite = useCallback((path: string) => favorites.includes(path), [favorites]);

  return { favorites, toggleFavorite, isFavorite };
}
