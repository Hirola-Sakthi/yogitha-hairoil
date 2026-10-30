import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import sequence from "./sequenceManifest.json";
import { frameAtProgress } from "./sequenceTimeline";
import { imageUrl } from "./shared/imageUrl";
gsap.registerPlugin(ScrollTrigger);
const COUNT = sequence.frameCount;
const url = (i) =>
  imageUrl(`${import.meta.env.BASE_URL}${sequence.directory}/frame_${String(i + 1).padStart(4, "0")}.webp?v=${sequence.revision}`);
export default function ProductSequence() {
  const section = useRef(null),
    canvas = useRef(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const el = canvas.current,
      ctx = el.getContext("2d", { alpha: false });
    if (!ctx) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const mobile = matchMedia("(max-width: 600px)");
    const cacheLimit = mobile.matches ? 16 : 24;
    const concurrency = mobile.matches ? 4 : 6;
    const cache = new Map(),
      loading = new Set(),
      failures = new Set(),
      requests = new Set();
    let desired = 0,
      drawn = -1,
      raf = 0,
      disposed = false,
      direction = 1;
    const draw = () => {
      raf = 0;
      if (disposed || !cache.size) return;
      const index = cache.has(desired)
        ? desired
        : [...cache.keys()].reduce((a, b) =>
            Math.abs(a - desired) < Math.abs(b - desired) ? a : b,
          );
      if (index === drawn) return;
      const image = cache.get(index);
      // Fill every viewport; portrait screens crop around the central action.
      const scale = Math.max(el.width / image.width, el.height / image.height);
      const width = image.width * scale,
        height = image.height * scale;
      const x = (el.width - width) / 2;
      const y = (el.height - height) / 2;
      ctx.fillStyle = "#17251c";
      ctx.fillRect(0, 0, el.width, el.height);
      ctx.drawImage(image, x, y, width, height);
      el.style.opacity = "1";
      el.dataset.frame = String(index + 1);
      drawn = index;
      el.dataset.phase = sequence.phases.find(
        (phase) => index >= phase.start && index <= phase.end,
      )?.name;
    };
    const schedule = () => {
      if (!raf && !disposed) raf = requestAnimationFrame(draw);
    };
    const pump = () => {
      if (disposed) return;
      const candidates = [desired];
      if (!reduced.matches) {
        // Keep the entire prefetch window inside the decoded cache budget.
        // Otherwise evicted candidates are immediately fetched again forever.
        const radius = Math.floor((cacheLimit - 1) / 2);
        for (let o = 1; o <= radius; o++) {
          candidates.push(desired + o * direction);
          candidates.push(desired - o * direction);
        }
      }
      for (const i of candidates) {
        if (loading.size >= concurrency) break;
        if (
          i < 0 ||
          i >= COUNT ||
          cache.has(i) ||
          loading.has(i) ||
          failures.has(i)
        )
          continue;
        loading.add(i);
        const image = new Image();
        image.decoding = "async";
        requests.add(image);
        image.onload = async () => {
          let decoded = image;
          if (mobile.matches && typeof createImageBitmap === "function") {
            try {
              decoded = await createImageBitmap(image);
            } catch {
              /* Keep the original image if bitmap resizing is unavailable. */
            }
          }
          requests.delete(image);
          loading.delete(i);
          if (disposed) {
            decoded.close?.();
            return;
          }
          cache.set(i, decoded);
          const farthest = [...cache.keys()].sort(
            (a, b) => Math.abs(b - desired) - Math.abs(a - desired),
          );
          while (cache.size > cacheLimit) {
            const index = farthest.shift();
            cache.get(index).close?.();
            cache.delete(index);
          }
          schedule();
          pump();
        };
        image.onerror = () => {
          requests.delete(image);
          loading.delete(i);
          failures.add(i);
          if (!disposed) {
            if ((failures.size > 8 || reduced.matches) && !cache.size)
              setFailed(true);
            pump();
          }
        };
        image.src = url(i);
      }
    };
    const resize = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      el.width = Math.round(el.clientWidth * dpr);
      el.height = Math.round(el.clientHeight * dpr);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      drawn = -1;
      schedule();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(el);
    resize();
    const panels = section.current.querySelectorAll(".scene-copy");
    const updatePanels = (progress) => {
      const windows = [
        [0, 0, 0.065, 0.1],
        [0.11, 0.14, 0.25, 0.29],
        [0.37, 0.4, 0.64, 0.69],
        [0.74, 0.76, 0.8, 0.84],
        [0.86, 0.89, 1, 1],
      ];
      panels.forEach((panel, index) => {
        const [start, full, end, done] = windows[index];
        const opacity =
          progress < start || progress > done
            ? 0
            : progress < full
              ? (progress - start) / (full - start)
              : progress > end
                ? 1 - (progress - end) / (done - end)
                : 1;
        panel.style.opacity = String(opacity);
        panel.style.visibility = opacity > 0.01 ? "visible" : "hidden";
        const offset =
          progress < full ? (1 - opacity) * 20 : -(1 - opacity) * 20;
        panel.style.transform = matchMedia("(max-width: 600px)").matches
          ? `translateY(${offset}px)`
          : `translateY(calc(-50% + ${offset}px))`;
      });
    };
    updatePanels(0);
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const update = (self) => {
        const next = frameAtProgress(self.progress, sequence);
        if (next !== desired) direction = next > desired ? 1 : -1;
        desired = next;
        section.current.style.setProperty("--progress", self.progress);
        updatePanels(self.progress);
        schedule();
        pump();
      };
      const trigger = ScrollTrigger.create({
        trigger: section.current,
        start: "top top",
        end: "bottom bottom",
        onUpdate: update,
        onRefresh: update,
        onToggle: () => {
          drawn = -1;
          schedule();
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
      requests.forEach((image) => {
        image.onload = image.onerror = null;
        image.src = "";
      });
      cache.forEach((image) => image.close?.());
      cache.clear();
    };
  }, []);
  return (
    <section
      id="top"
      className="sequence"
      ref={section}
      aria-label="The Ayurvedic hair oil story"
    >
      <span id="formula" className="scene-anchor anchor-formula" />
      <span id="craft" className="scene-anchor anchor-craft" />
      <span id="result" className="scene-anchor anchor-result" />
      <div className="film-stage">
        <img
          className="film-poster"
          src={imageUrl(`${import.meta.env.BASE_URL}${sequence.directory}/poster.webp?v=${sequence.revision}`)}
          alt="An empty ceramic bowl on a sunlit wooden table in a lush garden"
          fetchPriority="high"
        />
        <canvas ref={canvas} className="film-canvas" aria-hidden="true" />
        <div className="film-shade" />
        <div className="scene-copy intro-copy">
          <p className="eyebrow">DR. YOGITHA'S · AYURVEDIC HAIR OIL</p>
          <h2>Ayurvedic hair care, rooted in tradition.</h2>
          <p>
            A golden blend of botanical oils, inspired by Ayurvedic traditions.
            <br />
            Make hair care a considered ritual—and a little time for yourself.
          </p>
          <a className="pill-button" href="#shop">
            Discover the oil <span aria-hidden="true">↗</span>
          </a>
          <a className="underlined" href="#formula">
            Follow the ingredients
          </a>
        </div>
        <div className="scene-copy formula-copy">
          <p className="eyebrow">THE BOTANICAL STORY</p>
          <h2>
            Botanical oils,
            <br />
            <span>rooted in tradition.</span>
          </h2>
          <p>
            A golden blend of botanical oils,
            <br />
            inspired by Ayurvedic traditions.
          </p>
        </div>
        <div className="scene-copy filling-copy">
          <p className="eyebrow">THE GOLDEN POUR</p>
          <h2>
            From bowl
            <br />
            <span>to bottle.</span>
          </h2>
          <p>
            Watch the golden oil come together,
            <br />
            ready for your hair-care ritual.
          </p>
        </div>
        <div className="scene-copy packaging-copy">
          <p className="eyebrow">THE FINAL TOUCH</p>
          <h2>
            A considered
            <br />
            <span>final touch.</span>
          </h2>
          <p>
            A clear bottle, finished with a black cap
            <br />
            and a botanical label.
          </p>
        </div>
        <div className="scene-copy result-copy">
          <p className="eyebrow">YOUR HAIR RITUAL</p>
          <h2>
            Make space
            <br />
            <span>for hair care.</span>
          </h2>
          <p>
            Bring Ayurvedic-inspired botanical care
            <br />
            into a simple moment for yourself.
          </p>
          <a className="pill-button dark-button" href="#shop">
            Meet the hair oil <span aria-hidden="true">↗</span>
          </a>
        </div>
        <a href="#formula" className="scroll-cue">
          SCROLL <span aria-hidden="true">↓</span>
        </a>
        <span className="film-caption">DR. YOGITHA'S / AYURVEDIC HAIR OIL</span>
        <div className="film-progress" aria-hidden="true" />
        {failed && (
          <p className="film-error" role="status">
            Showing the still image. Discover the hair oil below.
          </p>
        )}
      </div>
    </section>
  );
}
