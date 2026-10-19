import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight, Link2, MessageCircle, Minus, Plus, ShoppingBag, Sparkles, WandSparkles } from "lucide-react";
import { api } from "@/state/api";
import { CATALOGUE_PRODUCTS, CATALOGUE_FESTIVE_BOXES } from "@/state/catalogueData";
import { useCart } from "@/state/CartContext";
import { findMatches, getProductServes } from "@/state/matchmaker";
import "./Home.css";
import "./HomePolish.css";
import "./MagnoliaCarousel.css";

const occasions = [
  { value: "Birthday", label: "Birthday", detail: "Celebrations" },
  { value: "Anniversary", label: "Anniversary", detail: "Milestones" },
  { value: "Tea party", label: "Tea & Coffee", detail: "Afternoons" },
  { value: "Family gathering", label: "Family Gathering", detail: "Sharing" },
  { value: "Graduation", label: "Milestone", detail: "Achievements" },
  { value: "Eid", label: "Eid", detail: "Festive" },
  { value: "Baby born", label: "New Arrival", detail: "Welcome" },
  { value: "Gift", label: "Gift", detail: "Thoughtful" },
  { value: "Just craving something", label: "Everyday Treat", detail: "Indulgence" },
];
const moods = [
  { value: "Chocolate lover", label: "Chocolate", detail: "Rich & indulgent", color: "#75514b" },
  { value: "Fresh & citrusy", label: "Citrus & Fruit", detail: "Bright & refreshing", color: "#cf9d4c" },
  { value: "Warm & comforting", label: "Warm Spices", detail: "Comforting & aromatic", color: "#b97759" },
  { value: "Coffee lover", label: "Coffee", detail: "Toasty & balanced", color: "#83705a" },
  { value: "Something different", label: "Baker's Choice", detail: "Unique & distinctive", color: "#7b8a70" },
];
const featuredCategories = [
  { id: "loaf", label: "Loaves" },
  { id: "cheesecake", label: "Dessert Boxes" },
  { id: "batch", label: "Bakes & Cups" },
  { id: "cookie", label: "Cookies" },
];
const heroSlides = [
  {
    src: "https://res.cloudinary.com/dffsqfwok/image/upload/v1790758951/Commercial_bakery_products_on_ta__2K_20260930140220_ggjrdi.jpg",
    alt: "Artisanal bakery spread with freshly baked loaves and treats",
    eyebrow: "ARTISANAL BAKERY · LAHORE",
    heading: "Freshly baked",
    accent: "from scratch.",
    description: "Small-batch tea loaves, signature brownies, and decadent cakes handcrafted with pure butter and timeless artisanal recipes.",
    action: "Explore Full Menu",
    href: "/menu",
    secondaryAction: "Advance Pre-Order",
    secondaryHref: "/order/local-pickup",
    position: "center",
  },
  {
    src: "https://res.cloudinary.com/n9pu62pg/image/upload/v1790870752/image_6ac914dd.jpg",
    alt: "Freshly baked moist Choco Chip Banana Bread",
    eyebrow: "DAILY FRESH BAKE · SAME-DAY DISPATCH",
    heading: "Craving warm banana bread?",
    accent: "Baked fresh today.",
    description: "Our signature moist Banana Bread is baked fresh daily in Lahore. Order before daily batch limits close for same-day delivery or pickup.",
    action: "Order Same-Day Loaf",
    href: "/order/same-day",
    secondaryAction: "View Banana Bread",
    secondaryHref: "/menu#cat-loaf",
    position: "center 42%",
  },
  {
    src: CATALOGUE_PRODUCTS.find((product) => product.id === "cinnamon-rolls-batch")?.image || "https://res.cloudinary.com/dffsqfwok/image/upload/v1790778866/WhatsApp_Image_2026-09-30_at_14.22.37.jpeg_2K_20260930193407_k7nfcn.jpg",
    alt: "Gooey frosted Cinnamon Rolls and dessert boxes",
    eyebrow: "MADE FOR GATHERING & SHARING",
    heading: "Dessert boxes &",
    accent: "signature bakes.",
    description: "From morning tea party loaves to rich tiramisu tubs and gooey frosted cinnamon rolls, pre-ordered 24 hours in advance.",
    action: "Browse Dessert Boxes",
    href: "/menu#cat-cheesecake",
    secondaryAction: "Build a Box",
    secondaryHref: "/build",
    position: "center",
  },
  {
    src: "https://res.cloudinary.com/n9pu62pg/image/upload/c_crop,x_0,y_120,w_1700,h_1416/v1791141497/Gemini_Generated_Image_jh3tl4jh3tl4jh3t.jpg",
    alt: "Thoughtfully packaged bakery gift box with brownies and sweets",
    eyebrow: "CUSTOM & CELEBRATION GIFTING",
    heading: "Thoughtfully packaged",
    accent: "for every occasion.",
    description: "Curated bakery boxes with satin ribbons and personalized cards for birthdays, anniversaries, corporate gifts, and celebrations.",
    action: "Build Your Gift Box",
    href: "/build",
    secondaryAction: "Corporate Gifting",
    secondaryHref: "/order/corporate-gifting",
    position: "center",
  },
];
function slug(x) { return x.toLowerCase().replaceAll(" ", "-").replaceAll("&", "and"); }

