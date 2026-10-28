import { CATALOGUE_PRODUCTS, CATALOGUE_FESTIVE_BOXES, CATALOGUE_PACKAGING } from "./catalogueData.js";
import { PAYMENT_CONFIG } from "./paymentConfig.js";

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function parseBudget(text) {
  const clean = String(text || "").toLowerCase();
  // Match patterns like "under 1000", "under rs 1,000", "rs. 1500", "budget 2000", "less than 1000"
  const amountRegex = /(?:under|below|less than|within|budget|up to|upto|max|maximum|around|rs\.?)\s*(?:rs\.?\s*)?(\d{1,3}(?:[, ]\d{3})+|\d+)/i;
  const match = clean.match(amountRegex);
  if (match && match[1]) {
    const val = parseInt(match[1].replace(/[, ]/g, ""), 10);
    if (!isNaN(val) && val > 0) return val;
  }
  const standaloneRs = clean.match(/\brs\.?\s*(\d+)\b/i);
  if (standaloneRs && standaloneRs[1]) {
    return parseInt(standaloneRs[1], 10);
  }
  // Word numbers: "thousand", "one thousand"
  if (clean.includes("thousand") || clean.includes("1k") || clean.includes("1 k")) return 1000;
  if (clean.includes("two thousand") || clean.includes("2k")) return 2000;
  if (clean.includes("fifteen hundred") || clean.includes("1500")) return 1500;
  return null;
}

/**
 * Resilient, client-side Pippa response generator.
 * Provides immediate, delightful, grounded bakery answers even when the backend is unreachable.
 */
