// Whole-Menu Bake Matchmaker Engine
// Accurately scores all catalogue products across loaves, dessert boxes, batches & cups, and cookies.

export function getProductServes(product) {
  if (!product) return { min: 1, max: 6, text: "Serving" };
  if (product.serves_min != null && product.serves_max != null) {
    return { min: product.serves_min, max: product.serves_max, text: product.serves || `${product.serves_min}–${product.serves_max}` };
  }
  if (product.batch_size) {
    return { min: product.batch_size, max: product.batch_size, text: product.unit || `Box of ${product.batch_size}` };
  }
  const unit = String(product.unit || "").toLowerCase();
  if (unit.includes("cup") || unit.includes("piece")) {
    return { min: 1, max: 2, text: product.unit || "Individual" };
  }
  return { min: 6, max: 8, text: product.serves || "6–8" };
}

export function scoreProduct(product, { occasion, mood, people, budget, dietary, category }) {
  if (!product) return -1e9;
  // If specific category is chosen and it is not 'all', exclude other categories
  if (category && category !== "all" && product.category !== category) {
    return -1e9;
  }

  let score = 0;

  // 1. Mood alignment (key emotional driver)
  if (Array.isArray(product.moods) && product.moods.includes(mood)) {
    score += 4.5;
  }

  // 2. Occasion alignment
  if (Array.isArray(product.occasions) && product.occasions.includes(occasion)) {
    score += 4.5;
  }

  // 3. Dietary preferences
  const diet = String(dietary || "No preference").toLowerCase().trim();
  if (diet === "sugar-free") {
    if (product.id === "sugar-free-dates") score += 8;
    else if (product.healthy) score += 4;
    else score -= 3;
  } else if (diet.includes("less sweet") || diet.includes("sugar")) {
    if (product.healthy) score += 5;
    if (product.id === "sugar-free-dates") score += 4;
    else if (["coconut-loaf", "apple-cinnamon-loaf", "oat-flour-banana-bread", "oat-flour-choco-chip-cookie"].includes(product.id)) {
      score += 2.5;
    }
  } else if (diet.includes("gluten")) {
    if (product.id === "flourless-brownies-batch") score += 8; // Gluten-free flourless
    else if (product.healthy || product.id.includes("oat")) score += 5; // Wholesome oat flour
  } else if (diet.includes("eggless")) {
    score += 1;
  }

  // 4. Guest count fit
  const serves = getProductServes(product);
  const count = Number(people) || 6;
  if (serves.min <= count && count <= serves.max) {
    score += 3.5;
  } else {
    const mid = (serves.min + serves.max) / 2;
    const diff = Math.abs(mid - count);
    score -= Math.min(diff * 0.2, 3.5);
  }

  // 5. Budget fit
  const price = Number(product.price) || 0;
  const maxBudget = Number(budget) || 1500;
  if (price <= maxBudget) {
    score += 3;
    const ratio = price / Math.max(1, maxBudget);
    if (ratio >= 0.4 && ratio <= 1.0) {
      score += 1.5; // Good value allocation
    }
  } else {
    const over = price - maxBudget;
    score -= over / 250; // Proportionate penalty for exceeding budget
  }

  return score;
}

export function findMatches(products, criteria, limit = 4) {
  if (!Array.isArray(products) || products.length === 0) return { product: null, options: [] };

  const scored = products
    .map((product) => ({ product, score: scoreProduct(product, criteria) }))
    .filter((entry) => entry.score > -1e8)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) {
    const fallback = products[0];
    return {
      product: fallback,
      explanation: `${fallback.name} — a signature favourite handcrafted in small batches.`,
      options: [fallback],
    };
  }

  const selected = [];
  const seenCategories = new Set();

  // Top overall match
  const best = scored[0].product;
  selected.push(best);
  seenCategories.add(best.category);

  // If searching whole menu ("all"), prioritize category diversity in the options
  if (!criteria.category || criteria.category === "all") {
    for (let i = 1; i < scored.length && selected.length < limit; i++) {
      const candidate = scored[i].product;
      if (!seenCategories.has(candidate.category)) {
        selected.push(candidate);
        seenCategories.add(candidate.category);
      }
    }
  }

  // Fill up to limit with the next highest scoring products
  for (let i = 1; i < scored.length && selected.length < limit; i++) {
    const candidate = scored[i].product;
    if (!selected.some((item) => item.id === candidate.id)) {
      selected.push(candidate);
    }
  }

  const categoryName = {
    loaf: "loaf",
    cheesecake: "dessert box",
    batch: "bake",
    cookie: "cookie treat",
  }[best.category] || "bake";

  const serves = getProductServes(best);
  const explanation = `${best.name} is an ideal match for your ${criteria.occasion ? criteria.occasion.toLowerCase() : "celebration"} — freshly baked to serve ${serves.text} within your budget.`;

  const numericBudget = Number(criteria.budget) || 1500;
  const varietyBox = numericBudget > 1500 ? buildVarietyBox(products, criteria) : null;

  return {
    product: best,
    explanation: varietyBox ? varietyBox.explanation : explanation,
    options: selected,
    varietyBox,
  };
}

