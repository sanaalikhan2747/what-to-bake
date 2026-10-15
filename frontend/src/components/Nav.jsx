import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronDown, Heart, House, Menu, MessageCircle, ShoppingBag, X } from "lucide-react";
import { useCart } from "@/state/CartContext";
import { api } from "@/state/api";
import { CATALOGUE_PRODUCTS, CATALOGUE_FESTIVE_BOXES } from "@/state/catalogueData";
import "./Nav.css";

const orderOptions = [
  { label: "Advance Orders", href: "/order/local-pickup" },
  { label: "Same-Day Orders", href: "/order/same-day" },
  { label: "Corporate Catering", href: "/order/corporate-catering" },
  { label: "Corporate Gifting", href: "/order/corporate-gifting" },
  { label: "Celebrations & Events", href: "/order/celebrations" },
];
const aboutOptions = [
  { label: "Our Story", href: "/our-story" },
];

function closeDropdown(event) {
  event.currentTarget.closest("details").open = false;
}

function NavDropdown({ id, label, heading, items, loading, className = "", pageHref, pageLinkLabel, feature }) {
  const groups = [];
  items.forEach((item) => {
    if (item.heading) groups.push({ heading: item.heading, items: [] });
    else {
      if (!groups.length) groups.push({ heading: null, items: [] });
      groups[groups.length - 1].items.push(item);
    }
  });
  return (
    <details
      className={`nav-dropdown ${className}`}
      data-testid={`nav-${id}`}
    >
      <summary
        className="nav-dropdown-trigger"
        aria-label={`Open ${label} menu`}
        onClick={(event) => {
          const currentDropdown = event.currentTarget.parentElement;
          if (!currentDropdown.open) {
            currentDropdown.closest(".nav").querySelectorAll("details[open]").forEach((dropdown) => {
              if (dropdown !== currentDropdown) dropdown.open = false;
            });
          }
        }}
      >
        {label} <ChevronDown size={15} aria-hidden="true" />
      </summary>
      <div className={`nav-dropdown-menu ${id === "menu" ? "nav-dropdown-menu-catalogue" : ""}`}>
        {pageHref ? (
          <div className="nav-dropdown-heading-row">
            <p className="nav-dropdown-heading">{heading}</p>
            <Link to={pageHref} className="nav-dropdown-all-link" onClick={closeDropdown}>
              {pageLinkLabel || "View all"} <ArrowRight size={13} aria-hidden="true" />
            </Link>
          </div>
        ) : <p className="nav-dropdown-heading">{heading}</p>}
        <div className={`nav-mega-body ${id === "menu" ? "nav-mega-catalogue" : ""}`}>
        {loading ? (
          <p className="nav-dropdown-message">Loading…</p>
        ) : items.length ? groups.map((group, index) => (
          <div className="nav-mega-column" key={group.heading || index}>
            {group.heading && <p className="nav-dropdown-category">{group.heading}</p>}
            <div className="nav-mega-links">
            {group.items.map((item) => (
            <Link key={item.key || item.label} to={item.href} onClick={closeDropdown}>
              {item.image && <img className="nav-dropdown-product-image" src={item.image} alt="" loading="lazy" />}
              <span>{item.label}</span>
              {item.detail && <small>{item.detail}</small>}
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
            ))}
            </div>
          </div>
        )) : (
          <p className="nav-dropdown-message">Nothing to show right now.</p>
        )}
        {feature && id !== "menu" && <Link to={feature.href} className="nav-mega-feature" onClick={closeDropdown}>
          <img src={feature.image} alt={feature.label} loading="lazy" />
          <span>{feature.label} <ArrowRight size={18} aria-hidden="true" /></span>
        </Link>}
        </div>
      </div>
    </details>
  );
}

