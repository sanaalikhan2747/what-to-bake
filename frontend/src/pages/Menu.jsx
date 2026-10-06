import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ShoppingBag, WandSparkles } from "lucide-react";
import { api } from "@/state/api";
import { useCart } from "@/state/CartContext";

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
  const [products, setProducts] = useState([]);
  const [filter, setFilter] = useState("all");
  const { addItem, setCartOpen } = useCart();
  const location = useLocation();

  useEffect(() => {
    api.get("/products").then((r) => setProducts(r.data)).catch(() => setProducts([]));
  }, []);

  useEffect(() => {
    if (!location.hash || !products.length) return;
    const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (target) setTimeout(() => target.scrollIntoView({ behavior: "smooth", block: "center" }), 80);
  }, [location.hash, products.length]);

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
              <article className="menu-card" id={`product-${p.id}`} key={p.id} data-testid={`menu-item-${p.id}`}>
                <div className="menu-card-image">
                  <img src={p.image} alt={p.name} />
                  {p.healthy && <span className="pill-healthy">Healthy option</span>}
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
    </div>
  );
}
