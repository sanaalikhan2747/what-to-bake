import { CATALOGUE_PRODUCTS, CATALOGUE_FESTIVE_BOXES, CATALOGUE_PACKAGING } from "./catalogueData.js";
import { PAYMENT_CONFIG } from "./paymentConfig.js";
import { buildVarietyBox, scoreProduct, getProductServes } from "./matchmaker.js";

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function parseBudget(text) {
  const clean = String(text || "").toLowerCase();
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
  if (clean.includes("thousand") || clean.includes("1k") || clean.includes("1 k")) return 1000;
  if (clean.includes("two thousand") || clean.includes("2k")) return 2000;
  if (clean.includes("twenty five hundred") || clean.includes("2500") || clean.includes("2.5k")) return 2500;
  if (clean.includes("three thousand") || clean.includes("3k")) return 3000;
  if (clean.includes("four thousand") || clean.includes("4k")) return 4000;
  if (clean.includes("fifteen hundred") || clean.includes("1500") || clean.includes("1.5k")) return 1500;
  return null;
}

function parseGuestCount(text) {
  const clean = String(text || "").toLowerCase();
  const match = clean.match(/\b(?:for|serves?|people|guests?|persons)\s*(\d{1,2})\b|\b(\d{1,2})\s*(?:people|guests?|persons)\b/);
  if (match) {
    const num = parseInt(match[1] || match[2], 10);
    if (!isNaN(num) && num > 0) return num;
  }
  if (clean.includes("couple") || clean.includes("two of us")) return 2;
  if (clean.includes("family") || clean.includes("gathering")) return 6;
  if (clean.includes("party") || clean.includes("dinner") || clean.includes("dawat")) return 8;
  return 6;
}

function extractOccasion(text) {
  const t = text.toLowerCase();
  if (t.includes("birthday") || t.includes("bday")) return "Birthday";
  if (t.includes("anniversary")) return "Anniversary";
  if (t.includes("tea") || t.includes("high tea") || t.includes("afternoon tea")) return "Tea party";
  if (t.includes("eid")) return "Eid";
  if (t.includes("graduation") || t.includes("convocation") || t.includes("milestone")) return "Graduation";
  if (t.includes("baby") || t.includes("shower") || t.includes("newborn") || t.includes("birth")) return "Baby born";
  if (t.includes("gift") || t.includes("present") || t.includes("surprise")) return "Gift";
  if (t.includes("dinner") || t.includes("family") || t.includes("dawat") || t.includes("gathering")) return "Family gathering";
  return null;
}

function extractFlavorMood(text) {
  const t = text.toLowerCase();
  if (t.includes("choc") || t.includes("fudge") || t.includes("brownie") || t.includes("malt") || t.includes("nutella") || t.includes("cocoa")) {
    return "Chocolate lover";
  }
  if (t.includes("lemon") || t.includes("mango") || t.includes("pineapple") || t.includes("citrus") || t.includes("fruit") || t.includes("zest") || t.includes("berry")) {
    return "Fresh & citrusy";
  }
  if (t.includes("cinnamon") || t.includes("apple") || t.includes("spice") || t.includes("banana") || t.includes("warm") || t.includes("comfort")) {
    return "Warm & comforting";
  }
  if (t.includes("coffee") || t.includes("walnut") || t.includes("brittle") || t.includes("caramel") || t.includes("toffee") || t.includes("banoffee")) {
    return "Coffee lover";
  }
  if (t.includes("sugar free") || t.includes("sugar-free") || t.includes("diet") || t.includes("healthy") || t.includes("dates") || t.includes("flourless") || t.includes("gluten") || t.includes("oat")) {
    return "Something different";
  }
  return null;
}

/**
 * Resilient, highly personalized Bakery Brain for Pippa.
 * Dynamically tailors replies and variety combinations based on the customer's
 * occasion, flavor cravings, guest count, and budget.
 */