export default function Nav({ onOpenChat }) {
  const { cartCount, setCartOpen } = useCart();
  const [products, setProducts] = useState(CATALOGUE_PRODUCTS);
  const [giftBoxes, setGiftBoxes] = useState(CATALOGUE_FESTIVE_BOXES);
  const [catalogueLoading, setCatalogueLoading] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const closeMenus = (event) => {
      const nav = document.querySelector(".nav");
      if (event.type === "keydown" && event.key !== "Escape") return;
      if (event.type === "pointerdown" && nav?.contains(event.target)) return;
      nav?.querySelectorAll("details[open]").forEach((dropdown) => { dropdown.open = false; });
      setMobileOpen(false);
    };
    document.addEventListener("pointerdown", closeMenus);
    document.addEventListener("keydown", closeMenus);
    return () => {
      document.removeEventListener("pointerdown", closeMenus);
      document.removeEventListener("keydown", closeMenus);
    };
  }, []);

  useEffect(() => {
    api.get("/products")
      .then((response) => {
        if (Array.isArray(response.data) && response.data.length > 0) {
          setProducts(response.data);
        }
      })
      .catch(() => {})
      .finally(() => setCatalogueLoading(false));
    api.get("/festive-boxes")
      .then((response) => {
        if (Array.isArray(response.data) && response.data.length > 0) {
          setGiftBoxes(response.data);
        }
      })
      .catch(() => {});
  }, []);

  const productItems = Array.isArray(products)
    ? products.flatMap((product, index) => {
        const previousCategory = index > 0 ? products[index - 1].category : null;
        const categoryHeading = product.category !== previousCategory
          ? [{ heading: ({ loaf: "LOAVES", cheesecake: "DESSERTS", batch: "BATCHES", cookie: "COOKIES" })[product.category] || product.category.toUpperCase() }]
          : [];
        return [
          ...categoryHeading,
          {
            key: product.id,
            label: product.name,
            href: `/menu#product-${product.id}`,
            detail: `Rs. ${product.price.toLocaleString()}`,
            image: product.image,
          },
        ];
      })
    : [];

  const giftingItems = [
    ...(Array.isArray(giftBoxes) ? giftBoxes.map((box) => ({
      key: box.id,
      label: box.name,
      href: `/festive/${box.id}`,
      detail: `From Rs. ${box.total.toLocaleString()}`,
    })) : []),
    { key: "gift-box-builder", label: "Custom Gift Box", href: "/build" },
  ];

  const feature = Array.isArray(products) && products[0]
    ? { image: products[0].image, label: "View Full Menu", href: "/menu" }
    : null;

  return (
    <nav className={`nav ${mobileOpen ? "nav-mobile-open" : ""}`} aria-label="Main navigation">
      <button className="nav-mobile-toggle" aria-label={mobileOpen ? "Close navigation" : "Open navigation"} aria-expanded={mobileOpen} aria-controls="nav-links" onClick={() => setMobileOpen(!mobileOpen)}>
        {mobileOpen ? <X size={22} /> : <Menu size={22} />}
      </button>
      <Link to="/" className="brand" data-testid="brand-home" aria-label="Treats & Temptation home" title="Treats & Temptation home">
        <span className="brand-mark bakery-emblem" aria-hidden="true">
          <svg className="bakery-emblem-pastry" width="27" height="27" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M7 19h18l-3 10H10Z" fill="#f7d8b5" />
            <path d="m13 22 1 5m5-5-1 5" />
            <path d="M7 19c-4-2-2-7 2-7-1-4 3-6 6-5 1-2 3-3 4-3 0 3 4 4 4 8 4 0 6 5 2 7Z" fill="#f5b9cf" />
            <path d="M10 13c3 2 9 2 12 0" />
          </svg>
          <Heart className="bakery-emblem-heart" size={11} />
        </span>
        <span className="bakery-name"><span>Treats &</span><span>Temptation</span></span>
      </Link>
      <div id="nav-links" className="nav-links" onClick={(event) => {
        if (event.target.closest("a")) setMobileOpen(false);
      }}>
      <Link to="/" className="nav-home" aria-label="Go to home page" title="Home" data-testid="nav-home">
        <House size={16} />
        <span>Home</span>
      </Link>
      <NavDropdown id="order" label="Order" heading="ORDER OPTIONS" items={orderOptions.map((option) => ({ ...option, key: option.href }))} feature={feature} />
      <div className="nav-sections">
        <NavDropdown id="menu" label="Menu" heading="ALL BAKES" items={productItems} loading={catalogueLoading} pageHref="/menu" pageLinkLabel="View full menu" />
        <NavDropdown id="build" label="Build a box" heading="MAKE IT YOURS" feature={feature} items={[
          { label: "Build a custom box", href: "/build" },
          { label: "Browse the full menu", href: "/menu" },
        ]} />
        <NavDropdown id="gifting" label="Gifting" heading="READY-MADE GIFT BOXES" items={giftingItems} loading={catalogueLoading} feature={feature} />
        <NavDropdown id="match" label="Find your perfect match" heading="FIND YOUR BAKE" feature={feature} items={[
          { label: "Open the bake matchmaker", href: "/#match" },
          { label: "Browse every bake", href: "/menu" },
        ]} />
      </div>
      <NavDropdown id="about" label="About Us" heading="ABOUT US" items={aboutOptions.map((option) => ({ ...option, key: option.href }))} feature={feature} />
      </div>
      <div className="nav-actions">
      <button className="icon-button" onClick={onOpenChat} data-testid="open-baker-chat" aria-label="Open baker chat" title="Baker chat">
        <MessageCircle size={21} />
      </button>
      <button className="cart-pill" onClick={() => setCartOpen(true)} data-testid="cart-button" aria-label="Open cart" title="Cart">
        <ShoppingBag size={18} />
        <span data-testid="cart-count">{cartCount}</span>
      </button>
      </div>
    </nav>
  );
}
