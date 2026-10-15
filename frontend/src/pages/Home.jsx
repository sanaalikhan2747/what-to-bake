import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight, Link2, MessageCircle, Minus, Plus, ShoppingBag, Sparkles, WandSparkles } from "lucide-react";
import { api } from "@/state/api";
import { CATALOGUE_PRODUCTS, CATALOGUE_FESTIVE_BOXES } from "@/state/catalogueData";
import { useCart } from "@/state/CartContext";
import { findMatches, getProductServes } from "@/state/matchmaker";
import "./Home.css";
import "./HomePolish.css";

const occasions = [
  { value: "Birthday", label: "A birthday", detail: "For a day worth celebrating" },
  { value: "Anniversary", label: "An anniversary", detail: "Celebrate a special date" },
  { value: "Tea party", label: "Tea with friends", detail: "Something for the table" },
  { value: "Family gathering", label: "A family gathering", detail: "Made to share" },
  { value: "Graduation", label: "A milestone", detail: "Recognise an achievement" },
  { value: "Eid", label: "Eid", detail: "For sharing with loved ones" },
  { value: "Baby born", label: "A new arrival", detail: "A thoughtful welcome" },
  { value: "Gift", label: "A thoughtful gift", detail: "Send something special" },
  { value: "Just craving something", label: "Just because", detail: "No occasion necessary" },
];
const moods = [
  { value: "Chocolate lover", label: "Chocolate", detail: "Rich and indulgent", color: "#75514b" },
  { value: "Fresh & citrusy", label: "Citrus & fruit", detail: "Bright, refreshing notes", color: "#cf9d4c" },
  { value: "Warm & comforting", label: "Warm spices", detail: "Comforting and aromatic", color: "#b97759" },
  { value: "Coffee lover", label: "Coffee", detail: "Toasty, balanced notes", color: "#83705a" },
  { value: "Something different", label: "Something different", detail: "Explore a new favourite", color: "#7b8a70" },
];
const featuredCategories = [
  { id: "loaf", label: "Loaves" },
  { id: "cheesecake", label: "Dessert boxes" },
  { id: "batch", label: "Bakes & cups" },
  { id: "cookie", label: "Artisanal cookies" },
];
const heroSlides = [
  {
    src: "https://res.cloudinary.com/dffsqfwok/image/upload/v1790758951/Commercial_bakery_products_on_ta__2K_20260930140220_ggjrdi.jpg",
    alt: "Homemade artisanal bakes and loaves",
    eyebrow: "SMALL-BATCH, BAKED WITH CARE",
    heading: "A little something",
    accent: "made from scratch.",
    description: "Fresh bakes for everyday treats and the moments worth celebrating.",
    action: "Explore the menu",
    href: "/menu",
    position: "69% 48%",
  },
  {
    src: CATALOGUE_PRODUCTS.find((product) => product.id === "cinnamon-rolls-batch")?.image,
    alt: "Cinnamon Rolls from the menu",
    eyebrow: "FOR THE TABLE",
    heading: "Bring something sweet",
    accent: "to the table.",
    description: "From tea-time loaves to generous dessert boxes, made to share.",
    action: "Browse dessert boxes",
    href: "/menu#cat-cheesecake",
    position: "100% 50%",
  },
  {
    src: "https://res.cloudinary.com/n9pu62pg/image/upload/c_crop,x_0,y_0,w_980,h_675/v1790938869/IMG-20261002-WA0190.jpg",
    alt: "Double Chocolate Cookie from the menu",
    eyebrow: "A GIFT FROM OUR KITCHEN",
    heading: "A thoughtful gesture",
    accent: "beautifully baked.",
    description: "Thoughtful bakery boxes for birthdays, thank-yous, and just because.",
    action: "Explore gifting",
    href: "/order/corporate-gifting",
    position: "100% 50%",
  },
  {
    src: "https://res.cloudinary.com/n9pu62pg/image/upload/c_crop,x_0,y_120,w_1700,h_1416/v1791141497/Gemini_Generated_Image_jh3tl4jh3tl4jh3t.jpg",
    alt: "Flourless Brownies from the menu",
    eyebrow: "MADE TO BE SHARED",
    heading: "Turning art",
    accent: "into sweetness.",
    description: "Plan a fresh advance order for your table, your team, or your next big day.",
    action: "Plan your order",
    href: "/order/local-pickup",
    position: "100% 50%",
    fit: "cover",
  },
];
function slug(x) { return x.toLowerCase().replaceAll(" ", "-").replaceAll("&", "and"); }

