import { useState } from "react";
import { ArrowUpRight, Coffee, Compass, House, Instagram, MapPin, Minus, Navigation, Plus, ShoppingBasket } from "lucide-react";
import { waLink } from "@/state/api";
import "./OurStory.css";

const storyBakes = [
  {
    id: "lemon-loaf",
    name: "Lemon Loaf",
    image: "https://images.unsplash.com/photo-1519915028121-7d3463d20b13?auto=format&fit=crop&w=900&q=85",
    story: "Bright, sunlit slices for the mornings that need a lift and the afternoons that need a smile.",
  },
  {
    id: "chocolate-chip-banana",
    name: "Chocolate Chip Banana Bread",
    image: "https://images.unsplash.com/photo-1621994214182-f467e6999dc9?auto=format&fit=crop&w=900&q=85",
    story: "The loaf you slice on a slow Sunday, with chocolate melting into every crumb.",
  },
  {
    id: "apple-cinnamon-loaf",
    name: "Apple Cinnamon Loaf",
    image: "https://images.unsplash.com/photo-1509365465985-25d11c17e812?auto=format&fit=crop&w=900&q=85",
    story: "Warm, gentle spice and soft apples — it makes the kitchen smell like a Sunday afternoon.",
  },
];

export default function OurStory() {
  const [mapZoom, setMapZoom] = useState(1);
  const [insideBakehouse, setInsideBakehouse] = useState(false);
  const [selectedLandmark, setSelectedLandmark] = useState(null);

  return (
    <div className="our-story-page">
      <header className="our-story-heading">
        <p className="eyebrow">ABOUT US</p>
        <h1>Our Story</h1>
        <p>Crafting artisanal bakes with pure butter, time, and premium ingredients.</p>
        <a className="inline-link" href="https://www.instagram.com/treatsandtemptationbysk/" target="_blank" rel="noreferrer" data-testid="instagram-link">
          Instagram <Instagram size={17} />
        </a>
      </header>

      <section className="founder-story-section" id="founder-story" aria-labelledby="founder-story-title" data-testid="founder-story">
        <div className="founder-story-grid">
          <div className="founder-story-main">
            <div className="founder-story-header">
              <p className="eyebrow">OUR JOURNEY</p>
              <h2 id="founder-story-title">A Passion That Grew Into Something Sweet</h2>
              <p className="founder-story-lead">
                My love for baking started long before Treats&amp;Temptations by SK ever existed.
              </p>
            </div>

            <div className="founder-story-prose">
              <p>
                As a child, I was fascinated by baking. I had wonderful baking books, endless curiosity, and a habit of experimenting with recipes. Not every experiment was a success — some turned out beautifully, some didn't quite go as planned, and a few ended in a little kitchen disaster! There were plenty of messes, a few ruined creations, and countless lessons along the way. But every success and every failure made me want to try again.
              </p>
              <p>
                As I grew older, baking slowly became more than just a childhood hobby. I started baking for my neighbours and friends, sometimes almost every day. Their appreciation, their love for what I made, and their constant encouragement gave me the confidence to take my passion a little further.
              </p>
              <p>
                And so, my journey began right where I was — within my own small community, sharing homemade treats with the people around me. What started with experimenting in my kitchen gradually grew into something I wanted to share with more people.
              </p>
              <p>
                Today, every loaf, cake, and dessert I make carries a little piece of that journey: the curiosity of a young girl, the lessons learned through trial and error, and the happiness of seeing people enjoy something made by hand.
              </p>
            </div>

            <blockquote className="founder-story-quote">
              <p>
                <strong>Treats&amp;Temptations by SK is more than just baking. It's a childhood dream that grew with time, a passion nurtured by the people who believed in me, and a love for creating homemade treats that bring people together.</strong>
              </p>
            </blockquote>

            <div className="founder-story-footer">
              <p className="founder-story-closing">
                And this is only the beginning of my story. I'm so happy you're here to be a part of it.
              </p>
              <span className="founder-signature">— Sana Khan</span>
            </div>
          </div>

          <aside className="founder-story-visual" aria-hidden="true">
            <div className="founder-story-photo-wrap">
              <img
                src="https://res.cloudinary.com/dffsqfwok/image/upload/v1790758951/Commercial_bakery_products_on_ta__2K_20260930140220_ggjrdi.jpg"
                alt="Freshly baked artisanal treats from Treats&Temptations by SK"
                loading="lazy"
              />
              <div className="founder-story-badge">
                <small>HANDCRAFTED FROM THE HEART</small>
                <b>Treats &amp; Temptation by SK</b>
                <span>Small-batch bakes · Askari X, Lahore</span>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <div className="our-story-bakes-header">
        <p className="eyebrow">OUR SPECIALITIES</p>
        <h2>Stories Behind Our Bakes</h2>
        <p>Every bake is handcrafted with pure butter and a story of its own.</p>
      </div>
      <section className="our-story-bakes" aria-label="Stories behind our loaves">
        {storyBakes.map((bake, index) => (
          <article className="our-story-bake" key={bake.id} data-testid={`our-story-${bake.id}`}>
            <div className="our-story-image">
              <img src={bake.image} alt={bake.name} loading="lazy" />
              <span>0{index + 1}</span>
            </div>
            <div className="our-story-copy">
              <p className="eyebrow">THE {bake.name.toUpperCase()}</p>
              <p>{bake.story}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="bakehouse-section" aria-labelledby="bakehouse-title">
        <div className="bakehouse-copy">
          <p className="eyebrow">OUR KITCHEN</p>
          <h2 id="bakehouse-title">Small-Batch Artisan Bakery</h2>
          <p>Based in Askari X, Lahore. Each order is prepared fresh on demand for your table.</p>
          <div className="bakehouse-address"><MapPin size={17} /><span>Askari X, Lahore, Pakistan<br /><small>Exact address provided upon order booking.</small></span></div>
          <a className="bakehouse-directions" href={waLink("Hi Sana! Could you please share the pickup address and directions for my order?")} target="_blank" rel="noreferrer" data-testid="bakehouse-directions">
            <Navigation size={16} /> Get Directions <ArrowUpRight size={15} />
          </a>
        </div>

        <div className="bakehouse-map" aria-label="Illustrated neighborhood map of the home bakery">
          <div className="map-neighborhood-label">AROUND THE NEIGHBOURHOOD <span>·</span> ASKARI X, LAHORE</div>
          <div className="map-viewport">
            <div className="map-canvas" style={{ transform: `scale(${mapZoom})` }}>
              <span className="map-block block-one" />
              <span className="map-block block-two" />
              <span className="map-block block-three" />
              <span className="map-block block-four" />
              <button className="map-park" type="button" aria-label="Show Little Green park" aria-pressed={selectedLandmark === "park"} onClick={() => setSelectedLandmark(selectedLandmark === "park" ? null : "park")}><i /><i /><i /><b>little green</b></button>
              <span className="map-waterway" aria-hidden="true" />
              <span className="map-road road-horizontal road-top" />
              <span className="map-road road-horizontal road-bottom" />
              <span className="map-road road-vertical road-left" />
              <span className="map-road road-vertical road-middle" />
              <span className="map-road road-vertical road-right" />
              <span className="map-crossing crossing-one" />
              <span className="map-crossing crossing-two" />
              <span className="map-route route-one" />
              <span className="map-route route-two" />
              <button className="map-map-label label-market" type="button" aria-pressed={selectedLandmark === "market"} onClick={() => setSelectedLandmark(selectedLandmark === "market" ? null : "market")}><ShoppingBasket size={12} /> corner market</button>
              <button className="map-map-label label-cafe" type="button" aria-pressed={selectedLandmark === "cafe"} onClick={() => setSelectedLandmark(selectedLandmark === "cafe" ? null : "cafe")}><Coffee size={12} /> tea &amp; toast</button>
              <span className="map-map-label label-lane">gul lane</span>
              <span className="map-street-name street-name-top">ROSE STREET</span>
              <span className="map-street-name street-name-side">GUL LANE</span>
              <span className="map-compass" aria-label="North"><Compass size={20} /><b>N</b></span>
              <button className="bakehouse-marker" type="button" aria-label="Enter Sana's home bakery" aria-expanded={insideBakehouse} onClick={() => { setSelectedLandmark(null); setInsideBakehouse(true); }} data-testid="bakehouse-map-marker">
                <span className="bakehouse-marker-pin"><House size={19} /></span>
                <span className="bakehouse-marker-label">Sana's bakehouse</span>
              </button>
            </div>
            {!insideBakehouse && selectedLandmark && (
              <div className="map-place-card" data-testid="map-place-card">
                <button type="button" aria-label="Close place details" onClick={() => setSelectedLandmark(null)}>×</button>
                <b>{selectedLandmark === "market" ? "Corner market" : selectedLandmark === "cafe" ? "Tea & Toast" : "Little Green"}</b>
                <span>{selectedLandmark === "market" ? "A friendly neighborhood stop" : selectedLandmark === "cafe" ? "A little pause along the way" : "A quiet patch of green"}</span>
              </div>
            )}
            {insideBakehouse && (
              <section className="bakehouse-interior" aria-labelledby="bakehouse-interior-title" data-testid="bakehouse-interior">
                <div className="bakehouse-interior-heading">
                  <span className="eyebrow">A PEEK INSIDE</span>
                  <h3 id="bakehouse-interior-title">Sana's home bakery</h3>
                  <button type="button" onClick={() => setInsideBakehouse(false)} aria-label="Back to neighborhood map" data-testid="bakehouse-map-back">
                    <MapPin size={14} /> Back to map
                  </button>
                </div>
                <div className="kitchen-scene" role="img" aria-label="Illustration of Sana baking cakes in her home kitchen">
                  <div className="kitchen-window"><i /><b /><em /></div>
                  <div className="kitchen-shelf"><span className="kitchen-jar jar-one" /><span className="kitchen-jar jar-two" /><span className="kitchen-plant" /></div>
                  <div className="kitchen-cupcakes"><i /><i /><i /><i /></div>
                  <div className="kitchen-baker"><span className="baker-hat" /><span className="baker-head"><i /><b /></span><span className="baker-body"><i /></span><span className="baker-arm" /></div>
                  <div className="kitchen-counter"><div className="kitchen-oven"><span className="oven-controls"><i /><i /><i /></span><span className="oven-glass"><i /></span></div><div className="cake-stand"><span className="cake-topper" /><span className="cake-layer cake-layer-top" /><span className="cake-layer cake-layer-bottom" /><span className="cake-stand-foot" /></div></div>
                  <span className="kitchen-scene-caption">Fresh from the oven, made with love</span>
                </div>
              </section>
            )}
          </div>
          {!insideBakehouse && <div className="map-controls" aria-label="Map controls">
            <button type="button" aria-label="Zoom in" title="Zoom in" onClick={() => setMapZoom((zoom) => Math.min(1.3, Number((zoom + 0.1).toFixed(1))))}><Plus size={17} /></button>
            <button type="button" aria-label="Zoom out" title="Zoom out" onClick={() => setMapZoom((zoom) => Math.max(0.9, Number((zoom - 0.1).toFixed(1))))}><Minus size={17} /></button>
            <button type="button" aria-label="Reset map" title="Reset map" onClick={() => setMapZoom(1)}><MapPin size={16} /></button>
          </div>}
          <div className="map-caption">{insideBakehouse ? "A little look around Sana's kitchen" : <>A little sketch, not to scale <span>·</span> Ask Sana for the exact pickup pin</>}</div>
        </div>
      </section>
    </div>
  );
}