export function getLocalPippaReply(message, history = []) {
  const lowered = normalize(message);
  const userHistory = (history || [])
    .filter((turn) => turn && turn.role === "user" && turn.text)
    .slice(-4)
    .map((turn) => normalize(turn.text));
  const fullContext = normalize(`${message} ${userHistory.join(" ")}`);
  const budget = parseBudget(fullContext);
  const isExclusive = /\b(under|below|less than)\b/.test(lowered);
  const withinBudget = (price) => {
    if (budget === null) return true;
    return isExclusive ? price < budget : price <= budget;
  };

  // 1. Allergens and dietary safety
  if (
    /allerg|ingredient|peanut|nut\s*free|nut-free|nuts|gluten|dairy|milk|lactose|sesame|soy|eggless|eggs|vegan|halal|contain/.test(
      lowered
    )
  ) {
    return "I don't have verified ingredient or allergen sheets in my recipe notebook, so I won't guess about allergy safety. Please confirm directly with Sana on WhatsApp (+92 322 411 2832: https://wa.me/923224112832) before ordering. I can still help compare bakes and prices!";
  }

  // 2. Location, opening hours, contact
  if (
    /where are you located|location|address|pickup address|store address|opening hours|business hours|open hours|what time do you open|email/.test(
      lowered
    )
  ) {
    return "Treats & Temptation by SK is a boutique home-based studio in Askari X, Lahore. All bakes are made fresh to order. Pick-up is arranged in Askari X, and doorstep delivery is available across Lahore. Sana confirms exact pick-up times and arrangements directly on WhatsApp (+92 322 411 2832: https://wa.me/923224112832).";
  }

  // 3. Payment methods (Allied Bank advance transfer)
  if (
    /card|credit card|debit card|online payment|pay online|payment|how do i pay|bank transfer|account details|bank|iban|allied/.test(
      lowered
    )
  ) {
    return (
      `All our bakes are freshly prepared on order. Orders are confirmed once advance payment is received ✨\n\n` +
      `Please transfer the total to confirm your slot:\n` +
      `• Bank: ${PAYMENT_CONFIG.bankName}\n` +
      `• Account Title: ${PAYMENT_CONFIG.accountTitle}\n` +
      `• IBAN: ${PAYMENT_CONFIG.iban}\n\n` +
      `Kindly share a quick screenshot of the transfer on WhatsApp (+92 322 411 2832) once done! (Online card payment and cash on deposit are unavailable).`
    );
  }

  // 4. Cash on delivery / deposit
  if (lowered.includes("cash")) {
    return (
      "We do not offer cash on deposit or cash on delivery. All our bakes are prepared fresh on order, and slots are confirmed once advance bank transfer to Allied Bank (Farzana seemin) is received. WhatsApp Sana: https://wa.me/923224112832."
    );
  }

  // 5. Delivery costs / timing
  if (
    /delivery fee|delivery charge|delivery cost|shipping cost|how much for delivery|how much is delivery/.test(
      lowered
    )
  ) {
    return "Delivery charges depend on your delivery location in Lahore and the courier service (e.g. Careem / Bykea delivery). Share your area with Sana on WhatsApp (+92 322 411 2832) for an exact quote: https://wa.me/923224112832.";
  }

  // 6. Same-day orders
  if (/same day|today|urgent|in 2 hours|right now/.test(lowered)) {
    return "For same-day orders, only freshly baked Banana Bread (Classic Choco Chip & Oat Flour) is available today (subject to daily oven batches). All other menu items require 24 hours advance pre-order. Message Sana on WhatsApp to confirm today's availability: https://wa.me/923224112832.";
  }

  // 7. Delivery & Pickup general
  if (/delivery|deliver|pick up|pickup|pick-up|collect|shipping/.test(lowered)) {
    return "We offer doorstep delivery across Lahore and self pick-up from Askari X, Lahore. Sana confirms the exact time and arrangements directly on WhatsApp: https://wa.me/923224112832.";
  }

  // 8. Custom Box / Build a box / Packaging costs
  if (
    /custom box|build a box|box builder|pick and mix|pick mix|packaging|ribbon|box price|box cost|how much is a custom box/.test(
      lowered
    )
  ) {
    const customItems = CATALOGUE_PRODUCTS.filter((p) => p.custom_box_unit != null);
    const itemPrices = customItems
      .map((p) => `${p.name}: Rs. ${p.custom_box_unit.toLocaleString()} each`)
      .join(", ");
    const boxPackaging = CATALOGUE_PACKAGING.map(
      (p) => `${p.name} (Rs. ${p.price.toLocaleString()})`
    ).join(", ");
    return (
      `In our Build a Box feature, you can pick and mix individual freshly baked treats!\n\n` +
      `• Per-piece treats: ${itemPrices}.\n` +
      `• Packaging choices: ${boxPackaging}, hand-tied with a luxury pink ribbon.\n\n` +
      `Your total depends on how many treats you select plus the packaging (Rs. 150). You can also add a handwritten note at checkout!`
    );
  }

  // 9. Ready-made Gift Boxes / Festive Boxes
  if (
    /gift box|gift boxes|gifting|festive box|festive boxes|eid box|anniversary box|birthday box|graduation box|baby born box|tell me about gift boxes/.test(
      lowered
    )
  ) {
    let boxes = CATALOGUE_FESTIVE_BOXES;
    if (budget !== null) {
      boxes = boxes.filter((b) => withinBudget(b.total));
      if (boxes.length === 0) {
        const lowest = Math.min(...CATALOGUE_FESTIVE_BOXES.map((b) => b.total));
        return `Our curated gift boxes start at Rs. ${lowest.toLocaleString()}; there aren't ready-made boxes under Rs. ${budget.toLocaleString()}. However, you can mix individual treats in 'Build a box' to fit your exact budget!`;
      }
    }
    const boxDescriptions = boxes
      .map(
        (b) =>
          `• ${b.name} (Rs. ${b.total.toLocaleString()}): ` +
          b.items.map((line) => `${line.qty} × ${line.product?.name || line.product_id}`).join(", ")
      )
      .join("\n");
    const intro = budget !== null
      ? `Here are our gift boxes within Rs. ${budget.toLocaleString()}:\n\n`
      : `Our curated gift boxes come tied with a luxury ribbon and are made for celebrations:\n\n`;
    return (
      `${intro}${boxDescriptions}\n\n` +
      `You can customize any of these under Gifting or build a custom treat box from scratch!`
    );
  }

  // 10. Specific item match (e.g. "how much is apple cinnamon loaf", "cheesecake", "brownies")
  const matchedProduct = CATALOGUE_PRODUCTS.find((p) =>
    lowered.includes(normalize(p.name))
  );
  if (matchedProduct) {
    const isCustomQuery = /custom|single|piece|each/.test(lowered);
    const unitPrice = isCustomQuery && matchedProduct.custom_box_unit != null
      ? matchedProduct.custom_box_unit
      : matchedProduct.price;
    let detail = `${matchedProduct.name} is Rs. ${unitPrice.toLocaleString()} per ${matchedProduct.unit}`;
    if (isCustomQuery && matchedProduct.custom_box_unit != null) {
      detail += " in a custom box";
    }
    detail += ".";
    if (matchedProduct.serves) {
      detail += ` Serves ${matchedProduct.serves}.`;
    }
    if (matchedProduct.story) {
      detail += ` ${matchedProduct.story}`;
    }
    return detail;
  }

  // 11. Budget queries ("Bakes under Rs 1,000", "Under 1500", "Menu options", "What can I get for 1000")
  if (
    budget !== null ||
    /menu|price|prices|cost|available|what do you have|products|bakes|under 1000|options/.test(lowered)
  ) {
    const categories = [
      { id: "loaf", label: "Loaves" },
      { id: "cheesecake", label: "Dessert Boxes" },
      { id: "batch", label: "Bakes & Cups" },
      { id: "cookie", label: "Cookies" },
    ];
    const lines = [];
    for (const cat of categories) {
      const items = CATALOGUE_PRODUCTS.filter(
        (p) => p.category === cat.id && withinBudget(p.price)
      );
      if (items.length > 0) {
        lines.push(
          `• ${cat.label}: ` +
            items.map((it) => `${it.name} (Rs. ${it.price.toLocaleString()})`).join(", ")
        );
      }
    }
    if (lines.length === 0) {
      const minPrice = Math.min(...CATALOGUE_PRODUCTS.map((p) => p.price));
      return `I couldn't find any menu items under Rs. ${budget?.toLocaleString() || "that amount"}. Our lowest-priced bakes start at Rs. ${minPrice.toLocaleString()} (e.g., Chocolate Chip Cookies and Trifle Cups). You can also mix treats in Build a Box!`;
    }
    const intro = budget !== null
      ? `Here are delicious options under Rs. ${budget.toLocaleString()}:\n\n`
      : `Here are our artisanal bakery favorites:\n\n`;
    return `${intro}${lines.join("\n")}\n\nTap 'Menu' at the top to see photos and order!`;
  }

  // 12. Recommendation questions
  if (/recommend|suggest|what should i|best bake|craving|favorite|popular/.test(lowered)) {
    if (/chocolate/.test(lowered)) {
      return "For chocolate lovers, I highly recommend our Choco Chip Banana Bread (Rs. 1,600) or our Double Chocolate Cookies (Rs. 350 each). Rich, fudgy, and loaded with melted chocolate chips!";
    }
    if (/tea|afternoon/.test(lowered)) {
      return "For tea time, you'll love the Coffee Bread with Walnut Crumble (Rs. 1,600) or our moist Lemon Loaf (Rs. 1,200). They pair beautifully with hot tea or coffee!";
    }
    return "Our most loved signature bakes are the warm Choco Chip Banana Bread (Rs. 1,600), freshly glazed Cinnamon Rolls (Pack of 4, Rs. 1,600), and New York Cheesecake (Rs. 3,500). What flavors do you usually crave?";
  }

  // 13. Order tracking
  const orderCodeMatch = lowered.match(/\btt\d{6}\b/i);
  if (orderCodeMatch || /track|my order|where is my order|status of order/.test(lowered)) {
    return "To look up an order, enter your order code (like TT123456) along with the last four digits of your phone number. You can also message Sana directly on WhatsApp with your code: https://wa.me/923224112832.";
  }

  // 14. Greeting / Hello
  if (/^(hi|hello|hey|salam|assalam|good morning|good afternoon|good evening)\b/.test(lowered)) {
    return "Hi! I’m Pippa, your pocket baker ✨ Tell me what you're craving, your budget, or an occasion you're celebrating, and I’ll help you find the sweetest bake!";
  }

  // Default fallback
  return "I'm Pippa, your pocket baker! I can help you check menu prices, find bakes under a budget, guide you through Build a Box and Gift Boxes, explain bank transfer payment, or assist with order questions. What can I bake up for you?";
}
