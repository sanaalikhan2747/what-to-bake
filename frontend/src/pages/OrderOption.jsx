import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { ArrowRight, Check, MessageCircle, ShoppingBag } from "lucide-react";
import { api, waLink } from "@/state/api";
import { CATALOGUE_PRODUCTS } from "@/state/catalogueData";
import { useCart } from "@/state/CartContext";
import OrderShowcase from "@/components/OrderShowcase";
import "./OrderOption.css";

const ORDER_PAGES = {
  "local-pickup": {
    eyebrow: "PRE-ORDER SERVICE",
    title: <em>Advance Orders</em>,
    intro: "Order fresh bakes in advance for local pick-up in Askari X or doorstep delivery across Lahore.",
    note: "Schedule and location are confirmed directly on WhatsApp prior to baking.",
    prompt: "Hello Sana! I would like to place an advance order.",
    primary: "Browse Menu",
    primaryTo: "/menu",
    secondary: "Custom Box",
    secondaryTo: "/build",
    label: "LOCAL PICK-UP & DELIVERY",
    image: "https://res.cloudinary.com/dffsqfwok/image/upload/v1790758951/Commercial_bakery_products_on_ta__2K_20260930140220_ggjrdi.jpg",
    imageAlt: "A selection of freshly baked loaves for an advance order",
    imageCaption: "Fresh from the oven, ready for your table",
    steps: [
      { title: "Select Bakes", detail: "Browse our menu or curate a custom gift box." },
      { title: "Choose Date & Time", detail: "Pick your preferred schedule and delivery or pick-up method." },
      { title: "Confirmation", detail: "Receive prompt order confirmation and arrangements via WhatsApp." },
    ],
  },
  "same-day": {
    eyebrow: "DAILY FRESH BAKE · LAHORE",
    title: <em>Same-Day Orders</em>,
    intro: "Craving a fresh bake today? Our signature Banana Bread is baked fresh daily and available for same-day delivery or pick-up in Lahore. All other menu items require 24 hours advance order.",
    note: "Same-day ordering is exclusively available for Banana Bread (Classic Choco Chip & Oat Flour), subject to daily batch availability. All other bakes require 24 hours advance notice.",
    prompt: "Hello Sana! I would like to place a same-day order for fresh Banana Bread.",
    primary: "Order Banana Bread",
    primaryTo: "#same-day-bakes",
    secondary: "Order on WhatsApp",
    label: "SAME-DAY ORDERS · BANANA BREAD EXCLUSIVE",
    image: "https://res.cloudinary.com/n9pu62pg/image/upload/v1790870752/image_6ac914dd.jpg",
    imageAlt: "Freshly baked Choco Chip Banana Bread",
    imageCaption: "Baked fresh daily · Available today",
    steps: [
      { title: "Select Banana Bread", detail: "Choose our classic Choco Chip Banana Bread or wholesome Oat Flour variant." },
      { title: "Fulfilment Details", detail: "Pick up in Askari X or provide your delivery address in Lahore." },
      { title: "Fast Dispatch", detail: "Instant confirmation on WhatsApp with same-day dispatch from our oven." },
    ],
  },
  "corporate-catering": {
    eyebrow: "EVENTS & OFFICES",
    title: <em>Corporate Catering</em>,
    intro: "Curated dessert platters, individual cups, and artisanal loaves tailored for team meetings and corporate events.",
    note: "Large orders require 48 hours notice for scheduling.",
    prompt: "Hello Sana! I would like to inquire about corporate catering options.",
    primary: "Explore Menu",
    primaryTo: "/menu",
    secondary: "Inquire on WhatsApp",
    label: "CORPORATE CATERING",
    image: "https://res.cloudinary.com/dffsqfwok/image/upload/v1790778866/WhatsApp_Image_2026-09-30_at_14.22.37.jpeg_2K_20260930193407_k7nfcn.jpg",
    imageAlt: "A curated spread of bakery treats for sharing",
    imageCaption: "Thoughtful bakes for the whole table",
    steps: [
      { title: "Event Details", detail: "Share your date, guest count, and venue." },
      { title: "Menu Selection", detail: "Choose assorted loaves, dessert boxes, and treats." },
      { title: "Coordinated Hand-off", detail: "Scheduled delivery directly to your office or venue." },
    ],
  },
  "corporate-gifting": {
    eyebrow: "CLIENT & TEAM GIFTS",
    title: <em>Corporate Gifting</em>,
    intro: "Artisanal gift boxes with signature ribbons and personalized message cards, crafted for clients and colleagues.",
    note: "Custom branding and packaging available for bulk orders.",
    prompt: "Hello Sana! I would like to discuss corporate gifting options.",
    primary: "Browse Gift Boxes",
    primaryTo: "/menu",
    secondary: "Build Custom Box",
    secondaryTo: "/build",
    label: "CORPORATE GIFTING",
    image: "https://res.cloudinary.com/dffsqfwok/image/upload/w_1800,q_auto,f_auto/v1790760596/Mango_dessert_trays_on_surface_2K_20260930142859_zpcb6w.jpg",
    imageAlt: "Giftable bakery desserts arranged for sharing",
    imageCaption: "A thoughtful gesture, baked with care",
    steps: [
      { title: "Choose Gift Format", detail: "Select ready-made boxes or custom assortments." },
      { title: "Order Volume & Notes", detail: "Specify recipient count, delivery dates, and gift messages." },
      { title: "Fulfillment", detail: "Carefully packaged and delivered on schedule." },
    ],
  },
  celebrations: {
    eyebrow: "CELEBRATIONS",
    title: <em>Celebrations & Events</em>,
    intro: "Centrepiece bakes, dessert boxes, and custom dessert spreads for birthdays, weddings, and family milestones.",
    note: "Advance booking recommended to reserve your preferred date.",
    prompt: "Hello Sana! I would like to plan bakes for an upcoming celebration.",
    primary: "Explore Menu",
    primaryTo: "/menu",
    secondary: "Build Custom Box",
    secondaryTo: "/build",
    label: "CELEBRATIONS & EVENTS",
    image: "https://res.cloudinary.com/dffsqfwok/image/upload/v1790778866/WhatsApp_Image_2026-09-30_at_14.22.37.jpeg_2K_20260930193407_k7nfcn.jpg",
    imageAlt: "A festive bakery box for a celebration",
    imageCaption: "Made for the moments worth gathering for",
    steps: [
      { title: "Select Centrepiece", detail: "Choose celebration loaves, cheesecakes, or custom boxes." },
      { title: "Guest Count", detail: "Share your date and guest count for portion guidance." },
      { title: "Delivery & Pick-up", detail: "Timely hand-off arranged to your schedule." },
    ],
  },
};

