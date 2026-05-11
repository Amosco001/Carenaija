import { useState, useEffect, useCallback } from "react";

export interface RecentlyViewedHospital {
  id: number;
  name: string;
  slug: string;
  state: string;
  lga: string;
  averageRating: number | null;
  totalReviews: number | null;
  ownership: string;
  viewedAt: number;
}

const STORAGE_KEY = "carenaija_recently_viewed";
const MAX_ITEMS = 5;

function getStoredItems(): RecentlyViewedHospital[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function storeItems(items: RecentlyViewedHospital[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

export function useRecentlyViewed() {
  const [items, setItems] = useState<RecentlyViewedHospital[]>([]);

  useEffect(() => {
    setItems(getStoredItems());
  }, []);

  const addHospital = useCallback((hospital: Omit<RecentlyViewedHospital, "viewedAt">) => {
    setItems(prev => {
      const filtered = prev.filter(h => h.id !== hospital.id);
      const updated = [{ ...hospital, viewedAt: Date.now() }, ...filtered].slice(0, MAX_ITEMS);
      storeItems(updated);
      return updated;
    });
  }, []);

  const clearAll = useCallback(() => {
    storeItems([]);
    setItems([]);
  }, []);

  return { items, addHospital, clearAll };
}
