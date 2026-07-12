import { useEffect, useRef } from "react";

const HEART_PATH =
  "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z";

const PALETTE = [
  "var(--blush)",
  "var(--gold)",
  "var(--turquoise)",
  "var(--bordo)",
] as const;

const INTERACTIVE_SELECTOR =
  "a, button, [role='button'], select, label[for], label:has(input), label:has(button), label.cursor-pointer, summary, .cursor-pointer, input[type='checkbox'], input[type='radio'], .cal-day-highlight, .edge-polaroid";

function spawnHeart(container: HTMLDivElement, x: number, y: number, dense: boolean) {
  if (container.childElementCount > 48) return;

  const color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
  const size = dense ? 17 + Math.random() * 10 : 16 + Math.random() * 10;
  const drift = (Math.random() - 0.5) * (dense ? 24 : 20);
  const lift = dense ? 30 + Math.random() * 10 : 26 + Math.random() * 10;
  const shadow = 0.12 + Math.random() * 0.22;

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("class", "cursor-heart");
  svg.style.left = `${x}px`;
  svg.style.top = `${y}px`;
  svg.style.width = `${size}px`;
  svg.style.height = `${size}px`;
  svg.style.setProperty("--heart-drift", `${drift}px`);
  svg.style.setProperty("--heart-lift", `-${lift}px`);
  svg.style.fill = color;
  svg.style.filter = `drop-shadow(0 1px 3px color-mix(in oklab, var(--bordo-deep) ${Math.round(shadow * 100)}%, transparent))`;

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", HEART_PATH);
  svg.appendChild(path);
  container.appendChild(svg);

  const cleanup = () => svg.remove();
  svg.addEventListener("animationend", cleanup, { once: true });
  window.setTimeout(cleanup, 1400);
}

export function CursorHearts() {
  const layerRef = useRef<HTMLDivElement>(null);
  const lastSpawnRef = useRef(0);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) return;

    const onMove = (e: MouseEvent) => {
      const layer = layerRef.current;
      if (!layer) return;

      const dense = !!(e.target as Element | null)?.closest(INTERACTIVE_SELECTOR);
      const interval = dense ? 190 : 300;
      const now = Date.now();
      if (now - lastSpawnRef.current < interval) return;
      lastSpawnRef.current = now;

      spawnHeart(layer, e.clientX, e.clientY, dense);
      if (dense && Math.random() > 0.82) {
        spawnHeart(
          layer,
          e.clientX + (Math.random() - 0.5) * 10,
          e.clientY + (Math.random() - 0.5) * 10,
          true,
        );
      }
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return <div ref={layerRef} aria-hidden className="cursor-heart-layer" />;
}
