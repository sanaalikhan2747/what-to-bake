import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight, Rotate3D, ShoppingBag, WandSparkles, X } from "lucide-react";
import { api } from "@/state/api";
import { CATALOGUE_PRODUCTS } from "@/state/catalogueData";
import { useCart } from "@/state/CartContext";
import Product360Viewer from "@/components/Product360Viewer";
import "./MenuProductDialog.css";

const CATEGORY_ORDER = ["loaf", "cheesecake", "batch", "cookie"];
const CATEGORY_LABEL = {
  loaf: "Loaves — freshly baked, made with love",
  cheesecake: "Cheesecake & Dessert Boxes",
  batch: "Brownies, Bakes & Dessert Cups",
  cookie: "Artisanal Cookies",
};
const CATEGORY_EYEBROW = {
  loaf: "01 / LOAVES",
  cheesecake: "02 / CHEESECAKE & DESSERT BOXES",
  batch: "03 / BROWNIES, BAKES & CUPS",
  cookie: "04 / COOKIES",
};

export default function Menu() {
  const [products, setProducts] = useState(CATALOGUE_PRODUCTS);
  const [filter, setFilter] = useState("all");
  const [viewingProduct, setViewingProduct] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const { addItem, setCartOpen } = useCart();
  const location = useLocation();

  useEffect(() => {
    api.get("/products")
      .then((r) => {
        if (Array.isArray(r.data) && r.data.length > 0) setProducts(r.data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!location.hash || !products.length) return;
    const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (target) setTimeout(() => target.scrollIntoView({ behavior: "smooth", block: "center" }), 80);
  }, [location.hash, products.length]);

  useEffect(() => {
    if (!selectedProduct) return undefined;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setSelectedProduct(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    const focusFrame = window.requestAnimationFrame(() => {
      document.querySelector(".menu-product-dialog-close")?.focus();
    });
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
      window.cancelAnimationFrame(focusFrame);
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, [selectedProduct]);

  const grouped = useMemo(() => {
    const g = {};
    CATEGORY_ORDER.forEach((c) => (g[c] = []));
    products.forEach((p) => { if (g[p.category]) g[p.category].push(p); });
    return g;
  }, [products]);

  const visibleCategories = filter === "all"
    ? CATEGORY_ORDER
    : filter === "healthy"
      ? CATEGORY_ORDER.filter((category) => grouped[category].some((product) => product.healthy))
      : [filter];
  const visibleGroups = visibleCategories.map((category) => ({
    category,
    products: filter === "healthy" ? grouped[category].filter((product) => product.healthy) : grouped[category],
  }));

  const add = (p) => {
    addItem({ id: p.id, name: p.name, price: p.price, image: p.image, custom_box: false });
    setCartOpen(true);
  };

  const openProduct = (event, product) => {
    if (event.target.closest("button")) return;
    setSelectedProduct(product);
  };

  const handleProductKeyDown = (event, product) => {
    if (event.target !== event.currentTarget || (event.key !== "Enter" && event.key !== " ")) return;
    event.preventDefault();
    setSelectedProduct(product);
  };

  return (
    <div className="menu-page">
      <header className="menu-header">
        <div className="menu-order-note">
          <strong>24 Hours Notice Required</strong>
          <span>Freshly prepared &amp; baked to order with love.</span>
        </div>
        <p className="eyebrow">THE FULL MENU</p>
        <h1>Freshly baked,<br /><em>made with love.</em></h1>
        <p className="menu-lead">
          Browse the whole kitchen — artisanal loaves, dessert boxes, bakes, cookies, and wholesome treats. Or, for a small mix,{" "}
          <Link to="/build" className="inline-link light" data-testid="menu-build-link">build a custom box <WandSparkles size={14} /></Link>.
        </p>
        <div className="menu-filters">
          <button className={filter === "all" ? "chip active" : "chip"} onClick={() => setFilter("all")} data-testid="filter-all">All</button>
          {CATEGORY_ORDER.map((c) => (
            <button key={c} className={filter === c ? "chip active" : "chip"} onClick={() => setFilter(c)} data-testid={`filter-${c}`}>
              {CATEGORY_LABEL[c].split(" — ")[0]}
            </button>
          ))}
          <button className={filter === "healthy" ? "chip active" : "chip"} onClick={() => setFilter("healthy")} data-testid="filter-healthy">
            Healthy Range
          </button>
        </div>
      </header>

      {visibleGroups.map(({ category: cat, products: categoryProducts }) => (
        <section className="menu-cat" key={cat} id={`cat-${cat}`}>
          <div className="menu-cat-head">
            <p className="eyebrow">{CATEGORY_EYEBROW[cat]}</p>
            <h2>{CATEGORY_LABEL[cat]}</h2>
          </div>
          <div className="menu-grid">
            {categoryProducts.map((p) => (
              <article className="menu-card menu-card-selectable" id={`product-${p.id}`} key={p.id} data-testid={`menu-item-${p.id}`} tabIndex={0} aria-label={`View details for ${p.name}`} aria-haspopup="dialog" onClick={(event) => openProduct(event, p)} onKeyDown={(event) => handleProductKeyDown(event, p)}>
                <div className="menu-card-image">
                  <img src={p.image} alt={p.name} />
                  {p.healthy && <span className="pill-healthy">Healthy option</span>}
                  <button
                    type="button"
                    className="menu-view-360"
                    onClick={() => setViewingProduct(p)}
                    aria-label={`Open 360 degree preview of ${p.name}`}
                    data-testid={`menu-360-${p.id}`}
                  >
                    <Rotate3D size={15} /> <span>360° view</span>
                  </button>
                </div>
                <div className="menu-card-body">
                  <h3>{p.name}</h3>
                  {p.note && <p className="menu-note">{p.note}</p>}
                  {p.variants && (
                    <p className="menu-note">Choose: {p.variants.join(" · ")}</p>
                  )}
                  <p className="menu-story">"{p.story}"</p>
                  {p.addons?.length > 0 && (
                    <p className="menu-addon">
                      Add {p.addons.map((a) => `${a.name} +Rs. ${a.price}`).join(", ")}
                    </p>
                  )}
                  <div className="menu-card-footer">
                    <div>
                      <b>Rs. {p.price.toLocaleString()}</b>
                      <small>{p.unit}</small>
                    </div>
                    <button className="button primary small" onClick={() => add(p)} data-testid={`menu-add-${p.id}`}>
                      Add <ShoppingBag size={14} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
      {viewingProduct && <Product360Viewer product={viewingProduct} onClose={() => setViewingProduct(null)} />}
      {selectedProduct && <div className="menu-product-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedProduct(null); }}>
        <section className="menu-product-dialog" role="dialog" aria-modal="true" aria-labelledby="menu-product-title" data-testid="menu-product-dialog">
          <button type="button" className="menu-product-dialog-close" onClick={() => setSelectedProduct(null)} aria-label="Close product details" data-testid="menu-product-close"><X size={19} /></button>
          <div className="menu-product-dialog-image">
            <img src={selectedProduct.image} alt={selectedProduct.name} />
            {selectedProduct.healthy && <span className="pill-healthy">Healthy option</span>}
            <button type="button" className="menu-product-360" onClick={() => { setViewingProduct(selectedProduct); setSelectedProduct(null); }} data-testid="menu-product-360">
              <Rotate3D size={15} /> View in 360°
            </button>
          </div>
          <div className="menu-product-dialog-copy">
            <p className="eyebrow">FRESH FROM THE KITCHEN</p>
            <h2 id="menu-product-title">{selectedProduct.name}</h2>
            {selectedProduct.note && <p className="menu-note">{selectedProduct.note}</p>}
            <p className="menu-product-story">{selectedProduct.story}</p>
            {selectedProduct.variants?.length > 0 && <div className="menu-product-options"><h3>Available options</h3><div>{selectedProduct.variants.map((variant) => <span key={variant}>{variant}</span>)}</div></div>}
            {selectedProduct.addons?.length > 0 && <div className="menu-product-options"><h3>Optional extras</h3><div>{selectedProduct.addons.map((addon) => <span key={addon.name}>{addon.name} + Rs. {addon.price.toLocaleString()}</span>)}</div></div>}
            <div className="menu-product-dialog-footer"><div><strong>Rs. {selectedProduct.price.toLocaleString()}</strong><small>/ {selectedProduct.unit}</small></div><button type="button" className="button primary" onClick={() => { add(selectedProduct); setSelectedProduct(null); }} data-testid="menu-product-add">Add to my box <ShoppingBag size={16} /></button></div>
            <Link to="/build" className="menu-product-build-link" onClick={() => setSelectedProduct(null)}>Build a custom box instead <ArrowRight size={14} /></Link>
          </div>
        </section>
      </div>}
    </div>
  );
}
