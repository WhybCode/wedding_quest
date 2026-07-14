const STICKMAN_LINE_SNAP_Y = "calc(-100% + 24px)";
const STICKMAN_PIXEL_SCALE = 2.5;
const STICKMAN_WIDTH = 8 * STICKMAN_PIXEL_SCALE;
const STICKMAN_HEIGHT = 12 * STICKMAN_PIXEL_SCALE;

export const FOOTER_PARTNER_LINE_POS = 92;
export const STICKMAN_MEET_THRESHOLD = 14;

type PixelStickmanProps = {
  facing?: "left" | "right";
  jumping?: boolean;
  torsoColor?: string;
};

/** Triviálny 8-bit stickman — Press Start 2P vibe cez SVG pixely */
export function PixelStickman({
  facing = "right",
  jumping = false,
  torsoColor = "var(--blush-vivid)",
}: PixelStickmanProps) {
  return (
    <svg
      viewBox="0 0 8 12"
      width={STICKMAN_WIDTH}
      height={STICKMAN_HEIGHT}
      shapeRendering="crispEdges"
      className={`pixel-stickman shrink-0 ${jumping ? "pixel-stickman--jump" : ""} ${
        facing === "left" ? "pixel-stickman--left" : ""
      }`}
      aria-hidden
    >
      <rect x="2" y="0" width="4" height="3" fill="var(--paper)" />
      <rect x="3" y="1" width="1" height="1" fill={torsoColor} />
      <rect x="3" y="3" width="2" height="5" fill={torsoColor} />
      <rect x="2" y="4" width="1" height="1" fill="var(--paper)" />
      <rect x="1" y="5" width="1" height="2" fill="var(--paper)" />
      <g transform="translate(8,0) scale(-1,1)">
        <rect x="2" y="4" width="1" height="1" fill="var(--paper)" />
        <rect x="1" y="5" width="1" height="2" fill="var(--paper)" />
      </g>
      <rect x="2" y="8" width="1" height="4" fill="var(--paper)" />
      <rect x="5" y="8" width="1" height="4" fill="var(--paper)" />
    </svg>
  );
}

/** Pixelové srdiečko nad stretnutím stickmanov */
export function PixelMeetHeart() {
  return (
    <svg
      viewBox="0 0 7 6"
      width={14}
      height={12}
      shapeRendering="crispEdges"
      className="pixel-meet-heart shrink-0"
      aria-hidden
    >
      <rect x="2" y="0" width="1" height="1" fill="var(--blush-vivid)" />
      <rect x="4" y="0" width="1" height="1" fill="var(--blush-vivid)" />
      <rect x="1" y="1" width="5" height="1" fill="var(--blush-vivid)" />
      <rect x="1" y="2" width="5" height="1" fill="var(--blush-vivid)" />
      <rect x="2" y="3" width="3" height="1" fill="var(--blush-vivid)" />
      <rect x="3" y="4" width="1" height="1" fill="var(--blush-vivid)" />
    </svg>
  );
}

export function isStickmanMeetClose(sectionId: string, linePos: number) {
  return sectionId === "footer"
    && Math.abs(linePos - FOOTER_PARTNER_LINE_POS) <= STICKMAN_MEET_THRESHOLD;
}

type SectionStickmanRailProps = {
  linePos: number;
  visible: boolean;
  jumping?: boolean;
};

/** Stickman na horizontálnej čiare pod levelom sekcie — nohy tesne na čiare */
export function SectionStickmanRail({ linePos, visible, jumping = false }: SectionStickmanRailProps) {
  if (!visible) return null;

  return (
    <div
      className="section-stickman-walker pointer-events-none absolute bottom-0 z-[5] transition-[left] duration-200 ease-out"
      style={{
        left: `${linePos}%`,
        transform: `translate(-50%, ${STICKMAN_LINE_SNAP_Y})`,
      }}
    >
      <PixelStickman jumping={jumping} />
    </div>
  );
}

/** Statický partner na pravom konci footer čiary */
export function FooterPartnerStickman() {
  return (
    <div
      className="footer-partner-stickman pointer-events-none absolute bottom-0 z-[5]"
      style={{
        left: `${FOOTER_PARTNER_LINE_POS}%`,
        transform: `translate(-50%, ${STICKMAN_LINE_SNAP_Y})`,
      }}
    >
      <PixelStickman facing="left" torsoColor="var(--turquoise)" />
    </div>
  );
}

type StickmanMeetHeartProps = {
  leftPos: number;
  visible: boolean;
};

/** Srdiečko nad stickmanmi pri stretnutí */
export function StickmanMeetHeart({ leftPos, visible }: StickmanMeetHeartProps) {
  if (!visible) return null;

  return (
    <div
      className="stickman-meet-heart pointer-events-none absolute bottom-0 z-[6] animate-stickman-meet-heart"
      style={{ left: `${leftPos}%` }}
    >
      <PixelMeetHeart />
    </div>
  );
}

/** Stickman na vlnke programu — na čiare medzi nodmi */
export function ProgramTrailStickman({
  left,
  top,
  facing,
  jumping,
}: {
  left: number;
  top: number;
  facing: "left" | "right";
  jumping?: boolean;
}) {
  return (
    <div
      className="program-trail-stickman pointer-events-none absolute z-[4] transition-[left,top] duration-200 ease-out"
      style={{
        left: `${left}%`,
        top: `${top}%`,
        transform: `translate(calc(-50% + ${facing === "right" ? 2 : -2}px), calc(-50% - 4px))`,
      }}
    >
      <PixelStickman facing={facing} jumping={jumping} />
    </div>
  );
}
