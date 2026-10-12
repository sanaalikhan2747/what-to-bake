import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { ArrowRight, MessageCircle } from "lucide-react";
import { waLink } from "@/state/api";
import OrderShowcase from "@/components/OrderShowcase";
import "./OrderOption.css";

const ORDER_PAGES = {
  "local-pickup": {
    eyebrow: "PLAN AHEAD",
    title: <>A little something,<br /><em>ready when you are.</em></>,
    intro: "Planning ahead? Choose pick-up or delivery, browse the menu, then send Sana your order details and preferred date and time. She'll confirm availability and arrangements.",
    note: "Your preferred date, time and fulfilment option are confirmed directly with Sana before your order is final.",
    prompt: "Hello Sana! I'd like to discuss an advance bakery order.",
    primary: "Browse the menu",
    primaryTo: "/menu",
    secondary: "Build a custom box",
    secondaryTo: "/build",
    label: "LOCAL PICK-UP",
    image: "https://res.cloudinary.com/dffsqfwok/image/upload/v1790758951/Commercial_bakery_products_on_ta__2K_20260930140220_ggjrdi.jpg",
    imageAlt: "A selection of freshly baked loaves for an advance order",
    imageCaption: "Fresh from the oven, ready for your table",
    steps: [
      { title: "Choose your bakes", detail: "Browse the menu or put together a custom box." },
      { title: "Share your timing", detail: "Send Sana your choices and preferred date, time and fulfilment option." },
      { title: "Confirm the details", detail: "Sana will confirm availability, timing and pick-up or delivery arrangements with you." },
    ],
  },
  "same-day": {
    eyebrow: "TODAY, IF THE OVEN SAYS YES",
    title: <>Craving something<br /><em>for today?</em></>,
    intro: "See what's baking, then message Sana with your area and preferred pick-up or delivery time. Same-day availability is confirmed directly, so you'll know what's possible before placing your order.",
    note: "Same-day service depends on availability and location; Sana will confirm by WhatsApp.",
    prompt: "Hello Sana! Is same-day pick-up or delivery available for my area today?",
    primary: "See today's bakes",
    primaryTo: "/menu",
    secondary: "Ask about availability",
    label: "SAME-DAY PICK-UP OR DELIVERY",
    image: "https://res.cloudinary.com/dffsqfwok/image/upload/w_1800,q_auto,f_auto/v1790760596/Mango_dessert_trays_on_surface_2K_20260930142859_zpcb6w.jpg",
    imageAlt: "Fresh mango desserts and bakery treats",
    imageCaption: "A little something for today",
    steps: [
      { title: "Pick a favourite", detail: "Browse the menu and tell Sana what you have in mind." },
      { title: "Share your area", detail: "Include your location and preferred pick-up or delivery time." },
      { title: "Check today's availability", detail: "Sana will confirm what can be arranged before you place the order." },
    ],
  },
  "corporate-catering": {
    eyebrow: "FOR THE WHOLE TABLE",
    title: <>Make room for<br /><em>one more slice.</em></>,
    intro: "Planning treats for a team, meeting or gathering? Share your date, guest count, location and the kinds of bakes you're considering. Sana can discuss a suitable order with you.",
    note: "Catering quantities and timing are confirmed individually; send your event details for a conversation.",
    prompt: "Hello Sana! I'm enquiring about bakes for a work gathering. Could we discuss date, guest count and options?",
    primary: "Explore the menu",
    primaryTo: "/menu",
    secondary: "Discuss catering",
    label: "CORPORATE CATERING",
    image: "https://res.cloudinary.com/dffsqfwok/image/upload/v1790778866/WhatsApp_Image_2026-09-30_at_14.22.37.jpeg_2K_20260930193407_k7nfcn.jpg",
    imageAlt: "A curated spread of bakery treats for sharing",
    imageCaption: "Thoughtful bakes for the whole table",
    steps: [
      { title: "Tell us about the gathering", detail: "Share the date, guest count, location and kind of event." },
      { title: "Explore the bakes", detail: "Browse loaves, dessert boxes, cookies and small treats for your table." },
      { title: "Discuss the order", detail: "Sana can confirm suitable quantities, timing and hand-off details with you." },
    ],
  },
  "corporate-gifting": {
    eyebrow: "A THOUGHTFUL THANK-YOU",
    title: <>Send something<br /><em>made with care.</em></>,
    intro: "For client thank-yous, team milestones or a thoughtful note, start with the bakes and gift boxes on our menu. Message Sana with quantities, timing and any personalisation you'd like to ask about.",
    note: "Gift packaging and personalisation depend on the order; Sana will confirm the available options.",
    prompt: "Hello Sana! I'm enquiring about gifts for a team or clients. Could we discuss quantities, timing and packaging options?",
    primary: "Browse giftable bakes",
    primaryTo: "/menu",
    secondary: "Build a gift box",
    secondaryTo: "/build",
    label: "CORPORATE GIFTING",
    image: "https://res.cloudinary.com/dffsqfwok/image/upload/w_1800,q_auto,f_auto/v1790760596/Mango_dessert_trays_on_surface_2K_20260930142859_zpcb6w.jpg",
    imageAlt: "Giftable bakery desserts arranged for sharing",
    imageCaption: "A thoughtful gesture, baked with care",
    steps: [
      { title: "Choose a gift", detail: "Start with a favourite bake or create a custom box." },
      { title: "Share the occasion", detail: "Tell Sana how many gifts you need, when they are needed and any message to include." },
      { title: "Confirm the details", detail: "Packaging, personalisation and hand-off options are confirmed for your order." },
    ],
  },
  celebrations: {
    eyebrow: "MARK THE MOMENT",
    title: <>A good reason<br /><em>to gather.</em></>,
    intro: "Birthday table, family gathering or a just-because celebration: find a favourite bake or start a custom box. For event quantities and timing, share your plans with Sana.",
    note: "Send the event date, guest count and location so Sana can help with the next steps.",
    prompt: "Hello Sana! I'm planning a celebration and would love to discuss bakes, quantities and timing.",
    primary: "Find a bake",
    primaryTo: "/menu",
    secondary: "Build a custom box",
    secondaryTo: "/build",
    label: "CELEBRATIONS & EVENTS",
    image: "https://res.cloudinary.com/dffsqfwok/image/upload/v1790778866/WhatsApp_Image_2026-09-30_at_14.22.37.jpeg_2K_20260930193407_k7nfcn.jpg",
    imageAlt: "A festive bakery box for a celebration",
    imageCaption: "Made for the moments worth gathering for",
    steps: [
      { title: "Choose the centrepiece", detail: "Find a favourite celebration bake or create a box with a little variety." },
      { title: "Plan for your guests", detail: "Share your guest count, event date and location with Sana." },
      { title: "Arrange the hand-off", detail: "Confirm availability, timing and collection details directly with Sana." },
    ],
  },
};