export function getLocalPippaReply(message, history = []) {
  const currentText = String(message || "");
  const lowered = normalize(currentText);

  // Parse budget from current message first; only check history if user is asking a follow-up
  let budget = parseBudget(currentText);
  const isFollowUp = /cheaper|more|variety|else|other|within|budget|another|option/.test(lowered);
  if (budget === null && isFollowUp && history.length > 0) {
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].role === "user") {
        const prevBudget = parseBudget(history[i].text);
        if (prevBudget !== null) {
          budget = prevBudget;
          break;
        }
      }
    }
  }

  const people = parseGuestCount(currentText);
  const occasion = extractOccasion(currentText);
  const flavorMood = extractFlavorMood(currentText);

  // 1. Allergens and dietary safety
  if (
    /allerg|ingredient|peanut|nut\s*free|nut-free|nuts|dairy|milk|lactose|sesame|soy|eggless|eggs|vegan|halal|contain/.test(
      lowered
    )
  ) {
    return "I don't have verified allergen or ingredient sheets in my kitchen notes, so I won't guess about allergy safety. Please confirm directly with Sana on WhatsApp (+92 322 411 2832: https://wa.me/923224112832) before placing an allergy-sensitive order. I can still help you compare prices, flavors, and treats!";
  }

  // 2. Location & pick-up
  if (/where are you located|location|address|pickup address|store address|opening hours|business hours|open hours|what time do you open|email/.test(lowered)) {
    return "Treats & Temptation by SK is an artisanal studio based in Askari X, Lahore. All our bakes are prepared fresh on pre-order. We offer pick-up in Askari X and doorstep delivery across Lahore. Sana confirms exact pick-up times and arrangements directly on WhatsApp (+92 322 411 2832: https://wa.me/923224112832).";
  }

  // 3. Payment methods (Allied Bank advance transfer)
  if (/card|credit card|debit card|online payment|pay online|payment|how do i pay|bank transfer|account details|bank|iban|allied/.test(lowered)) {
    return (
      `All our bakes are freshly prepared on order. Orders are confirmed once advance payment is received ✨\n\n` +
      `Please transfer the total to confirm your slot:\n` +
      `• Bank: ${PAYMENT_CONFIG.bankName}\n` +
      `• Account Title: ${PAYMENT_CONFIG.accountTitle}\n` +
      `• IBAN: ${PAYMENT_CONFIG.iban}\n\n` +
      `Kindly share a quick screenshot of the transfer on WhatsApp (+92 322 411 2832) once done! (Online card payment and cash on deposit are unavailable).`
    );
  }

  // 4. Cash on deposit / delivery
  if (lowered.includes("cash")) {
    return "We do not offer cash on deposit or cash on delivery. All our bakes are prepared fresh to order, and slots are confirmed once advance bank transfer to Allied Bank (Farzana seemin) is received. Message Sana on WhatsApp for assistance: https://wa.me/923224112832.";
  }

  // 5. Delivery costs / delivery inquiry
  if (/delivery fee|delivery charge|delivery cost|shipping cost|how much for delivery|how much is delivery/.test(lowered)) {
    return "Delivery charges depend on your delivery location in Lahore and rider service rates (Careem / Bykea delivery). Share your area with Sana on WhatsApp (+92 322 411 2832) for an exact quote: https://wa.me/923224112832.";
  }

  // 6. Same-day orders
  if (/same day|today|urgent|in 2 hours|right now/.test(lowered)) {
    return "For same-day orders, only freshly baked Banana Bread (Classic Choco Chip & Oat Flour) is available today (subject to daily oven batches). All other menu items require 24 hours advance pre-order. Message Sana on WhatsApp to confirm today's availability: https://wa.me/923224112832.";
  }

  // 7. Custom Box / Build a Box specifics
  if (/custom box|build a box|box builder|pick and mix|pick mix|packaging|ribbon|box price|box cost|how much is a custom box/.test(lowered)) {
    const customItems = CATALOGUE_PRODUCTS.filter((p) => p.custom_box_unit != null);
    const itemPrices = customItems
      .map((p) => `${p.name}: Rs. ${p.custom_box_unit.toLocaleString()} each`)
      .join(", ");
    const boxPackaging = CATALOGUE_PACKAGING.map(
      (p) => `${p.name} (Rs. ${p.price.toLocaleString()})`
    ).join(", ");
    return (
      `In our Build a Box feature, you can create a custom assortment with individual treats!\n\n` +
      `• Per-piece treats: ${itemPrices}.\n` +
      `• Packaging choices: ${boxPackaging}, tied with a signature pink satin ribbon.\n\n` +
      `Your total is simply the sum of the treats you pick plus the packaging (Rs. 150). You can also add a handwritten note at checkout!`
    );
  }

  // 8. Ready-made Gift Boxes / Festive Boxes
  if (/gift box|gift boxes|gifting|festive box|festive boxes|tell me about gift boxes/.test(lowered)) {
    let boxes = CATALOGUE_FESTIVE_BOXES;
    if (budget !== null) {
      boxes = boxes.filter((b) => b.total <= budget);
      if (boxes.length === 0) {
        const lowest = Math.min(...CATALOGUE_FESTIVE_BOXES.map((b) => b.total));
        return `Our curated gift boxes start at Rs. ${lowest.toLocaleString()} (the Anniversary Box). Under Rs. ${budget.toLocaleString()}, you can build your own custom gift box in 'Build a Box' with individual brownies, cinnamon rolls, or cookies!`;
      }
    }
    const boxList = boxes
      .map(
        (b) =>
          `🎁 ${b.name} (Rs. ${b.total.toLocaleString()}): ` +
          b.items.map((line) => `${line.qty} × ${line.product?.name || line.product_id}`).join(", ")
      )
      .join("\n");
    const intro = budget !== null
      ? `Here are curated gift boxes within Rs. ${budget.toLocaleString()}:\n\n`
      : `Our curated gift boxes are hand-tied with a luxury ribbon and perfect for celebrations:\n\n`;
    return `${intro}${boxList}\n\nAll gift boxes come with gift tags. You can order them under 'Gifting' or customize treats in 'Build a box'!`;
  }

  // 9. Variety / Mix / Assortment request OR Budget > 1500 with variety request
  const wantsVariety = /variety|mix|assortment|combination|platter|sampler|spread|few different|several|both/.test(lowered);
  if (wantsVariety || (budget && budget >= 2000 && !/only|single|just one/.test(lowered))) {
    const effectiveBudget = budget || 3000;
    const criteria = {
      budget: effectiveBudget,
      occasion: occasion || "Celebration",
      mood: flavorMood || "Chocolate lover",
      people: people,
      dietary: "No preference",
      category: "all",
    };
    const varietyBox = buildVarietyBox(CATALOGUE_PRODUCTS, criteria);
    if (varietyBox && varietyBox.items && varietyBox.items.length >= 2) {
      const itemsList = varietyBox.items
        .map((it) => `• ${it.product.name} (Rs. ${it.line_total.toLocaleString()}) — ${it.product.category === "loaf" ? "Whole Loaf" : it.product.unit || "Treat"}`)
        .join("\n");
      return (
        `✨ Here is a curated variety combination tailored for your ${occasion ? occasion.toLowerCase() : "celebration"} (serves ${varietyBox.serves}):\n\n` +
        `${itemsList}\n\n` +
        `💰 Total: Rs. ${varietyBox.total.toLocaleString()} (within your Rs. ${effectiveBudget.toLocaleString()} budget)\n\n` +
        `This combination gives your guests a lovely balance of textures and flavors. You can add these directly to your bag, or mix and match in 'Build a box'!`
      );
    }
  }

  // 10. Occasion-specific customer requirements
  if (occasion) {
    if (occasion === "Birthday") {
      return (
        `🎂 For a wonderful birthday celebration (${people} guests), here is our top variety:\n\n` +
        `1. 🍰 Centerpiece Showstoppers:\n` +
        `   • New York Cheesecake (Rs. 2,200 — velvety, rich, classic graham crust, serves 6–8)\n` +
        `   • Salted Caramel Brownie Trifle Box (Rs. 2,500 — layers of fudgy brownie, caramel & cream)\n\n` +
        `2. 🎁 Curated Gifting:\n` +
        `   • Birthday Box (Rs. 3,800: 1 × Choco Chip Banana Bread + 4 × Double Chocolate Cookies + 1 × Box of 4 Brownies, ribbon-tied)\n\n` +
        `3. 🧁 Mini Treats for Sharing:\n` +
        `   • Malt Cake Cup (Rs. 400) or Chocolate Trifle Cup (Rs. 400)\n\n` +
        `Would you like something rich in chocolate, or a creamy cheesecake?`
      );
    }

    if (occasion === "Tea party") {
      return (
        `🫖 For an afternoon tea or high tea gathering (${people} guests), we recommend this elegant spread:\n\n` +
        `• Coffee Bread with Walnut Crumble (Rs. 1,200) — toasty, aromatic, slices like a dream\n` +
        `• Moist Lemon Loaf (Rs. 1,200) — bright citrus glaze that pairs wonderfully with hot tea\n` +
        `• Warm Cinnamon Rolls (Pack of 4, Rs. 1,600) — pillowy soft with cream cheese icing\n` +
        `• Crisp Chocolate Chip Cookies (Rs. 300 each / Pack of 4 Rs. 1,200)\n\n` +
        `Or choose our ready-made Anniversary Box (Rs. 2,400) which combines Coffee Bread with 4 Cookies!`
      );
    }

    if (occasion === "Anniversary") {
      return (
        `🥂 For a sweet anniversary celebration:\n\n` +
        `• Signature Anniversary Box (Rs. 2,400): 1 × Coffee Bread with Walnut Crumble + 4 × Chocolate Chip Cookies, tied with satin ribbon.\n` +
        `• Romantic Dessert Boxes: Banoffee Pie Trifle Box (Rs. 2,100) or New York Cheesecake (Rs. 2,200).\n` +
        `• Decadent Loaf: Double Chocolate Loaf (Rs. 1,800) or Choco Chip Banana Bread (Rs. 1,200).\n\n` +
        `You can also add a custom anniversary note at checkout!`
      );
    }

    if (occasion === "Eid" || occasion === "Family gathering") {
      return (
        `🌙 For Eid and family gatherings (${people} guests), here is a festive variety for sharing:\n\n` +
        `• Curated Eid Box (Rs. 3,800): 1 × Coconut Loaf + 4 × Double Chocolate Cookies + 1 × Box of 4 Papparoti Buns!\n` +
        `• Large Dessert Trifle Boxes (serves 6–8):\n` +
        `  - Fruit Trifle Box (Rs. 1,800) — light and refreshing with seasonal fruits\n` +
        `  - Banoffee Pie Trifle Box (Rs. 2,100) — fresh bananas and dulce de leche\n` +
        `• Loaf Favorites: Coconut Loaf (Rs. 1,200) or Apple Cinnamon Loaf (Rs. 950)\n\n` +
        `What flavor profile does your family love most?`
      );
    }

    if (occasion === "Baby born") {
      return (
        `🍼 For welcoming a new baby or celebrating a baby shower:\n\n` +
        `• Curated Baby Born Box (Rs. 2,800): 1 × Lemon Loaf + 1 × Cinnamon Rolls (Pack of 4), tied in ribbon.\n` +
        `• Gentle Treats: Mango Trifle Cup (Rs. 350) and Fruit Trifle Box (Rs. 1,800).\n` +
        `• Build a Box: Pick mini loaves, cookies, and pastel ribbons in our Box Builder!`
      );
    }

    if (occasion === "Graduation") {
      return (
        `🎓 For a milestone graduation celebration:\n\n` +
        `• Signature Graduation Box (Rs. 2,800): 1 × Coffee Bread with Walnut Crumble + 1 × Cinnamon Rolls (Pack of 4).\n` +
        `• Party Centerpieces: New York Cheesecake (Rs. 2,200) or Salted Caramel Brownie Trifle Box (Rs. 2,500).\n` +
        `• Bite-Sized Treats: Brownies (Box of 4, Rs. 1,200) and Double Chocolate Cookies (Rs. 350).`
      );
    }
  }

  // 11. Flavor cravings and mood matching
  if (flavorMood) {
    if (flavorMood === "Chocolate lover") {
      return (
        `🍫 For chocolate cravings, here is our decadent chocolate lineup:\n\n` +
        `• Fudgy & Rich: Classic Brownies (Box of 4, Rs. 1,200) or Gluten-Free Flourless Brownies (Rs. 1,200)\n` +
        `• Chilled Showstopper: Salted Caramel Brownie Trifle Box (Rs. 2,500) or Malt Cake Box (Rs. 1,800)\n` +
        `• Warm Oven Loaves: Double Chocolate Loaf (Rs. 1,800) or Choco Chip Banana Bread (Rs. 1,200)\n` +
        `• Bite-sized: Double Chocolate Cookie (Rs. 350) or Chocolate Trifle Cup (Rs. 400)\n\n` +
        `Are you craving warm baked slices or a cold creamy dessert box?`
      );
    }

    if (flavorMood === "Fresh & citrusy") {
      return (
        `🍋 For something fresh, fruity, and citrusy:\n\n` +
        `• Zesty & Glazed: Moist Lemon Loaf (Rs. 1,200 — real lemon zest & citrus glaze)\n` +
        `• Tropical Desserts: Pineapple Dessert Box (Rs. 1,800) or Fruit Trifle Box (Rs. 1,800)\n` +
        `• Chilled Cups: Mango Trifle Cup (Rs. 350) — layered sponge, mango puree, and light cream\n` +
        `• Spiced Fruit: Apple Cinnamon Loaf (Rs. 950)\n\n` +
        `These are light, refreshing, and never overwhelmingly heavy!`
      );
    }

    if (flavorMood === "Warm & comforting") {
      return (
        `☕ For warm, comforting bakery aromas:\n\n` +
        `• Cinnamon Rolls (Pack of 4, Rs. 1,600) — buttery swirl with cream cheese glaze\n` +
        `• Choco Chip Banana Bread (Rs. 1,200) — loaded with ripe bananas and melting chips\n` +
        `• Apple Cinnamon Loaf (Rs. 950) — spiced apple chunks and warm cinnamon\n` +
        `• Papparoti Buns (Box of 4, Rs. 1,200) — crispy coffee crust with buttery center\n\n` +
        `Pop any of these in the oven or microwave for 15 seconds for that fresh-out-of-the-oven bliss!`
      );
    }

    if (flavorMood === "Coffee lover") {
      return (
        `☕ For coffee lovers:\n\n` +
        `• Coffee Bread with Walnut Crumble (Rs. 1,200) — rich coffee swirl topped with toasty walnuts\n` +
        `• Coffee Cake with Nutty Brittle (Rs. 1,200) — moist coffee sponge with crunchy caramelized brittle\n` +
        `• Papparoti Buns (Box of 4, Rs. 1,200) — famous aromatic coffee caramel topping\n` +
        `• Banoffee Pie Trifle Box (Rs. 2,100) — pairs heavenly with a warm cup of espresso\n\n` +
        `Which one would pair best with your coffee?`
      );
    }

    if (flavorMood === "Something different") {
      return (
        `✨ For guilt-free, wholesome, or dietary-friendly options:\n\n` +
        `• Sugar-Free Dates Loaf (Rs. 1,800) — 100% naturally sweetened with premium dates, zero refined sugar\n` +
        `• Flourless Brownies (Box of 4, Rs. 1,200) — naturally gluten-free and deeply fudgy\n` +
        `• Oat Flour Choco Chip Banana Bread (Rs. 1,200) — wholesome oat flour recipe\n` +
        `• Oat Flour Chocolate Chip Cookie (Rs. 400 each)\n\n` +
        `Healthy indulgence crafted with pure quality ingredients!`
      );
    }
  }

  // 12. Specific product match
  const matchedProduct = CATALOGUE_PRODUCTS.find((p) => lowered.includes(normalize(p.name)));
  if (matchedProduct) {
    const isCustomQuery = /custom|single|piece|each/.test(lowered);
    const unitPrice = isCustomQuery && matchedProduct.custom_box_unit != null
      ? matchedProduct.custom_box_unit
      : matchedProduct.price;
    let detail = `🍰 **${matchedProduct.name}** is Rs. ${unitPrice.toLocaleString()} per ${matchedProduct.unit}`;
    if (isCustomQuery && matchedProduct.custom_box_unit != null) {
      detail += " in a custom box";
    }
    detail += ".";
    if (matchedProduct.serves) {
      detail += ` Serves ${matchedProduct.serves}.`;
    }
    if (matchedProduct.story) {
      detail += `\n${matchedProduct.story}`;
    }
    return detail;
  }

  // 13. Category queries
  if (/cheesecake|dessert box|dessert boxes|trifle box/.test(lowered)) {
    const desserts = CATALOGUE_PRODUCTS.filter((p) => p.category === "cheesecake");
    const list = desserts.map((p) => `• ${p.name} (Rs. ${p.price.toLocaleString()} — serves ${p.serves})`).join("\n");
    return (
      `🍰 Here are our signature cold-set Dessert Boxes & Cheesecakes (generous 6–8 servings each):\n\n` +
      `${list}\n\n` +
      `Each dessert box is layered to perfection and served chilled. Which flavor catches your eye?`
    );
  }

  if (/loaf|loaves|bread/.test(lowered)) {
    const loaves = CATALOGUE_PRODUCTS.filter((p) => p.category === "loaf");
    const list = loaves.map((p) => `• ${p.name} (Rs. ${p.price.toLocaleString()} — serves ${p.serves})`).join("\n");
    return (
      `🍞 Here is our freshly baked artisanal Loaf collection (all serve 6–8):\n\n` +
      `${list}\n\n` +
      `All loaves are baked with pure butter and real fruit/cocoa. Would you like a warm slice recommendation?`
    );
  }

  if (/cookie|cookies/.test(lowered)) {
    const cookies = CATALOGUE_PRODUCTS.filter((p) => p.category === "cookie");
    const list = cookies.map((p) => `• ${p.name} (Rs. ${p.price.toLocaleString()})`).join("\n");
    return (
      `🍪 Here are our handcrafted Cookies:\n\n` +
      `${list}\n\n` +
      `You can order individual cookies, a pack of 4, or mix them into a custom box!`
    );
  }

  if (/cup|cups|trifle cup|batch|batches|brownie|rolls/.test(lowered)) {
    const batches = CATALOGUE_PRODUCTS.filter((p) => p.category === "batch");
    const list = batches.map((p) => `• ${p.name} (Rs. ${p.price.toLocaleString()} — ${p.unit})`).join("\n");
    return (
      `🧁 Here are our individual bakes, cups & sharing batches:\n\n` +
      `${list}\n\n` +
      `Great for party platters, tea tables, or single cravings!`
    );
  }

  // 14. Budget queries (Under 1000, 1500, etc.)
  if (budget !== null || /under 1000|cheap|affordable|budget/.test(lowered)) {
    const targetBudget = budget || 1000;
    const items = CATALOGUE_PRODUCTS.filter((p) => p.price <= targetBudget);
    if (items.length === 0) {
      const minPrice = Math.min(...CATALOGUE_PRODUCTS.map((p) => p.price));
      return `Our lowest-priced bakes start at Rs. ${minPrice.toLocaleString()} (e.g. Chocolate Chip Cookie Rs. 300, Trifle Cups Rs. 350–400). In 'Build a box', you can also assemble single treats to match your budget!`;
    }

    const loaves = items.filter((p) => p.category === "loaf");
    const cups = items.filter((p) => p.category === "batch");
    const cookies = items.filter((p) => p.category === "cookie");
    const desserts = items.filter((p) => p.category === "cheesecake");

    const lines = [];
    if (loaves.length) lines.push(`🍞 **Loaves**: ` + loaves.map((it) => `${it.name} (Rs. ${it.price.toLocaleString()})`).join(", "));
    if (desserts.length) lines.push(`🍰 **Desserts**: ` + desserts.map((it) => `${it.name} (Rs. ${it.price.toLocaleString()})`).join(", "));
    if (cups.length) lines.push(`🧁 **Bakes & Cups**: ` + cups.map((it) => `${it.name} (Rs. ${it.price.toLocaleString()})`).join(", "));
    if (cookies.length) lines.push(`🍪 **Cookies**: ` + cookies.map((it) => `${it.name} (Rs. ${it.price.toLocaleString()})`).join(", "));

    return (
      `💰 Here are delicious options within Rs. ${targetBudget.toLocaleString()}:\n\n` +
      `${lines.join("\n\n")}\n\n` +
      `Tip: You can also combine treats (e.g. a Loaf + Cookie, or 2 Trifle Cups) for great variety!`
    );
  }

  // 15. Recommendation / Best seller general
  if (/recommend|suggest|what should i|best bake|favorite|popular|famous|top/.test(lowered)) {
    return (
      `✨ Our most celebrated customer favorites across the menu:\n\n` +
      `1. 🍞 **Warm Banana Bread** (Rs. 1,200) — same-day oven fresh in Lahore, pure butter with molten chocolate chips.\n` +
      `2. 🍰 **New York Cheesecake** (Rs. 2,200) — velvety smooth on a buttery graham crust, serves 6–8.\n` +
      `3. 🧁 **Cinnamon Rolls** (Pack of 4, Rs. 1,600) — pillowy soft with vanilla cream cheese icing.\n` +
      `4. 🍮 **Salted Caramel Brownie Trifle Box** (Rs. 2,500) — layered fudge brownies, caramel, and cream.\n\n` +
      `Tell me if you prefer something chocolatey, fruity, or toasty for tea time!`
    );
  }

  // 16. Greetings
  if (/^(hi|hello|hey|salam|assalam|good morning|good afternoon|good evening)\b/.test(lowered)) {
    return "Hi there! I’m Pippa, your pocket baker at Treats & Temptation by SK ✨ Tell me what you're celebrating, your budget, or flavors you're craving, and I'll curate the sweetest variety for you!";
  }

  // 17. Default helpful guide
  return (
    `I'm Pippa, your pocket baker! I can help you find the perfect bake or curate a variety spread.\n\n` +
    `Try asking me:\n` +
    `• *"What should I get for a birthday with 8 guests?"*\n` +
    `• *"Suggest a variety of bakes within Rs. 2,500"*\n` +
    `• *"I want something chocolate for tea time"*\n` +
    `• *"Tell me about gift boxes" or "How much is a custom box?"*\n\n` +
    `What are you in the mood for today?`
  );
}
