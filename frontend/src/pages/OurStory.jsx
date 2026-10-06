import { Instagram } from "lucide-react";
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
    </div>
  );
}