export default function OrderOption({ orderType }) {
  const { addItem, setCartOpen } = useCart();
  const [addedLoafId, setAddedLoafId] = useState(null);
  const [menuPhotos, setMenuPhotos] = useState(() => [...new Set(CATALOGUE_PRODUCTS.map((product) => product.image).filter(Boolean))]);
  const [advanceRequest, setAdvanceRequest] = useState({
    fulfilment: "pickup",
    fullName: "",
    email: "",
    phone: "",
    date: "",
    time: "",
    address: "",
    details: "",
  });
  const [sameDayRequest, setSameDayRequest] = useState({
    fulfilment: "pickup",
    selectedLoaf: "Choco Chip Banana Bread (Rs. 1,200)",
    quantity: 1,
    fullName: "",
    phone: "",
    address: "",
    notes: "",
  });
  const option = ORDER_PAGES[orderType];

  useEffect(() => {
    if (orderType !== "local-pickup") return undefined;
    let active = true;
    api.get("/products")
      .then(({ data }) => {
        if (!active) return;
        const photos = [...new Set(data.map((product) => product.image).filter(Boolean))];
        if (photos.length) setMenuPhotos(photos);
      })
      .catch(() => {});
    return () => { active = false; };
  }, [orderType]);

  if (!option) return <Navigate to="/menu" replace />;

  const updateAdvanceRequest = (event) => {
    const { name, value } = event.target;
    setAdvanceRequest((current) => ({ ...current, [name]: value }));
  };

  const submitAdvanceRequest = (event) => {
    event.preventDefault();
    if (orderType !== "local-pickup") return;
    const isDelivery = advanceRequest.fulfilment === "delivery";
    const service = isDelivery ? "delivery" : "pick-up";
    const message = [
      `Hello Sana! I'd like to request an advance ${service} order.`,
      `Full name: ${advanceRequest.fullName.trim()}`,
      `Email: ${advanceRequest.email.trim()}`,
      `Phone: ${advanceRequest.phone.trim()}`,
      `Preferred ${service} date: ${advanceRequest.date}`,
      `Preferred ${service} time: ${advanceRequest.time}`,
      ...(isDelivery ? [`Delivery address: ${advanceRequest.address.trim()}`] : []),
      `Order details: ${advanceRequest.details.trim()}`,
      `Please confirm availability and ${isDelivery ? "delivery arrangements" : "pick-up location"}.`,
    ].join("\n");
    window.open(waLink(message), "_blank", "noopener,noreferrer");
  };

  const updateSameDayRequest = (event) => {
    const { name, value } = event.target;
    setSameDayRequest((current) => ({ ...current, [name]: value }));
  };

  const submitSameDayRequest = (event) => {
    event.preventDefault();
    const isDelivery = sameDayRequest.fulfilment === "delivery";
    const service = isDelivery ? "delivery" : "pick-up";
    const message = [
      `Hello Sana! I'd like to place a SAME-DAY Banana Bread order.`,
      `Loaf choice: ${sameDayRequest.selectedLoaf}`,
      `Quantity: ${sameDayRequest.quantity}`,
      `Fulfilment: ${isDelivery ? "Doorstep Delivery (Lahore)" : "Pick-up (Askari X, Lahore)"}`,
      `Full name: ${sameDayRequest.fullName.trim()}`,
      `Phone: ${sameDayRequest.phone.trim()}`,
      ...(isDelivery ? [`Delivery address: ${sameDayRequest.address.trim()}`] : []),
      ...(sameDayRequest.notes.trim() ? [`Notes / Timing: ${sameDayRequest.notes.trim()}`] : []),
      `Please confirm if this is available for today!`,
    ].join("\n");
    window.open(waLink(message), "_blank", "noopener,noreferrer");
  };

  const addLoafToCart = (product) => {
    addItem({ id: product.id, name: product.name, price: product.price, image: product.image, custom_box: false });
    setAddedLoafId(product.id);
    setTimeout(() => setAddedLoafId(null), 2000);
    setCartOpen(true);
  };

  const bananaBreadProducts = CATALOGUE_PRODUCTS.filter((product) =>
    product.id === "chocolate-chip-banana" || product.id === "oat-flour-banana-bread"
  );

  return (
    <div className="order-option-page">
      <section className="order-option-hero" aria-labelledby="order-option-title">
        <div className="order-option-copy">
          {orderType !== "local-pickup" && <p className="eyebrow">{option.label}</p>}
          <p className="order-option-kicker">{option.eyebrow}</p>
          <h1 id="order-option-title">{option.title}</h1>
          <p className="order-option-intro">{option.intro}</p>
          <div className="order-option-actions">
            {option.primaryTo?.startsWith("#") ? (
              <a
                className="button primary"
                href={option.primaryTo}
                onClick={(e) => {
                  e.preventDefault();
                  document.querySelector(option.primaryTo)?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                {option.primary} <ArrowRight size={16} />
              </a>
            ) : (
              <Link className="button primary" to={option.primaryTo}>{option.primary} <ArrowRight size={16} /></Link>
            )}
            {option.secondaryTo ? (
              <Link className="button ghost" to={option.secondaryTo}>{option.secondary} <ArrowRight size={16} /></Link>
            ) : (
              <a className="button ghost" href={waLink(option.prompt)} target="_blank" rel="noreferrer">{option.secondary} <MessageCircle size={16} /></a>
            )}
          </div>
        </div>
        <OrderShowcase image={option.image} alt={option.imageAlt} caption={option.imageCaption} gallery={orderType === "local-pickup" ? menuPhotos : []} />
      </section>
      {orderType === "local-pickup" && <section className="advance-order-section" aria-labelledby="advance-order-title">
        <div className="advance-order-heading">
          <h2 id="advance-order-title">Pre-Order Booking</h2>
          <p>Select pick-up or delivery and specify your preferred date and time. Confirmed directly via WhatsApp.</p>
        </div>
        <form className="advance-order-form" onSubmit={submitAdvanceRequest} data-testid="advance-order-form">
          <fieldset className="advance-order-fieldset">
            <legend>Fulfilment Method</legend>
            <div className="advance-order-fulfilment" role="radiogroup" aria-label="Order fulfilment">
              {[{ value: "pickup", label: "Pick-up" }, { value: "delivery", label: "Delivery" }].map((choice) => (
                <label className={`advance-order-fulfilment-option${advanceRequest.fulfilment === choice.value ? " selected" : ""}`} key={choice.value}>
                  <input type="radio" name="fulfilment" value={choice.value} checked={advanceRequest.fulfilment === choice.value} onChange={updateAdvanceRequest} data-testid={`advance-order-${choice.value}`} />
                  <span>{choice.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <label className="advance-order-field">
            <span>Full name</span>
            <input autoComplete="name" name="fullName" value={advanceRequest.fullName} onChange={updateAdvanceRequest} required maxLength={100} data-testid="advance-order-name" />
          </label>
          <label className="advance-order-field">
            <span>Email address</span>
            <input type="email" autoComplete="email" name="email" value={advanceRequest.email} onChange={updateAdvanceRequest} required maxLength={254} data-testid="advance-order-email" />
          </label>
          <label className="advance-order-field">
            <span>Phone number</span>
            <input type="tel" autoComplete="tel" name="phone" value={advanceRequest.phone} onChange={updateAdvanceRequest} required maxLength={40} data-testid="advance-order-phone" />
          </label>
          <label className="advance-order-field">
            <span>Preferred date</span>
            <input type="date" name="date" min={new Date().toLocaleDateString("en-CA")} value={advanceRequest.date} onChange={updateAdvanceRequest} required data-testid="advance-order-date" />
          </label>
          <label className="advance-order-field">
            <span>Preferred time</span>
            <input type="time" name="time" value={advanceRequest.time} onChange={updateAdvanceRequest} required data-testid="advance-order-time" />
          </label>
          {advanceRequest.fulfilment === "delivery" && <label className="advance-order-field advance-order-field-wide">
            <span>Delivery address</span>
            <textarea name="address" value={advanceRequest.address} onChange={updateAdvanceRequest} required maxLength={500} rows={2} autoComplete="street-address" placeholder="Enter delivery address in Lahore." data-testid="advance-order-address" />
          </label>}
          <label className="advance-order-field advance-order-field-wide">
            <span>Order Details</span>
            <textarea name="details" value={advanceRequest.details} onChange={updateAdvanceRequest} required minLength={3} maxLength={1200} rows={4} placeholder="List items, quantities, and any notes." data-testid="advance-order-details" />
          </label>
          <div className="advance-order-submit-row">
            <p>Availability and arrangements will be confirmed directly on WhatsApp.</p>
            <button type="submit" className="button primary" data-testid="advance-order-submit">Submit Pre-Order <MessageCircle size={16} /></button>
          </div>
        </form>
      </section>}
      {orderType === "same-day" && (
        <section className="same-day-section" id="same-day-bakes" aria-labelledby="same-day-bakes-title">
          <div className="same-day-heading">
            <p className="eyebrow">DAILY FRESH BAKE · EXCLUSIVE SAME-DAY</p>
            <h2 id="same-day-bakes-title">Today's Fresh Banana Bread</h2>
            <p>
              Baked fresh daily in small batches and ready for same-day dispatch in Lahore.
              All other menu items require 24 hours advance pre-order.
            </p>
          </div>

          <div className="same-day-cards-grid" data-testid="same-day-cards">
            {bananaBreadProducts.map((product) => (
              <article className="same-day-card" key={product.id} data-testid={`same-day-item-${product.id}`}>
                <div className="same-day-card-image">
                  <img src={product.image} alt={product.name} loading="lazy" />
                  <span className="same-day-pill">Available Today</span>
                  {product.healthy && <span className="same-day-pill-healthy">Healthy option</span>}
                </div>
                <div className="same-day-card-body">
                  <div className="same-day-card-header">
                    <p className="same-day-category">ARTISANAL LOAF</p>
                    <h3>{product.name}</h3>
                    <b className="same-day-price">Rs. {product.price.toLocaleString()}</b>
                  </div>
                  <p className="same-day-story">{product.story}</p>
                  {product.note && <p className="same-day-note">{product.note}</p>}
                  <p className="same-day-serves">Serves {product.serves}</p>
                  {product.addons?.length > 0 && (
                    <p className="same-day-addon">
                      Optional: {product.addons.map((a) => `${a.name} (+Rs. ${a.price})`).join(", ")}
                    </p>
                  )}
                  <div className="same-day-card-actions">
                    <button
                      type="button"
                      className="button primary"
                      onClick={() => addLoafToCart(product)}
                      data-testid={`same-day-add-${product.id}`}
                    >
                      {addedLoafId === product.id ? <>Added <Check size={15} /></> : <>Add to Cart <ShoppingBag size={15} /></>}
                    </button>
                    <a
                      className="button ghost"
                      href={waLink(`Hello Sana! I'd like to place a same-day order for ${product.name} today.`)}
                      target="_blank"
                      rel="noreferrer"
                      data-testid={`same-day-wa-${product.id}`}
                    >
                      Order on WhatsApp <MessageCircle size={15} />
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="same-day-booking-wrap">
            <div className="advance-order-heading">
              <p className="eyebrow">SAME-DAY DISPATCH</p>
              <h2>Quick Same-Day Request</h2>
              <p>Pick up from Askari X or enter your Lahore delivery address. Sana confirms your bake on WhatsApp within minutes.</p>
            </div>
            <form className="advance-order-form" onSubmit={submitSameDayRequest} data-testid="same-day-order-form">
              <fieldset className="advance-order-fieldset">
                <legend>Fulfilment Method</legend>
                <div className="advance-order-fulfilment" role="radiogroup" aria-label="Order fulfilment">
                  {[{ value: "pickup", label: "Pick-up (Askari X, Lahore)" }, { value: "delivery", label: "Doorstep Delivery (Lahore)" }].map((choice) => (
                    <label className={`advance-order-fulfilment-option${sameDayRequest.fulfilment === choice.value ? " selected" : ""}`} key={choice.value}>
                      <input type="radio" name="fulfilment" value={choice.value} checked={sameDayRequest.fulfilment === choice.value} onChange={updateSameDayRequest} data-testid={`same-day-fulfilment-${choice.value}`} />
                      <span>{choice.label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <label className="advance-order-field">
                <span>Choose Banana Bread</span>
                <select name="selectedLoaf" value={sameDayRequest.selectedLoaf} onChange={updateSameDayRequest} data-testid="same-day-loaf-select">
                  <option value="Choco Chip Banana Bread (Rs. 1,200)">Choco Chip Banana Bread (Rs. 1,200)</option>
                  <option value="Oat Flour Choco Chip Banana Bread (Rs. 1,200)">Oat Flour Choco Chip Banana Bread (Rs. 1,200)</option>
                  <option value="Both Loaves (1x Classic + 1x Oat Flour - Rs. 2,400)">Both Loaves (1x Classic + 1x Oat Flour - Rs. 2,400)</option>
                </select>
              </label>
              <label className="advance-order-field">
                <span>Quantity</span>
                <input type="number" min="1" max="10" name="quantity" value={sameDayRequest.quantity} onChange={updateSameDayRequest} required data-testid="same-day-quantity" />
              </label>
              <label className="advance-order-field">
                <span>Full name</span>
                <input autoComplete="name" name="fullName" value={sameDayRequest.fullName} onChange={updateSameDayRequest} required maxLength={100} data-testid="same-day-name" />
              </label>
              <label className="advance-order-field">
                <span>Phone number (WhatsApp)</span>
                <input type="tel" autoComplete="tel" name="phone" value={sameDayRequest.phone} onChange={updateSameDayRequest} required maxLength={40} data-testid="same-day-phone" />
              </label>
              {sameDayRequest.fulfilment === "delivery" && (
                <label className="advance-order-field advance-order-field-wide">
                  <span>Delivery address in Lahore</span>
                  <textarea name="address" value={sameDayRequest.address} onChange={updateSameDayRequest} required maxLength={500} rows={2} autoComplete="street-address" placeholder="House / Apt, Street, Sector, Phase, Lahore" data-testid="same-day-address" />
                </label>
              )}
              <label className="advance-order-field advance-order-field-wide">
                <span>Timing preference or notes (Optional)</span>
                <input name="notes" value={sameDayRequest.notes} onChange={updateSameDayRequest} placeholder="e.g. deliver around 4 PM, add walnuts (+Rs. 100)" data-testid="same-day-notes" />
              </label>
              <div className="advance-order-submit-row">
                <p>Sana will confirm availability and dispatch details directly on WhatsApp.</p>
                <button type="submit" className="button primary" data-testid="same-day-submit">
                  Order for Today on WhatsApp <MessageCircle size={16} />
                </button>
              </div>
            </form>
          </div>

          <aside className="same-day-advance-notice" data-testid="same-day-advance-notice">
            <div className="same-day-advance-copy">
              <p className="eyebrow">LOOKING FOR OTHER BAKES?</p>
              <h3>Cakes, Cheesecakes & Dessert Boxes are Advance Order</h3>
              <p>
                To maintain small-batch perfection, all our cheesecakes, dessert boxes, cookies, and other loaves
                require 24 hours advance pre-order.
              </p>
            </div>
            <Link to="/order/local-pickup" className="button ghost" data-testid="same-day-go-advance">
              Explore Advance Orders <ArrowRight size={16} />
            </Link>
          </aside>
        </section>
      )}
      {orderType !== "local-pickup" && <section className="order-option-steps" aria-label={`How ${option.label.toLowerCase()} works`}>
        <div className="order-option-steps-heading">
          <p className="eyebrow">ORDER PROCESS</p>
          <h2>How It Works</h2>
        </div>
        <div className="order-option-step-list">
          {option.steps.map((step, index) => (
            <article className="order-option-step" key={step.title}>
              <span className="order-option-step-number">0{index + 1}</span>
              <div><h3>{step.title}</h3><p>{step.detail}</p></div>
            </article>
          ))}
        </div>
      </section>}
      <section className="order-option-next">
        <div>
          <p className="eyebrow">A NOTE BEFORE YOU ORDER</p>
          <p>{option.note}</p>
        </div>
        <a className="order-option-contact" href={waLink(option.prompt)} target="_blank" rel="noreferrer">
          Message Sana on WhatsApp <MessageCircle size={16} />
        </a>
      </section>
      <div className="order-option-backlinks">
        <Link to="/">Back to home</Link>
        <Link to="/menu">Full menu</Link>
      </div>
    </div>
  );
}