import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { imageUrl } from "../shared/imageUrl";
import { useStore } from "./StoreContext";
import "./home-social-gallery.css";

gsap.registerPlugin(ScrollTrigger);

const galleryPhoto = (filename, alt, position) => ({
  src: `${import.meta.env.BASE_URL}${filename}`,
  alt,
  position,
});
const photos = [
  galleryPhoto("follow-1.webp", "Man holding a dropper beside a skincare bottle", "left-1"),
  { empty: true, position: "left-2" },
  { empty: true, position: "left-3" },
  galleryPhoto("follow-2.webp", "Man applying serum to his hair", "left-4"),
  { src: `${import.meta.env.BASE_URL}follow-3.webp`, alt: "Portrait of a man with textured hair holding a hair serum", featured: true },
  { empty: true, position: "right-1" },
  galleryPhoto("follow-4.webp", "Man holding a hair serum beside his hair", "right-2"),
  galleryPhoto("follow-5.webp", "Close-up portrait of a man holding hair growth serum", "right-3"),
  { empty: true, position: "right-4" },
];

export default function HomeSocialGallery() {
  const section = useRef(null);
  const { data } = useStore();
  const instagramUrl = /^https:\/\/(www\.)?instagram\.com\//i.test(data?.settings?.instagramUrl || "")
    ? data.settings.instagramUrl
    : "";
  const instagramHandle = instagramUrl.match(/instagram\.com\/([^/?#]+)/i)?.[1];

  useEffect(() => {
    const root = section.current;
    if (!root) return;

    const media = gsap.matchMedia();
    media.add("(min-width: 701px) and (prefers-reduced-motion: no-preference)", () => {
      const tiles = gsap.utils.toArray(root.querySelectorAll(".home-social-tile"));
      const centerTile = tiles.find((tile) => tile.classList.contains("is-featured"));
      if (!centerTile || !tiles.length) return;

      const centerBounds = centerTile.getBoundingClientRect();
      const centerX = centerBounds.left + centerBounds.width / 2;
      const centerY = centerBounds.top + centerBounds.height / 2;

      tiles.forEach((tile) => {
        if (tile === centerTile) {
          gsap.set(tile, { scale: 1, autoAlpha: 1, transformOrigin: "center center" });
          return;
        }
        const bounds = tile.getBoundingClientRect();
        gsap.set(tile, {
          x: centerX - (bounds.left + bounds.width / 2),
          y: centerY - (bounds.top + bounds.height / 2),
          scale: 0.22,
          autoAlpha: 0,
          transformOrigin: "center center",
        });
      });

      const spread = gsap.to(tiles.filter((tile) => tile !== centerTile), {
        x: (_, tile) => {
          if (tile.classList.contains("is-left-4")) return -32;
          if (tile.classList.contains("is-right-3")) return 32;
          return 0;
        },
        y: 0,
        scale: 1,
        autoAlpha: 1,
        stagger: { each: 0.08, from: "center" },
        ease: "none",
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: "bottom bottom",
          scrub: 1.2,
          invalidateOnRefresh: true,
        },
      });
      return () => spread.scrollTrigger?.kill();
    });

    return () => media.revert();
  }, []);

  return (
    <section className="home-social-gallery" ref={section} aria-labelledby="home-social-gallery-title">
      <div className="home-social-gallery-inner">
        <header className="home-social-gallery-heading">
          <div className="home-social-heading-copy">
            <p className="eyebrow">FOLLOW US</p>
            <h2 id="home-social-gallery-title"><span className="home-social-heading-main">Follow Us On</span><span>Instagram</span></h2>
            <p className="home-social-description">Botanical inspiration and little moments from our hair-care ritual.</p>
          </div>
          <div className="home-social-profile">
            <img src={imageUrl(`${import.meta.env.BASE_URL}dr-yogitha.jpg`)} alt="" />
            <div className="home-social-profile-copy">
              <strong>{instagramHandle ? `@${instagramHandle.replace(/^@/, "")}` : data?.settings?.brand || "Dr. Yogitha’s"}</strong>
              <span>Ayurvedic Hair Oil</span>
            </div>
            <a className="home-social-follow" href={instagramUrl || "https://www.instagram.com/"} target="_blank" rel="noopener noreferrer">Follow</a>
          </div>
        </header>
        <div className="home-social-gallery-grid">
          {photos.map((photo) => (
            photo.empty
              ? <div className={`home-social-empty is-${photo.position}`} key={photo.position} aria-hidden="true" />
              : <div className={`home-social-tile${photo.featured ? " is-featured" : ""}${photo.position ? ` is-${photo.position}` : ""}`} key={photo.src}>
                  <img src={imageUrl(photo.src)} alt={photo.alt} loading="lazy" />
                </div>
          ))}
        </div>
      </div>
    </section>
  );
}