export default function Home() {
  const [products, setProducts] = useState(CATALOGUE_PRODUCTS);
  const [loaves, setLoaves] = useState(CATALOGUE_PRODUCTS.filter((p) => p.category === "loaf"));
  const [boxes, setBoxes] = useState(CATALOGUE_FESTIVE_BOXES);
  const [featuredCategory, setFeaturedCategory] = useState("loaf");
  const [heroSlide, setHeroSlide] = useState(0);
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
    const timer = window.setInterval(() => {
      setHeroSlide((current) => (current + 1) % heroSlides.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, []);

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
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">{heroSlides[heroSlide].eyebrow}</p>
          <h1><span>{heroSlides[heroSlide].heading}</span><em>{heroSlides[heroSlide].accent}</em></h1>
          <p className="hero-text">{heroSlides[heroSlide].description}</p>
          <div className="hero-actions">
            <Link to={heroSlides[heroSlide].href} className="button primary" data-testid="hero-find-bake">
              {heroSlides[heroSlide].action} <ArrowRight size={17} />
            </Link>
            <Link to="/build" className="button text-button" data-testid="hero-build-box">
              <WandSparkles size={17} /> Build a box
            </Link>
          </div>
        </div>
        <div
          className="hero-image hero-showcase"
          role="region"
          aria-label="Bakery photo carousel"
          style={{
            "--hero-photo-background": `url("${heroSlides[heroSlide].src}")`,
            "--hero-photo-position": heroSlides[heroSlide].position,
            "--hero-photo-fit": heroSlides[heroSlide].fit || "cover",
          }}
        >
          <img
            key={heroSlides[heroSlide].src}
            src={heroSlides[heroSlide].src}
            alt={heroSlides[heroSlide].alt}
            data-testid="hero-dessert-image"
            loading="eager"
          />
          <div className="hero-carousel-controls">
            <div className="hero-slide-dots" role="group" aria-label="Choose bakery photo">
              {heroSlides.map((photo, index) => (
                <button
                  key={photo.src}
                  type="button"
                  className={heroSlide === index ? "hero-slide-dot active" : "hero-slide-dot"}
                  aria-label={`Show photo ${index + 1}: ${photo.alt}`}
                  aria-pressed={heroSlide === index}
                  onClick={() => setHeroSlide(index)}
                />
              ))}
            </div>
            <button
              type="button"
              className="hero-slide-arrow"
              aria-label="Previous bakery photo"
              onClick={() => setHeroSlide((heroSlide + heroSlides.length - 1) % heroSlides.length)}
            >
              <ChevronLeft size={19} />
            </button>
            <button
              type="button"
              className="hero-slide-arrow"
              aria-label="Next bakery photo"
              onClick={() => setHeroSlide((heroSlide + 1) % heroSlides.length)}
            >
              <ChevronRight size={19} />
            </button>
          </div>
        </div>
      </section>

      <section className="featured-products" aria-labelledby="featured-products-title">
        <div className="featured-products-heading">
          <div>
              <p className="eyebrow">FROM THE LITTLE BAKESHOP</p>
              <h2 id="featured-products-title">Made for sharing.<br /><em>And devouring.</em></h2>
              <p>Loaves, little treats and celebration bakes, made in small batches and ready to find their way to your table.</p>
          </div>
          <Link to="/menu" className="featured-menu-link">Explore the whole menu <ArrowRight size={16} /></Link>
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
            <p className="eyebrow">01 / THE BAKE MATCHMAKER</p>
            <h2>Let's Find Your<br /><em>Match.</em></h2>
            <p>A few little questions, then perfect recommendations curated from our whole menu just for you.</p>
          </div>
          <button type="button" className="match-surprise-button" onClick={surprise} aria-label="Ask the baker for a magical surprise bake" data-testid="match-mascot-surprise">
            <Sparkles size={21} aria-hidden="true" />
            <span className="match-surprise-copy">
              <small>YOUR LITTLE BAKER</small>
              <b>Tap her wand for a<br />magical bake match</b>
              <span>Let’s make a little magic <Sparkles size={13} aria-hidden="true" /></span>
            </span>
            <ArrowRight className="match-surprise-arrow" size={17} aria-hidden="true" />
          </button>
        </div>
        <div className="match-form">
          <div className="question">
            <label>Looking for a specific bake category?</label>
            <div className="choice-grid category-choice-grid">
              {[
                { id: "all", label: "Whole Menu (All bakes)" },
                { id: "loaf", label: "Loaves" },
                { id: "cheesecake", label: "Dessert boxes" },
                { id: "batch", label: "Bakes & cups" },
                { id: "cookie", label: "Artisanal cookies" },
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
            <label>What is the occasion?</label>
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
            <label>Which flavours do you prefer?</label>
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
              <label>How many people?</label>
              <div className="stepper">
                <button onClick={() => setPeople(Math.max(1, people - 1))} data-testid="people-minus"><Minus size={15} /></button>
                <strong data-testid="people-count">{people}</strong>
                <button onClick={() => setPeople(people + 1)} data-testid="people-plus"><Plus size={15} /></button>
              </div>
            </div>
            <div className="question">
              <label>Budget</label>
              <div className="budget-input">
                <span>Rs.</span>
                <input value={budget} onChange={(e) => setBudget(e.target.value)} data-testid="budget-input" />
              </div>
            </div>
          </div>
          <div className="question">
            <label>Any dietary preferences?</label>
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
            {loading ? "Finding your matches…" : <>Find my perfect matches <ArrowRight size={17} /></>}
          </button>
        </div>
      </section>

      {match && (
        <section className="result-section" id="match-result">
          <div className="result-card">
            <div className="result-image">
              <img src={match.product.image} alt={match.product.name} data-testid="match-product-image" />
              <span>YOUR PERFECT MATCH</span>
            </div>
            <div className="result-copy">
              <p className="eyebrow">A NOTE FROM THE BAKER</p>
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
                  Add to my box <ShoppingBag size={17} />
                </button>
                <button className="button ghost" onClick={saveMatch} disabled={saving} data-testid="save-match-button">
                  {saving ? "Saving…" : <>Save & share <Link2 size={16} /></>}
                </button>
              </div>
              {savedNote && <p className="saved-note" data-testid="saved-note">{savedNote}</p>}
            </div>
          </div>

          {matchOptions.filter((opt) => opt.id !== match.product.id).length > 0 && (
            <div className="match-alternatives-container" data-testid="match-alternatives">
              <div className="match-alternatives-heading">
                <p className="eyebrow">MORE OPTIONS FOR YOU</p>
                <h3>Other Perfect Matches From Our Menu</h3>
                <p>Curated alternatives that fit your {mood.toLowerCase()} craving for a {occasion.toLowerCase()}.</p>
              </div>
              <div className="match-alternatives-grid">
                {matchOptions
                  .filter((opt) => opt.id !== match.product.id)
                  .map((opt) => {
                    const categoryLabel = {
                      loaf: "Loaf",
                      cheesecake: "Dessert Box",
                      batch: "Bakes & Cups",
                      cookie: "Artisanal Cookie",
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
          <p className="eyebrow">02 / READY-MADE FESTIVE BOXES</p>
          <h2>One-tap<br /><em>gifting.</em></h2>
          <p>Curated pairings for the moments you don't want to think twice about.</p>
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
