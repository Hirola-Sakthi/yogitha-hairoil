import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import sequence from "./sequenceManifest.json";
import { frameAtProgress } from "./sequenceTimeline";
import { imageUrl } from "./shared/imageUrl";

gsap.registerPlugin(ScrollTrigger);

const frameUrl = (index) => imageUrl(
  `${import.meta.env.BASE_URL}${sequence.directory}/frame_${String(index + 1).padStart(4, "0")}.webp?v=${sequence.revision}`,
);

export default function ProductSequence() {
  const section = useRef(null);
  const canvas = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const sectionEl = section.current;
    const canvasEl = canvas.current;
    const context = canvasEl?.getContext("2d", { alpha: false });
    if (!sectionEl || !canvasEl || !context) return;

    const mobile = matchMedia("(max-width: 600px)");
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    const cacheLimit = mobile.matches ? 16 : 24;
    const concurrency = mobile.matches ? 4 : 6;
    const cache = new Map();
    const loading = new Set();
    const failures = new Set();
    const requests = new Set();
    const panels = sectionEl.querySelectorAll(".scene-copy");
    let desired = 0;
    let drawn = -1;
    let direction = 1;
    let raf = 0;
    let disposed = false;

    const draw = () => {
      raf = 0;
      if (disposed || !cache.size) return;
      const index = cache.has(desired)
        ? desired
        : [...cache.keys()].reduce((a, b) => Math.abs(a - desired) < Math.abs(b - desired) ? a : b);
      if (index === drawn) return;
      const frame = cache.get(index);
      const scale = Math.max(canvasEl.width / frame.width, canvasEl.height / frame.height);
      const width = frame.width * scale;
      const height = frame.height * scale;
      context.fillStyle = "#17251c";
      context.fillRect(0, 0, canvasEl.width, canvasEl.height);
      context.drawImage(frame, (canvasEl.width - width) / 2, (canvasEl.height - height) / 2, width, height);
      canvasEl.style.opacity = "1";
      canvasEl.dataset.frame = String(index + 1);
      drawn = index;
    };

    const schedule = () => {
      if (!raf && !disposed) raf = requestAnimationFrame(draw);
    };

    const pump = () => {
      if (disposed) return;
      const candidates = [desired];
      if (!reducedMotion.matches) {
        const radius = Math.floor((cacheLimit - 1) / 2);
        for (let offset = 1; offset <= radius; offset += 1) {
          candidates.push(desired + offset * direction, desired - offset * direction);
        }
      }
      for (const index of candidates) {
        if (loading.size >= concurrency) break;
        if (index < 0 || index >= sequence.frameCount || cache.has(index) || loading.has(index) || failures.has(index)) continue;
        loading.add(index);
        const image = new Image();
        image.decoding = "async";
        requests.add(image);
        image.onload = () => {
          requests.delete(image);
          loading.delete(index);
          if (disposed) return;
          cache.set(index, image);
          const farthest = [...cache.keys()].sort((a, b) => Math.abs(b - desired) - Math.abs(a - desired));
          while (cache.size > cacheLimit) cache.delete(farthest.shift());
          schedule();
          pump();
        };
        image.onerror = () => {
          requests.delete(image);
          loading.delete(index);
          failures.add(index);
          if (failures.size > 8 && !cache.size) setFailed(true);
          pump();
        };
        image.src = frameUrl(index);
      }
    };

    const resize = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      canvasEl.width = Math.round(canvasEl.clientWidth * dpr);
      canvasEl.height = Math.round(canvasEl.clientHeight * dpr);
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      drawn = -1;
      schedule();
    };

    const updatePanels = (progress) => {
      const windows = [[0, 0, 0.065, 0.1], [0.11, 0.14, 0.25, 0.29], [0.37, 0.4, 0.64, 0.69], [0.74, 0.76, 0.8, 0.84], [0.86, 0.89, 1, 1]];
      panels.forEach((panel, index) => {
        const [start, full, end, done] = windows[index];
        const opacity = progress < start || progress > done ? 0 : progress < full ? (progress - start) / (full - start) : progress > end ? 1 - (progress - end) / (done - end) : 1;
        panel.style.opacity = String(opacity);
        panel.style.visibility = opacity > 0.01 ? "visible" : "hidden";
        const offset = progress < full ? (1 - opacity) * 20 : -(1 - opacity) * 20;
        panel.style.transform = mobile.matches ? `translateY(${offset}px)` : `translateY(calc(-50% + ${offset}px))`;
      });
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvasEl);
    resize();
    updatePanels(0);

    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const trigger = ScrollTrigger.create({
        trigger: sectionEl,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          const next = frameAtProgress(self.progress, sequence);
          if (next !== desired) direction = next > desired ? 1 : -1;
          desired = next;
          sectionEl.style.setProperty("--progress", self.progress);
          updatePanels(self.progress);
          schedule();
          pump();
        },
      });
      return () => trigger.kill();
    });
    pump();

    return () => {
      disposed = true;
      media.revert();
      observer.disconnect();
      cancelAnimationFrame(raf);
      requests.forEach((image) => { image.onload = image.onerror = null; image.src = ""; });
      cache.clear();
    };
  }, []);

  return (
    <section id="top" className="sequence" ref={section} aria-label="The Ayurvedic hair oil story">
      <span id="formula" className="scene-anchor anchor-formula" />
      <span id="craft" className="scene-anchor anchor-craft" />
      <span id="result" className="scene-anchor anchor-result" />
      <div className="film-stage">
        <img className="film-poster" src={imageUrl(`${import.meta.env.BASE_URL}${sequence.directory}/poster.webp?v=${sequence.revision}`)} alt="Dr. Yogitha's Ayurvedic hair oil advertisement" fetchPriority="high" />
        <canvas ref={canvas} className="film-canvas" aria-hidden="true" />
        <div className="film-shade" />
        <div className="scene-copy intro-copy"><p className="eyebrow">DR. YOGITHA'S · AYURVEDIC HAIR OIL</p><h2>Ayurvedic hair care, rooted in tradition.</h2><p>A golden blend of botanical oils, inspired by Ayurvedic traditions.<br />Make hair care a considered ritual—and a little time for yourself.</p><a className="pill-button" href="#shop">Discover the oil <span aria-hidden="true">↗</span></a><a className="underlined" href="#formula">Follow the ingredients</a></div>
        <div className="scene-copy formula-copy"><p className="eyebrow">THE BOTANICAL STORY</p><h2>Botanical oils,<br /><span>rooted in tradition.</span></h2><p>A golden blend of botanical oils,<br />inspired by Ayurvedic traditions.</p></div>
        <div className="scene-copy filling-copy"><p className="eyebrow">THE GOLDEN POUR</p><h2>From bowl<br /><span>to bottle.</span></h2><p>Watch the golden oil come together,<br />ready for your hair-care ritual.</p></div>
        <div className="scene-copy packaging-copy"><p className="eyebrow">THE FINAL TOUCH</p><h2>A considered<br /><span>final touch.</span></h2><p>A clear bottle, finished with a black cap<br />and a botanical label.</p></div>
        <div className="scene-copy result-copy"><p className="eyebrow">YOUR HAIR RITUAL</p><h2>Make space<br /><span>for hair care.</span></h2><p>Bring Ayurvedic-inspired botanical care<br />into a simple moment for yourself.</p><a className="pill-button dark-button" href="#shop">Meet the hair oil <span aria-hidden="true">↗</span></a></div>
        <a href="#formula" className="scroll-cue">SCROLL <span aria-hidden="true">↓</span></a>
        <span className="film-caption">DR. YOGITHA'S / AYURVEDIC HAIR OIL</span>
        <div className="film-progress" aria-hidden="true" />
        {failed && <p className="film-error" role="status">Showing the still image. Discover the hair oil below.</p>}
      </div>
    </section>
  );
}