export function buildVarietyBox(products, criteria) {
  const numericBudget = Number(criteria.budget) || 1500;
  if (numericBudget <= 1500 || !Array.isArray(products) || products.length === 0) {
    return null;
  }

  const diet = String(criteria.dietary || "No preference").toLowerCase().trim();
  const isDietaryCompatible = (p) => {
    if (diet === "sugar-free") return Boolean(p.healthy || p.id === "sugar-free-dates");
    if (diet.includes("less sweet") || diet.includes("sugar")) {
      return Boolean(p.healthy || ["coconut-loaf", "apple-cinnamon-loaf", "oat-flour-banana-bread", "oat-flour-choco-chip-cookie", "sugar-free-dates"].includes(p.id));
    }
    if (diet.includes("gluten")) return Boolean(p.healthy || p.id.includes("oat") || p.id === "flourless-brownies-batch");
    return true;
  };

  const pool = products.filter(isDietaryCompatible);
  if (!pool.length) return null;

  const scored = pool
    .map((product) => ({ product, score: scoreProduct(product, criteria) }))
    .filter((entry) => entry.score > -1e8)
    .sort((a, b) => b.score - a.score);

  if (!scored.length) return null;

  // Step 1: Pick a centerpiece bake that leaves budget for complementary variety
  let centerpieceEntry = scored.find(
    (e) => ["loaf", "cheesecake"].includes(e.product.category) && e.product.price <= numericBudget * 0.75
  );
  if (!centerpieceEntry) {
    centerpieceEntry = scored.find((e) => e.product.price < numericBudget) || scored[0];
  }

  const centerpiece = centerpieceEntry.product;
  const selectedItems = [{ product: centerpiece, qty: 1, line_total: centerpiece.price }];
  let currentTotal = centerpiece.price;
  const categoriesInBox = new Set([centerpiece.category]);
  const productIdsInBox = new Set([centerpiece.id]);

  // Step 2: Pick complementary treats from other categories (batch, cookie, etc.)
  const categoryOrder = ["batch", "cookie", "loaf", "cheesecake"].filter((c) => !categoriesInBox.has(c));

  for (const cat of categoryOrder) {
    const remaining = numericBudget - currentTotal;
    if (remaining < 300) break;

    const candEntry = scored.find(
      (e) =>
        e.product.category === cat &&
        !productIdsInBox.has(e.product.id) &&
        e.product.price <= remaining
    );

    if (candEntry) {
      selectedItems.push({ product: candEntry.product, qty: 1, line_total: candEntry.product.price });
      currentTotal += candEntry.product.price;
      categoriesInBox.add(candEntry.product.category);
      productIdsInBox.add(candEntry.product.id);
    }
  }

  // Step 3: If budget still remains (>= 300) and box has < 4 items, add another treat
  const remainingAfterCats = numericBudget - currentTotal;
  if (remainingAfterCats >= 300 && selectedItems.length < 4) {
    const extraEntry = scored.find(
      (e) =>
        !productIdsInBox.has(e.product.id) &&
        e.product.price <= remainingAfterCats
    );
    if (extraEntry) {
      selectedItems.push({ product: extraEntry.product, qty: 1, line_total: extraEntry.product.price });
      currentTotal += extraEntry.product.price;
      categoriesInBox.add(extraEntry.product.category);
      productIdsInBox.add(extraEntry.product.id);
    }
  }

  // Return variety box only if at least 2 distinct products are included
  if (selectedItems.length < 2) {
    return null;
  }

  let minServes = 0;
  let maxServes = 0;
  selectedItems.forEach((it) => {
    const s = getProductServes(it.product);
    minServes += (s.min || 1) * it.qty;
    maxServes += (s.max || 1) * it.qty;
  });

  const occasionLabel = criteria.occasion || "Celebration";
  const namesList = selectedItems.map((it) => it.product.name).join(" + ");
  const explanation = `Curated variety box for your ${occasionLabel.toLowerCase()}: a celebratory combination of ${namesList}. Handcrafted to serve ${minServes}–${maxServes} guests within your Rs. ${numericBudget.toLocaleString()} budget.`;

  return {
    isVarietyBox: true,
    name: `${occasionLabel} Variety Box`,
    tagline: `Curated assortment of ${selectedItems.length} handcrafted bakes for ${criteria.people || minServes} guests`,
    items: selectedItems,
    total: currentTotal,
    serves: `${minServes}–${maxServes} guests`,
    servesMin: minServes,
    servesMax: maxServes,
    explanation,
    categories: Array.from(categoriesInBox),
    centerpiece,
  };
}