export default function Home() {
  const [products, setProducts] = useState(CATALOGUE_PRODUCTS);
  const [loaves, setLoaves] = useState(CATALOGUE_PRODUCTS.filter((p) => p.category === "loaf"));
  const [boxes, setBoxes] = useState(CATALOGUE_FESTIVE_BOXES);
  const [featuredCategory, setFeaturedCategory] = useState("loaf");
  const [heroSlide, setHeroSlide] = useState(0);
  const [isHeroPaused, setIsHeroPaused] = useState(false);
  const touchStartXRef = useRef(null);
  const featuredRailRef = useRef(null);
  const [matchCategory, setMatchCategory] = useState("all");
  const [occasion, setOccasion] = useState("");
  const [mood, setMood] = useState("");
  const [people, setPeople] = useState(6);
  const [budget, setBudget] = useState(1500);
  const [dietary, setDietary] = useState("No preference");
  const [match, setMatch] = useState(null);
  const [matchOptions, setMatchOptions] = useState([]);
  const [matchError, setMatchError] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedNote, setSavedNote] = useState("");
  const location = useLocation();
  const { addItem, setCartOpen } = useCart();

  useEffect(() => {
    api.get("/products").then((r) => {
      if (Array.isArray(r.data) && r.data.length > 0) {
        setProducts(r.data);
        setLoaves(r.data.filter((p) => p.category === "loaf"));
      }
    }).catch(() => {});
    api.get("/festive-boxes").then((r) => {
      if (Array.isArray(r.data) && r.data.length > 0) {
        setBoxes(r.data);
      }
    }).catch(() => {});
    const params = new URLSearchParams(window.location.search);
    const savedId = params.get("match");
    if (savedId) {
      const directMatch = CATALOGUE_PRODUCTS.find((p) => p.id === savedId);
      if (directMatch) {
        setMatch({
          product: directMatch,
          explanation: `${directMatch.name} — a special bake hand-picked for your celebration.`,
        });
        setMatchOptions([directMatch]);
        setTimeout(() => document.getElementById("match-result")?.scrollIntoView({ behavior: "smooth" }), 300);
      } else {
        api.get(`/match/${savedId}`).then((r) => {
          if (r?.data?.product?.id) {
            setMatch({ product: r.data.product, explanation: r.data.explanation });
            const opts = Array.isArray(r.data.options) && r.data.options.length ? r.data.options : [r.data.product];
            setMatchOptions(opts);
            setTimeout(() => document.getElementById("match-result")?.scrollIntoView({ behavior: "smooth" }), 300);
          }
        }).catch(() => {});
      }
    }
  }, []);

  useEffect(() => {
    if (location.hash) {
      const el = document.querySelector(location.hash);
      if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth" }), 80);
    }
  }, [location]);

  useEffect(() => {
    if (isHeroPaused) return;
    const timer = window.setInterval(() => {
      setHeroSlide((current) => (current + 1) % heroSlides.length);
    }, 5500);
    return () => window.clearInterval(timer);
  }, [isHeroPaused]);

  const prevHeroSlide = () => {
    setHeroSlide((current) => (current + heroSlides.length - 1) % heroSlides.length);
  };

  const nextHeroSlide = () => {
    setHeroSlide((current) => (current + 1) % heroSlides.length);
  };

  const handleTouchStart = (e) => {
    if (e.touches && e.touches[0]) {
      touchStartXRef.current = e.touches[0].clientX;
    }
  };

  const handleTouchEnd = (e) => {
    if (touchStartXRef.current === null || !e.changedTouches || !e.changedTouches[0]) return;
    const diff = touchStartXRef.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        setHeroSlide((current) => (current + 1) % heroSlides.length);
      } else {
        setHeroSlide((current) => (current + heroSlides.length - 1) % heroSlides.length);
      }
    }
    touchStartXRef.current = null;
  };

  const runMatch = async () => {
    setLoading(true); setMatchError(""); setSavedNote("");
    const numericPeople = Number(people) || 6;
    const numericBudget = Number(budget) || 1500;
    const cataloguePool = (products && products.length) ? products : CATALOGUE_PRODUCTS;

    // Immediately calculate whole-menu match client-side so customer never experiences delay or failure
    const instantResult = findMatches(cataloguePool, {
      occasion,
      mood,
      people: numericPeople,
      budget: numericBudget,
      dietary,
      category: matchCategory,
    });

    if (instantResult?.product) {
      setMatch({ product: instantResult.product, explanation: instantResult.explanation });
      setMatchOptions(instantResult.options?.length ? instantResult.options : [instantResult.product]);
      setTimeout(() => document.getElementById("match-result")?.scrollIntoView({ behavior: "smooth" }), 60);
    }

    try {
      const r = await api.post("/match", {
        occasion, mood, people: numericPeople, budget: numericBudget, dietary, category: matchCategory,
      });
      if (r?.data?.product?.id) {
        setMatch({ product: r.data.product, explanation: r.data.explanation });
        const opts = Array.isArray(r.data.options) && r.data.options.length ? r.data.options : [r.data.product];
        setMatchOptions(opts);
      }
    } catch {
      // Backend is optional/offline; client match is already seamlessly displayed
    } finally {
      setLoading(false);
    }
  };

  const surprise = () => {
    const cataloguePool = (products && products.length) ? products : CATALOGUE_PRODUCTS;
    const pool = matchCategory === "all" ? cataloguePool : cataloguePool.filter((p) => p.category === matchCategory);
    const activePool = pool.length ? pool : cataloguePool;
    const picked = activePool[Math.floor(Math.random() * activePool.length)];
    const otherPicks = activePool.filter((p) => p.id !== picked.id).sort(() => 0.5 - Math.random()).slice(0, 3);
    const surpriseCategoryLabel = {
      loaf: "loaf",
      cheesecake: "dessert box",
      batch: "bake",
      cookie: "cookie treat",
    }[picked.category] || "bake";
    setMatch({
      product: picked,
      explanation: `${picked.name} — a little baker's instinct says this is the ${surpriseCategoryLabel} you didn't know you were craving.`,
    });
    setMatchOptions([picked, ...otherPicks]);
    setSavedNote("");
    setTimeout(() => document.getElementById("match-result")?.scrollIntoView({ behavior: "smooth" }), 60);
    return picked;
  };

  const selectAlternativeMatch = (opt) => {
    const servesInfo = getProductServes(opt);
    const catLabel = {
      loaf: "loaf",
      cheesecake: "dessert box",
      batch: "bake",
      cookie: "cookie treat",
    }[opt.category] || "bake";
    setMatch({
      product: opt,
      explanation: `${opt.name} — a lovely ${catLabel} pick for your ${occasion.toLowerCase()} gathering. Serves ${servesInfo.text} and fits right into your Rs. ${Number(budget || 1500).toLocaleString()} budget.`,
    });
    setSavedNote("");
    setTimeout(() => document.getElementById("match-result")?.scrollIntoView({ behavior: "smooth" }), 60);
  };

  const saveMatch = async () => {
    if (!match?.product || saving) return;
    setSaving(true); setSavedNote("");
    const directUrl = `${window.location.origin}/?match=${match.product.id}`;
    try {
      const r = await api.post("/match/save", {
        product_id: match.product.id, occasion, mood, people,
        budget: Number(budget) || 0, dietary, explanation: match.explanation,
      });
      const url = r?.data?.id ? `${window.location.origin}/?match=${r.data.id}` : directUrl;
      try {
        await navigator.clipboard.writeText(url);
        setSavedNote("Link copied — paste it anywhere to come back to this bake.");
      } catch {
        setSavedNote(url);
      }
    } catch {
      try {
        await navigator.clipboard.writeText(directUrl);
        setSavedNote("Link copied — paste it anywhere to come back to this bake.");
      } catch {
        setSavedNote(directUrl);
      }
    } finally {
      setSaving(false);
    }
  };

  const addMatchToCart = () => {
    if (!match) return;
    addItem({ id: match.product.id, name: match.product.name, price: match.product.price, image: match.product.image, custom_box: false });
    setCartOpen(true);
  };

  const addProductToCart = (product) => {
    addItem({ id: product.id, name: product.name, price: product.price, image: product.image, custom_box: false });
    setCartOpen(true);
  };

  const scrollFeaturedRail = (direction) => {
    const rail = featuredRailRef.current;
    if (rail) rail.scrollBy({ left: direction * rail.clientWidth * 0.78, behavior: "smooth" });
  };

  const productGroups = (featuredCategory === "all"
    ? featuredCategories.filter((category) => category.id !== "all")
    : featuredCategories.filter((category) => category.id === featuredCategory)
  ).map((category) => ({
    ...category,
    products: products.filter((product) => product.category === category.id),
  })).filter((group) => group.products.length > 0);
  const featuredProducts = productGroups.flatMap((group) => group.products.map((product, index) => ({
    product,
    index,
    categoryIndex: featuredCategories.findIndex((category) => category.id === group.category),
  }))).sort((first, second) => first.index - second.index || first.categoryIndex - second.categoryIndex)
    .slice(0, 6)
    .map(({ product }) => product);
  const visibleProductGroups = productGroups.map((group) => ({
    ...group,
    products: group.products.filter((product) => featuredProducts.some((featured) => featured.id === product.id)),
  })).filter((group) => group.products.length > 0);

  const addFestive = (box) => {
    box.items.forEach(({ product, qty }) => {
      addItem({ id: product.id, name: product.name, price: product.price, image: product.image, custom_box: false, qty });
    });
    setCartOpen(true);
  };

  return (
    <>
      <section
        className="hero magnoliabakery-carousel"
        role="region"
        aria-roledescription="carousel"
        aria-label="Bakery showcase carousel"
        onMouseEnter={() => setIsHeroPaused(true)}
        onMouseLeave={() => setIsHeroPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="hero-carousel-track">
          {heroSlides.map((slide, index) => {
            const isActive = heroSlide === index;
            return (
              <div
                key={slide.src || index}
                className={`hero-carousel-slide ${isActive ? "active" : ""}`}
                aria-hidden={!isActive}
              >
                {/* Full-bleed Bakery Backdrop with Magnolia warm vignette */}
                <div className="hero-slide-media">
                  <img
                    src={slide.src}
                    alt={slide.alt}
                    className="hero-slide-img"
                    loading={index === 0 ? "eager" : "lazy"}
                    data-testid={isActive ? "hero-dessert-image" : undefined}
                    style={{ objectPosition: slide.position || "center" }}
                  />
                  <div className="hero-slide-scrim" />
                </div>

                {/* Magnolia-Style Frosted Editorial Content Card */}
                <div className="hero-content-bounds">
                  <div className="hero-editorial-card">
                    <p className="hero-kicker">
                      <Sparkles size={12} className="hero-kicker-sparkle" />
                      <span>{slide.eyebrow}</span>
                    </p>
                    <h1 className="hero-heading">
                      <span>{slide.heading}</span>
                      <em>{slide.accent}</em>
                    </h1>
                    <p className="hero-description">{slide.description}</p>
                    <div className="hero-actions">
                      <Link
                        to={slide.href}
                        className="button primary hero-primary-btn"
                        data-testid={isActive ? "hero-find-bake" : undefined}
                      >
                        {slide.action} <ArrowRight size={17} />
                      </Link>
                      <Link
                        to={slide.secondaryHref || "/build"}
                        className="button hero-secondary-btn"
                        data-testid={isActive ? "hero-build-box" : undefined}
                      >
                        <WandSparkles size={16} /> {slide.secondaryAction || "Build a box"}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Magnolia Floating Circular Navigation Arrows */}
        <button
          type="button"
          className="hero-arrow-btn hero-arrow-prev"
          aria-label="Previous slide"
          onClick={prevHeroSlide}
        >
          <ChevronLeft size={22} />
        </button>
        <button
          type="button"
          className="hero-arrow-btn hero-arrow-next"
          aria-label="Next slide"
          onClick={nextHeroSlide}
        >
          <ChevronRight size={22} />
        </button>

        {/* Magnolia Bottom Indicator Capsule */}
        <div className="hero-controls-capsule" role="group" aria-label="Slide indicators">
          <div className="hero-indicator-pills">
            {heroSlides.map((slide, index) => (
              <button
                key={slide.src || index}
                type="button"
                className={`hero-indicator-pill ${heroSlide === index ? "active" : ""}`}
                aria-label={`Go to slide ${index + 1}: ${slide.heading} ${slide.accent}`}
                aria-pressed={heroSlide === index}
                onClick={() => setHeroSlide(index)}
              />
            ))}
          </div>
          <span className="hero-counter-label" aria-hidden="true">
            {String(heroSlide + 1).padStart(2, "0")} / {String(heroSlides.length).padStart(2, "0")}
          </span>
        </div>
      </section>

      <Link className="home-order-float" to="/order/local-pickup" data-testid="home-plan-order">
        <ShoppingBag size={18} aria-hidden="true" />
        Plan your order <ArrowRight size={18} aria-hidden="true" />
      </Link>

      <section className="featured-products" aria-labelledby="featured-products-title">
        <div className="featured-products-heading">
          <div>
            <p className="eyebrow">OUR SPECIALITIES</p>
            <h2 id="featured-products-title">Signature Bakes</h2>
            <p>Handcrafted daily in small batches with premium ingredients.</p>
          </div>
          <Link to="/menu" className="featured-menu-link">Explore Menu <ArrowRight size={16} /></Link>
        </div>
        <div className="featured-tabs" role="group" aria-label="Filter all bakes">
          {featuredCategories.map((category) => (
            <button
              key={category.id}
              type="button"
              className={featuredCategory === category.id ? "featured-tab active" : "featured-tab"}
              aria-pressed={featuredCategory === category.id}
              onClick={() => setFeaturedCategory(category.id)}
              data-testid={`featured-filter-${category.id}`}
            >
              {category.label}
            </button>
          ))}
        </div>
        <div className="featured-groups">
          {visibleProductGroups.map((group, groupIndex) => (
            <section className="featured-category-group" key={group.id} aria-labelledby={`featured-category-${group.id}`}>
              <div className="featured-category-heading">
                <span>{String(groupIndex + 1).padStart(2, "0")}</span>
                <h3 id={`featured-category-${group.id}`}>{group.label}</h3>
                <i />
                <small>{group.products.length} {group.products.length === 1 ? "bake" : "bakes"}</small>
                <div className="featured-rail-controls" role="group" aria-label="Browse featured bakes">
                  <button type="button" onClick={() => scrollFeaturedRail(-1)} aria-label="Scroll featured bakes left"><ChevronLeft size={17} /></button>
                  <button type="button" onClick={() => scrollFeaturedRail(1)} aria-label="Scroll featured bakes right"><ChevronRight size={17} /></button>
                </div>
              </div>
              <div className="featured-grid" ref={featuredRailRef}>
                {group.products.map((product, index) => (
                  <article className="featured-card" key={product.id} data-testid={`featured-product-${product.id}`}>
                    <Link to={`/menu#product-${product.id}`} className="featured-card-image" aria-label={`Browse menu: ${product.name}`}>
                      <img src={product.image} alt={product.name} loading="lazy" />
                      <span className="featured-card-index">{String(index + 1).padStart(2, "0")}</span>
                    </Link>
                    <div className="featured-card-copy">
                      <h4>{product.name}</h4>
                      <p className="featured-card-story">{product.story}</p>
                      <div className="featured-card-footer">
                        <span>Rs. {product.price.toLocaleString()} <small>/ {product.unit}</small></span>
                        <button type="button" className="featured-add" onClick={() => addProductToCart(product)} aria-label={`Add ${product.name} to bag`}>
                          <ShoppingBag size={16} />
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>

      <section className="match-section" id="match">
        <div className="match-heading-row">
          <div className="section-intro">
            <p className="eyebrow">CURATED RECOMMENDATIONS</p>
            <h2>Bake Matchmaker</h2>
            <p>Select your preferences for a personalized menu recommendation.</p>
          </div>
          <button type="button" className="match-surprise-button" onClick={surprise} aria-label="Surprise bake recommendation" data-testid="match-mascot-surprise">
            <Sparkles size={20} aria-hidden="true" />
            <span className="match-surprise-copy">
              <small>QUICK RECOMMENDATION</small>
              <b>Surprise Me</b>
              <span>Baker's instinct <Sparkles size={12} aria-hidden="true" /></span>
            </span>
            <ArrowRight className="match-surprise-arrow" size={16} aria-hidden="true" />
          </button>
        </div>
        <div className="match-form">
          <div className="question">
            <label>Bake Category</label>
            <div className="choice-grid category-choice-grid">
              {[
                { id: "all", label: "Whole Menu" },
                { id: "loaf", label: "Loaves" },
                { id: "cheesecake", label: "Dessert Boxes" },
                { id: "batch", label: "Bakes & Cups" },
                { id: "cookie", label: "Cookies" },
              ].map((choice) => (
                <button
                  key={choice.id}
                  type="button"
                  className={matchCategory === choice.id ? "choice active" : "choice"}
                  aria-pressed={matchCategory === choice.id}
                  onClick={() => setMatchCategory(choice.id)}
                  data-testid={`match-category-${choice.id}`}
                >
                  <span className="choice-title">{choice.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="question">
            <label>Occasion</label>
            <div className="choice-grid occasion-choice-grid">
              {occasions.map((choice) => (
                <button type="button" className={occasion === choice.value ? "choice active" : "choice"} aria-pressed={occasion === choice.value} onClick={() => setOccasion(choice.value)} data-testid={`occasion-${slug(choice.value)}`} key={choice.value}>
                  <span className="choice-title">{choice.label}</span>
                  <small>{choice.detail}</small>
                </button>
              ))}
            </div>
          </div>
          <div className="question">
            <label>Flavour Profile</label>
            <div className="choice-grid mood-choice-grid">
              {moods.map((choice) => (
                <button type="button" className={mood === choice.value ? "choice mood-choice active" : "choice mood-choice"} aria-pressed={mood === choice.value} onClick={() => setMood(choice.value)} data-testid={`mood-${slug(choice.value)}`} key={choice.value}>
                  <span className="mood-choice-title"><i style={{ "--mood-swatch": choice.color }} />{choice.label}</span>
                  <small>{choice.detail}</small>
                </button>
              ))}
            </div>
          </div>
          <div className="split-questions">
            <div className="question">
              <label>Guests / Servings</label>
              <div className="stepper">
                <button onClick={() => setPeople(Math.max(1, people - 1))} data-testid="people-minus"><Minus size={15} /></button>
                <strong data-testid="people-count">{people}</strong>
                <button onClick={() => setPeople(people + 1)} data-testid="people-plus"><Plus size={15} /></button>
              </div>
            </div>
            <div className="question">
              <label>Budget (PKR)</label>
              <div className="budget-input">
                <span>Rs.</span>
                <input value={budget} onChange={(e) => setBudget(e.target.value)} data-testid="budget-input" />
              </div>
            </div>
          </div>
          <div className="question">
            <label>Dietary Requirements</label>
            <select value={dietary} onChange={(e) => setDietary(e.target.value)} data-testid="dietary-select">
              <option>No preference</option>
              <option>Eggless</option>
              <option>Less sweet</option>
              <option>Sugar-free</option>
              <option>Gluten conscious</option>
            </select>
          </div>
          {matchError && <p className="inline-error" data-testid="match-error">{matchError}</p>}
          <button className="button primary wide" onClick={runMatch} disabled={loading || !occasion || !mood} data-testid="find-match-button">
            {loading ? "Finding matches…" : <>Find My Match <ArrowRight size={17} /></>}
          </button>
        </div>
      </section>

      {match && (
        <section className="result-section" id="match-result">
          <div className="result-card">
            <div className="result-image">
              <img src={match.product.image} alt={match.product.name} data-testid="match-product-image" />
              <span>CURATED MATCH</span>
            </div>
            <div className="result-copy">
              <p className="eyebrow">RECOMMENDATION</p>
              <h2 data-testid="match-product-name">{match.product.name}</h2>
              <p className="result-description" data-testid="match-explanation">{match.explanation}</p>
              <p className="story">"{match.product.story}"</p>
              {match.product.addons?.length > 0 && (
                <p className="addon-note" data-testid="match-addons">
                  Add-on: {match.product.addons.map((a) => `${a.name} (+Rs. ${a.price})`).join(", ")}
                </p>
              )}
              <div className="result-meta">
                <span>Serves {getProductServes(match.product).text}</span>
                <b>Rs. {match.product.price.toLocaleString()}</b>
              </div>
              <div className="result-actions">
                <button className="button primary" onClick={addMatchToCart} data-testid="add-match-to-cart">
                  Add to Cart <ShoppingBag size={17} />
                </button>
                <button className="button ghost" onClick={saveMatch} disabled={saving} data-testid="save-match-button">
                  {saving ? "Saving…" : <>Share Link <Link2 size={16} /></>}
                </button>
              </div>
              {savedNote && <p className="saved-note" data-testid="saved-note">{savedNote}</p>}
            </div>
          </div>

          {matchOptions.filter((opt) => opt.id !== match.product.id).length > 0 && (
            <div className="match-alternatives-container" data-testid="match-alternatives">
              <div className="match-alternatives-heading">
                <p className="eyebrow">MORE OPTIONS</p>
                <h3>Other Recommended Bakes</h3>
                <p>Handpicked alternatives matching your preferences.</p>
              </div>
              <div className="match-alternatives-grid">
                {matchOptions
                  .filter((opt) => opt.id !== match.product.id)
                  .map((opt) => {
                    const categoryLabel = {
                      loaf: "Loaf",
                      cheesecake: "Dessert Box",
                      batch: "Bakes & Cups",
                      cookie: "Cookie",
                    }[opt.category] || "Bake";
                    const servesInfo = getProductServes(opt);
                    return (
                      <article className="match-alt-card" key={opt.id} data-testid={`match-alt-${opt.id}`}>
                        <div className="match-alt-image-wrap">
                          <img src={opt.image} alt={opt.name} loading="lazy" />
                          <span className="match-alt-badge">{categoryLabel}</span>
                        </div>
                        <div className="match-alt-copy">
                          <div className="match-alt-header">
                            <h4>{opt.name}</h4>
                            <b>Rs. {opt.price.toLocaleString()}</b>
                          </div>
                          <p className="match-alt-story">{opt.story}</p>
                          <div className="match-alt-footer">
                            <span className="match-alt-serves">Serves {servesInfo.text}</span>
                            <div className="match-alt-actions">
                              <button
                                type="button"
                                className="button ghost small"
                                onClick={() => selectAlternativeMatch(opt)}
                                data-testid={`match-alt-select-${opt.id}`}
                              >
                                View note
                              </button>
                              <button
                                type="button"
                                className="featured-add"
                                onClick={() => addProductToCart(opt)}
                                aria-label={`Add ${opt.name} to box`}
                                data-testid={`match-alt-add-${opt.id}`}
                              >
                                <ShoppingBag size={15} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
              </div>
            </div>
          )}
        </section>
      )}

      <section className="festive-section" id="festive">
        <div className="festive-heading">
          <p className="eyebrow">GIFTING</p>
          <h2>Curated Gift Boxes</h2>
          <p>Artisanal gift boxes for celebrations and thoughtful gifting.</p>
        </div>
        <div className="festive-grid">
          {boxes.map((box) => (
            <article className="festive-card" key={box.id} data-testid={`festive-${box.id}`}>
              <div className="festive-image">
                <img src={box.image} alt={box.name} />
              </div>
              <div className="festive-body">
                <h3>{box.name}</h3>
                <p className="festive-tagline">{box.tagline}</p>
                <ul className="festive-items">
                  {box.items.map(({ product, qty }) => (<li key={product.id}>{qty}× {product.name}</li>))}
                </ul>
                <div className="festive-footer">
                  <b>from Rs. {box.total.toLocaleString()}</b>
                  <div className="festive-actions">
                    <Link className="button primary small" to={`/festive/${box.id}`} data-testid={`festive-customize-${box.id}`}>
                      Customize <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

    </>
  );
}
