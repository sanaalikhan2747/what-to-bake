import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronDown, Heart, House, Menu, MessageCircle, ShoppingBag, X } from "lucide-react";
import { useCart } from "@/state/CartContext";
import { api } from "@/state/api";
import "./Nav.css";

const orderOptions = [
  { label: "Advanced Order for Local Pick-Up", href: "/order/local-pickup" },
  { label: "Same-Day Pick-Up or Delivery", href: "/order/same-day" },
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

function NavDropdown({ id, label, heading, items, loading, className = "", pageHref, pageLinkLabel }) {
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
        {loading ? (
          <p className="nav-dropdown-message">Loading…</p>
        ) : items.length ? items.map((item) => (
          item.heading ? (
            <p className="nav-dropdown-category" key={item.heading}>{item.heading}</p>
          ) : (
            <Link key={item.key || item.label} to={item.href} onClick={closeDropdown}>
              {item.image && <img className="nav-dropdown-product-image" src={item.image} alt="" loading="lazy" />}
              <span>{item.label}</span>
              {item.detail && <small>{item.detail}</small>}
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          )
        )) : (
          <p className="nav-dropdown-message">Nothing to show right now.</p>
        )}
      </div>
    </details>
  );
}

export default function Nav({ onOpenChat }) {
  const { cartCount, setCartOpen } = useCart();
  const [products, setProducts] = useState([]);
  const [giftBoxes, setGiftBoxes] = useState([]);
  const [catalogueLoading, setCatalogueLoading] = useState(true);
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
      .then((response) => setProducts(response.data))
      .catch(() => {})
      .finally(() => setCatalogueLoading(false));
    api.get("/festive-boxes")
      .then((response) => setGiftBoxes(response.data))
      .catch(() => {});
  }, []);

  const productItems = products.flatMap((product, index) => {
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
  });

  const giftingItems = [
    ...giftBoxes.map((box) => ({
      key: box.id,
      label: box.name,
      href: `/festive/${box.id}`,
      detail: `From Rs. ${box.total.toLocaleString()}`,
    })),
    { key: "gift-box-builder", label: "Build a gift box", href: "/build" },
  ];

  return (
    <nav className={`nav ${mobileOpen ? "nav-mobile-open" : ""}`} aria-label="Main navigation">
      <button className="nav-mobile-toggle" aria-label={mobileOpen ? "Close navigation" : "Open navigation"} aria-expanded={mobileOpen} aria-controls="nav-links" onClick={() => setMobileOpen(!mobileOpen)}>
        {mobileOpen ? <X size={22} /> : <Menu size={22} />}
      </button>
      <Link to="/" className="brand" data-testid="brand-home" aria-label="SK Treats & Temptation home" title="Treats & Temptation home">
        <span className="brand-mark" aria-hidden="true"><span>SK</span><Heart className="brand-heart" size={12} /></span>
        <span className="brand-name"><span>Treats &</span><span>Temptation</span></span>
      </Link>
      <div id="nav-links" className="nav-links" onClick={(event) => {
        if (event.target.closest("a")) setMobileOpen(false);
      }}>
      <Link to="/" className="nav-home" aria-label="Go to home page" title="Home" data-testid="nav-home">
        <House size={16} />
        <span>Home</span>
      </Link>
      <NavDropdown id="order" label="Order" heading="ORDER OPTIONS" items={orderOptions.map((option) => ({ ...option, key: option.href }))} />
      <div className="nav-sections">
        <NavDropdown id="menu" label="Menu" heading="ALL BAKES" items={productItems} loading={catalogueLoading} pageHref="/menu" pageLinkLabel="View full menu" />
        <NavDropdown id="build" label="Build a box" heading="MAKE IT YOURS" items={[
          { label: "Build a custom box", href: "/build" },
          { label: "Browse the full menu", href: "/menu" },
        ]} />
        <NavDropdown id="gifting" label="Gifting" heading="READY-MADE GIFT BOXES" items={giftingItems} loading={catalogueLoading} />
        <NavDropdown id="match" label="Find your perfect match" heading="FIND YOUR BAKE" items={[
          { label: "Open the bake matchmaker", href: "/#match" },
          { label: "Browse every bake", href: "/menu" },
        ]} />
      </div>
      <NavDropdown id="about" label="About Us" heading="ABOUT US" items={aboutOptions.map((option) => ({ ...option, key: option.href }))} />
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
