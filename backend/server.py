from fastapi import FastAPI, APIRouter, HTTPException
from speech import transcribe_request
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import random
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Literal
import uuid
import json
import asyncio
import re
from datetime import datetime, timezone
try:
    from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone
except ImportError:
    LlmChat = UserMessage = TextDelta = StreamDone = None


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ.get('MONGO_URL', '')
if mongo_url:
    client = AsyncIOMotorClient(
        mongo_url,
        serverSelectionTimeoutMS=int(os.environ.get("MONGO_SERVER_SELECTION_TIMEOUT_MS", "5000")),
    )
    db = client[os.environ.get('DB_NAME', 'whattobake')]
else:
    client = None
    db = None

app = FastAPI()
api_router = APIRouter(prefix="/api")


# ---------- Static catalogue ----------

# Whole-menu items. `custom_box_unit` (optional) is the per-piece price in a custom box.
PRODUCTS = [
     # Loaves
     {"id": "apple-cinnamon-loaf", "name": "Apple Cinnamon Loaf", "category": "loaf", "price": 950,
      "serves": "6–8", "serves_min": 6, "serves_max": 8, "unit": "loaf",
      "moods": ["Warm & comforting"], "occasions": ["Tea party", "Family gathering", "Anniversary", "Just craving something"],
      "image": "https://res.cloudinary.com/n9pu62pg/image/upload/v1792842257/Screenshot_20261012_231833_Chrome.jpg",
      "story": "Warm spice and cinnamon folded into a tender, golden crumb."},
     {"id": "chocolate-chip-banana", "name": "Choco Chip Banana Bread", "category": "loaf", "price": 1200,
      "serves": "6–8", "serves_min": 6, "serves_max": 8, "unit": "loaf",
      "addons": [{"name": "Walnuts", "price": 100}],
      "moods": ["Warm & comforting", "Chocolate lover"], "occasions": ["Tea party", "Family gathering", "Just craving something", "Birthday"],
      "image": "https://res.cloudinary.com/n9pu62pg/image/upload/v1790870752/image_6ac914dd.jpg",
      "story": "Classic banana bread loaded with melted semi-sweet chocolate chips."},
     {"id": "lemon-loaf", "name": "Lemon Loaf", "category": "loaf", "price": 1200,
      "serves": "6–8", "serves_min": 6, "serves_max": 8, "unit": "loaf",
      "moods": ["Fresh & citrusy"], "occasions": ["Tea party", "Gift", "Baby born", "Just craving something"],
      "image": "https://res.cloudinary.com/n9pu62pg/image/upload/v1791123638/IMG-20261004-WA0232.jpg",
      "story": "Zesty lemon loaf with a moist crumb, topped with citrus glaze."},
     {"id": "coconut-loaf", "name": "Coconut Loaf", "category": "loaf", "price": 1200,
      "serves": "6–8", "serves_min": 6, "serves_max": 8, "unit": "loaf",
      "moods": ["Something different", "Fresh & citrusy"], "occasions": ["Tea party", "Gift", "Eid", "Anniversary"],
      "image": "https://res.cloudinary.com/n9pu62pg/image/upload/v1790866286/IMG-20250821-WA0289.jpg",
      "story": "Toasted coconut loaf with a tender, buttery crumb."},
     {"id": "coffee-walnut-loaf", "name": "Coffee Bread with Walnut Crumble", "category": "loaf", "price": 1200,
      "serves": "6–8", "serves_min": 6, "serves_max": 8, "unit": "loaf",
      "moods": ["Coffee lover", "Warm & comforting"], "occasions": ["Anniversary", "Family gathering", "Graduation", "Tea party"],
      "image": "https://res.cloudinary.com/n9pu62pg/image/upload/v1790869322/image_6aeade9c_1.jpg",
      "story": "Espresso-infused loaf topped with a buttery, crunchy walnut crumble."},
    {"id": "double-chocolate-loaf", "name": "Double Chocolate Loaf", "category": "loaf", "price": 1800,
     "serves": "6–8", "serves_min": 6, "serves_max": 8, "unit": "loaf",
      "moods": ["Chocolate lover"], "occasions": ["Birthday", "Gift", "Just craving something"],
      "image": "https://res.cloudinary.com/n9pu62pg/image/upload/v1791141262/Gemini_Generated_Image_asmttfasmttfasmt.jpg",
      "story": "Rich cocoa crumb studded with molten chocolate chunks throughout."},
    {"id": "mini-loaves-pack", "name": "Mini Loaves (Pack of 4)", "category": "loaf", "price": 2000,
     "serves": "4 mini loaves", "serves_min": 4, "serves_max": 8,
     "unit": "pack of 4", "batch_size": 4, "variants": ["Lemon", "Coconut", "Coffee Walnut", "Double Chocolate"],
      "moods": ["Something different", "Gift"], "occasions": ["Gift", "Tea party", "Family gathering"],
      "image": "https://res.cloudinary.com/n9pu62pg/image/upload/v1791140536/Gemini_Generated_Image_sajcjgsajcjgsajc.jpg",
      "story": "Four artisanal mini loaves — mix any combination of loaf flavours."},
     {"id": "sugar-free-dates", "name": "Sugar-Free Dates Loaf", "category": "loaf", "price": 1800,
      "serves": "6–8", "serves_min": 6, "serves_max": 8, "unit": "loaf", "healthy": True,
      "note": "with walnuts & chocolate chips",
      "moods": ["Warm & comforting", "Something different"], "occasions": ["Gift", "Family gathering", "Just craving something"],
      "image": "https://res.cloudinary.com/n9pu62pg/image/upload/v1790869786/image_8402ea07.jpg",
      "story": "Naturally sweetened with Arabian dates and crunchy walnuts."},
    {"id": "oat-flour-banana-bread", "name": "Oat Flour Choco Chip Banana Bread", "category": "loaf", "price": 1200,
     "serves": "6–8", "serves_min": 6, "serves_max": 8, "unit": "loaf", "healthy": True,
      "note": "Wholesome oat flour & dark chocolate",
      "moods": ["Warm & comforting", "Chocolate lover"], "occasions": ["Tea party", "Gift", "Just craving something"],
      "image": "https://res.cloudinary.com/n9pu62pg/image/upload/v1790870752/image_6ac914dd.jpg",
      "story": "Wholesome oat flour, ripe bananas, and rich chocolate chips."},

     # Cheesecake & dessert boxes
     {"id": "nyc-cheesecake", "name": "New York Cheesecake", "category": "cheesecake", "price": 2200,
      "unit": "1 lb", "serves": "6–8", "serves_min": 6, "serves_max": 8,
      "variants": ["Strawberry Topping", "Lemon Topping"],
      "moods": ["Fresh & citrusy", "Something different"], "occasions": ["Anniversary", "Birthday", "Gift"],
      "image": "https://res.cloudinary.com/n9pu62pg/image/upload/v1790867632/IMG-20250913-WA0191.jpg",
      "story": "Silky slow-baked cheesecake on a buttery biscuit crust with fruit topping."},
     {"id": "pineapple-cheesecake", "name": "Pineapple Dessert Box", "category": "cheesecake", "price": 1800,
      "unit": "1 lb", "serves": "6–8", "serves_min": 6, "serves_max": 8,
      "moods": ["Fresh & citrusy", "Something different"], "occasions": ["Tea party", "Gift", "Family gathering"],
      "image": "https://res.cloudinary.com/n9pu62pg/image/upload/v1791622441/419066.jpg",
      "story": "Juicy tropical pineapple layered with light, pillowy cream cheese."},
     {"id": "banoffee-pie", "name": "Banoffee Pie Trifle Box", "category": "cheesecake", "price": 2100,
      "unit": "1 box", "serves": "6–8", "serves_min": 6, "serves_max": 8,
      "moods": ["Warm & comforting"], "occasions": ["Family gathering", "Anniversary", "Gift"],
      "image": "https://res.cloudinary.com/n9pu62pg/image/upload/v1791621229/Gemini_Generated_Image_5o2yxo5o2yxo5o2y.jpg",
      "story": "Dulce de leche toffee, fresh bananas, and coffee-dusted whipped cream."},
     {"id": "coffee-cake-nutty", "name": "Coffee Cake with Nutty Brittle", "category": "cheesecake", "price": 1200,
      "unit": "1 lb", "serves": "6–8", "serves_min": 6, "serves_max": 8,
      "moods": ["Coffee lover"], "occasions": ["Tea party", "Anniversary", "Graduation"],
      "image": "https://res.cloudinary.com/n9pu62pg/image/upload/v1791621156/Gemini_Generated_Image_xbirs4xbirs4xbir.jpg",
      "story": "Deep roast coffee crumb frosted with buttercream and crunchy nut brittle."},
     {"id": "fruit-trifle-box", "name": "Fruit Trifle Box", "category": "cheesecake", "price": 1800,
      "unit": "1 box", "serves": "6–8", "serves_min": 6, "serves_max": 8,
      "moods": ["Fresh & citrusy"], "occasions": ["Family gathering", "Tea party", "Gift"],
      "image": "https://res.cloudinary.com/n9pu62pg/image/upload/v1791621178/Gemini_Generated_Image_6u3an76u3an76u3a.jpg",
      "story": "Golden sponge layered with fresh seasonal fruit and silky custard."},
     {"id": "salted-caramel-brownie-trifle", "name": "Salted Caramel Brownie Trifle Box", "category": "cheesecake", "price": 2500,
      "unit": "1 box", "serves": "6–8", "serves_min": 6, "serves_max": 8,
      "moods": ["Chocolate lover"], "occasions": ["Birthday", "Family gathering", "Gift"],
      "image": "https://res.cloudinary.com/n9pu62pg/image/upload/v1791624702/Gemini_Generated_Image_5j06gv5j06gv5j06.jpg",
      "story": "Fudgy brownie bites, housemade salted caramel, and chantilly cream."},
     {"id": "malt-cake-box", "name": "Malt Cake Box", "category": "cheesecake", "price": 1800,
      "unit": "1 box", "serves": "6–8", "serves_min": 6, "serves_max": 8,
      "moods": ["Chocolate lover"], "occasions": ["Birthday", "Family gathering", "Gift"],
      "image": "https://res.cloudinary.com/n9pu62pg/image/upload/v1791621203/Gemini_Generated_Image_92833d92833d9283.jpg",
      "story": "Tender chocolate malt cake frosted with signature malt fudge."},

     # Brownies, bakes & dessert cups
     {"id": "flourless-brownies-batch", "name": "Flourless Brownies (Box of 4)", "category": "batch", "price": 1200,
      "unit": "box of 4", "batch_size": 4, "custom_box_unit": 300, "healthy": True,
      "note": "Gluten-free & intensely chocolatey", "variants": ["Flourless Fudgy"],
      "moods": ["Chocolate lover"], "occasions": ["Gift", "Just craving something", "Birthday"],
      "image": "https://res.cloudinary.com/n9pu62pg/image/upload/v1791141497/Gemini_Generated_Image_jh3tl4jh3tl4jh3t.jpg",
      "story": "Gluten-friendly, intensely rich dark chocolate fudge brownies."},
     {"id": "brownies-batch", "name": "Brownies (Box of 4)", "category": "batch", "price": 1200,
      "unit": "box of 4", "batch_size": 4, "custom_box_unit": 300,
      "variants": ["Classic Fudgy", "Walnut Fudge", "Flourless"],
      "moods": ["Chocolate lover"], "occasions": ["Gift", "Just craving something", "Birthday"],
      "image": "https://res.cloudinary.com/n9pu62pg/image/upload/v1791141801/Gemini_Generated_Image_wxnq4owxnq4owxnq.jpg",
      "story": "Dense, crinkly-topped fudge brownies in your favourite mix of flavours."},
     {"id": "cinnamon-rolls-batch", "name": "Cinnamon Rolls (Pack of 4)", "category": "batch", "price": 1600,
      "unit": "pack of 4", "batch_size": 4, "custom_box_unit": 400,
      "variants": ["Chocolate", "Vanilla"],
      "moods": ["Warm & comforting"], "occasions": ["Tea party", "Family gathering", "Baby born"],
      "image": "https://res.cloudinary.com/n9pu62pg/image/upload/v1790941291/IMG-20261002-WA0200.jpg",
      "story": "Soft brioche spirals spiced with Ceylon cinnamon and sweet glaze."},
     {"id": "papparoti-batch", "name": "Papparoti Buns (Box of 4)", "category": "batch", "price": 1200,
      "unit": "box of 4", "batch_size": 4, "custom_box_unit": 300,
      "variants": ["Classic Coffee Crust"],
      "moods": ["Coffee lover", "Warm & comforting"], "occasions": ["Tea party", "Just craving something"],
      "image": "https://res.cloudinary.com/n9pu62pg/image/upload/v1790938012/IMG-20261002-WA0137.jpg",
      "story": "Buttery brioche buns topped with a crisp coffee caramel crust."},
     {"id": "mango-trifle-cup", "name": "Mango Trifle Cup", "category": "batch", "price": 350,
      "unit": "cup", "moods": ["Fresh & citrusy"], "occasions": ["Tea party", "Gift", "Just craving something"],
      "image": "https://res.cloudinary.com/dffsqfwok/image/upload/w_900,q_auto,f_auto/v1790760596/Mango_dessert_trays_on_surface_2K_20260930142859_zpcb6w.jpg",
      "story": "Layers of sponge, fresh mango puree, and delicate custard cream."},
     {"id": "chocolate-trifle-cup", "name": "Chocolate Trifle Cup", "category": "batch", "price": 400,
      "unit": "cup", "moods": ["Chocolate lover"], "occasions": ["Gift", "Birthday", "Just craving something"],
      "image": "https://res.cloudinary.com/n9pu62pg/image/upload/v1791142811/Gemini_Generated_Image_kp9srkp9srkp9srk.jpg",
      "story": "Rich chocolate sponge, silky mousse, and chocolate shavings."},
     {"id": "malt-cake-cup", "name": "Malt Cake Cup", "category": "batch", "price": 400,
      "unit": "cup", "moods": ["Chocolate lover"], "occasions": ["Gift", "Birthday", "Just craving something"],
      "image": "https://res.cloudinary.com/n9pu62pg/image/upload/v1790867380/ChatGPT_Image_Jun_13_2026_12_23_46_AM.png",
      "story": "Malted chocolate sponge topped with fluffy malt glaze."},
     {"id": "dessert-cups-pack", "name": "Dessert Cups (Pack of 4)", "category": "batch", "price": 1500,
      "unit": "pack of 4", "batch_size": 4, "variants": ["Mango Trifle", "Chocolate Trifle", "Malt Cake"],
      "moods": ["Something different", "Gift"], "occasions": ["Gift", "Tea party", "Family gathering"],
      "image": "https://res.cloudinary.com/n9pu62pg/image/upload/v1791142771/Gemini_Generated_Image_kvm9lykvm9lykvm9_1.jpg",
      "story": "Four individual dessert cups in any mix of flavours you choose."},

     # Artisanal cookies
     {"id": "oat-flour-choco-chip-cookie", "name": "Oat Flour Chocolate Chip Cookie", "category": "cookie", "price": 400,
      "unit": "piece", "custom_box_unit": 400, "healthy": True,
      "note": "Nutrient-rich & hearty crunch",
      "moods": ["Chocolate lover", "Warm & comforting"], "occasions": ["Gift", "Just craving something"],
      "image": "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=900&q=85",
      "story": "Hearty oat flour with melted chocolate chips — crisp edges and a soft center."},
     {"id": "chocolate-chip-cookie", "name": "Chocolate Chip Cookie", "category": "cookie", "price": 300,
      "unit": "piece", "custom_box_unit": 300,
      "moods": ["Chocolate lover", "Warm & comforting"], "occasions": ["Gift", "Just craving something"],
      "image": "https://res.cloudinary.com/n9pu62pg/image/upload/v1790937990/IMG-20261002-WA0186.jpg",
      "story": "Crisp golden edges with gooey semi-sweet chocolate pooled inside."},
     {"id": "double-chocolate-cookie", "name": "Double Chocolate Cookie", "category": "cookie", "price": 350,
      "unit": "piece", "custom_box_unit": 350,
      "moods": ["Chocolate lover"], "occasions": ["Birthday", "Gift", "Just craving something"],
      "image": "https://res.cloudinary.com/n9pu62pg/image/upload/v1790938869/IMG-20261002-WA0190.jpg",
      "story": "Pure chocolate dough packed with milk and dark chocolate chunks."},
     {"id": "cookies-pack", "name": "Cookies (Pack of 4)", "category": "cookie", "price": 1200,
      "unit": "pack of 4", "batch_size": 4, "variants": ["Chocolate Chip", "Double Chocolate", "Oat Flour Chocolate Chip"],
      "moods": ["Chocolate lover", "Gift"], "occasions": ["Gift", "Tea party", "Birthday"],
      "image": "https://res.cloudinary.com/n9pu62pg/image/upload/v1790937990/IMG-20261002-WA0186.jpg",
      "story": "Four freshly baked artisanal cookies in any combination you choose."},
]


