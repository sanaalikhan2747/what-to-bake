import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { ArrowRight, MessageCircle } from "lucide-react";
import { api, waLink } from "@/state/api";
import { CATALOGUE_PRODUCTS } from "@/state/catalogueData";
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
    eyebrow: "DAILY AVAILABILITY",
    title: <em>Same-Day Orders</em>,
    intro: "Subject to daily oven capacity. Message us on WhatsApp to check today's freshly available bakes and timings.",
    note: "Same-day availability depends on current batch schedules.",
    prompt: "Hello Sana! What bakes are available for same-day order today?",
    primary: "View Menu",
    primaryTo: "/menu",
    secondary: "Check Availability",
    label: "SAME-DAY ORDERS",
    image: "https://res.cloudinary.com/dffsqfwok/image/upload/w_1800,q_auto,f_auto/v1790760596/Mango_dessert_trays_on_surface_2K_20260930142859_zpcb6w.jpg",
    imageAlt: "Fresh mango desserts and bakery treats",
    imageCaption: "Fresh daily bakes",
    steps: [
      { title: "Select Item", detail: "Check our menu for your preferred bakes." },
      { title: "Provide Location", detail: "Share your delivery area or pick-up preference." },
      { title: "Instant Confirmation", detail: "We confirm available stock and dispatch times directly." },
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

  return (
    <div className="order-option-page">
      <section className="order-option-hero" aria-labelledby="order-option-title">
        <div className="order-option-copy">
          {orderType !== "local-pickup" && <p className="eyebrow">{option.label}</p>}
          <p className="order-option-kicker">{option.eyebrow}</p>
          <h1 id="order-option-title">{option.title}</h1>
          <p className="order-option-intro">{option.intro}</p>
          <div className="order-option-actions">
            <Link className="button primary" to={option.primaryTo}>{option.primary} <ArrowRight size={16} /></Link>
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