export default function OrderOption({ orderType }) {
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
        <OrderShowcase image={option.image} alt={option.imageAlt} caption={option.imageCaption} />
      </section>
      {orderType === "local-pickup" && <section className="advance-order-section" aria-labelledby="advance-order-title">
        <div className="advance-order-heading">
          <p className="eyebrow">AN ADVANCE ORDER</p>
          <h2 id="advance-order-title">Book your order</h2>
          <p>Choose pick-up or delivery and share your preferred date and time. Sana will confirm availability and arrangements with you on WhatsApp.</p>
        </div>
        <form className="advance-order-form" onSubmit={submitAdvanceRequest} data-testid="advance-order-form">
          <fieldset className="advance-order-fieldset">
            <legend>How would you like to receive your order?</legend>
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
            <textarea name="address" value={advanceRequest.address} onChange={updateAdvanceRequest} required maxLength={500} rows={2} autoComplete="street-address" placeholder="Enter the full delivery address." data-testid="advance-order-address" />
          </label>}
          <label className="advance-order-field advance-order-field-wide">
            <span>What would you like to order?</span>
            <textarea name="details" value={advanceRequest.details} onChange={updateAdvanceRequest} required minLength={3} maxLength={1200} rows={4} placeholder="List your bakes, quantities, and any notes for Sana." data-testid="advance-order-details" />
          </label>
          <div className="advance-order-submit-row">
            <p>Sana will confirm availability and your {advanceRequest.fulfilment === "delivery" ? "delivery" : "pick-up"} arrangements before the order is final.</p>
            <button type="submit" className="button primary" data-testid="advance-order-submit">Send request to Sana <MessageCircle size={16} /></button>
          </div>
        </form>
      </section>}
      {orderType !== "local-pickup" && <section className="order-option-steps" aria-label={`How ${option.label.toLowerCase()} works`}>
        <div className="order-option-steps-heading">
          <p className="eyebrow">A SIMPLE, PERSONAL ORDER</p>
          <h2>From first thought<br /><em>to freshly baked.</em></h2>
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