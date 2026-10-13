import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Heart } from "lucide-react";

const WishlistContext = createContext(null);

const STORAGE_KEY = "tt_wishlist_v1";

function loadWishlist() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export function WishlistProvider({ children }) {
  const [wishlist, setWishlist] = useState(loadWishlist);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setWishlist(loadWishlist());
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(wishlist));
      } catch {}
    }
  }, [wishlist, isLoaded]);

  const toggle = useCallback((product) => {
    setWishlist((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      if (exists) {
        return prev.filter((p) => p.id !== product.id);
      }
      return [...prev, { ...product, addedAt: Date.now() }];
    });
  }, []);

  const add = useCallback((product) => {
    setWishlist((prev) => {
      if (prev.some((p) => p.id === product.id)) return prev;
      return [...prev, { ...product, addedAt: Date.now() }];
    });
  }, []);

  const remove = useCallback((productId) => {
    setWishlist((prev) => prev.filter((p) => p.id !== productId));
  }, []);

  const clear = useCallback(() => setWishlist([]), []);

  const isInWishlist = useCallback((productId) => {
    return wishlist.some((p) => p.id === productId);
  }, [wishlist]);

  const count = wishlist.length;

  return (
    <WishlistContext.Provider value={{ wishlist, toggle, add, remove, clear, isInWishlist, count, isLoaded }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) throw new Error("useWishlist must be used within WishlistProvider");
  return context;
}

export function WishlistButton({ product, className = "", size = "md" }) {
  const { toggle, isInWishlist } = useWishlist();
  const inWishlist = isInWishlist(product.id);

  const sizes = {
    sm: { icon: 16, padding: 8 },
    md: { icon: 20, padding: 10 },
    lg: { icon: 24, padding: 12 },
  };

  const { icon, padding } = sizes[size];

  return (
    <button
      className={`wishlist-button ${inWishlist ? "active" : ""} ${className}`}
      onClick={() => toggle(product)}
      aria-label={inWishlist ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
      aria-pressed={inWishlist}
      style={{ padding, width: padding * 2, height: padding * 2 }}
    >
      <Heart size={icon} className={inWishlist ? "filled" : ""} />
    </button>
  );
}