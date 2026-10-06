import { Link, Navigate } from "react-router-dom";
import { ArrowRight, MessageCircle } from "lucide-react";
import { waLink } from "@/state/api";
import "./OrderOption.css";

const ORDER_PAGES = {
  "local-pickup": {
    eyebrow: "PLAN AHEAD",
    title: <>A little something,<br /><em>ready when you are.</em></>,
    intro: "Planning to collect your bakes? Browse the menu, then message Sana with your choices and preferred pick-up date and time. She'll confirm what's available.",
    note: "Pick-up timing is confirmed directly with Sana before your order is final.",
    prompt: "Hello Sana! I'd like to arrange an advance local pick-up. I'll share my bake choices and preferred date and time.",
    primary: "Browse the menu",
    primaryTo: "/menu",
    secondary: "Build a custom box",
    secondaryTo: "/build",
    label: "LOCAL PICK-UP",
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
  },
};

export default function OrderOption({ orderType }) {
  const option = ORDER_PAGES[orderType];
  if (!option) return <Navigate to="/menu" replace />;

  return (
    <div className="order-option-page">
      <section className="order-option-hero">
        <p className="eyebrow">{option.label}</p>
        <p className="order-option-kicker">{option.eyebrow}</p>
        <h1>{option.title}</h1>
        <p className="order-option-intro">{option.intro}</p>
        <div className="order-option-actions">
          <Link className="button primary" to={option.primaryTo}>{option.primary} <ArrowRight size={16} /></Link>
          {option.secondaryTo ? (
            <Link className="button ghost" to={option.secondaryTo}>{option.secondary} <ArrowRight size={16} /></Link>
          ) : (
            <a className="button ghost" href={waLink(option.prompt)} target="_blank" rel="noreferrer">{option.secondary} <MessageCircle size={16} /></a>
          )}
        </div>
      </section>
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