PACKAGING = [
    {"id": "clear-box", "name": "Clear Plastic Box with Pink Ribbon", "price": 150, "ribbon": "pink", "style": "clear",
     "image": "https://customer-assets-rejwkqb3.emergentagent.net/job_bake-moment/artifacts/byzd23k4_2981-Pastry-Box-9-x-6.webp"},
    {"id": "white-box", "name": "White Cardboard Box with Pink Ribbon", "price": 150, "ribbon": "pink", "style": "white",
     "image": "https://customer-assets-rejwkqb3.emergentagent.net/job_bake-moment/artifacts/ww1p99rw_2666-Brownie-Box-6x6x2.webp"},
    {"id": "kraft-box", "name": "Brown Kraft Box with Pink Ribbon", "price": 150, "ribbon": "pink", "style": "kraft",
     "image": "https://customer-assets-rejwkqb3.emergentagent.net/job_bake-moment/artifacts/98od3myz_2666-1-Brownie-Box-6-x-6-x-2-4-Pcs-.webp"},
]


FESTIVE_BOXES = [
    {"id": "anniversary-box", "name": "Anniversary Box", "tagline": "Slow, warm and a little bit romantic.",
    "items": [{"product_id": "coffee-walnut-loaf", "qty": 1}, {"product_id": "chocolate-chip-cookie", "qty": 4}],
        "image": "https://res.cloudinary.com/dffsqfwok/image/upload/v1790781186/Bakery_gift_box_product_shoot_2K_20260930201127_tpv8bt.jpg?pid=1617118601021"},
    {"id": "birthday-box", "name": "Birthday Box", "tagline": "The loud, chocolatey kind of joy.",
     "items": [{"product_id": "chocolate-chip-banana", "qty": 1}, {"product_id": "double-chocolate-cookie", "qty": 4}, {"product_id": "brownies-batch", "qty": 1}],
        "image": "https://res.cloudinary.com/dffsqfwok/image/upload/v1790781445/Bakery_product_shoot_for_website_2K_20260930201702_wr1y0v.jpg?pid=1700045530510"},
    {"id": "graduation-box", "name": "Graduation Box", "tagline": "A proud, celebratory afternoon.",
     "items": [{"product_id": "coffee-walnut-loaf", "qty": 1}, {"product_id": "cinnamon-rolls-batch", "qty": 1}],
        "image": "https://res.cloudinary.com/dffsqfwok/image/upload/v1790781742/Graduation_pastry_gift_box_shoot_2K_20260930202204_uatomr.jpg?pid=1764385827123"},
    {"id": "eid-box", "name": "Eid Box", "tagline": "Sweet, generous and made for sharing.",
    "items": [{"product_id": "coconut-loaf", "qty": 1}, {"product_id": "double-chocolate-cookie", "qty": 4}, {"product_id": "papparoti-batch", "qty": 1}],
        "image": "https://res.cloudinary.com/dffsqfwok/image/upload/v1790782194/Eid_dessert_box_product_shoot_2K_20260930202830_gn5gmr.jpg?pid=1513201099705"},
    {"id": "baby-born-box", "name": "Baby Born Box", "tagline": "Gentle, bright and full of good wishes.",
     "items": [{"product_id": "lemon-loaf", "qty": 1}, {"product_id": "cinnamon-rolls-batch", "qty": 1}],
        "image": "https://res.cloudinary.com/dffsqfwok/image/upload/v1790782197/Designing_baby_dessert_gift_box_2K_20260930202937_vsh6nh.jpg?pid=1700045530510"},
]


