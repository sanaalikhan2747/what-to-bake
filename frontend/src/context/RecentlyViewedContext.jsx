import { createContext, useContext, useEffect, useState, useCallback } from "react";

const RecentlyViewedContext = createContext(null);

const STORAGE_KEY = "tt_recently_viewed_v1";
const MAX_ITEMS = 10;

function loadRecentlyViewed() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export function RecentlyViewedProvider({ children }) {
  const [items, setItems] = useState(loadRecentlyViewed);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setItems(loadRecentlyViewed());
    setIsLoaded(true);
  }, []);

  const add = useCallback((product) => {
    setItems((prev) => {
      const filtered = prev.filter((p) => p.id !== product.id);
      const updated = [{ ...product, viewedAt: Date.now() }, ...filtered].slice(0, MAX_ITEMS);
      return updated;
    });
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const remove = useCallback((productId) => {
    setItems((prev) => prev.filter((p) => p.id !== productId));
  }, []);

  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      } catch {}
    }
  }, [items, isLoaded]);

  return (
    <RecentlyViewedContext.Provider value={{ items, add, clear, remove, isLoaded }}>
      {children}
    </RecentlyViewedContext.Provider>
  );
}

export function useRecentlyViewed() {
  const context = useContext(RecentlyViewedContext);
  if (!context) throw new Error("useRecentlyViewed must be used within RecentlyViewedProvider");
  return context;
}