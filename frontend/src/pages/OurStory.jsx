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
        <p className="eyebrow">04 / STORY BEHIND THE BAKE</p>
        <h1>Good things<br /><em>take time.</em></h1>
        <p>Every loaf has a mood, a memory, a reason to be shared. Here are a few of ours.</p>
        <a className="inline-link" href="https://www.instagram.com/treatsandtemptationbysk/" target="_blank" rel="noreferrer" data-testid="instagram-link">
          See more on Instagram <Instagram size={17} />
        </a>
      </header>
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
          <p className="eyebrow">A LITTLE PLACE, A LOT OF LOVE</p>
          <h2 id="bakehouse-title">Baked at home.<br /><em>Made for your table.</em></h2>
          <p>Sana's kitchen is a small home bakery where every order is made fresh, one thoughtful batch at a time.</p>
          <div className="bakehouse-address"><MapPin size={17} /><span>Karachi, Pakistan<br /><small>Pickup details shared personally when arranging your order.</small></span></div>
          <a className="bakehouse-directions" href={waLink("Hi Sana! Could you please share the pickup address and directions for my order?")} target="_blank" rel="noreferrer" data-testid="bakehouse-directions">
            <Navigation size={16} /> Ask Sana for directions <ArrowUpRight size={15} />
          </a>
        </div>

        <div className="bakehouse-map" aria-label="Illustrated neighborhood map of the home bakery">
          <div className="map-neighborhood-label">AROUND THE NEIGHBOURHOOD <span>·</span> KARACHI</div>
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