def _by_id():
    return {p["id"]: p for p in PRODUCTS}


def _pack_by_id():
    return {p["id"]: p for p in PACKAGING}


def _hydrate_box(box):
    pmap = _by_id()
    items = []
    total = 0
    for it in box["items"]:
        p = pmap.get(it["product_id"])
        if not p:
            continue
        items.append({"product": p, "qty": it["qty"]})
        total += p["price"] * it["qty"]
    return {**box, "items": items, "total": total}


# ---------- Models ----------

class MatchRequest(BaseModel):
    occasion: str
    mood: str
    people: int
    budget: int
    dietary: str = "No preference"
    category: Optional[str] = "all"


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=1000)
    session_id: Optional[str] = None
    history: Optional[List[dict]] = Field(default=None, max_length=12)


class SaveMatchRequest(BaseModel):
    product_id: str
    occasion: str
    mood: str
    people: int
    budget: int
    dietary: str = "No preference"
    explanation: str


class OrderItem(BaseModel):
    product_id: str
    qty: int = Field(ge=1, le=99)
    # When True, use custom_box_unit price instead of the full/batch price.
    custom_box: bool = False


class Customer(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    phone: str = Field(min_length=6, max_length=30)
    address: str = Field(min_length=4, max_length=400)
    delivery_date: Optional[str] = None
    email: Optional[str] = None
    notes: Optional[str] = None


class CreateOrderRequest(BaseModel):
    items: List[OrderItem]
    packaging_id: Optional[str] = None
    personalized_message: Optional[str] = Field(default=None, max_length=140)
    customer: Customer


# ---------- Matchmaker (loaves only — the emotional layer) ----------

LOAF_CATALOGUE_FOR_AI = [
    {"name": p["name"], "price": p["price"], "serves": p["serves"], "moods": p["moods"], "occasions": p["occasions"]}
    for p in PRODUCTS if p["category"] == "loaf"
]

FULL_CATALOGUE_FOR_AI = [
    {"name": p["name"], "price": p["price"], "unit": p.get("unit", "each"), "moods": p["moods"], "occasions": p["occasions"]}
    for p in PRODUCTS
]


def _product_serves_range(product):
    if "serves_min" in product and "serves_max" in product:
        return product["serves_min"], product["serves_max"]
    batch_size = product.get("batch_size")
    if batch_size:
        return batch_size, batch_size
    unit = str(product.get("unit", "")).lower()
    if any(k in unit for k in ("cup", "piece", "each")):
        return 1, 2
    return 6, 8


def _score(product, req: MatchRequest):
    if req.category and req.category != "all":
        if product["category"] != req.category:
            return -1e9

    score = 0.0

    # 1. Mood alignment
    if req.mood in product.get("moods", []):
        score += 4.5

    # 2. Occasion alignment
    if req.occasion in product.get("occasions", []):
        score += 4.5

    # 3. Dietary preferences
    diet = (req.dietary or "No preference").lower().strip()
    if "sugar" in diet or "less sweet" in diet:
        if product.get("healthy"):
            score += 5.0
        if product.get("id") == "sugar-free-dates":
            score += 4.0
        elif product.get("id") in ("coconut-loaf", "apple-cinnamon-loaf", "oat-flour-banana-bread", "oat-flour-choco-chip-cookie"):
            score += 2.5
    elif "gluten" in diet:
        if product.get("id") == "flourless-brownies-batch":
            score += 8.0
        elif product.get("healthy") or "oat" in product.get("id", ""):
            score += 5.0
    elif "eggless" in diet:
        score += 1.0

    # 4. Guest count fit
    s_min, s_max = _product_serves_range(product)
    people = max(1, req.people)
    if s_min <= people <= s_max:
        score += 3.5
    else:
        mid = (s_min + s_max) / 2.0
        dist = abs(mid - people)
        score -= min(dist * 0.2, 3.5)

    # 5. Budget fit
    price = product.get("price", 0)
    budget = req.budget or 1500
    if price <= budget:
        score += 3.0
        ratio = price / max(1, budget)
        if 0.4 <= ratio <= 1.0:
            score += 1.5
    else:
        over = price - budget
        score -= (over / 250.0)

    return score


def _pick_options(req: MatchRequest, limit: int = 4):
    scored = [(p, _score(p, req)) for p in PRODUCTS]
    scored = [x for x in scored if x[1] > -1e8]
    scored.sort(key=lambda x: x[1], reverse=True)

    if not scored:
        return [PRODUCTS[0]] if PRODUCTS else []

    selected = []
    seen_cats = set()

    # Top overall match
    top = scored[0][0]
    selected.append(top)
    seen_cats.add(top["category"])

    # If category is "all", prioritize category diversity across options
    if not req.category or req.category == "all":
        for p, s in scored[1:]:
            if len(selected) >= limit:
                break
            if p["category"] not in seen_cats:
                selected.append(p)
                seen_cats.add(p["category"])

    # Fill remaining spots with top scores
    for p, s in scored[1:]:
        if len(selected) >= limit:
            break
        if p not in selected:
            selected.append(p)

    return selected


def _pick_product(req: MatchRequest):
    options = _pick_options(req, limit=1)
    return options[0] if options else PRODUCTS[0]


async def ask_baker(prompt: str, session_id: str, system_extra: str = "", full_catalogue: bool = True, history=None):
    catalogue = FULL_CATALOGUE_FOR_AI if full_catalogue else LOAF_CATALOGUE_FOR_AI
    system_message = (
        "You are the warm, concise home baker for Treats & Temptation by SK. "
        "Only ever mention items from this catalogue (never invent products, prices or ingredients): "
        + json.dumps(catalogue) + ". "
        "Speak like a friend, not a menu. Keep replies under 90 words. All prices are in Rs. "
        "The catalogue does not contain verified ingredient or allergen lists. Never guess ingredients or claim a product is safe for an allergy; recommend confirming directly with the baker. "
        "Do not claim access to private orders. Order tracking is handled separately by the secure order lookup. "
        "Verified website details: WhatsApp +92 322 411 2832; all bakes are freshly prepared on order and orders are confirmed once advance payment is received; payment is by advance bank transfer to Allied bank (Account Title: Farzana seemin, IBAN: PK53ABPA0010070700810022); customers share a transfer screenshot on WhatsApp to confirm their slot; online card payment and cash on deposit are unavailable; pickup address and opening hours are not published, so Sana confirms pickup availability, location and time directly. "
        "The website has a full menu, a build-your-own box with per-piece pricing and Rs. 150 pink-ribbon packaging, five festive gift boxes, a checkout form, and order pages. Never invent delivery zones, same-day availability, an email, a physical address, business hours, discounts, or stock status."
    )
    if system_extra:
        system_message += " " + system_extra
    if LlmChat is not None and os.environ.get("EMERGENT_LLM_KEY"):
        chat = LlmChat(api_key=os.environ["EMERGENT_LLM_KEY"], session_id=session_id, system_message=system_message).with_model("openai", "gpt-4o-mini")
        text = ""
        async for event in chat.stream_message(UserMessage(text=prompt)):
            if isinstance(event, TextDelta):
                text += event.content
            elif isinstance(event, StreamDone):
                break
        return text.strip()

    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("No AI provider key is configured")

    def request_completion():
        import requests
        messages = [{"role": "system", "content": system_message}]
        for turn in (history or [])[-10:]:
            if not isinstance(turn, dict) or turn.get("role") not in ("user", "assistant"):
                continue
            text = str(turn.get("text", "")).strip()[:1000]
            if text:
                messages.append({"role": turn["role"], "content": text})
        messages.append({"role": "user", "content": prompt})
        response = requests.post(
            os.environ.get("OPENAI_API_URL", "https://api.openai.com/v1/chat/completions"),
            headers={"Authorization": f"Bearer {api_key}"},
            json={
                "model": os.environ.get("OPENAI_MODEL", "gpt-4o-mini"),
                "messages": messages,
                "temperature": 0.5,
                "max_tokens": 180,
            },
            timeout=20,
        )
        response.raise_for_status()
        return response.json()["choices"][0]["message"]["content"].strip()

    return await asyncio.to_thread(request_completion)


def _spoken_number(tokens):
    small = {
        "zero": 0, "one": 1, "two": 2, "three": 3, "four": 4, "five": 5,
        "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10,
        "eleven": 11, "twelve": 12, "thirteen": 13, "fourteen": 14,
        "fifteen": 15, "sixteen": 16, "seventeen": 17, "eighteen": 18,
        "nineteen": 19, "twenty": 20, "thirty": 30, "forty": 40,
        "fifty": 50, "sixty": 60, "seventy": 70, "eighty": 80, "ninety": 90,
    }
    current = 0
    total = 0
    found = False
    for token in tokens:
        if token == "and":
            continue
        if token in small:
            current += small[token]
            found = True
        elif token == "hundred":
            current = max(current, 1) * 100
            found = True
        elif token in ("thousand", "k"):
            total += max(current, 1) * 1000
            current = 0
            found = True
        else:
            break
    return total + current if found else None


def _catalogue_chat_reply(message: str, history=None):
    normalize = lambda text: re.sub(r"[^a-z0-9]+", " ", str(text).lower()).strip()
    lowered = normalize(message)
    user_history = [
        str(turn.get("text", "")) for turn in (history or [])
        if isinstance(turn, dict) and turn.get("role") == "user" and turn.get("text")
    ][-4:]
    context = normalize(" ".join(user_history))
    query = normalize(f"{message} {' '.join(user_history)}")

    raw_context = re.sub(r"[^a-z0-9, ]", " ", " ".join([message, *user_history]).lower())
    amount_pattern = r"((?:\d{1,3}(?:[, ]\d{3})+)|\d+)"
    budget_pattern = rf"(?:under|below|within|budget(?:\s+(?:of|is|around))?|up to|upto|less than|spend(?:ing)?(?:\s+(?:up to|under|around))?|maximum(?:\s+budget)?|max(?:imum)?\s+spend)\s*(?:rs\.?\s*)?{amount_pattern}"
    budget_match = re.search(budget_pattern, raw_context)
    if not budget_match:
        budget_match = re.search(rf"\brs\.?\s*{amount_pattern}\b", raw_context)
    budget = int(re.sub(r"[, ]", "", budget_match.group(1))) if budget_match else None
    if budget is None:
        tokens = raw_context.split()
        cues = {"under", "below", "within", "budget", "upto", "spend", "maximum", "max"}
        fillers = {"rs", "rupees", "about", "around", "of", "is", "up", "to", "less", "than"}
        number_tokens = set(("zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty thirty forty fifty sixty seventy eighty ninety hundred thousand k and").split())
        for index, token in enumerate(tokens):
            if token not in cues:
                continue
            cursor = index + 1
            while cursor < len(tokens) and tokens[cursor] in fillers:
                cursor += 1
            spoken_tokens = []
            while cursor < len(tokens) and tokens[cursor] in number_tokens:
                spoken_tokens.append(tokens[cursor])
                cursor += 1
            budget = _spoken_number(spoken_tokens)
            if budget is not None:
                break
    budget_exclusive = bool(re.search(r"\b(?:under|below|less than)\b", raw_context))
    within_budget = lambda amount: budget is None or (amount < budget if budget_exclusive else amount <= budget)
    people_match = re.search(r"\b(?:for|serves?|people|guests?)\s+(\d{1,2})\b|\b(\d{1,2})\s*(?:people|guests?|persons)\b", lowered)
    if not people_match:
        people_match = re.search(r"\b(?:for|serves?|people|guests?)\s+(\d{1,2})\b|\b(\d{1,2})\s*(?:people|guests?|persons)\b", context)
    people = int(next(group for group in people_match.groups() if group)) if people_match else None
    if people is None:
        people_words = set("zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty thirty forty fifty sixty seventy eighty ninety".split())
        tokens = raw_context.split()
        for index, token in enumerate(tokens[:-1]):
            if token not in ("for", "serves", "serving"):
                continue
            count = _spoken_number(tokens[index + 1:index + 3])
            if count is not None and count <= 99 and any(person in tokens[index + 1:index + 5] for person in ("people", "guests", "persons")):
                people = count
                break

    if any(word in lowered for word in ("allerg", "ingredient", "peanut", "tree nut", "nut free", "nut-free", "nuts", "gluten", "dairy", "milk", "lactose", "sesame", "soy", "eggless", "eggs", "vegan", "vegetarian", "halal", "contain", "contains")):
        return "I don't have verified ingredient or allergen sheets, so I won't guess about allergy safety. Please confirm directly with Sana before ordering: https://wa.me/923224112832. I can still help compare bakes and prices."

    if any(word in lowered for word in ("email", "email address", "street address", "physical address", "store address", "where are you located", "your address", "opening hours", "business hours", "what time do you open")):
        if "email" in lowered:
            detail = "There isn't a public email address listed."
        elif any(word in lowered for word in ("hour", "open", "close", "time")):
            detail = "Opening hours aren't published, so please message Sana to arrange a time."
        else:
            detail = "The pick-up address isn't published; Sana confirms the location for each order."
        return f"{detail} WhatsApp Sana at +92 322 411 2832: https://wa.me/923224112832."

    if any(word in lowered for word in ("card", "credit card", "debit card", "online payment", "pay online", "payment", "how do i pay", "bank transfer", "account details", "bank", "iban")):
        return (
            "All our bakes are freshly prepared on order. Orders are confirmed once advance payment is received.\n\n"
            "Please transfer the total to confirm your slot:\n"
            "• Bank: Allied bank\n"
            "• Account Title: Farzana seemin\n"
            "• IBAN: PK53ABPA0010070700810022\n\n"
            "Kindly share a quick screenshot of the transfer on WhatsApp (+92 322 411 2832) once done! ✨ (Online card payment is currently unavailable)."
        )

    if "cash" in lowered:
        return "We do not offer cash on deposit or cash on delivery. All our bakes are freshly prepared on order, and orders are confirmed once advance bank transfer to Allied bank (Farzana seemin) is received: https://wa.me/923224112832."

    if any(word in lowered for word in ("delivery fee", "delivery fees", "delivery charge", "shipping cost", "delivery cost", "how much for delivery", "how much is delivery", "how much does delivery cost")):
        return "Delivery charges depend on your area and aren't listed as a fixed price here. Send Sana your location and order details for a quote: https://wa.me/923224112832."

    if any(word in lowered for word in ("same day", "today")):
        return "For same-day orders, only freshly baked Banana Bread (Classic Choco Chip & Oat Flour) is available today (subject to daily oven batches). All other menu items require 24 hours advance pre-order. Message Sana on WhatsApp to confirm: https://wa.me/923224112832."

    if any(word in lowered for word in ("delivery", "deliver", "pick up", "pickup", "pick-up", "collect", "shipping")):
        return "Pick-up is available in Askari X and doorstep delivery across Lahore. Send Sana your location and preferred time; she confirms availability and arrangements directly: https://wa.me/923224112832."

    if any(word in lowered for word in ("gift box", "gift boxes", "gifting", "festive box", "festive boxes", "eid box", "anniversary box", "birthday box", "graduation box", "baby born box")):
        boxes = [_hydrate_box(box) for box in FESTIVE_BOXES]
        if budget is not None:
            boxes = [box for box in boxes if within_budget(box["total"])]
            if not boxes:
                lowest = min(_hydrate_box(box)["total"] for box in FESTIVE_BOXES)
                return f"There aren't ready-made gift boxes under Rs. {budget:,}; they start at Rs. {lowest:,}. You could build a smaller custom gift box instead."
        options = "; ".join(
            f"{box['name']} (Rs. {box['total']:,}; " + ", ".join(f"{line['qty']} × {line['product']['name']}" for line in box["items"]) + ")"
            for box in boxes
        )
        lead = f"Ready-made gift boxes under Rs. {budget:,}: " if budget is not None else "Our ready-made gift boxes are "
        return f"{lead}{options}. You can customize a box from Gifting or make a mix in Build a box."

    if any(word in lowered for word in ("custom box", "build a box", "box builder", "pick and mix", "pick mix", "packaging", "ribbon")):
        custom_items = [product for product in PRODUCTS if product.get("custom_box_unit") is not None]
        prices = ", ".join(f"{product['name']} Rs. {product['custom_box_unit']:,} each" for product in custom_items)
        packs = ", ".join(f"{item['name']} Rs. {item['price']:,}" for item in PACKAGING)
        return f"The custom-box treats are {prices}. Packaging is {packs}, with pink ribbon included. Your total depends on your choices; add a personal note at checkout."

    if any(word in lowered for word in ("catering", "corporate", "office event", "large order", "bulk order", "event order", "party order")):
        return "For catering, corporate gifts, or larger event quantities, share your date, guest count and location with Sana so she can confirm suitable bakes and timing: https://wa.me/923224112832. The site doesn't list fixed catering packages."

    if any(word in lowered for word in ("discount", "coupon", "promo code", "promotion", "sale")):
        return "I don't have a published discount or coupon to offer right now. Sana can confirm any current offers directly: https://wa.me/923224112832."

    if any(word in lowered for word in ("custom cake", "special design", "specific design", "custom design", "can you make")):
        return "The online menu shows the bakes currently listed. For a special design or request, send Sana the details and date so she can confirm what's possible: https://wa.me/923224112832."

    category_terms = {
        "loaf": ("loaf", "loaves", "bread"),
        "cheesecake": ("cheesecake", "cake", "dessert", "desserts", "pie"),
        "batch": ("brownie", "brownies", "batch", "batches", "roll", "rolls", "bun", "buns", "eclair"),
        "cookie": ("cookie", "cookies"),
    }
    category = next((key for key, terms in category_terms.items() if any(term in query for term in terms)), None)
    occasion_map = {
        "Birthday": ("birthday",), "Anniversary": ("anniversary",), "Tea party": ("tea",),
        "Family gathering": ("family", "gathering"), "Graduation": ("graduation",), "Eid": ("eid",),
        "Baby born": ("new baby", "baby", "new arrival"), "Gift": ("gift", "present"),
    }
    occasion = next((name for name, words in occasion_map.items() if any(word in query for word in words)), None)
    recommendation = any(word in query for word in ("recommend", "suggest", "what should", "which one", "best for", "perfect for", "match me", "surprise"))
    if recommendation and category in (None, "loaf"):
        mood = "Coffee lover" if "coffee" in query else "Chocolate lover" if "chocolate" in query else "Warm & comforting"
        req = MatchRequest(occasion=occasion or "Just craving something", mood=mood, people=people or 6, budget=budget or 100000)
        candidates = [item for item in PRODUCTS if item["category"] == "loaf" and within_budget(item["price"])]
        if occasion:
            candidates = [item for item in candidates if occasion in item["occasions"]] or candidates
        if not candidates:
            return f"The loaves start at Rs. {min(item['price'] for item in PRODUCTS if item['category'] == 'loaf'):,}. I can look for cookies or smaller treats within Rs. {budget:,}."
        best = max(candidates, key=lambda item: _score(item, req))
        return f"For {occasion.lower() if occasion else 'a little treat'}, I’d suggest {best['name']} (Rs. {best['price']:,}, serves {best['serves']}). {best['story']}"

    product_query = normalize(f"{message} {' '.join(user_history)}")
    product = next((item for item in PRODUCTS if normalize(item["name"]) in product_query), None)
    if product:
        custom_price = product.get("custom_box_unit") if any(word in lowered for word in ("custom", "single", "piece", "each")) else None
        price = custom_price if custom_price is not None else product["price"]
        detail = f"{product['name']} is Rs. {price:,} per {product['unit']}"
        if custom_price is not None and custom_price != product["price"]:
            detail += " in a custom box"
        detail += "."
        if product.get("serves"):
            detail += f" It serves {product['serves']}."
        if product.get("note"):
            detail += f" Note: {product['note']}."
        if product.get("addons"):
            detail += " Optional add-ons: " + ", ".join(f"{addon['name']} +Rs. {addon['price']}" for addon in product["addons"]) + "."
        if product.get("variants"):
            detail += " Options: " + ", ".join(product["variants"]) + "."
        return detail

    if budget is not None or any(word in lowered for word in ("menu", "price", "cost", "available", "what do you have", "products", "bakes", "options")):
        categories = [category] if category else list(category_terms)
        menu_lines = []
        labels = {"loaf": "Loaves", "cheesecake": "Desserts", "batch": "Batches", "cookie": "Cookies"}
        for current in categories:
            items = [item for item in PRODUCTS if item["category"] == current and within_budget(item["price"])]
            if people and current == "loaf":
                items = [item for item in items if item.get("serves_min", 0) <= people + 2]
            if items:
                menu_lines.append(f"{labels[current]}: " + ", ".join(f"{item['name']} (Rs. {item['price']:,})" for item in items))
        if not menu_lines:
            return f"I couldn't find {labels[category].lower() if category else 'any bakes'} under Rs. {budget:,}. The lowest-priced item starts at Rs. {min(item['price'] for item in PRODUCTS):,}. Want me to find the closest options?"
        intro = f"Here are options under Rs. {budget:,}" if budget is not None else "Here are the current menu options"
        if people:
            intro += f" for around {people} people"
        return intro + ":\n" + "\n".join(menu_lines) + "\nOpen Menu to browse photos and full details."

    if any(word in lowered for word in ("cancel", "cancellation", "change my order", "edit my order", "modify my order", "wrong address", "refund", "return")):
        return "Order changes, cancellations and refunds need Sana's confirmation. Message her as soon as possible with your order code: https://wa.me/923224112832."

    if any(word in lowered for word in ("order", "track", "status", "arrive")):
        return "For an existing order, send its code (like TT123456) and the last four digits of the checkout phone to check the status privately. For a new order, add bakes to your bag and continue to checkout; Sana confirms it on WhatsApp."

    if any(word in lowered for word in ("website", "how do i", "how can i", "where can i", "how to", "checkout", "place an order", "place order")):
        return "Browse all bakes in Menu, mix treats in Build a box, or customize one of the ready-made gifts under Gifting. Add your choices to the bag and continue to checkout; orders are confirmed once advance bank transfer to Allied bank (Farzana seemin) is received and receipt is shared on WhatsApp."

    if any(word in lowered for word in ("hello", "hi", "hey", "good morning", "good afternoon", "good evening")) and len(lowered.split()) <= 5:
        return "Hi! I’m Pippa. Tell me what you’re celebrating, your budget, or what you’re craving and I’ll find a few lovely options."

    return "I can help with menu items and prices, budget-friendly picks, recommendations, gift boxes, custom-box costs, checkout, and order tracking. Ask away; for details that aren't published, I’ll check with Sana rather than guess."


async def _order_tracking_reply(message: str):
    order_match = re.search(r"\bTT\d{6}\b", message.upper())
    if not order_match:
        return None

    suffix_match = re.search(r"(?:ending(?:\s+in)?|ends\s+in|last\s*(?:four|4)(?:\s+digits?)?|phone(?:\s+number)?\s*(?:is|:)?)[^\d]{0,16}(\d{4})\b", message.lower())
    if not suffix_match:
        return "For privacy, please send the last four digits of the phone number used at checkout along with your order code."

    try:
        order = await db.orders.find_one({"order_number": order_match.group(0)}, {"_id": 0})
    except Exception:
        logging.getLogger(__name__).warning("Order lookup unavailable")
        return "I can't reach the order book right now. Please try again shortly or message Sana on WhatsApp."
    if not order:
        return "I couldn't find that order code. Please double-check it, or message Sana on WhatsApp and she'll help you."

    phone = re.sub(r"\D", "", str(order.get("customer", {}).get("phone", "")))
    if not phone or phone[-4:] != suffix_match.group(1):
        return "I couldn't verify those details, so I can't show the order yet. Check the code and phone digits, or contact Sana directly."

    status = str(order.get("status", "being prepared")).replace("_", " ")
    items = ", ".join(f"{item.get('qty', 1)} × {item.get('name', 'bake')}" for item in order.get("items", []))
    total = order.get("total")
    total_text = f" The total is Rs. {total:,}." if isinstance(total, (int, float)) else ""
    return f"Order {order_match.group(0)} is currently {status}. Items: {items or 'details unavailable'}.{total_text} For a change or delivery update, message Sana on WhatsApp."


# ---------- Routes ----------

@api_router.get("/")
async def root():
    return {"message": "Treats & Temptation by SK API"}


@api_router.get("/products")
async def list_products():
    return PRODUCTS


@api_router.get("/packaging")
async def list_packaging():
    return PACKAGING


@api_router.get("/festive-boxes")
async def list_festive_boxes():
    return [_hydrate_box(b) for b in FESTIVE_BOXES]


@api_router.get("/festive-boxes/{box_id}")
async def get_festive_box(box_id: str):
    for b in FESTIVE_BOXES:
        if b["id"] == box_id:
            return _hydrate_box(b)
    raise HTTPException(status_code=404, detail="Festive box not found")


@api_router.post("/match")
async def match_dessert(request: MatchRequest):
    options = _pick_options(request, limit=4)
    best = options[0] if options else PRODUCTS[0]
    s_min, s_max = _product_serves_range(best)
    serves_val = best.get("serves") or (f"{s_min}–{s_max}" if s_min != s_max else str(s_min))
    category_name = {
        "loaf": "loaf",
        "cheesecake": "dessert box",
        "batch": "bake",
        "cookie": "cookie treat",
    }.get(best.get("category"), "bake")

    prompt = (
        f"The perfect bake for this customer is: {best['name']} (Rs. {best['price']}, serves {serves_val}). "
        f"They are buying for a {request.occasion.lower()}, in the mood for {request.mood.lower()}, "
        f"for {request.people} people, budget around Rs. {request.budget}, dietary: {request.dietary}. "
        f"Write ONE warm, personal sentence (max 30 words) explaining why {best['name']} suits them. "
        f"You MUST use the exact name '{best['name']}' and MUST NOT mention any other bake."
    )
    try:
        explanation = await ask_baker(
            prompt,
            "match-" + uuid.uuid4().hex,
            system_extra=f"For this reply you must only talk about '{best['name']}'.",
            full_catalogue=True,
        )
    except Exception as e:
        logging.getLogger(__name__).warning("match LLM error: %s", e)
        explanation = f"{best['name']} is an ideal match for your {request.occasion.lower()} — freshly baked to serve {serves_val}."
    other_names = [p["name"] for p in PRODUCTS if p["id"] != best["id"]]
    if best["name"].lower() not in explanation.lower() or any(n.lower() in explanation.lower() for n in other_names):
        explanation = f"{best['name']} is an ideal match for your {request.occasion.lower()} — freshly baked to serve {serves_val} within your budget."
    return {"product": best, "explanation": explanation, "options": options}


@api_router.post("/match/save")
async def save_match(payload: SaveMatchRequest):
    pmap = _by_id()
    if payload.product_id not in pmap:
        raise HTTPException(status_code=404, detail="Unknown product")
    match_id = uuid.uuid4().hex[:10]
    await db.saved_matches.insert_one({
        "match_id": match_id,
        "product_id": payload.product_id,
        "occasion": payload.occasion,
        "mood": payload.mood,
        "people": payload.people,
        "budget": payload.budget,
        "dietary": payload.dietary,
        "explanation": payload.explanation,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"id": match_id}


@api_router.get("/match/{match_id}")
async def get_saved_match(match_id: str):
    doc = await db.saved_matches.find_one({"match_id": match_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Match not found")
    product = _by_id().get(doc["product_id"])
    if not product:
        raise HTTPException(status_code=404, detail="Match no longer available")
    return {
        "id": doc["match_id"], "product": product, "explanation": doc["explanation"],
        "occasion": doc.get("occasion"), "mood": doc.get("mood"),
        "people": doc.get("people"), "budget": doc.get("budget"),
    }


api_router.add_api_route("/speech/transcribe", transcribe_request, methods=["POST"])


@api_router.post("/chat")
async def baker_chat(request: ChatRequest):
    session_id = request.session_id or "chat-" + uuid.uuid4().hex
    order_context = " ".join(
        str(turn.get("text", "")) for turn in (request.history or [])
        if isinstance(turn, dict) and turn.get("role") == "user" and turn.get("text")
    )
    reply = await _order_tracking_reply(f"{order_context} {request.message}".strip())
    if reply is not None:
        mode = "order"
    else:
        try:
            reply = await ask_baker(request.message, session_id, full_catalogue=True, history=request.history)
            mode = "ai"
        except Exception as e:
            logging.getLogger(__name__).info("Using grounded baker helper: %s", e)
            reply = _catalogue_chat_reply(request.message, history=request.history)
            mode = "catalogue"
    async def save_chat_log():
        try:
            await db.baker_chats.insert_one({
            "session_id": session_id, "message": request.message, "reply": reply, "ok": True, "mode": mode,
            "created_at": datetime.now(timezone.utc).isoformat(),
            })
        except Exception:
            logging.getLogger(__name__).warning("Chat log unavailable; returning the reply without saving it")

    asyncio.create_task(save_chat_log())
    return {"session_id": session_id, "reply": reply, "ok": True, "mode": mode}


def _new_order_number():
    return "TT" + "".join(random.choices("0123456789", k=6))


@api_router.post("/orders")
async def create_order(payload: CreateOrderRequest):
    if not payload.items:
        raise HTTPException(status_code=400, detail="Cart is empty")
    pmap = _by_id()
    packmap = _pack_by_id()

    lines = []
    subtotal = 0
    for item in payload.items:
        product = pmap.get(item.product_id)
        if not product:
            raise HTTPException(status_code=404, detail=f"Unknown product: {item.product_id}")
        if item.custom_box and "custom_box_unit" not in product:
            raise HTTPException(status_code=400, detail=f"{product['name']} is not sold as a custom-box unit")
        unit_price = product["custom_box_unit"] if item.custom_box else product["price"]
        line_total = unit_price * item.qty
        subtotal += line_total
        lines.append({
            "product_id": product["id"],
            "name": product["name"],
            "qty": item.qty,
            "custom_box": item.custom_box,
            "unit_price": unit_price,
            "line_total": line_total,
            "image": product["image"],
        })

    pack = None
    packaging_total = 0
    if payload.packaging_id:
        pack = packmap.get(payload.packaging_id)
        if not pack:
            raise HTTPException(status_code=404, detail="Unknown packaging option")
        packaging_total = pack["price"]

    total = subtotal + packaging_total
    order_number = _new_order_number()

    order_doc = {
        "order_number": order_number,
        "items": lines,
        "packaging": ({"id": pack["id"], "name": pack["name"], "price": pack["price"], "ribbon": pack["ribbon"], "style": pack.get("style"), "image": pack.get("image")} if pack else None),
        "personalized_message": payload.personalized_message or "",
        "customer": payload.customer.model_dump(),
        "subtotal": subtotal,
        "packaging_total": packaging_total,
        "total": total,
        "currency": "PKR",
        "status": "pending_confirmation",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.orders.insert_one(order_doc)
    order_doc.pop("_id", None)
    return order_doc


@api_router.get("/orders/{order_number}")
async def get_order(order_number: str):
    doc = await db.orders.find_one({"order_number": order_number}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Order not found")
    return doc


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
