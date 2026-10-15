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
      explanation: `${fallback.name} is a baker's favourite, handcrafted with love.`,
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
    batch: "batch bake",
    cookie: "cookie treat",
  }[best.category] || "bake";

  const serves = getProductServes(best);
  const explanation = `${best.name} — a warm, homemade ${categoryName} tailored for your ${criteria.occasion ? criteria.occasion.toLowerCase() : "celebration"}. Ideal for ${criteria.people || 6} and fits gently within your Rs. ${Number(criteria.budget || 1500).toLocaleString()} budget.`;

  return {
    product: best,
    explanation,
    options: selected,
  };
}
