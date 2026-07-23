import { createFileRoute } from "@tanstack/react-router";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { toast, Toaster } from "sonner";
import { CursorHearts } from "../components/CursorHearts";
import {
  FooterPartnerStickman,
  FOOTER_PARTNER_LINE_POS,
  isStickmanMeetClose,
  ProgramTrailStickman,
  SectionStickmanRail,
  StickmanMeetHeart,
} from "../components/QuestStickman";
import { TetrisBackground } from "../components/TetrisDecor";
import { WeddingMap, MapMarkerIcon } from "../components/WeddingMap";
import photoManifest from "../data/photo-manifest.json";
import { sitePath } from "../lib/site-path";
import {
  Heart, MapPin, Calendar as CalendarIcon, Music, Utensils, Sparkles,
  Camera, Gift, Shirt, HelpCircle, Phone, Mail, Check, ChevronDown,
  ChevronRight, Send, Bot, User as UserIcon, Download, ExternalLink,
  Plus, Trash2, Car, Ban, CircleCheck, Trophy,
} from "lucide-react";

export const Route = createFileRoute("/")({ component: WeddingSite });

const FORM_ENDPOINT_DEFAULT =
  "https://script.google.com/macros/s/AKfycbzwHgw3HfWyvTnlA08n9fs2xSgz1E3qi8YcUnrXMbf7jovKgU-jHv41DvJKF6Wt-CM/exec";

/** Vite env na CI môže byť prázdny reťazec (nastavený secret bez hodnoty) — ?? by nepoužilo fallback. */
function viteEnv(name: string, fallback = "") {
  const value = import.meta.env[name as keyof ImportMetaEnv];
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed || fallback;
}

// ============ CONFIG (easy to edit) ============
const CONFIG = {
  brideName: "Natália",
  groomName: "Oto",
  dateISO: "2026-10-10T14:00:00+02:00",
  dateHuman: "10.10.2026",
  city: "Brno, Česká republika",
  /** Google Apps Script → Google Sheets (bez Formspree) */
  formEndpoint: viteEnv("VITE_FORMS_ENDPOINT", FORM_ENDPOINT_DEFAULT),
  formEndpoints: {
    rsvp: viteEnv("VITE_FORMS_RSVP"),
    pokrm: viteEnv("VITE_FORMS_POKRM"),
    ubytovanie: viteEnv("VITE_FORMS_UBYTOVANIE"),
    poznamka: viteEnv("VITE_FORMS_POZNAMKA"),
  },
  contacts: {
    natalia: { phone: "+421 950 323 833", email: "nataalia.schultz@gmail.com" },
    oto: { phone: "+421 949 127 356", email: "oto.schultz.o3@gmail.com" },
  },
  maps: {
    hotel: "https://maps.app.goo.gl/VpT7aXx7cn22k6YMA",
    zraz: "https://maps.app.goo.gl/VpT7aXx7cn22k6YMA",
    kostol: "https://maps.app.goo.gl/neQhvFuGKpXvciWT6",
    kumst: "https://maps.app.goo.gl/6jTyfog5wV9YqcAL6",
  },
  /** Lokácie svadby — súradnice pre mapu a karty */
  locations: [
    {
      id: "hotel",
      name: "Hotel Continental",
      desc: "Ubytovanie & check-in + zraz. Tvoja štartovná lokácia.",
      addr: "Kounicova 680/6, 602 00 Brno",
      image: "photos/lokacia_1.jpg",
      lat: 49.2005075,
      lng: 16.6046812,
      url: "https://maps.app.goo.gl/VpT7aXx7cn22k6YMA",
    },
    {
      id: "kostol",
      name: "Kostol sv. Jakuba",
      desc: "Obrad. Prosíme, príď aspoň s 15 min rezervou.",
      addr: "Jakubské náměstí, 602 00 Brno",
      image: "photos/lokacia_2.jpg",
      lat: 49.1966056,
      lng: 16.6083647,
      url: "https://maps.app.goo.gl/neQhvFuGKpXvciWT6",
    },
    {
      id: "kumst",
      name: "Kumst",
      desc: "Hostina, prvý tanec, raut a dozvuky.",
      addr: "Údolní 495/19, 602 00 Brno",
      image: "photos/lokacia_3.jpg",
      lat: 49.196831,
      lng: 16.600333,
      url: "https://maps.app.goo.gl/6jTyfog5wV9YqcAL6",
    },
  ],
  /** Voliteľná vlastná mapa (obrázok v public/) namiesto OpenStreetMap — napr. "/maps/brno-custom.png" */
  mapCustomImage: "" as string,
  hotel: {
    name: "Hotel Continental Brno",
    phone: "+420 541 519 609",
    email: "info@continentalbrno.cz",
  },
  qrPayment: sitePath("photos/QR_money.png"),
  qrPhotos: sitePath("photos/QR_photos.png"),
  photoUploadUrl: "https://drive.google.com/drive/folders/1HX-JrCV7PUJ9KLZ3z5_yQj88bmHFaXPN?usp=sharing",
  // Trojica jedál na výber pre hostí
  meals: [
    {
      key: "nevesta",
      label: "Nevestina voľba",
      desc: "Grilované kuracie špízy, grilované zemiaky, šmakózna zelenina, humus a tahini.",
    },
    {
      key: "zenich",
      label: "Ženíchova voľba",
      desc: "Grilované kuracie prsia, syr paneer, hranolky, šmakózna zelenina a zelená majonéza.",
    },
    {
      key: "sefkuchar",
      label: "Voľba šéfkuchára",
      desc: "Grilované jahňacie, grilované zemiaky, pita, šmakózna zelenina a humus.",
    },
  ] as const,
  // Cenník izieb (Kč / noc, vrátane raňajok)
  rooms: [
    { key: "single", label: "Jednolôžková", price: 1950 },
    { key: "double", label: "Dvojlôžková DBL", sublabel: "manželská posteľ", price: 2500 },
    { key: "twin", label: "Dvojlôžková TWIN", sublabel: "oddelené postele", price: 2500 },
  ] as const,
  extras: {
    extraBed: 600,   // prístelka
    cot: 0,          // detská postieľka do 3r
    pet: 500,        // pes / zviera
    parking: 390,    // parkovanie / noc (info mimo formulára)
  },
};

// ============ SHARED GUEST STORE (RSVP → Pokrm → Ubytovanie) ============
type Guest = { id: string; name: string; attending: boolean };
const GUEST_KEY = "no-wedding-guests-v1";
const RSVP_SENT_KEY = "no-wedding-rsvp-sent-v1";
const POKRM_SENT_KEY = "no-wedding-pokrm-sent-v1";
const POKRM_DATA_KEY = "no-wedding-pokrm-data-v1";
const UBYTOVANIE_SENT_KEY = "no-wedding-ubytovanie-sent-v1";
const UBYTOVANIE_DATA_KEY = "no-wedding-ubytovanie-data-v1";
const KONTAKT_SENT_KEY = "no-wedding-kontakt-sent-v1";
const KONTAKT_DATA_KEY = "no-wedding-kontakt-data-v1";

function readGuests(): Guest[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(GUEST_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Guest[];
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}
function writeGuests(list: Guest[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(GUEST_KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent("guests-updated"));
}

/** Hlavná osoba z RSVP (id „main“), prípadne prvý hosť. */
function getMainRsvpName(): string {
  const guests = readGuests();
  const main = guests.find((g) => g.id === "main") ?? guests[0];
  return main?.name?.trim() || "";
}

function useGuests(): Guest[] {
  const [guests, setGuests] = useState<Guest[]>([]);
  useEffect(() => {
    setGuests(readGuests());
    const h = () => setGuests(readGuests());
    window.addEventListener("guests-updated", h);
    window.addEventListener("storage", h);
    return () => {
      window.removeEventListener("guests-updated", h);
      window.removeEventListener("storage", h);
    };
  }, []);
  return guests;
}

// ============ CHECKLIST ============
const SECTIONS = [
  { id: "hero", label: "Poznač si termín", icon: CalendarIcon },
  { id: "program", label: "Naplánuj si deň", icon: MapPin },
  { id: "lokacie", label: "Naplánuj si cestu", icon: Car },
  { id: "rsvp", label: "Potvrď účasť", icon: Check },
  { id: "ubytovanie", label: "Rezervuj si izbu", icon: Sparkles },
  { id: "pokrm", label: "Vyber si pokrm", icon: Utensils },
  { id: "dresscode", label: "Nachystaj si odev", icon: Shirt },
  { id: "dary", label: "Priprav dar", icon: Gift },
  { id: "den", label: "Uži si náš deň", icon: Music },
  { id: "brno", label: "Objav Brno", icon: MapPin },
  { id: "fotky", label: "Zdieľaj s nami fotky", icon: Camera },
  { id: "faq", label: "Dopýtaj sa", icon: HelpCircle },
  { id: "kontakt", label: "Posledné veci", icon: Phone },
];
const CHECK_KEY = "no-wedding-checked-v1";
const ACHIEVEMENT_KEY = "no-wedding-quest-achievement-v1";
const STICKMAN_LINE_MIN = 2;
const STICKMAN_LINE_MAX = 98;
const STICKMAN_START_LINE_POS = 88;
const STICKMAN_LINE_STEP = 8;
const PROGRAM_TRAIL_SEGMENT_COUNT = 7;

type StickmanContextValue = {
  sectionId: string;
  linePos: number;
  programStop: number;
  jumping: boolean;
};

const StickmanContext = createContext<StickmanContextValue>({
  sectionId: "hero",
  linePos: STICKMAN_START_LINE_POS,
  programStop: 0,
  jumping: false,
});

const SECTION_IDS = [
  "hero", "program", "lokacie", "rsvp", "ubytovanie", "pokrm",
  "dresscode", "dary", "den", "brno", "fotky", "faq", "kontakt",
] as const;

const FOOTER_STICKMAN_ID = "footer" as const;
const STICKMAN_NAV_IDS = [...SECTION_IDS, FOOTER_STICKMAN_ID] as const;

/** Zdieľaný stav pre scroll sync — číta sa synchronne mimo React renderu */
const stickmanProgramEngagedRef = { current: false };

function getScrollOffset() {
  return window.matchMedia("(min-width: 1024px)").matches ? 16 : 68;
}

const CHECKLIST_IDS = new Set(SECTIONS.map((s) => s.id));

/** Sekcie bez vlastnej položky v quest logu → checklist id */
const SECTION_TO_CHECKLIST: Record<string, string> = {};

function sectionToChecklist(sectionId: string): string {
  const id = SECTION_TO_CHECKLIST[sectionId] ?? sectionId;
  return CHECKLIST_IDS.has(id) ? id : "kontakt";
}

function checklistToSection(checklistId: string): string {
  return checklistId;
}

function getActiveChecklistId(): string {
  const edge = getScrollOffset();
  const marker = edge + 96;

  for (let i = SECTION_IDS.length - 1; i >= 0; i--) {
    const id = SECTION_IDS[i];
    const el = document.getElementById(id);
    if (!el) continue;
    const rect = el.getBoundingClientRect();
    if (rect.top <= marker && rect.bottom > edge) {
      return sectionToChecklist(id);
    }
  }
  return "hero";
}

function getCurrentSectionIndex() {
  const edge = getScrollOffset();
  const marker = edge + 96;

  for (let i = SECTION_IDS.length - 1; i >= 0; i--) {
    const el = document.getElementById(SECTION_IDS[i]);
    if (!el) continue;
    const rect = el.getBoundingClientRect();
    if (rect.top <= marker && rect.bottom > edge) {
      return i;
    }
  }
  return 0;
}

function getStickmanRailRect(navId: (typeof STICKMAN_NAV_IDS)[number]): DOMRect | null {
  if (navId === FOOTER_STICKMAN_ID) {
    return document.getElementById("quest-footer-line")?.getBoundingClientRect() ?? null;
  }
  if (navId === "hero") {
    return document.querySelector<HTMLElement>('[data-stickman-rail="hero-program"]')?.getBoundingClientRect() ?? null;
  }
  if (navId === "program") {
    return document.querySelector<HTMLElement>('[data-stickman-rail="program-trail"]')?.getBoundingClientRect() ?? null;
  }
  return document.querySelector<HTMLElement>(`[data-stickman-rail="${navId}"]`)?.getBoundingClientRect() ?? null;
}

function getStickmanCheckpointLineY(navId: (typeof STICKMAN_NAV_IDS)[number]): number | null {
  const rect = getStickmanRailRect(navId);
  if (!rect) return null;
  if (navId === "program") {
    return Math.min(Math.max((rect.top + rect.bottom) / 2, rect.top), rect.bottom);
  }
  return rect.bottom;
}

function isHeaderLineVisible(lineY: number, viewportTop: number, viewportBottom: number) {
  return lineY >= viewportTop - 8 && lineY <= viewportBottom + 8;
}

function isHeroStickmanLineVisible(viewportTop: number, viewportBottom: number) {
  const lineY = getStickmanCheckpointLineY("hero");
  return lineY !== null && isHeaderLineVisible(lineY, viewportTop, viewportBottom);
}

function isProgramStickmanLineVisible(viewportTop: number, viewportBottom: number) {
  if (isHeroStickmanLineVisible(viewportTop, viewportBottom)) return false;
  if (getCurrentSectionIndex() > 1) return false;
  const rect = getStickmanRailRect("program");
  if (!rect) return false;
  return rect.top < viewportBottom && rect.bottom > viewportTop;
}

function isStickmanCheckpointVisible(
  navId: (typeof STICKMAN_NAV_IDS)[number],
  viewportTop: number,
  viewportBottom: number,
) {
  if (navId === "hero") return isHeroStickmanLineVisible(viewportTop, viewportBottom);
  if (navId === "program") return isProgramStickmanLineVisible(viewportTop, viewportBottom);

  const lineY = getStickmanCheckpointLineY(navId);
  return lineY !== null && isHeaderLineVisible(lineY, viewportTop, viewportBottom);
}

function resolveFooterStickmanIndex(): number | null {
  const footerIdx = STICKMAN_NAV_IDS.length - 1;
  const kontakt = document.getElementById("kontakt");
  if (!kontakt) return null;

  const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  const endSlack = 0;

  if (window.scrollY < maxScroll - endSlack) return null;

  const kontaktTop = kontakt.getBoundingClientRect().top + window.scrollY;
  if (window.scrollY + getScrollOffset() < kontaktTop - 8) return null;

  return footerIdx;
}

function getCurrentStickmanSectionIndex(currentIdx = 0, programStop = 0) {
  const edge = getScrollOffset();
  const anchor = edge + 96;
  const viewportTop = edge;
  const viewportBottom = window.innerHeight;
  const bandTop = anchor - 32;
  const bandBottom = anchor + 160;
  const heroIdx = STICKMAN_NAV_IDS.indexOf("hero");
  const programIdx = STICKMAN_NAV_IDS.indexOf("program");

  if (stickmanProgramEngagedRef.current && getCurrentSectionIndex() <= 1) {
    return programIdx;
  }

  const footerResolved = resolveFooterStickmanIndex();
  if (footerResolved !== null) {
    return footerResolved;
  }

  type Candidate = { idx: number; lineY: number; dist: number };
  const visible: Candidate[] = [];
  const inBand: Candidate[] = [];

  for (let i = 0; i < STICKMAN_NAV_IDS.length; i++) {
    const navId = STICKMAN_NAV_IDS[i];
    if (!isStickmanCheckpointVisible(navId, viewportTop, viewportBottom)) continue;
    const lineY = getStickmanCheckpointLineY(navId);
    if (lineY === null) continue;
    const candidate = { idx: i, lineY, dist: Math.abs(lineY - anchor) };
    visible.push(candidate);

    const inReadingBand = navId === "program"
      ? (() => {
          const rect = getStickmanRailRect("program");
          return !!rect && rect.top < bandBottom && rect.bottom > bandTop;
        })()
      : lineY >= bandTop && lineY <= bandBottom;
    if (inReadingBand) inBand.push(candidate);
  }

  const pickHeroOrProgram = (candidates: Candidate[]) => {
    const hasHero = candidates.some((c) => c.idx === heroIdx);
    const hasProgram = candidates.some((c) => c.idx === programIdx);
    if (!hasHero || !hasProgram) return null;
    if (stickmanProgramEngagedRef.current) return programIdx;
    if (currentIdx === programIdx || programStop > 0) return programIdx;
    if (currentIdx === heroIdx) return heroIdx;
    return null;
  };

  if (inBand.length > 0) {
    const footerInBand = resolveFooterStickmanIndex();
    if (footerInBand !== null) return footerInBand;
    const heroProgramPick = pickHeroOrProgram(inBand);
    if (heroProgramPick !== null) return heroProgramPick;
    inBand.sort((a, b) => a.dist - b.dist);
    return inBand[0].idx;
  }

  const currentNavId = STICKMAN_NAV_IDS[currentIdx];
  if (currentNavId && isStickmanCheckpointVisible(currentNavId, viewportTop, viewportBottom)) {
    return currentIdx;
  }

  if (visible.length > 0) {
    const footerPick = resolveFooterStickmanIndex();
    if (footerPick !== null) return footerPick;
    const heroProgramPick = pickHeroOrProgram(visible);
    if (heroProgramPick !== null) return heroProgramPick;
    visible.sort((a, b) => a.dist - b.dist);
    return visible[0].idx;
  }

  let bestIdx = 0;
  let bestAbove = -Infinity;

  for (let i = 0; i < STICKMAN_NAV_IDS.length; i++) {
    const lineY = getStickmanCheckpointLineY(STICKMAN_NAV_IDS[i]);
    if (lineY === null || lineY > anchor) continue;
    if (lineY > bestAbove) {
      bestAbove = lineY;
      bestIdx = i;
    }
  }

  if (bestAbove > -Infinity) {
    const footerPick = resolveFooterStickmanIndex();
    if (footerPick !== null) return footerPick;
    return bestIdx;
  }

  let nearestIdx = 0;
  let nearestDist = Infinity;
  for (let i = 0; i < STICKMAN_NAV_IDS.length; i++) {
    const lineY = getStickmanCheckpointLineY(STICKMAN_NAV_IDS[i]);
    if (lineY === null) continue;
    const dist = Math.abs(lineY - anchor);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearestIdx = i;
    }
  }

  const footerPick = resolveFooterStickmanIndex();
  if (footerPick !== null) return footerPick;

  return nearestIdx;
}

function scrollToStickmanTarget(navId: (typeof STICKMAN_NAV_IDS)[number], behavior: ScrollBehavior = "smooth") {
  if (navId === FOOTER_STICKMAN_ID) {
    const el = document.getElementById("quest-footer-line");
    if (!el) return;
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const lineY = el.getBoundingClientRect().bottom + window.scrollY;
    const targetTop = Math.min(Math.max(0, lineY - getScrollOffset() - 24), maxScroll);
    window.scrollTo({ top: targetTop, behavior });
    return;
  }

  const el = document.getElementById(navId);
  if (el) scrollToSection(el, behavior);
}

function getStickmanNavIndex(keyboardNavIndex: number | null) {
  if (keyboardNavIndex !== null) return keyboardNavIndex;
  return getCurrentStickmanSectionIndex();
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return target.isContentEditable;
}

function scrollToSection(el: HTMLElement, behavior: ScrollBehavior = "smooth") {
  const top = el.getBoundingClientRect().top + window.scrollY - getScrollOffset();
  window.scrollTo({ top, behavior });
}

function isQuestLogComplete(checked: Set<string>) {
  return SECTIONS.every((s) => checked.has(s.id));
}

function markSectionChecked(id: string) {
  try {
    const raw = window.localStorage.getItem(CHECK_KEY);
    const next = new Set(raw ? (JSON.parse(raw) as string[]) : []);
    if (next.has(id)) return;
    next.add(id);
    window.localStorage.setItem(CHECK_KEY, JSON.stringify([...next]));
    window.dispatchEvent(new CustomEvent("wedding-check-update"));
  } catch { /* noop */ }
}

function WeddingSite() {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [active, setActive] = useState<string>("hero");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [achievementOpen, setAchievementOpen] = useState(false);
  const pendingScrollRef = useRef<string | null>(null);
  const keyboardNavIndexRef = useRef<number | null>(null);
  const [stickmanSectionIdx, setStickmanSectionIdx] = useState(0);
  const [stickmanLinePos, setStickmanLinePos] = useState(STICKMAN_START_LINE_POS);
  const [stickmanProgramStop, setStickmanProgramStop] = useState(0);
  const [stickmanJumping, setStickmanJumping] = useState(false);
  const stickmanJumpTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const stickmanLinePosRef = useRef(STICKMAN_START_LINE_POS);
  const stickmanProgramStopRef = useRef(0);
  const stickmanSectionIdxRef = useRef(0);
  const stickmanManualModeRef = useRef(false);

  stickmanLinePosRef.current = stickmanLinePos;
  stickmanProgramStopRef.current = stickmanProgramStop;
  stickmanSectionIdxRef.current = stickmanSectionIdx;

  const pulseStickmanJump = () => {
    clearTimeout(stickmanJumpTimerRef.current);
    setStickmanJumping(true);
    stickmanJumpTimerRef.current = setTimeout(() => setStickmanJumping(false), 280);
  };

  // Load persisted checks
  useEffect(() => {
    const sync = () => {
      try {
        const raw = window.localStorage.getItem(CHECK_KEY);
        if (raw) setChecked(new Set(JSON.parse(raw) as string[]));
      } catch { /* noop */ }
    };
    sync();
    try {
      if (window.localStorage.getItem(RSVP_SENT_KEY) === "1") markSectionChecked("rsvp");
      if (window.localStorage.getItem(POKRM_SENT_KEY) === "1") markSectionChecked("pokrm");
      if (window.localStorage.getItem(UBYTOVANIE_SENT_KEY) === "1") markSectionChecked("ubytovanie");
      if (window.localStorage.getItem(KONTAKT_SENT_KEY) === "1") markSectionChecked("kontakt");
    } catch { /* noop */ }
    window.addEventListener("wedding-check-update", sync);
    return () => window.removeEventListener("wedding-check-update", sync);
  }, []);

  useEffect(() => {
    if (!isQuestLogComplete(checked)) return;
    try {
      if (window.localStorage.getItem(ACHIEVEMENT_KEY) === "1") return;
      window.localStorage.setItem(ACHIEVEMENT_KEY, "1");
    } catch { /* noop */ }
    setAchievementOpen(true);
  }, [checked]);

  // Aktívna položka checklistu podľa scroll pozície
  useEffect(() => {
    let rafId: number | null = null;

    const syncActive = () => {
      if (pendingScrollRef.current) return;
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        setActive(getActiveChecklistId());
        if (stickmanManualModeRef.current || stickmanProgramEngagedRef.current) return;
        keyboardNavIndexRef.current = null;
        setStickmanSectionIdx(getCurrentStickmanSectionIndex(
          stickmanSectionIdxRef.current,
          stickmanProgramStopRef.current,
        ));
      });
    };

    const onResize = () => {
      if (!stickmanManualModeRef.current && !stickmanProgramEngagedRef.current) {
        keyboardNavIndexRef.current = null;
        setStickmanSectionIdx(getCurrentStickmanSectionIndex(
          stickmanSectionIdxRef.current,
          stickmanProgramStopRef.current,
        ));
      }
      setActive(getActiveChecklistId());
    };

    setActive(getActiveChecklistId());
    setStickmanSectionIdx(getCurrentStickmanSectionIndex(0, 0));
    window.addEventListener("scroll", syncActive, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", syncActive);
      window.removeEventListener("resize", onResize);
      if (rafId !== null) window.cancelAnimationFrame(rafId);
    };
  }, []);

  // Šípky hore/dole — skok po sekciách; vľavo/vpravo — po čiare / bublinkách
  useEffect(() => {
    const programIdx = STICKMAN_NAV_IDS.indexOf("program");

    const lockStickmanManualMode = () => {
      stickmanManualModeRef.current = true;
    };

    const engageProgramTrail = () => {
      stickmanProgramEngagedRef.current = true;
    };

    const releaseProgramTrail = () => {
      stickmanProgramEngagedRef.current = false;
    };

    const applyStickmanSection = (
      nextIdx: number,
      placement?: { linePos?: number; programStop?: number },
    ) => {
      stickmanSectionIdxRef.current = nextIdx;
      keyboardNavIndexRef.current = nextIdx;
      setStickmanSectionIdx(nextIdx);

      if (placement?.programStop !== undefined) {
        stickmanProgramStopRef.current = placement.programStop;
        setStickmanProgramStop(placement.programStop);
      }
      if (placement?.linePos !== undefined) {
        stickmanLinePosRef.current = placement.linePos;
        setStickmanLinePos(placement.linePos);
      }
    };

    const goToStickmanSection = (
      nextIdx: number,
      placement?: { linePos?: number; programStop?: number },
    ) => {
      if (nextIdx < 0 || nextIdx >= STICKMAN_NAV_IDS.length) return;

      const navId = STICKMAN_NAV_IDS[nextIdx];
      const checklistId = navId === FOOTER_STICKMAN_ID
        ? sectionToChecklist("kontakt")
        : sectionToChecklist(navId);

      pendingScrollRef.current = checklistId;
      lockStickmanManualMode();

      if (navId === "program") {
        engageProgramTrail();
      } else if (navId === "hero") {
        releaseProgramTrail();
      }

      applyStickmanSection(nextIdx, placement);
      pulseStickmanJump();
      setActive(checklistId);

      const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth";

      if (navId === "program") {
        const stop = placement?.programStop ?? stickmanProgramStopRef.current;
        scrollToProgramStickman(stop, behavior);
      } else {
        scrollToStickmanTarget(navId, behavior);
      }

      window.setTimeout(() => {
        pendingScrollRef.current = null;
      }, navId === FOOTER_STICKMAN_ID ? 1200 : 600);
    };

    const crossSectionHorizontal = (currentIdx: number, direction: 1 | -1) => {
      const nextIdx = currentIdx + direction;
      if (nextIdx < 0 || nextIdx >= STICKMAN_NAV_IDS.length) return;

      const nextId = STICKMAN_NAV_IDS[nextIdx];
      const placement: { linePos?: number; programStop?: number } = {};

      if (direction > 0) {
        if (nextId === "program") placement.programStop = 0;
        else placement.linePos = STICKMAN_LINE_MIN;
      } else if (nextId === "program") {
        placement.programStop = PROGRAM_TRAIL_SEGMENT_COUNT - 1;
      } else {
        placement.linePos = STICKMAN_LINE_MAX;
      }

      goToStickmanSection(nextIdx, placement);
    };

    const navigateSection = (direction: 1 | -1) => {
      const currentIdx = keyboardNavIndexRef.current ?? stickmanSectionIdxRef.current;
      const nextIdx = direction > 0
        ? Math.min(currentIdx + 1, STICKMAN_NAV_IDS.length - 1)
        : Math.max(currentIdx - 1, 0);

      if (nextIdx === currentIdx) return;

      const navId = STICKMAN_NAV_IDS[nextIdx];
      const placement =
        navId === "hero"
          ? { linePos: STICKMAN_START_LINE_POS }
          : navId === "program"
            ? { programStop: 0 }
            : undefined;

      goToStickmanSection(nextIdx, placement);
    };

    const moveStickmanHorizontal = (delta: 1 | -1) => {
      const sectionIdx = keyboardNavIndexRef.current ?? stickmanSectionIdxRef.current;
      const sectionId = STICKMAN_NAV_IDS[sectionIdx];
      const maxIdx = STICKMAN_NAV_IDS.length - 1;
      const scrollBehavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth";

      if (sectionId === "program") {
        const stop = stickmanProgramStopRef.current;
        const nextStop = stop + delta;
        if (nextStop < 0) {
          if (sectionIdx > 0) crossSectionHorizontal(sectionIdx, -1);
          return;
        }
        if (nextStop >= PROGRAM_TRAIL_SEGMENT_COUNT) {
          if (sectionIdx < maxIdx) crossSectionHorizontal(sectionIdx, 1);
          return;
        }
        pendingScrollRef.current = "program";
        lockStickmanManualMode();
        engageProgramTrail();
        applyStickmanSection(programIdx, { programStop: nextStop });
        window.requestAnimationFrame(() => {
          scrollToProgramStickman(nextStop, scrollBehavior);
        });
        window.setTimeout(() => {
          pendingScrollRef.current = null;
        }, 400);
        return;
      }

      if (sectionId === "hero") {
        const pos = stickmanLinePosRef.current;
        const nextPos = pos + delta * STICKMAN_LINE_STEP;
        if (nextPos > STICKMAN_LINE_MAX) {
          crossSectionHorizontal(sectionIdx, 1);
          return;
        }
        if (nextPos < STICKMAN_LINE_MIN) {
          stickmanLinePosRef.current = STICKMAN_LINE_MIN;
          setStickmanLinePos(STICKMAN_LINE_MIN);
          return;
        }
        pendingScrollRef.current = "hero";
        lockStickmanManualMode();
        stickmanLinePosRef.current = nextPos;
        setStickmanLinePos(nextPos);
        window.setTimeout(() => {
          pendingScrollRef.current = null;
        }, 200);
        return;
      }

      const pos = stickmanLinePosRef.current;
      const nextPos = pos + delta * STICKMAN_LINE_STEP;

      if (nextPos < STICKMAN_LINE_MIN) {
        if (sectionIdx > 0) crossSectionHorizontal(sectionIdx, -1);
        else setStickmanLinePos(STICKMAN_LINE_MIN);
        return;
      }
      if (nextPos > STICKMAN_LINE_MAX) {
        if (sectionIdx < maxIdx) crossSectionHorizontal(sectionIdx, 1);
        else setStickmanLinePos(STICKMAN_LINE_MAX);
        return;
      }
      lockStickmanManualMode();
      stickmanLinePosRef.current = nextPos;
      setStickmanLinePos(nextPos);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        pulseStickmanJump();
        return;
      }

      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        if (e.repeat) return;
      }

      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        moveStickmanHorizontal(e.key === "ArrowRight" ? 1 : -1);
        return;
      }

      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      e.preventDefault();
      navigateSection(e.key === "ArrowDown" ? 1 : -1);
    };

    const resetKeyboardNav = () => {
      keyboardNavIndexRef.current = null;
      stickmanManualModeRef.current = false;
      stickmanProgramEngagedRef.current = false;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("wheel", resetKeyboardNav, { passive: true });
    window.addEventListener("touchstart", resetKeyboardNav, { passive: true });
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("wheel", resetKeyboardNav);
      window.removeEventListener("touchstart", resetKeyboardNav);
      clearTimeout(stickmanJumpTimerRef.current);
    };
  }, []);

  const scrollTo = (id: string) => {
    const sectionId = checklistToSection(id);
    const navIdx = SECTION_IDS.indexOf(sectionId as (typeof SECTION_IDS)[number]);
    if (navIdx >= 0) {
      keyboardNavIndexRef.current = navIdx;
      stickmanSectionIdxRef.current = navIdx;
      setStickmanSectionIdx(navIdx);
      if (sectionId === "program") {
        stickmanProgramEngagedRef.current = true;
        stickmanManualModeRef.current = true;
      }
      pulseStickmanJump();
    }

    pendingScrollRef.current = id;
    setActive(id);
    const el = document.getElementById(sectionId);
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth";
    if (sectionId === "program") {
      scrollToProgramStickman(stickmanProgramStopRef.current, behavior);
    } else if (el) {
      scrollToSection(el, behavior);
    }
    setMobileOpen(false);
    window.setTimeout(() => {
      pendingScrollRef.current = null;
    }, 600);
  };

  const toggleCheck = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      try { window.localStorage.setItem(CHECK_KEY, JSON.stringify([...next])); } catch { /* noop */ }
      return next;
    });
  };

  const clearChecklistProgress = () => {
    if (checked.size === 0) return;
    setChecked(new Set());
    setAchievementOpen(false);
    try {
      window.localStorage.setItem(CHECK_KEY, JSON.stringify([]));
      window.localStorage.removeItem(ACHIEVEMENT_KEY);
    } catch { /* noop */ }
  };

  const progress = Math.round((checked.size / SECTIONS.length) * 100);
  const questComplete = isQuestLogComplete(checked);

  const stickmanContextValue = useMemo<StickmanContextValue>(
    () => ({
      sectionId: STICKMAN_NAV_IDS[stickmanSectionIdx] ?? "hero",
      linePos: stickmanLinePos,
      programStop: stickmanProgramStop,
      jumping: stickmanJumping,
    }),
    [stickmanSectionIdx, stickmanLinePos, stickmanProgramStop, stickmanJumping],
  );

  return (
    <div className="relative min-h-screen overflow-x-visible">
      <StickmanContext.Provider value={stickmanContextValue}>
      <Toaster position="top-center" richColors visibleToasts={1} />
      <QuestAchievementPopup open={achievementOpen} onClose={() => setAchievementOpen(false)} />
      <CursorHearts />
      <PaperTexture />

      <MobileChecklist
        open={mobileOpen}
        onToggle={() => setMobileOpen((o) => !o)}
        checked={checked}
        active={active}
        onPick={scrollTo}
        onToggleCheck={toggleCheck}
        progress={progress}
        questComplete={questComplete}
      />

      <div className="site-body relative">
        <TetrisBackground />
        <div className="edge-layout relative z-10 mx-auto max-w-[1400px] overflow-visible px-6 sm:px-8 md:px-10 pt-16 lg:px-8 lg:pt-8 lg:pr-[360px]">
        <EdgePhotos />
        <div className="edge-content">
        <HeroSection />
        <ProgramSection />
        <LokacieSection />
        <RsvpSection />
        <UbytovanieSection />
        <PokrmSection />
        <DresscodeSection />
        <DarySection />
        <DenSection />
        <BrnoSection />
        <FotkySection />
        <FaqSection />
        <KontaktSection />
        </div>
      </div>
      </div>

      <DesktopChecklist
        checked={checked}
        active={active}
        onPick={scrollTo}
        onToggleCheck={toggleCheck}
        onClearProgress={clearChecklistProgress}
        progress={progress}
        questComplete={questComplete}
      />
      </StickmanContext.Provider>
    </div>
  );
}

// ============ EDGE PHOTOS ============
const EDGE_PHOTO_COUNT = 14;

/** Voliteľné výnimky — len ak súbor nemá tvar „číslo.prípona“. */
const EDGE_PHOTO_FILE_OVERRIDES: Partial<Record<number, string>> = {};

const EDGE_PHOTO_MANIFEST = photoManifest as Record<string, string>;

function resolveEdgePhotoSrc(photoNum: number) {
  const file = EDGE_PHOTO_MANIFEST[String(photoNum)] ?? EDGE_PHOTO_FILE_OVERRIDES[photoNum];
  return file ? sitePath(`photos/${file}`) : null;
}

function hash01(n: number, salt: number) {
  const x = Math.sin(n * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function edgePhotoVariants(col: number, side: "left" | "right", total: number) {
  const h = col + (side === "left" ? 0 : 137);
  const sideMul = side === "left" ? 1 : -1;
  const progress = total > 1 ? col / (total - 1) : 0;
  const endBias = progress * progress;

  const baseSpacer = 0.45 + hash01(h, 4) * 1.35;
  const spacer =
    side === "left"
      ? baseSpacer * (1 - endBias * 0.45)
      : baseSpacer * (1 + endBias * 1.05);

  return {
    rot: (hash01(h, 1) * 22 - 11) * sideMul + (side === "right" ? endBias * 6 : endBias * -4),
    shift: (hash01(h, 2) * 34 - 17) * (side === "left" ? 1 : -1) + (side === "right" ? endBias * 14 : endBias * -8),
    nudgeY: hash01(h, 3) * 36 - 18 + (side === "right" ? endBias * 32 : endBias * -14),
    spacer,
  };
}

function edgeTrailingSpacer(side: "left" | "right") {
  return side === "left" ? 0.3 : 2.85;
}

/**
 * Popisky pod okrajovými fotkami — formát zobrazenia: „miesto, rok“.
 *
 * Číslo fotky = názov súboru v public/photos/ (napr. 4.jpeg):
 *   1  … 14  → ľavý okraj (hore → dole)
 *   15 … 28  → pravý okraj (hore → dole)
 *
 * Stačí vložiť súbor ako „číslo.prípona“ do public/photos/ — manifest sa synchronizuje automaticky pri npm run dev.
 * Neštandardný názov → EDGE_PHOTO_FILE_OVERRIDES vyššie.
 */
const EDGE_PHOTO_CAPTIONS: { place: string; year: string }[] = [
  // 1 — ľavý okraj, hore
  { place: "Le Mont-Saint-Michel, FR", year: "2025" },
  // 2
  { place: "Smolenice, SK", year: "2020" },
  // 3
  { place: "Brno, CZ", year: "2023" },
  // 4
  { place: "Praha", year: "2022" },
  // foto_5
  { place: "Paris, FR", year: "2025" },
  // foto_6
  { place: "Paris, FR", year: "2025" },
  // foto_7
  { place: "Hverir, IS", year: "2022" },
  // foto_8
  { place: "Brno, CZ", year: "2026" },
  // foto_9
  { place: "Muráno, IT", year: "2025" },
  // foto_10
  { place: "Skiathos, GR", year: "2021" },
  // foto_11
  { place: "Santorini, GR", year: "2025" },
  // foto_12
  { place: "Brno, CZ", year: "2022" },
  // foto_13
  { place: "Atény, GR", year: "2025" },
  // foto_14 — ľavý okraj, dole
  { place: "Fuerteventura, ES", year: "2023" },
  // foto_15 — pravý okraj, hore
  { place: "Chtelnica, SK", year: "2018" },
  // foto_16
  { place: "Kriváň, SK", year: "2020" },
  // foto_17
  { place: "Tokio, JP", year: "2026" },
  // foto_18
  { place: "San Francisco, US", year: "2026" },
  // foto_19
  { place: "Brno, CZ", year: "2023" },
  // foto_20
  { place: "Brno, CZ", year: "2020" },
  // foto_21
  { place: "Vestmannaeyjar, IM", year: "2022" },
  // foto_22
  { place: "Špačince, SK", year: "2020" },
  // foto_23
  { place: "Caorle, IT", year: "2025" },
  // foto_24
  { place: "Orava, SK", year: "2018" },
  // foto_25
  { place: "Nantes, FR", year: "2025" },
  // foto_26
  { place: "Brno, CZ", year: "2023" },
  // foto_27
  { place: "Paphos, CY", year: "2022" },
  // foto_28 — pravý okraj, dole
  { place: "Brno, CZ", year: "2022" },
];

function edgePhotoCaption(index: number) {
  const { place, year } = EDGE_PHOTO_CAPTIONS[index] ?? { place: "", year: "" };
  if (place && year) return `${place}, ${year}`;
  if (place) return place;
  if (year) return year;
  return "miesto, rok";
}

function edgePhotoCaptionIsPlaceholder(index: number) {
  const { place, year } = EDGE_PHOTO_CAPTIONS[index] ?? { place: "", year: "" };
  return !place && !year;
}

/** Foto 8–10 — výraznejší sklon pri leveloch 08–10 */
const EDGE_PHOTO_ROT_OVERRIDES: Record<number, number> = {
  7: -6,
  8: 5,
  9: -4.5,
  14: 3.5,
  15: -3.5,
};

/** Výnimky orezania — index 0 = foto 1 */
const EDGE_PHOTO_IMG_CLASS_OVERRIDES: Partial<Record<number, string>> = {
  23: "edge-photo-img--night",
};

function polaroidPlaceholder(n: number) {
  const hues = [350, 85, 190, 20];
  const h = hues[n % hues.length];
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='250' height='330' viewBox='0 0 250 330'>
    <rect width='250' height='330' fill='hsl(${h} 35% 88%)'/>
    <text x='125' y='170' text-anchor='middle' font-family='sans-serif' font-size='22' fill='hsl(${h} 25% 28%)'>Foto ${n + 1}</text>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function EdgePolaroid({ index, columnIndex, side, total }: { index: number; columnIndex: number; side: "left" | "right"; total: number }) {
  const v = edgePhotoVariants(columnIndex, side, total);
  const rot = EDGE_PHOTO_ROT_OVERRIDES[index] ?? v.rot;
  const photoNum = index + 1;
  const photoSrc = resolveEdgePhotoSrc(photoNum);
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [photoSrc]);

  const showPlaceholder = !photoSrc || imgFailed;

  return (
    <div
      className="edge-polaroid cursor-pointer"
      style={{
        transform: `translate(${v.shift}px, ${v.nudgeY}px) rotate(${rot}deg)`,
      }}
    >
      <div className="tape tape-center" />
      {EDGE_PHOTO_IMG_CLASS_OVERRIDES[index] === "edge-photo-img--night" ? (
        <div className="edge-polaroid__img-frame--night">
          <img
            key={photoSrc ?? `ph-${index}`}
            src={showPlaceholder ? polaroidPlaceholder(index) : photoSrc}
            alt=""
            className="edge-photo-img edge-photo-img--night"
            decoding="async"
            loading="lazy"
            onError={() => setImgFailed(true)}
          />
        </div>
      ) : (
        <img
          key={photoSrc ?? `ph-${index}`}
          src={showPlaceholder ? polaroidPlaceholder(index) : photoSrc}
          alt=""
          className="edge-photo-img"
          decoding="async"
          loading="lazy"
          onError={() => setImgFailed(true)}
        />
      )}
      <p
        className={`edge-photo-caption font-hand ${edgePhotoCaptionIsPlaceholder(index) ? "edge-photo-caption--placeholder" : ""}`}
      >
        {edgePhotoCaption(index)}
      </p>
    </div>
  );
}

function EdgeGallery({ side, indices }: {
  side: "left" | "right";
  indices: number[];
}) {
  const total = indices.length;
  return (
    <div className={`edge-gallery edge-gallery--${side}`}>
      {indices.map((index, col) => (
        <span key={`${side}-${index}`} className="contents">
          {col > 0 && (
            <div
              className="edge-spacer"
              style={{ flexGrow: edgePhotoVariants(col - 1, side, total).spacer }}
              aria-hidden
            />
          )}
          <EdgePolaroid index={index} columnIndex={col} side={side} total={total} />
        </span>
      ))}
      <div
        className="edge-spacer edge-spacer--trail"
        style={{ flexGrow: edgeTrailingSpacer(side) }}
        aria-hidden
      />
    </div>
  );
}

function EdgePhotos() {
  const left = Array.from({ length: EDGE_PHOTO_COUNT }, (_, i) => i);
  const right = Array.from({ length: EDGE_PHOTO_COUNT }, (_, i) => i + EDGE_PHOTO_COUNT);
  return (
    <div className="edge-galleries" aria-hidden>
      <EdgeGallery side="left" indices={left} />
      <EdgeGallery side="right" indices={right} />
    </div>
  );
}

// ============ BACKGROUND ============
function PaperTexture() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 opacity-[0.08] mix-blend-overlay"
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/></svg>\")",
      }}
    />
  );
}

// ============ CHECKLIST UI ============
function QuestAchievementPopup({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-[color:var(--bordo-deep)]/75 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Zavrieť achievement"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="quest-achievement-title"
        aria-describedby="quest-achievement-desc"
        className="paper-card relative z-10 w-full max-w-sm rotate-1 p-8 text-center shadow-2xl"
      >
        <div className="tape tape-center" />
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full border-2 border-dashed border-[color:var(--gold)] bg-[color:var(--gold)]/15">
          <QuestLogTrophy className="h-7 w-7" />
        </div>
        <p className="font-marker text-xs uppercase tracking-[0.2em] text-[color:var(--turquoise)]">
          Achievement
        </p>
        <h3 id="quest-achievement-title" className="mt-3 font-display text-3xl text-[color:var(--bordo)]">
          Bude svatba!
        </h3>
        <p id="quest-achievement-desc" className="sr-only">
          Quest log je kompletne splnený.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-[color:var(--bordo)] px-6 py-2.5 font-marker text-xs uppercase tracking-wide text-[color:var(--gold)] transition hover:bg-[color:var(--bordo-deep)]"
        >
          <Check className="h-4 w-4" aria-hidden />
          Pokračovať
        </button>
      </div>
    </div>
  );
}

function QuestLogTrophy({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <Trophy
      className={`shrink-0 text-[color:var(--gold)] ${className}`}
      aria-label="Achievement splnený"
      fill="currentColor"
      strokeWidth={1.75}
    />
  );
}

function ChecklistItem({
  s, done, active, onPick, onToggleCheck,
}: {
  s: (typeof SECTIONS)[number];
  done: boolean; active: boolean;
  onPick: (id: string) => void;
  onToggleCheck: (id: string) => void;
}) {
  return (
    <div
      className={`group flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-[color:var(--ink)]/5 ${
        active ? "bg-[color:var(--gold)]/15" : ""
      }`}
    >
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onToggleCheck(s.id); }}
        aria-label={done ? `Odčiarknuť ${s.label}` : `Označiť ${s.label} ako hotové`}
        className={`grid h-6 w-6 shrink-0 place-items-center rounded border-2 transition ${
          done ? "border-[color:var(--turquoise)] bg-[color:var(--turquoise)]/20" : "border-[color:var(--ink)]/40 hover:border-[color:var(--bordo)]"
        }`}
        style={{ transform: done ? "rotate(-3deg)" : "none" }}
      >
        {done && (
          <svg viewBox="0 0 20 20" className="h-5 w-5 text-[color:var(--bordo-deep)]">
            <path d="M3 11 L8 15 L17 4" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
      <button
        type="button"
        onClick={() => onPick(s.id)}
        className="flex-1 text-left font-hand text-lg leading-tight text-[color:var(--ink)]"
        style={{ textDecoration: done ? "line-through" : "none" }}
      >
        {s.label}
      </button>
      <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-[color:var(--bordo)] opacity-0 transition-opacity group-hover:opacity-100" />
    </div>
  );
}

function DesktopChecklist({
  checked, active, onPick, onToggleCheck, onClearProgress, progress, questComplete,
}: {
  checked: Set<string>; active: string; progress: number; questComplete: boolean;
  onPick: (id: string) => void;
  onToggleCheck: (id: string) => void;
  onClearProgress: () => void;
}) {
  return (
    <aside className="fixed right-6 top-6 bottom-6 z-30 hidden w-[320px] overflow-visible lg:block">
      <div className="paper-card notebook-lines relative h-full overflow-visible p-5 pt-8">
        <div className="tape" />
        <div className="flex h-full min-h-0 flex-col overflow-hidden">
        <div className="mb-3 flex items-center gap-2 border-b-2 border-dashed border-[color:var(--ink)]/20 pb-2">
          <h2 className="font-marker text-xl text-[color:var(--bordo)]">Quest log</h2>
          {questComplete && <QuestLogTrophy />}
          <span className="ml-auto font-hand text-xl text-[color:var(--ink)]/70">{progress}%</span>
        </div>
        <div className="mb-3 h-2 overflow-hidden rounded-full bg-[color:var(--ink)]/10">
          <div className="h-full rounded-full bg-[color:var(--turquoise)] transition-all" style={{ width: `${progress}%` }} />
        </div>
        <p className="mb-2 font-hand text-xs text-[color:var(--ink)]/60">Odčiarkni si sám, keď máš hotovo ✍️</p>
        <div className="checklist-menu-scroll min-h-0 flex-1 space-y-0.5">
          {SECTIONS.map((s) => (
            <ChecklistItem
              key={s.id} s={s}
              done={checked.has(s.id)} active={active === s.id}
              onPick={onPick} onToggleCheck={onToggleCheck}
            />
          ))}
        </div>
        <div className="relative mt-auto shrink-0">
          <StickmanControlHintsDesktop />
          {checked.size > 0 && (
            <button
              type="button"
              onClick={onClearProgress}
              className="absolute -bottom-0.5 right-0 z-10 rounded p-0.5 text-[color:var(--ink)]/25 transition hover:text-[color:var(--ink)]/55"
              title="Vymazať odčiarknuté položky"
              aria-label="Vymazať odčiarknuté položky"
            >
              <Trash2 className="h-3 w-3" strokeWidth={1.75} />
            </button>
          )}
        </div>
        </div>
      </div>
    </aside>
  );
}

function StickmanArrowKeysHint() {
  return (
    <svg
      className="quest-stickman-keys"
      viewBox="0 0 56 34"
      fill="none"
      aria-hidden
    >
      <rect x="20" y="1" width="16" height="13" rx="2" stroke="currentColor" strokeWidth="1.1" />
      <path d="M28 4.5 L31.5 9.5 H24.5 Z" fill="currentColor" />

      <rect x="2" y="18" width="16" height="13" rx="2" stroke="currentColor" strokeWidth="1.1" />
      <path d="M5.5 24.5 L10.5 21 V28 Z" fill="currentColor" />

      <rect x="20" y="18" width="16" height="13" rx="2" stroke="currentColor" strokeWidth="1.1" />
      <path d="M28 28.5 L24.5 23.5 H31.5 Z" fill="currentColor" />

      <rect x="38" y="18" width="16" height="13" rx="2" stroke="currentColor" strokeWidth="1.1" />
      <path d="M50.5 24.5 L45.5 21 V28 Z" fill="currentColor" />
    </svg>
  );
}

function StickmanCurvedCue() {
  return (
    <svg
      className="quest-stickman-hint__curved-cue"
      viewBox="0 0 44 30"
      fill="none"
      aria-hidden
    >
      <defs>
        <marker
          id="hint-hand-arrow"
          viewBox="0 0 8 8"
          refX="6.5"
          refY="4"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path
            d="M1 1.5 L6.5 4 L1 6.5"
            stroke="currentColor"
            strokeWidth="1.35"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </marker>
      </defs>
      <path
        d="M1 24 C 10 25, 22 16, 40 12"
        stroke="currentColor"
        strokeWidth="1.55"
        strokeLinecap="round"
        markerEnd="url(#hint-hand-arrow)"
      />
    </svg>
  );
}

function StickmanControlHintsDesktop() {
  return (
    <div
      className="quest-stickman-hint quest-stickman-hint--checklist hidden lg:block"
      aria-label="Pssst, skús ovládať postavičku šípkami"
    >
      <p className="quest-stickman-hint__whisper">Pssst, skús</p>
      <StickmanCurvedCue />
      <StickmanArrowKeysHint />
    </div>
  );
}

function StickmanControlHintsMobile() {
  return (
    <p className="quest-stickman-hint quest-stickman-hint--mobile-pc">
      Psst... pre lepší zážitok sa presuň na PC
    </p>
  );
}

function MobileChecklist({
  open, onToggle, checked, active, onPick, onToggleCheck, progress, questComplete,
}: {
  open: boolean; onToggle: () => void;
  checked: Set<string>; active: string; progress: number; questComplete: boolean;
  onPick: (id: string) => void;
  onToggleCheck: (id: string) => void;
}) {
  return (
    <div className="fixed inset-x-0 top-0 z-40 lg:hidden">
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 border-b border-[color:var(--gold)]/30 bg-[color:var(--bordo-deep)]/95 px-4 py-2.5 backdrop-blur"
      >
        <span className="font-marker text-sm text-[color:var(--gold)]">Quest log</span>
        {questComplete && <QuestLogTrophy className="h-3.5 w-3.5" />}
        <div className="flex-1 h-1.5 rounded-full bg-[color:var(--paper)]/15 overflow-hidden">
          <div className="h-full bg-[color:var(--turquoise)]" style={{ width: `${progress}%` }} />
        </div>
        <span className="font-hand text-lg text-[color:var(--paper)]">{progress}%</span>
        <ChevronDown className={`h-4 w-4 text-[color:var(--paper)] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="paper-card mx-3 mt-2 flex max-h-[70vh] flex-col overflow-hidden p-3">
          <div className="checklist-menu-scroll min-h-0 flex-1 space-y-0.5">
            {SECTIONS.map((s) => (
              <ChecklistItem
                key={s.id} s={s}
                done={checked.has(s.id)} active={active === s.id}
                onPick={onPick} onToggleCheck={onToggleCheck}
              />
            ))}
          </div>
          <StickmanControlHintsMobile />
        </div>
      )}
    </div>
  );
}

// ============ Section wrapper ============
function Section({
  id, level, title, children,
}: { id: string; level: string; title: string; children: React.ReactNode }) {
  const stickman = useContext(StickmanContext);
  const showStickman =
    id === "program"
      ? stickman.sectionId === "hero"
      : stickman.sectionId === id;

  return (
    <section id={id} className="scroll-mt-[4.25rem] py-16 pb-24 lg:scroll-mt-4 lg:py-24 lg:pb-32">
      <div className="relative mb-8 flex items-end gap-4">
        <span className="font-marker text-sm uppercase tracking-widest text-[color:var(--turquoise)]">
          {level}
        </span>
        <div
          className="relative flex-1 pt-[22px]"
          data-stickman-rail={id === "program" ? "hero-program" : id}
        >
          <div className="pointer-events-none absolute inset-x-0 bottom-0 border-t-2 border-dashed border-[color:var(--gold)]/40" />
          <SectionStickmanRail linePos={stickman.linePos} visible={showStickman} jumping={stickman.jumping} />
        </div>
      </div>
      <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-[color:var(--paper)] mb-8">
        {title}
      </h2>
      {children}
    </section>
  );
}

// ============ HERO ============
function useCountdown(iso: string) {
  const target = useMemo(() => new Date(iso).getTime(), [iso]);
  // Start with 0-diff (matches SSR) and update in effect to avoid hydration mismatch
  const [now, setNow] = useState<number>(target);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, target - now);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return { days, hours, minutes, seconds };
}

const GCAL_URL =
  "https://calendar.google.com/calendar/render?action=TEMPLATE" +
  "&text=Svadba+Nat%C3%A1lia+%26+Oto" +
  "&dates=20261010T120000Z/20261011T000000Z" +
  "&location=Brno&details=Co-op+quest";

function downloadIcs() {
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Natalia-Oto//Wedding//SK",
    "BEGIN:VEVENT",
    "UID:natalia-oto-2026@wedding",
    "DTSTAMP:20260101T000000Z",
    "DTSTART:20261010T120000Z",
    "DTEND:20261011T000000Z",
    "SUMMARY:Svadba Natália & Oto",
    "LOCATION:Brno, Česká republika",
    "DESCRIPTION:Co-op quest začína. Tešíme sa na Vás.",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const blob = new Blob([ics], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "svadba-natalia-oto.ics"; a.click();
  URL.revokeObjectURL(url);
}

function AddToCalendar() {
  return (
    <div className="group relative z-20 mt-4">
      <button
        type="button"
        className="inline-flex w-full items-center justify-center gap-2 rounded-full border-2 border-dashed border-[color:var(--bordo)] px-4 py-2 font-marker text-xs uppercase tracking-wide text-[color:var(--bordo)] transition hover:bg-[color:var(--bordo)]/10"
      >
        <Download className="h-4 w-4" /> Pridať do kalendára
        <ChevronDown className="h-3 w-3 transition-transform group-hover:rotate-180 group-focus-within:rotate-180" />
      </button>
      <div className="pointer-events-none absolute left-0 right-0 top-full z-50 pt-1 opacity-0 transition-opacity duration-150 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100">
        <div className="space-y-1.5 rounded-md border border-dashed border-[color:var(--ink)]/30 bg-white/95 p-2 shadow-lg">
          <a
            href={GCAL_URL} target="_blank" rel="noreferrer"
            className="flex items-center gap-2 rounded px-2 py-1.5 font-hand text-base text-[color:var(--ink)] hover:bg-[color:var(--gold)]/20"
          >
            <span aria-hidden>📅</span> Google Calendar
          </a>
          <button
            type="button"
            onClick={downloadIcs}
            className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left font-hand text-base text-[color:var(--ink)] hover:bg-[color:var(--gold)]/20"
          >
            <span aria-hidden>🍎</span> Apple / Outlook (.ics)
          </button>
        </div>
      </div>
    </div>
  );
}

function HeroMobilePhoto() {
  const photoSrc = resolveEdgePhotoSrc(1);
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [photoSrc]);

  const showPlaceholder = !photoSrc || imgFailed;

  return (
    <div className="hero-intro-photo mb-1 flex w-full justify-end pr-10 sm:pr-14 md:pr-20 lg:hidden">
      <div className="edge-polaroid w-[2.45rem] max-w-[38vw] rotate-[5deg] pointer-events-none cursor-default p-0.5 pb-1 shadow-sm">
        <div className="tape tape-center scale-[0.52]" />
        <img
          src={showPlaceholder ? polaroidPlaceholder(0) : photoSrc}
          alt="Natália a Oto"
          className="edge-photo-img"
          decoding="async"
          loading="eager"
          onError={() => setImgFailed(true)}
        />
        <p
          className={`edge-photo-caption !mt-0.5 !min-h-0 !px-0 !text-[0.5rem] !leading-tight font-hand ${edgePhotoCaptionIsPlaceholder(0) ? "edge-photo-caption--placeholder" : ""}`}
        >
          {edgePhotoCaption(0)}
        </p>
      </div>
    </div>
  );
}

function HeroSection() {
  const c = useCountdown(CONFIG.dateISO);

  return (
    <section id="hero" className="pt-8 lg:pt-16 pb-6">
      <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr] items-center">
        <div>
          <p className="font-hand text-2xl text-[color:var(--paper)] mb-2">
            Zdá sa, že ste boli pozvaní na svadbu.
          </p>
          <h1 className="font-pixel text-5xl md:text-6xl lg:text-7xl leading-[1.3] text-[color:var(--gold)]">
            <span>Natália</span>
            <span className="mt-2 flex flex-wrap items-baseline gap-x-6 gap-y-1">
              <span className="font-hand mx-4 md:mx-6 text-4xl md:text-5xl lg:text-6xl text-[color:var(--blush)]">&amp;</span>
              <span>Oto</span>
            </span>
          </h1>
          <HeroMobilePhoto />
          <div className="ticker-line my-6 max-w-xl" />
          <p className="max-w-xl text-lg text-[color:var(--paper)]/80 leading-relaxed">
            Spúšťame našu najväčšiu co-op misiu a chceme, aby si bol/a pri tom!
           Preskúmaj všetky jej levely - ulož si náš dátum, odčiarkaj si quest log a daj nám vedieť, či ťa zbadáme nielen spoza oltára, ale aj na tanečnom parkete.
            Poprosíme ťa tiež o potvrdenie rezervácie nami objednaného ubytovania, ak si neplánuješ hľadať alternatívu
            po vlastnej osi.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#rsvp"
              className="inline-flex items-center gap-2 rounded-full bg-[color:var(--paper)] px-6 py-3 font-marker text-sm uppercase tracking-wide text-[color:var(--bordo-deep)] shadow-[0_6px_0_-2px_rgba(0,0,0,0.4)] hover:translate-y-0.5 hover:shadow-[0_4px_0_-2px_rgba(0,0,0,0.4)] transition"
            >
              <Heart className="h-4 w-4" /> Potvrdzujem účasť
            </a>
          </div>
        </div>

        <div className="hero-save-date-card relative z-40 ml-4 md:ml-8">
          <div className="paper-card relative mx-auto max-w-sm overflow-visible p-6 rotate-2">
            <div className="tape" />
            <p className="absolute top-5 right-5 font-body text-sm text-[color:var(--ink)]">2026</p>
            <p className="font-marker text-xs uppercase tracking-widest text-[color:var(--bordo)]">Save the date</p>
            <div className="mt-3 text-center">
              <p className="font-display text-6xl md:text-7xl font-bold leading-none text-[color:var(--bordo)]">10</p>
              <p className="mt-2 font-hand text-xl text-[color:var(--ink)]/70">{CONFIG.city}</p>
            </div>
            <MiniCalendar />
            <AddToCalendar />
          </div>
        </div>
      </div>

      <div className="mt-20 grid grid-cols-4 gap-3 max-w-2xl">
        {[
          { l: "dní", v: c.days },
          { l: "hodín", v: c.hours },
          { l: "minút", v: c.minutes },
          { l: "sekúnd", v: c.seconds },
        ].map((x) => (
          <div key={x.l} className="paper-card !bg-[color:var(--gold)] p-3 text-center -rotate-1 even:rotate-1">
            <div className="font-pixel text-xl md:text-2xl text-[color:var(--bordo)]">
              {String(x.v).padStart(2, "0")}
            </div>
            <div className="font-hand text-sm text-[color:var(--ink)]/70">{x.l}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function MiniCalendar() {
  const startDay = 4; // Thu (Mon=1)
  const days = 31;
  const cells: (number | null)[] = [];
  for (let i = 1; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);
  return (
    <div className="hero-mini-calendar rounded-md border border-[color:var(--ink)]/20 bg-[color:var(--paper)] p-3">
      <div className="grid grid-cols-7 gap-1 text-center font-hand text-xs text-[color:var(--ink)]/60">
        {["P", "U", "S", "Š", "P", "S", "N"].map((d, i) => <div key={i}>{d}</div>)}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1 text-center font-body text-xs">
        {cells.map((d, i) => {
          const is10 = d === 10;
          return (
            <div
              key={i}
              className={`aspect-square grid place-items-center rounded ${
                is10
                  ? "cal-day-highlight relative cursor-pointer overflow-visible bg-[color:var(--bordo)] text-[color:var(--gold)] font-bold"
                  : "text-[color:var(--ink)]/80"
              }`}
            >
              {is10 ? (
                <>
                  <svg aria-hidden viewBox="0 0 24 24" className="cal-heart-doodle">
                    <path d="M11.8 19.6c0 0-8.4-6.2-8.9-11.1-.4-2.8 1.9-5.3 4.7-5.1 1.8.1 3.2 1.6 3.8 2.9.6-1.3 2.1-2.8 4.1-2.6 2.5.3 4.3 2.7 3.9 5.2-.6 5.1-8.6 10.7-8.6 10.7z" />
                  </svg>
                  <span>{d}</span>
                </>
              ) : (
                d
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============ PROGRAM ============
const PROGRAM = [
  { time: "10:00–11:00", title: "Výjazd z domu", icon: "🚗", place: null, url: null },
  { time: "13:00", title: "Check-in v hoteli", icon: "🛏️", place: "Hotel Continental", url: CONFIG.maps.hotel },
  { time: "14:30–15:00", title: "Zraz", icon: "🥂", place: "Recepcia hotela Continental", url: CONFIG.maps.hotel },
  { time: "15:30", title: "Obrad", icon: "💍", place: "Kostol sv. Jakuba", url: CONFIG.maps.kostol },
  { time: "18:00", title: "Hostina", icon: "🍽️", place: "Kumst", url: CONFIG.maps.kumst },
  { time: "19:30", title: "Prvý tanec", icon: "💃", place: null, url: null },
  { time: "22:00", title: "Nočný raut", icon: "🌮", place: null, url: null },
  { time: "02:00", title: "Dozvuky", icon: "🪩", place: null, url: null },
];

const PROGRAM_TRAIL_WIDE = new Set(["Check-in v hoteli", "Zraz"]);
const PROGRAM_TRAIL_LIFT = new Set(["Zraz", "Hostina", "Nočný raut"]);

type TrailPoint = { x: number; y: number };

/** Zastávky — širšie vlnky, bez striktného striedania, ku koncu viac doprava */
const PROGRAM_TRAIL_STOPS: TrailPoint[] = [
  { x: 10, y: 3 },
  { x: 32, y: 17 },
  { x: 14, y: 31 },
  { x: 34, y: 45 },
  { x: 16, y: 59 },
  { x: 31, y: 73 },
  { x: 22, y: 85 },
  { x: 38, y: 97 },
];

/** Šírka jednotlivých oblúkov — plynulé, nerovnomerné */
const PROGRAM_TRAIL_BULGES = [9, -13, 8, -14, 11, -10, 16];

function getProgramTrailBezier(segmentIndex: number) {
  const p0 = PROGRAM_TRAIL_STOPS[segmentIndex];
  const p2 = PROGRAM_TRAIL_STOPS[segmentIndex + 1];
  const bulge = PROGRAM_TRAIL_BULGES[segmentIndex] ?? 10;
  const p1 = { x: (p0.x + p2.x) / 2 + bulge, y: (p0.y + p2.y) / 2 };
  return { p0, p1, p2 };
}

/** Bod na čiare trailu medzi nodmi — t=0.5 je stred úseku */
function getProgramTrailPointOnSegment(segmentIndex: number, t = 0.5): TrailPoint {
  const { p0, p1, p2 } = getProgramTrailBezier(segmentIndex);
  const u = 1 - t;
  return {
    x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
    y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
  };
}

const STICKMAN_VIEW_PADDING = 40;

/** Posunie stránku len ak je postavička mimo zorného poľa — väčším skokom, nie po každom kroku */
function scrollStickmanYIntoViewIfNeeded(
  stickmanY: number,
  behavior: ScrollBehavior = "smooth",
) {
  const edge = getScrollOffset();
  const visibleTop = edge + STICKMAN_VIEW_PADDING;
  const visibleBottom = window.innerHeight - STICKMAN_VIEW_PADDING;

  if (stickmanY >= visibleTop && stickmanY <= visibleBottom) return;

  const targetY = edge + Math.round(window.innerHeight * 0.34);
  const minReveal = Math.round(window.innerHeight * 0.28);

  let delta = stickmanY - targetY;
  if (stickmanY > visibleBottom) {
    delta = Math.max(delta, minReveal);
  } else if (stickmanY < visibleTop) {
    delta = Math.min(delta, -minReveal);
  }

  if (Math.abs(delta) < 8) return;

  const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  const targetTop = Math.min(Math.max(0, window.scrollY + delta), maxScroll);
  window.scrollTo({ top: targetTop, behavior });
}

function scrollProgramTrailStopIntoView(
  programStop: number,
  behavior: ScrollBehavior = "smooth",
) {
  const trail = document.querySelector<HTMLElement>('[data-stickman-rail="program-trail"]');
  if (!trail) return;

  const rect = trail.getBoundingClientRect();
  const segmentIdx = Math.max(0, Math.min(PROGRAM_TRAIL_SEGMENT_COUNT - 1, programStop));
  const point = getProgramTrailPointOnSegment(segmentIdx, 0.5);
  const stickmanY = rect.top + (rect.height * point.y) / 100;

  scrollStickmanYIntoViewIfNeeded(stickmanY, behavior);
}

/** Stop 0 = zarovnanie sekcie ako ostatné; ďalšie zastávky = scroll po traili */
function scrollToProgramStickman(
  programStop: number,
  behavior: ScrollBehavior = "smooth",
) {
  if (programStop <= 0) {
    scrollToStickmanTarget("program", behavior);
    return;
  }
  scrollProgramTrailStopIntoView(programStop, behavior);
}

function buildProgramTrailPath(stops: TrailPoint[]) {
  if (stops.length < 2) return "";
  let d = `M ${stops[0].x} ${stops[0].y}`;
  for (let i = 1; i < stops.length; i++) {
    const prev = stops[i - 1];
    const curr = stops[i];
    const bulge = PROGRAM_TRAIL_BULGES[i - 1] ?? 10;
    const cpx = (prev.x + curr.x) / 2 + bulge;
    const cpy = (prev.y + curr.y) / 2;
    d += ` Q ${cpx} ${cpy} ${curr.x} ${curr.y}`;
  }
  return d;
}

function ProgramTrail() {
  const pathD = buildProgramTrailPath(PROGRAM_TRAIL_STOPS);
  const stickman = useContext(StickmanContext);
  const showStickman = stickman.sectionId === "program";
  const segmentIdx = Math.max(0, Math.min(PROGRAM_TRAIL_SEGMENT_COUNT - 1, stickman.programStop));
  const linePos = getProgramTrailPointOnSegment(segmentIdx, 0.5);
  const prevLinePos = getProgramTrailPointOnSegment(Math.max(0, segmentIdx - 1), 0.5);
  const nextLinePos = getProgramTrailPointOnSegment(
    Math.min(PROGRAM_TRAIL_SEGMENT_COUNT - 1, segmentIdx + 1),
    0.5,
  );
  const stickmanFacing: "left" | "right" = segmentIdx < PROGRAM_TRAIL_SEGMENT_COUNT - 1
    ? (nextLinePos.x >= linePos.x ? "right" : "left")
    : (linePos.x >= prevLinePos.x ? "right" : "left");

  return (
    <div className="program-trail" data-stickman-rail="program-trail">
      <svg
        className="program-trail-svg"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path d={pathD} className="program-trail-line" vectorEffect="non-scaling-stroke" />
      </svg>

      {showStickman && (
        <ProgramTrailStickman
          left={linePos.x}
          top={linePos.y}
          facing={stickmanFacing}
          jumping={stickman.jumping}
        />
      )}

      {PROGRAM.map((p, i) => {
        const stop = PROGRAM_TRAIL_STOPS[i];
        const isWide = PROGRAM_TRAIL_WIDE.has(p.title);
        const liftStop = PROGRAM_TRAIL_LIFT.has(p.title);

        return (
          <div
            key={p.title}
            className={`program-trail-stop${liftStop ? " program-trail-stop--lift" : ""}`}
            style={{ left: `${stop.x}%`, top: `${stop.y}%` }}
          >
            <span
              className="program-trail-node"
              style={{ transform: `rotate(${(i % 2 ? 1 : -1) * 4}deg)` }}
              aria-hidden
            >
              {p.icon}
            </span>
            <div className={`program-trail-label${isWide ? " program-trail-label--wide" : ""}`}>
              <div className="program-trail-copy">
                <span className="program-trail-time font-hand">
                  {p.time}
                </span>
                <h3 className="program-trail-title font-display">{p.title}</h3>
                {p.place && p.url && (
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noreferrer"
                    className="program-trail-place font-hand transition"
                  >
                    📍 {p.place}
                  </a>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ProgramSection() {
  return (
    <Section id="program" level="Level 01" title="Program dňa">
      <p className="font-hand text-2xl text-[color:var(--gold)] mb-8 max-w-[50.4rem] leading-relaxed">
        Náš Wedding Quest s krycím menom "10.10.2026" má viacero levelov a tie zase svoje checkpointy. 
        Tu je ich zoznam a mapa, aby ste neskončili pri vedľajšej misii v zlej pivnici či v skrytom leveli.
      </p>
      <ProgramTrail />
    </Section>
  );
}

// ============ LOKÁCIE ============
function LokacieSection() {
  return (
    <Section id="lokacie" level="Level 02" title="Lokácie checkpointov">
      <div className="grid gap-6 md:grid-cols-3">
        {CONFIG.locations.map((l, i) => (
          <div key={l.name} className="paper-card p-5" style={{ transform: `rotate(${(i - 1) * 0.6}deg)` }}>
            <div className="mb-3 overflow-hidden rounded-md bg-gradient-to-br from-[color:var(--turquoise)]/30 to-[color:var(--blush)]/30">
              {"image" in l && l.image ? (
                <img
                  src={sitePath(l.image)}
                  alt={l.name}
                  className="aspect-video w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="grid aspect-video place-items-center text-4xl">
                  <MapPin className="h-10 w-10 text-[color:var(--bordo)]" />
                </div>
              )}
            </div>
            <h3 className="font-display text-2xl text-[color:var(--bordo)] flex items-center gap-2.5">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[color:var(--bordo)] text-[color:var(--bordo)]">
                <MapMarkerIcon id={l.id} className="h-4 w-4" />
              </span>
              {l.name}
            </h3>
            <p className="mt-1 font-hand text-lg text-[color:var(--ink)]/80">{l.desc}</p>
            {l.id === "kumst" && <div className="h-5" aria-hidden />}
            <p className="mt-2 text-sm text-[color:var(--ink)]/60">{l.addr}</p>
            <a
              href={l.url}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-1 rounded-full border border-[color:var(--bordo)] px-3 py-1.5 text-sm text-[color:var(--bordo)] hover:bg-[color:var(--bordo)] hover:text-[color:var(--paper)] transition"
            >
              Navigovať v Google Maps <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        ))}
      </div>

      <div className="paper-card mt-8 overflow-hidden p-3 sm:p-4">
        <WeddingMap
          locations={CONFIG.locations}
          customImage={CONFIG.mapCustomImage ? sitePath(CONFIG.mapCustomImage.replace(/^\//, "")) : undefined}
        />
      </div>
    </Section>
  );
}

// ============ FORM UTILITIES (Google Apps Script → Sheets; funguje aj na github.io) ============
function getFormEndpoint(formName: string) {
  const specific = CONFIG.formEndpoints[formName as keyof typeof CONFIG.formEndpoints];
  return specific || CONFIG.formEndpoint;
}

async function submitForm(formName: string, data: Record<string, unknown>) {
  if ((data as { hp?: string }).hp) return { ok: true };
  const endpoint = getFormEndpoint(formName);
  if (!endpoint || endpoint.includes("your-form-id") || endpoint.includes("your-endpoint")) {
    console.warn(`Forms endpoint pre „${formName}“ nie je nastavený (VITE_FORMS_*).`);
    return { ok: false };
  }
  const mainPerson =
    (typeof data.mainPerson === "string" && data.mainPerson.trim()) ||
    (typeof data.name === "string" && data.name.trim()) ||
    getMainRsvpName();
  const subjectSuffix = mainPerson ? ` · ${mainPerson}` : "";
  const payload = {
    _subject: `Svadba · ${formName}${subjectSuffix}`,
    _form: formName,
    ...data,
    mainPerson: mainPerson || undefined,
  };

  try {
    // text/plain = bez CORS preflightu; Apps Script web app často redirectuje
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
      redirect: "follow",
    });

    // Po redirecte Apps Script môže vrátiť 200 s JSON alebo opaque/chybu CORS —
    // ak sa podarí parsovať { ok: true/false }, rešpektujeme to; inak 2xx = úspech.
    const text = await res.text().catch(() => "");
    if (text) {
      try {
        const parsed = JSON.parse(text) as { ok?: boolean; error?: string };
        if (typeof parsed.ok === "boolean") {
          if (!parsed.ok) console.error("Forms error:", parsed.error ?? parsed);
          return { ok: parsed.ok };
        }
      } catch { /* nie JSON — berieme HTTP status */ }
    }
    if (!res.ok) {
      console.error("Forms HTTP error:", res.status, text.slice(0, 200));
      return { ok: false };
    }
    return { ok: true };
  } catch (err) {
    console.error("Forms network error:", err);
    return { ok: false };
  }
}

function makeId() {
  return `g_${Math.random().toString(36).slice(2, 10)}`;
}

// ============ RSVP ============
function RsvpSection() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [attending, setAttending] = useState<"yes" | "no">("yes");
  const [extras, setExtras] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(RSVP_SENT_KEY) === "1") setSent(true);
      const stored = readGuests();
      if (stored.length > 0) {
        const main = stored.find((g) => g.id === "main") ?? stored[0];
        setName(main.name);
        setAttending(main.attending ? "yes" : "no");
        setExtras(stored.filter((g) => g.id !== "main").map((g) => ({ id: g.id, name: g.name })));
      }
    } catch { /* noop */ }
  }, []);

  function addExtra() {
    setExtras((p) => [...p, { id: makeId(), name: "" }]);
  }
  function removeExtra(id: string) {
    setExtras((p) => p.filter((e) => e.id !== id));
  }
  function updateExtra(id: string, guestName: string) {
    setExtras((p) => p.map((e) => (e.id === id ? { ...e, name: guestName } : e)));
  }
  function editRsvp() {
    setSent(false);
    try { window.localStorage.removeItem(RSVP_SENT_KEY); } catch { /* noop */ }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    if (!name.trim()) { toast.error("Vyplň prosím meno.", { id: "rsvp" }); return; }
    if (!phone.trim()) { toast.error("Vyplň prosím telefón.", { id: "rsvp" }); return; }

    const isAttending = attending === "yes";
    const list: Guest[] = [{ id: "main", name: name.trim(), attending: isAttending }];
    extras.forEach((g) => {
      if (g.name.trim()) list.push({ id: g.id, name: g.name.trim(), attending: isAttending });
    });
    writeGuests(list);

    const fd = new FormData(e.currentTarget);
    setLoading(true);
    const r = await submitForm("rsvp", {
      hp: fd.get("hp"),
      name, phone, attending,
      guests: list,
      guestNames: list.map((g) => g.name).join(", "),
    });
    setLoading(false);
    if (r.ok) {
      setSent(true);
      try { window.localStorage.setItem(RSVP_SENT_KEY, "1"); } catch { /* noop */ }
      markSectionChecked("rsvp");
      toast.success("Level dokončený! RSVP odoslané ✨", { id: "rsvp" });
    } else toast.error("Nepodarilo sa odoslať. Skús to znova alebo nám napíš.", { id: "rsvp" });
  }

  if (sent) {
    return (
      <Section id="rsvp" level="Level 03" title="RSVP aneb prezenčka">
        <div className="paper-card p-8 text-center">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[color:var(--turquoise)] text-[color:var(--bordo-deep)]">
            <Check className="h-10 w-10" strokeWidth={3} />
          </div>
          <h3 className="mt-4 font-display text-3xl text-[color:var(--bordo)]">+8XP!</h3>
          <p className="mt-2 font-hand text-xl text-[color:var(--ink)]">
            Ďakujeme! Uložili sme si tvoju odpoveď. Uvidíme sa 10.10.2026.
          </p>
          <button
            type="button"
            onClick={editRsvp}
            className="mt-5 font-hand text-base text-[color:var(--ink)]/60 hover:text-[color:var(--bordo)]"
          >
            Zmeniť odpoveď
          </button>
        </div>
      </Section>
    );
  }

  return (
    <Section id="rsvp" level="Level 03" title="RSVP aneb prezenčka">
      <p className="font-hand text-2xl text-[color:var(--gold)] mb-8 max-w-2xl">
        Bez potvrdenia účasti sa quest log neuloží. Prosíme, daj nám vedieť čo najskôr.
      </p>
      <form onSubmit={onSubmit} className="paper-card p-6 md:p-8 space-y-5">
        <input type="text" name="hp" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-4">
          <div className="w-full max-w-md shrink-0">
            <label className="form-label text-sm tracking-wider">Tvoje meno *</label>
            <input
              value={name} onChange={(e) => setName(e.target.value)} required
              className="mt-1 w-full rounded-md border border-[color:var(--ink)]/30 bg-white/60 px-3 py-2 text-[color:var(--ink)] placeholder:text-[color:var(--ink)]/40 focus:outline-none focus:ring-2 focus:ring-[color:var(--gold)]"
            />
          </div>
          <div className="w-full min-w-0 flex-1">
            <label className="form-label text-sm tracking-wider">Tvoj telefón *</label>
            <input
              value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" required
              className="mt-1 w-full rounded-md border border-[color:var(--ink)]/30 bg-white/60 px-3 py-2 text-[color:var(--ink)] placeholder:text-[color:var(--ink)]/40 focus:outline-none focus:ring-2 focus:ring-[color:var(--gold)]"
            />
          </div>
        </div>

        <div>
          <label className="form-label text-sm mb-2 block tracking-wider">Ďalší hostia</label>
          <div className="space-y-2">
            {extras.map((g) => (
              <div key={g.id} className="flex items-center gap-2">
                <input
                  value={g.name}
                  onChange={(e) => updateExtra(g.id, e.target.value)}
                  placeholder="Meno hosťa"
                  className="w-full max-w-md rounded-md border border-[color:var(--ink)]/30 bg-white/60 px-3 py-2 text-[color:var(--ink)] placeholder:text-[color:var(--ink)]/40 focus:outline-none focus:ring-2 focus:ring-[color:var(--gold)]"
                />
                <button
                  type="button" onClick={() => removeExtra(g.id)}
                  aria-label="Odstrániť hosťa"
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-[color:var(--ink)]/50 hover:bg-[color:var(--bordo)]/10 hover:text-[color:var(--bordo)]"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button
              type="button" onClick={addExtra}
              className="inline-flex items-center gap-2 rounded-full border-2 border-dashed border-[color:var(--gold)] px-4 py-2 font-hand text-base text-[color:var(--gold)] hover:bg-[color:var(--gold)]/10 transition"
            >
              <Plus className="h-4 w-4" /> Pridať hosta
            </button>
          </div>
        </div>

        <div>
          <label className="form-label text-sm tracking-wider">Prídete?</label>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setAttending("yes")}
              className={`rounded-full border-2 px-5 py-2 font-marker text-sm uppercase tracking-wide transition ${
                attending === "yes"
                  ? "border-[color:var(--turquoise)] bg-[color:var(--turquoise)]/30 text-[color:var(--bordo-deep)]"
                  : "border-dashed border-[color:var(--ink)]/40 text-[color:var(--ink)] hover:border-[color:var(--turquoise)]"
              }`}
            >Áno, prídeme</button>
            <button
              type="button"
              onClick={() => setAttending("no")}
              className={`rounded-full border-2 px-5 py-2 font-marker text-sm uppercase tracking-wide transition ${
                attending === "no"
                  ? "border-[color:var(--bordo)] bg-[color:var(--bordo)]/15 text-[color:var(--bordo)]"
                  : "border-dashed border-[color:var(--ink)]/40 text-[color:var(--ink)] hover:border-[color:var(--bordo)]"
              }`}
            >Nie, žiaľ neprídeme</button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-full bg-[color:var(--bordo)] px-6 py-3 font-marker text-sm uppercase tracking-wide text-[color:var(--gold)] disabled:opacity-60"
        >
          <Send className="h-4 w-4" /> {loading ? "Odosielam..." : "Odoslať RSVP"}
        </button>
      </form>
    </Section>
  );
}

// ============ POKRM (per-guest picker) ============
type MealPick = { mealKey: string; kids: boolean };

function MealChefToPhotoCue() {
  const arrowhead = (
    <marker
      id="meal-chef-photo-arrowhead"
      viewBox="0 0 8 8"
      refX="6.5"
      refY="4"
      markerWidth="6"
      markerHeight="6"
      orient="auto"
    >
      <path
        d="M1 1.5 L6.5 4 L1 6.5"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </marker>
  );

  return (
    <>
      <svg
        className="pointer-events-none absolute -bottom-2 left-[calc(100%-2.25rem)] z-10 hidden h-12 w-[6.75rem] text-[color:var(--gold)] md:block"
        viewBox="0 0 108 44"
        fill="none"
        aria-hidden
      >
        <defs>{arrowhead}</defs>
        <path
          d="M6 14 C 24 30, 48 32, 68 22 C 82 12, 94 4, 102 2"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="5 4"
          strokeLinecap="round"
          markerEnd="url(#meal-chef-photo-arrowhead)"
        />
      </svg>
      <svg
        className="pointer-events-none absolute -bottom-16 left-[calc(100%-4rem)] z-10 block h-[5.5rem] w-11 text-[color:var(--gold)] md:hidden"
        viewBox="0 0 44 80"
        fill="none"
        aria-hidden
      >
        <defs>
          <marker
            id="meal-chef-photo-arrowhead-mobile"
            viewBox="0 0 8 8"
            refX="6.5"
            refY="4"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path
              d="M1 1.5 L6.5 4 L1 6.5"
              stroke="currentColor"
              strokeWidth="1.35"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </marker>
        </defs>
        <path
          d="M36 6 C 20 24, 38 38, 10 72"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="5 4"
          strokeLinecap="round"
          markerEnd="url(#meal-chef-photo-arrowhead-mobile)"
        />
      </svg>
    </>
  );
}

function PokrmSection() {
  const guests = useGuests().filter((g) => g.attending);
  const [picks, setPicks] = useState<Record<string, MealPick>>({});
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(POKRM_SENT_KEY) === "1") setSent(true);
      const raw = window.localStorage.getItem(POKRM_DATA_KEY);
      if (raw) setPicks(JSON.parse(raw) as Record<string, MealPick>);
    } catch { /* noop */ }
  }, []);

  function setPick(id: string, patch: Partial<MealPick>) {
    setPicks((p) => ({
      ...p,
      [id]: { mealKey: p[id]?.mealKey ?? CONFIG.meals[0].key, kids: p[id]?.kids ?? false, ...patch },
    }));
  }

  function editPokrm() {
    setSent(false);
    try { window.localStorage.removeItem(POKRM_SENT_KEY); } catch { /* noop */ }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    const fd = new FormData(e.currentTarget);
    const payload = guests.map((g) => ({
      guestId: g.id, name: g.name,
      meal: picks[g.id]?.mealKey ?? CONFIG.meals[0].key,
      kids: picks[g.id]?.kids ?? false,
    }));
    setLoading(true);
    const r = await submitForm("pokrm", { meals: payload, hp: fd.get("hp") });
    setLoading(false);
    if (r.ok) {
      setSent(true);
      try {
        window.localStorage.setItem(POKRM_SENT_KEY, "1");
        window.localStorage.setItem(POKRM_DATA_KEY, JSON.stringify(picks));
      } catch { /* noop */ }
      markSectionChecked("pokrm");
      toast.success("Power-up vybraný ⚡", { id: "pokrm" });
    } else toast.error("Skús to prosím znova.", { id: "pokrm" });
  }

  return (
    <Section id="pokrm" level="Level 05" title="Power-up pokrm">
      {guests.length === 0 ? (
        <div className="paper-card p-6 text-center">
          <p className="font-hand text-xl text-[color:var(--ink)]">
            Najprv prosím vyplň RSVP – potom sa tu zobrazia hostia a k nim výber pokrmu.
          </p>
          <a href="#rsvp" className="mt-4 inline-flex items-center gap-2 rounded-full bg-[color:var(--bordo)] px-5 py-2 font-marker text-xs uppercase text-[color:var(--gold)]">
            Ísť na RSVP
          </a>
        </div>
      ) : sent ? (
        <div className="paper-card p-8 text-center">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[color:var(--turquoise)] text-[color:var(--bordo-deep)]">
            <Check className="h-10 w-10" strokeWidth={3} />
          </div>
          <h3 className="mt-4 font-display text-3xl text-[color:var(--bordo)]">+8XP!</h3>
          <p className="mt-2 font-hand text-xl text-[color:var(--ink)]">
            Ďakujeme! Máme tvoj výber uložený ✨
          </p>
          <button
            type="button"
            onClick={editPokrm}
            className="mt-5 font-hand text-base text-[color:var(--ink)]/60 hover:text-[color:var(--bordo)]"
          >
            Zmeniť odpoveď
          </button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-6">
          <input type="text" name="hp" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

          <div className="paper-card overflow-visible p-5 md:py-6 md:pl-6 md:pr-0">
            <div className="grid gap-5 md:grid-cols-[minmax(0,0.95fr)_min(50%,360px)] md:items-start">
              <div className="overflow-visible">
                <p className="font-hand text-lg leading-snug text-[color:var(--ink)]/80">
                  Aby si si svadobnú hostinu vychutnal, zvoľ si čo ti je po chuti...
                </p>
                <ul className="mt-3.5 space-y-2.5 overflow-visible">
                  {CONFIG.meals.map((m) => (
                    <li
                      key={m.key}
                      className={`relative overflow-visible rounded-md border-2 border-dashed border-[color:var(--bordo)] px-3 py-2.5 ${
                        m.key === "sefkuchar" ? "z-10" : ""
                      }`}
                    >
                      <p className="font-hand text-base font-semibold leading-tight text-[color:var(--bordo)]">{m.label}</p>
                      <p className="mt-0.5 text-sm leading-snug text-[color:var(--ink)]/75">{m.desc}</p>
                      {m.key === "sefkuchar" && <MealChefToPhotoCue />}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="overflow-hidden rounded-lg md:rounded-r-none">
                <img
                  src={sitePath("photos/menu.jpg")}
                  alt="Menu svadobného grilovania"
                  className="w-full border-2 border-dashed border-[color:var(--gold)]/40 object-cover shadow-sm md:min-h-[280px] md:justify-self-end md:rounded-l-lg md:rounded-r-none md:border-r-0"
                />
              </div>
            </div>
          </div>

          <div className="paper-card p-6 md:p-8">
            <h3 className="mb-5 font-marker text-sm uppercase tracking-widest text-[color:var(--turquoise)]">
              Voľba pre hostí
            </h3>
            <div className="space-y-3">
              {guests.map((g) => {
                const pick = picks[g.id]?.mealKey ?? CONFIG.meals[0].key;
                const kids = picks[g.id]?.kids ?? false;
                return (
                  <div
                    key={g.id}
                    className="flex flex-col gap-3 border-b border-dashed border-[color:var(--ink)]/15 pb-3 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:gap-4"
                  >
                    <div className="min-w-0 shrink-0 sm:w-28">
                      <p className="font-display text-lg text-[color:var(--bordo)]">{g.name}</p>
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row">
                      {CONFIG.meals.map((m) => (
                        <label
                          key={m.key}
                          className={`flex-1 cursor-pointer rounded-full border-2 px-4 py-2 text-center font-hand text-sm transition sm:text-base ${
                            pick === m.key
                              ? "border-[color:var(--bordo)] bg-[color:var(--gold)]/25 text-[color:var(--bordo-deep)]"
                              : "border-dashed border-[color:var(--ink)]/30 text-[color:var(--ink)] hover:border-[color:var(--bordo)]"
                          }`}
                        >
                          <input
                            type="radio"
                            name={`meal-${g.id}`}
                            value={m.key}
                            checked={pick === m.key}
                            onChange={() => setPick(g.id, { mealKey: m.key })}
                            className="sr-only"
                          />
                          {m.label}
                        </label>
                      ))}
                    </div>
                    <label className="inline-flex shrink-0 items-center gap-2 font-hand text-sm text-[color:var(--ink)] sm:w-32 sm:justify-end">
                      <input
                        type="checkbox"
                        checked={kids}
                        onChange={(e) => setPick(g.id, { kids: e.target.checked })}
                        className="h-4 w-4 accent-[color:var(--bordo)]"
                      />
                      Detská porcia
                    </label>
                  </div>
                );
              })}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[color:var(--bordo)] px-6 py-3 font-marker text-sm uppercase tracking-wide text-[color:var(--gold)] disabled:opacity-60"
            >
              <Send className="h-4 w-4" /> {loading ? "Odosielam..." : "Odoslať výber"}
            </button>
          </div>
        </form>
      )}
    </Section>
  );
}

// ============ UBYTOVANIE ============
type RoomEntry = {
  id: string;
  typeKey: string;
  mainGuestId: string | null;
  additionalGuestIds: string[];
  cots: number;
  extraBeds: number;
  pet: boolean;
};

function roomGuestIds(r: RoomEntry) {
  return [r.mainGuestId, ...r.additionalGuestIds].filter(Boolean) as string[];
}

function findGuestRoomId(rooms: RoomEntry[], guestId: string): string | null {
  for (const room of rooms) {
    if (roomGuestIds(room).includes(guestId)) return room.id;
  }
  return null;
}

function createDefaultRoom(): RoomEntry {
  return {
    id: makeId(),
    typeKey: CONFIG.rooms[1].key,
    mainGuestId: null,
    additionalGuestIds: [],
    cots: 0,
    extraBeds: 0,
    pet: false,
  };
}

function UbytovanieSection() {
  const guests = useGuests().filter((g) => g.attending);
  const [rooms, setRooms] = useState<RoomEntry[]>([]);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const guestClickRef = useRef<{
    key: string;
    count: number;
    lastAt: number;
    timer: ReturnType<typeof setTimeout> | null;
  }>({ key: "", count: 0, lastAt: 0, timer: null });

  useEffect(() => {
    try {
      if (window.localStorage.getItem(UBYTOVANIE_SENT_KEY) === "1") setSent(true);
      const raw = window.localStorage.getItem(UBYTOVANIE_DATA_KEY);
      if (raw) {
        const data = JSON.parse(raw) as { rooms?: RoomEntry[] };
        if (Array.isArray(data.rooms) && data.rooms.length > 0) setRooms(data.rooms);
      }
    } catch { /* noop */ }
    setDataLoaded(true);
  }, []);

  useEffect(() => {
    if (!dataLoaded || sent || guests.length === 0 || rooms.length > 0) return;
    setRooms([createDefaultRoom()]);
  }, [dataLoaded, sent, guests.length, rooms.length]);

  function editUbytovanie() {
    setSent(false);
    try { window.localStorage.removeItem(UBYTOVANIE_SENT_KEY); } catch { /* noop */ }
  }

  function addRoom() {
    setRooms((r) => [...r, createDefaultRoom()]);
  }
  function removeRoom(id: string) {
    setRooms((r) => r.filter((x) => x.id !== id));
  }
  function updateRoom(id: string, patch: Partial<RoomEntry>) {
    setRooms((r) => r.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }
  function singleGuestClick(roomId: string, guestId: string) {
    setRooms((prev) => {
      const takenElsewhere = prev.some(
        (room) => room.id !== roomId && roomGuestIds(room).includes(guestId),
      );
      if (takenElsewhere) {
        toast.error("Táto osoba je už priradená do inej izby.");
        return prev;
      }
      return prev.map((room) => {
      if (room.id !== roomId) return room;
      const { mainGuestId, additionalGuestIds } = room;
      if (mainGuestId === guestId) return room;
      if (additionalGuestIds.includes(guestId)) {
        return {
          ...room,
          mainGuestId: guestId,
          additionalGuestIds: additionalGuestIds
            .filter((id) => id !== guestId)
            .concat(mainGuestId ? [mainGuestId] : []),
        };
      }
      if (!mainGuestId) return { ...room, mainGuestId: guestId };
      return { ...room, additionalGuestIds: [...additionalGuestIds, guestId] };
    });
    });
  }
  function switchMainGuest(roomId: string, guestId: string) {
    setRooms((prev) => prev.map((room) => {
      if (room.id !== roomId) return room;
      const { mainGuestId, additionalGuestIds } = room;
      if (mainGuestId === guestId) return room;
      if (!additionalGuestIds.includes(guestId)) return room;
      return {
        ...room,
        mainGuestId: guestId,
        additionalGuestIds: additionalGuestIds
          .filter((id) => id !== guestId)
          .concat(mainGuestId ? [mainGuestId] : []),
      };
    }));
  }
  function removeGuestFromRoom(roomId: string, guestId: string) {
    setRooms((prev) => prev.map((room) => {
      if (room.id !== roomId) return room;
      if (room.mainGuestId === guestId) {
        return {
          ...room,
          mainGuestId: room.additionalGuestIds[0] ?? null,
          additionalGuestIds: room.additionalGuestIds.slice(1),
        };
      }
      if (room.additionalGuestIds.includes(guestId)) {
        return { ...room, additionalGuestIds: room.additionalGuestIds.filter((id) => id !== guestId) };
      }
      return room;
    }));
  }
  function onGuestChipClick(roomId: string, guestId: string) {
    const key = `${roomId}:${guestId}`;
    const store = guestClickRef.current;
    const now = Date.now();

    if (store.key !== key) {
      if (store.timer) clearTimeout(store.timer);
      store.key = key;
      store.count = 0;
      store.lastAt = 0;
    }

    const gap = now - store.lastAt;
    store.lastAt = now;
    store.count += 1;

    if (store.count === 2 && gap < 400) {
      if (store.timer) clearTimeout(store.timer);
      store.count = 0;
      store.key = "";
      store.lastAt = 0;
      store.timer = null;
      removeGuestFromRoom(roomId, guestId);
      return;
    }

    if (store.timer) clearTimeout(store.timer);
    store.timer = setTimeout(() => {
      const clicks = store.count;
      store.count = 0;
      store.key = "";
      store.lastAt = 0;
      store.timer = null;

      if (clicks === 1) singleGuestClick(roomId, guestId);
      else if (clicks === 2) switchMainGuest(roomId, guestId);
    }, 350);
  }

  function roomPrice(r: RoomEntry) {
    const base = CONFIG.rooms.find((x) => x.key === r.typeKey)?.price ?? 0;
    return base + r.extraBeds * CONFIG.extras.extraBed + (r.pet ? CONFIG.extras.pet : 0);
  }
  const total = rooms.reduce((sum, r) => sum + roomPrice(r), 0);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    if (rooms.length === 0) { toast.error("Pridaj aspoň jednu izbu.", { id: "ubytovanie" }); return; }
    if (rooms.some((r) => !r.mainGuestId)) {
      toast.error("Každá izba musí mať zvolenú hlavnú osobu.", { id: "ubytovanie" });
      return;
    }
    const fd = new FormData(e.currentTarget);
    const payload = rooms.map((r) => ({
      typeKey: r.typeKey,
      typeLabel: CONFIG.rooms.find((x) => x.key === r.typeKey)?.label,
      mainGuest: guests.find((g) => g.id === r.mainGuestId)?.name,
      additionalGuests: r.additionalGuestIds.map((id) => guests.find((g) => g.id === id)?.name).filter(Boolean),
      guests: roomGuestIds(r).map((id) => guests.find((g) => g.id === id)?.name).filter(Boolean),
      cots: r.cots, extraBeds: r.extraBeds, pet: r.pet,
      price: roomPrice(r),
    }));
    setLoading(true);
    const r = await submitForm("ubytovanie", { rooms: payload, totalPrice: total, night: "10.10.2026 → 11.10.2026", hp: fd.get("hp") });
    setLoading(false);
    if (r.ok) {
      setSent(true);
      try {
        window.localStorage.setItem(UBYTOVANIE_SENT_KEY, "1");
        window.localStorage.setItem(UBYTOVANIE_DATA_KEY, JSON.stringify({ rooms }));
      } catch { /* noop */ }
      markSectionChecked("ubytovanie");
      toast.success("Ďakujeme, tvoju voľbu si píšeme!", { id: "ubytovanie" });
    } else toast.error("Skús to prosím znova.", { id: "ubytovanie" });
  }

  const dobryVediet = (
    <div className="rounded-lg border border-dashed border-[color:var(--ink)]/25 bg-white/35 p-5">
      <p className="font-marker text-[0.96rem] uppercase text-[color:var(--bordo)]">Dobré vedieť</p>
      <ul className="mt-3 space-y-2 font-hand text-[1.375rem] leading-snug text-[color:var(--ink)]">
        <li>· Check-in od 13:00, check-out do 12:00.</li>
        <li>· Raňajky sú v cene izby.</li>
        <li>· Parkovanie v hoteli je za príplatok <span className="price-muted">{CONFIG.extras.parking} Kč / noc</span>.</li>
        <li>· Úhrada za izbu je možná na recepcii pri check-ine (kartou i v hotovosti).</li>
        <li>
          · Predĺženie pobytu alebo akékoľvek iné požiadavky si môžeš dohodnúť priamo s hotelom:
          <span className="mt-1 block pl-3 text-[1.24rem]">
            <a href={`tel:${CONFIG.hotel.phone.replace(/\s/g, "")}`} className="hover:text-[color:var(--bordo)]">{CONFIG.hotel.phone}</a>
            {"   •   "}
            <a href={`mailto:${CONFIG.hotel.email}`} className="hover:text-[color:var(--bordo)]">{CONFIG.hotel.email}</a>
          </span>
        </li>
        <li>
          · S hotelom komunikuj pod heslom <strong>„Svadba Schultz“</strong> a menom protagonistu, na ktorého je izba nahlásená.
        </li>
      </ul>
    </div>
  );

  return (
    <Section id="ubytovanie" level="Level 04" title="Hotel ala čik-čik domček">
      <p className="font-hand text-2xl text-[color:var(--gold)] mb-8 max-w-[50.4rem] leading-relaxed">
        Pre hostí máme predbežne dohodnuté ubytovanie v Hoteli Continental na noc
        <span className="font-normal text-[color:var(--paper)]"> zo soboty 10.10.2026 na nedeľu 11.10.2026</span>. Poprosíme ťa o potvrdenie
        rezervácie pre všetky osoby, za ktoré rezerváciu vypĺňaš. Ak ťa náš výber neoslovil, môžeš si nájsť ubytovanie po vlastnej osi.
      </p>

      {sent ? (
        <div className="paper-card p-8 text-center">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[color:var(--turquoise)] text-[color:var(--bordo-deep)]">
            <Check className="h-10 w-10" strokeWidth={3} />
          </div>
          <h3 className="mt-4 font-display text-3xl text-[color:var(--bordo)]">+8XP!</h3>
          <p className="mt-2 font-hand text-xl text-[color:var(--ink)]">
            Ďakujeme, ozveme sa s potvrdením ✨
          </p>
          <button
            type="button"
            onClick={editUbytovanie}
            className="mt-5 font-hand text-base text-[color:var(--ink)]/60 hover:text-[color:var(--bordo)]"
          >
            Zmeniť odpoveď
          </button>
        </div>
      ) : guests.length === 0 ? (
        <div className="paper-card p-6 text-center">
          <p className="font-hand text-xl text-[color:var(--ink)]">
            Najprv prosím vyplň RSVP – potom si tu môžeš rozdeliť hostí do izieb.
          </p>
          <a href="#rsvp" className="mt-4 inline-flex items-center gap-2 rounded-full bg-[color:var(--bordo)] px-5 py-2 font-marker text-xs uppercase text-[color:var(--gold)]">
            Ísť na RSVP
          </a>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="paper-card p-6 md:p-8 space-y-5">
          <input type="text" name="hp" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

          <div className="space-y-4">
            {rooms.map((r, idx) => (
              <div key={r.id} className="rounded-lg border-2 border-dashed border-[color:var(--ink)]/30 bg-white/40 p-4">
                <div className="mb-3 flex items-baseline justify-between gap-2">
                  <h3 className="font-display text-xl text-[color:var(--bordo)]">Izba #{idx + 1}</h3>
                  <button
                    type="button" onClick={() => removeRoom(r.id)}
                    aria-label="Odstrániť izbu"
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-[color:var(--ink)]/60 hover:bg-[color:var(--bordo)]/10 hover:text-[color:var(--bordo)]"
                  >
                    <Trash2 className="h-4 w-4" /> Odstrániť
                  </button>
                </div>

                <div>
                  <label className="form-label text-base">Typ izby</label>
                  <div className="mt-2 grid gap-2 sm:grid-cols-3">
                    {CONFIG.rooms.map((rt) => (
                      <label
                        key={rt.key}
                        className={`cursor-pointer rounded-lg border-2 p-3.5 text-left transition ${
                          r.typeKey === rt.key
                            ? "border-[color:var(--bordo)] bg-[color:var(--gold)]/20"
                            : "border-dashed border-[color:var(--ink)]/30 hover:border-[color:var(--bordo)]"
                        }`}
                      >
                        <input
                          type="radio" name={`type-${r.id}`} value={rt.key}
                          checked={r.typeKey === rt.key}
                          onChange={() => updateRoom(r.id, { typeKey: rt.key })}
                          className="sr-only"
                        />
                        <div className="font-hand text-lg leading-tight text-[color:var(--ink)]">
                          <span className="whitespace-nowrap">
                            {rt.label}
                            {"sublabel" in rt && rt.sublabel ? (
                              <span className="text-sm font-normal text-[color:var(--ink)]/50"> ({rt.sublabel})</span>
                            ) : null}
                          </span>
                        </div>
                        <div className="price-muted mt-0.5 text-base">{rt.price.toLocaleString("sk-SK")} Kč / noc</div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="mt-4">
                  <label className="form-label text-sm">Na koho je izba</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {guests.map((g) => {
                      const isMain = r.mainGuestId === g.id;
                      const isAdditional = r.additionalGuestIds.includes(g.id);
                      const guestRoomId = findGuestRoomId(rooms, g.id);
                      const inOtherRoom = guestRoomId !== null && guestRoomId !== r.id;
                      return (
                        <button
                          key={g.id}
                          type="button"
                          disabled={inOtherRoom}
                          onClick={() => onGuestChipClick(r.id, g.id)}
                          title={
                            inOtherRoom
                              ? "Už priradená do inej izby"
                              : "Klik: pridať / prepnúť hlavnú · dvojklik: odstrániť"
                          }
                          className={`rounded-full border-2 px-3 py-1.5 font-hand text-sm transition select-none ${
                            inOtherRoom
                              ? "cursor-not-allowed border-dashed border-[color:var(--ink)]/15 text-[color:var(--ink)]/35 opacity-50"
                              : isMain
                                ? "border-[color:var(--turquoise)] bg-[color:var(--turquoise)]/25 text-[color:var(--bordo-deep)]"
                                : isAdditional
                                  ? "border-[color:var(--turquoise)] bg-transparent text-[color:var(--ink)]"
                                  : "border-dashed border-[color:var(--ink)]/30 text-[color:var(--ink)] hover:border-[color:var(--bordo)]"
                          }`}
                        >
                          {isMain && <Check className="mr-1 inline h-3 w-3" />}
                          {g.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4 grid min-w-0 gap-3 sm:grid-cols-3">
                  <div className="min-w-0">
                    <label className="form-label block text-[0.7rem] leading-tight sm:text-xs">
                      <span className="flex min-w-0 items-baseline gap-0.5 whitespace-nowrap">
                        <span className="shrink-0">Detská postieľka</span>
                        <span className="shrink-0 font-normal normal-case text-[color:var(--ink)]/55">(do 3r.)</span>
                        <span className="price-muted shrink-0 font-body font-normal normal-case">zadarmo</span>
                      </span>
                    </label>
                    <input
                      type="number" min={0} value={r.cots}
                      onChange={(e) => updateRoom(r.id, { cots: Math.max(0, Number(e.target.value)) })}
                      className="mt-1 w-full rounded-md border border-[color:var(--ink)]/30 bg-white/60 px-3 py-2 text-[color:var(--ink)]"
                    />
                  </div>
                  <div className="min-w-0">
                    <label className="form-label block text-xs leading-tight">
                      <span className="flex min-w-0 items-baseline gap-1 whitespace-nowrap">
                        <span className="shrink-0">Prístelka</span>
                        <span className="price-muted min-w-0 truncate font-body font-normal normal-case">{CONFIG.extras.extraBed} Kč / ks</span>
                      </span>
                    </label>
                    <input
                      type="number" min={0} value={r.extraBeds}
                      onChange={(e) => updateRoom(r.id, { extraBeds: Math.max(0, Number(e.target.value)) })}
                      className="mt-1 w-full rounded-md border border-[color:var(--ink)]/30 bg-white/60 px-3 py-2 text-[color:var(--ink)]"
                    />
                  </div>
                  <div className="min-w-0">
                    <label className="form-label block text-xs leading-tight">
                      <span className="flex min-w-0 items-baseline gap-1 whitespace-nowrap">
                        <span className="shrink-0">Havo na izbe</span>
                        <span className="price-muted min-w-0 truncate font-body font-normal normal-case">{CONFIG.extras.pet} Kč / noc</span>
                      </span>
                    </label>
                    <label className="mt-1 flex cursor-pointer items-center gap-3 rounded-md border border-[color:var(--ink)]/30 bg-white/60 px-3 py-2 text-[color:var(--ink)]">
                      <input
                        type="checkbox" checked={r.pet}
                        onChange={(e) => updateRoom(r.id, { pet: e.target.checked })}
                        className="h-4 w-4 accent-[color:var(--bordo)]"
                      />
                      <span className="font-hand text-base">Áno</span>
                    </label>
                  </div>
                </div>

                <div className="mt-3 text-right font-marker text-sm text-[color:var(--bordo)]">
                  Izba spolu: {roomPrice(r).toLocaleString("sk-SK")} Kč
                </div>
              </div>
            ))}
          </div>

          <button
            type="button" onClick={addRoom}
            className="inline-flex items-center gap-2 rounded-full border-2 border-dashed border-[color:var(--gold)] px-4 py-2 font-hand text-base text-[color:var(--gold)] hover:bg-[color:var(--gold)]/10 transition"
          >
            <Plus className="h-4 w-4" /> Pridať izbu
          </button>

          {rooms.length > 0 && (
            <div className="rounded-lg border-2 border-dashed border-[color:var(--gold)] bg-[color:var(--gold)]/10 p-4">
              <p className="font-marker text-xs uppercase text-[color:var(--bordo)]">Predbežná kalkulácia (1 noc)</p>
              <p className="font-display text-4xl text-[color:var(--bordo)]">{total.toLocaleString("sk-SK")} Kč</p>
              <p className="text-xs text-[color:var(--ink)]/70">
                Ide o orientačnú kalkuláciu. Finálne potvrdenie pošleme my alebo hotel.
              </p>
            </div>
          )}

          {dobryVediet}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full bg-[color:var(--bordo)] px-6 py-3 font-marker text-sm uppercase tracking-wide text-[color:var(--gold)] disabled:opacity-60"
          >
            <Send className="h-4 w-4" /> {loading ? "Odosielam..." : "Odoslať záujem"}
          </button>
        </form>
      )}
    </Section>
  );
}

// ============ DRESSCODE ============
const DRESSCODE_PALETTE = [
  { color: "#3a1418", cells: [[0, 0], [0, 1], [1, 0], [1, 1]] }, // O
  { color: "#8b1e1e", cells: [[0, 1], [0, 2], [1, 0], [1, 1]] }, // S
  { color: "#c8942c", cells: [[0, 0], [1, 0], [2, 0], [0, 1]] }, // J
  { color: "#f5c542", cells: [[0, 1], [1, 0], [1, 1], [1, 2]] }, // T
  { color: "#4bb3a7", cells: [[0, 0], [1, 0], [2, 0], [3, 0]] }, // I
  { color: "#c78bbf", cells: [[0, 0], [1, 0], [2, 0], [2, 1]] }, // L
] as const;

type TetrominoCell = readonly [number, number];

function TetrominoSwatch({ color, cells }: { color: string; cells: readonly TetrominoCell[] }) {
  const cols = cells.map(([, c]) => c);
  const rows = cells.map(([r]) => r);
  const minC = Math.min(...cols);
  const maxC = Math.max(...cols);
  const minR = Math.min(...rows);
  const maxR = Math.max(...rows);
  const gridCols = maxC - minC + 1;
  const gridRows = maxR - minR + 1;

  return (
    <div
      className="dresscode-tetromino-grid"
      style={{
        gridTemplateColumns: `repeat(${gridCols}, var(--dresscode-cell))`,
        gridTemplateRows: `repeat(${gridRows}, var(--dresscode-cell))`,
      }}
      aria-hidden
    >
      {cells.map(([r, c], i) => (
        <div
          key={i}
          className="dresscode-tetromino-cell"
          style={{
            gridColumn: c - minC + 1,
            gridRow: r - minR + 1,
            background: color,
          }}
        />
      ))}
    </div>
  );
}

function DresscodeSection() {
  return (
    <Section id="dresscode" level="Level 06" title="Dresscode a.k.a. skin pack">
      <p className="font-hand text-2xl text-[color:var(--gold)] mb-8 max-w-[50.4rem] leading-relaxed">
      Definovaný heslom „elegantne ale hravo“. Očakávame, že prídeš nahodený/á slávnostne, ale najmä pohodlne na celý deň slávenia.
      Farby a štýl môžu pokojne ladit s jesennou, pestrofarebnou paletou, no môžeš sa inšpirovať aj tu:
      </p>
      <div className="mb-6 grid w-full max-w-2xl grid-cols-6 gap-2 sm:gap-2.5">
        {DRESSCODE_PALETTE.map((piece, i) => (
          <div
            key={piece.color}
            className={`dresscode-palette-card paper-card grid place-items-center ${i % 2 ? "rotate-2" : "-rotate-2"}`}
          >
            <TetrominoSwatch color={piece.color} cells={piece.cells} />
          </div>
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="paper-card p-6">
          <h3 className="mb-3 flex items-center gap-2 font-pixel text-sm uppercase text-[color:var(--turquoise)] md:text-base">
            <CircleCheck className="h-6 w-6 shrink-0 stroke-[2.25] md:h-7 md:w-7" aria-hidden />
            Do&apos;s
          </h3>
          <ul className="space-y-2 font-hand text-lg text-[color:var(--ink)]">
            <li>· Slávnostne elegantné oblečenie</li>
            <li>· Pohodlné topánky na pretancovanú noc</li>
            <li>· Jednofarebné jesenné / hravé tóny podporujeme</li>
            <li>· Diamantová zbroj, zlaté bloky a železné krompáče</li>
          </ul>
        </div>
        <div className="paper-card p-6">
          <h3 className="mb-3 flex items-center gap-2 font-pixel text-sm uppercase text-[color:var(--destructive)] md:text-base">
            <Ban className="h-5 w-5 shrink-0 md:h-6 md:w-6" aria-hidden />
            Don&apos;ts
          </h3>
          <ul className="space-y-2 font-hand text-lg text-[color:var(--ink)]">
            <li>· Biele šaty (ak nie si nevesta)</li>
            <li>· Tepláky, kraťasy či rozgajdané kapsáče</li>
            <li>· Obuv, v ktorej nevydržíš tancovať alebo sa veľmo spotíš</li>
            <li>· Cosplay draka len po schválení novomanželmi</li>
          </ul>
        </div>
      </div>
    </Section>
  );
}

// ============ DARY ============
function DarySection() {
  return (
    <Section id="dary" level="Level 07" title="Loot & kvety">
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="paper-card p-6 md:p-8">
          <p className="font-hand text-2xl text-[color:var(--bordo)] mb-4">
            Najväčším darom bude pre nás to, že prídete osláviť náš deň s nami.
          </p>
          <p className="text-[color:var(--ink)]/80 leading-relaxed">
            Ak by ste nás aj tak chceli niečím potešiť, viac než vecné dary oceníme
            finančný príspevok na spoločný štart do manželstva.
          </p>
          <div className="mt-6 rounded-lg border-2 border-dashed border-[color:var(--blush)] p-4">
            <p className="font-marker text-sm uppercase text-[color:var(--bordo)]">💐 Kytice</p>
            <p className="mt-1 font-hand text-lg text-[color:var(--ink)]">
              Aby neskončila orezaná flórasmutne v kúte, budeme radi, ak ušetríte svoje peňaženky a vzácne metre štvorcové našej garzónky a dohodneme sa na maximálne jednom kvietku na osobu.
            </p>
          </div>
        </div>
        <div className="paper-card p-5 rotate-1">
          <p className="font-marker text-xs uppercase text-[color:var(--bordo)]">Dobrovoľný fast travel pre váš dar</p>
          <p className="mt-1 font-hand text-lg text-[color:var(--ink)]/80">
            Pre tých, ktorí majú radšej rýchly checkout než obálky v inventári.
          </p>
          <div className="mt-11 grid place-items-center">
            <div className="h-48 w-48 overflow-hidden rounded-md">
              <img src={CONFIG.qrPayment} alt="QR kód pre platbu" className="qr-code-img" />
            </div>
          </div>
          {/* <p className="mt-2 text-center text-xs text-[color:var(--ink)]/60">QR placeholder</p> */}
        </div>
      </div>
    </Section>
  );
}

// ============ DEŇ ============
function DenSection() {
  return (
    <Section id="den" level="Level 08" title="Lov na XP">
      <div className="paper-card p-6 md:p-10 relative overflow-hidden">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-[color:var(--turquoise)]/30 blur-2xl" />
        <div className="absolute -left-8 -bottom-8 h-40 w-40 rounded-full bg-[color:var(--blush)]/30 blur-2xl" />
        <div className="relative grid gap-6 md:grid-cols-3">
          {[
            { icon: "🎶", title: "Vykrúcaj sa", txt: "Playlist je legendárny, nech nás posadne démonom tanca spolu!" },
            { icon: "🥂", title: "Jedz & pi", txt: "Koľko žalúdok zvládne a hrdlo ráči. Samo sa to predsa neminie!" },
            { icon: "💬", title: "Pokecaj si", txt: "Spoznaj svoj stôl, presúvaj sa k ďalším až kým pusa nebolí!" },
            { icon: "📸", title: "Vyplň foto BINGO", txt: "9 fotiek, každá s unikátnym zadaním." },
            { icon: "🎲", title: "Zahraj si stolovku", txt: "Stôl s hrami prekypuje, zavolaj nás na hru!" },
            { icon: "📝", title: "Zapoj sa do kvízu", txt: "Koho poznáš lepšie a poznajú sa vôbec oni??" },
            { icon: "🎀", title: "Vypleť svadobnú kyticu", txt: "Že vraj alternatíva ku hádzaniu, tak uvidíme." },
            { icon: "📰", title: "Skúmaj svadobné noviny", txt: "Kto, s kým, kedy a kde vlastne sedíš?!" },

          ].map((c) => (
            <div key={c.title} className="rounded-lg border-2 border-dashed border-[color:var(--gold)]/50 p-5 text-center">
              <div className="text-4xl">{c.icon}</div>
              <h3 className="mt-2 font-display text-2xl text-[color:var(--bordo)]">{c.title}</h3>
              <p className="mt-2 font-hand text-lg text-[color:var(--ink)]">{c.txt}</p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

// ============ FOTKY ============
function FotkySection() {
  return (
    <Section id="fotky" level="Level 10" title="Foto save point">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="paper-card p-6">
          <p className="font-hand text-2xl text-[color:var(--bordo)]">
            Zachytil si moment či screenshot, ktorý by nemal zapadnút v galérii telefónu?
          </p>
          <p className="mt-2 text-[color:var(--ink)]/80 leading-relaxed">
            Nahraj ho sem! Tvoríme centralizovanú kolekciu legendárnych fotiek a videií,
            aby sme si mohli kompletne vyskladať náš deň.
          </p>
          <a
            href={CONFIG.photoUploadUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-[color:var(--bordo)] px-6 py-3 font-marker text-sm uppercase tracking-wide text-[color:var(--gold)]"
          >
            <Camera className="h-4 w-4" /> Nahraj fotky
          </a>
        </div>
        <div className="paper-card p-6 text-center">
          <p className="font-marker text-xs uppercase text-[color:var(--bordo)]">Alebo naskenuj</p>
          <div className="mt-3 grid place-items-center">
            <div className="h-48 w-48 overflow-hidden rounded-md">
              <img src={CONFIG.qrPhotos} alt="QR kód na nahrávanie fotiek" className="qr-code-img" />
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

// ============ BRNO ============
const BRNO_TIPS = [
  { title: "Kostnica u sv. Jakuba", desc: "Sv. Jakub skrýva v hlbinách tajomstvá, ktoré vás donútia vrátiť sa aj po obrade..." },
  { title: "Brnenský orloj", desc: "Veľký, dlhý a čierny skvost námestia Slobody." },
  { title: "Socha markraběte Jošta Lucemburského", desc: "Čo sa tak všetci chichocú pod tou sochou...?" },
  { title: "Zelný trh a labyrint", desc: "Doobeda sprechádzka po trhovisku so zeleninou a ovocím, poobede podzemie!" },
  { title: "Brnenský drak", desc: "Zdobí starú radnicu a možno ti o ňom dačo prezradia aj mladomanželia..." },
  { title: "Katedrála sv. Petra a Pavla", desc: "Čas na odpustky po prehýrenej noci..." },
  { title: "Conditio humana - Sv. Kryštof", desc: "Ďalší, tentoraz však menší a rozkošný!" },
  { title: "Pevnosť Špilberk", desc: "Hrad týčiaci sa nad mestom je ideálnym nedeľným side questom." },
  { title: "Pivovar Starobrno", desc: "Odporúčame zarezervovať si prehliadku s ochutnávkou nefiltra na konci!" },
  { title: "Park Lužánky", desc: "Park blízko centra, ideálny na rannú jógu, oddych na deke a kus zelene v meste." },
  { title: "Villa Tugendhat", desc: "Bez rezervácie hrozia iba záhrady tejto architektonickej ikony, ale ani to nie je zlé!" },
  { title: "VIDA! science centrum", desc: "Ideálny program s deťmi aj pre deti vo vás!" },
  { title: "Vodojemy Žlutý Kopec", desc: "Čerstvo rekonštruované, atmosférické a prekvapivo bez vody." },
  { title: "Famózna prežieračka", desc: "ZAZA; 3F Sushi; Ramen Brno; Špageta; Padagali; Bango Brno" },
  { title: "Cukrom nešetria", desc: "Ještě jednu; Dezertína; William Thomas; Profík & Trolík; Cukrářství Martinák" },
  { title: "Kávoholici ocenia", desc: "qb scuk; Café Robot; Kimono Coffee; Kytkafe; Vážkafé; " },
  { title: "Pivné bruško podporia", desc: "U Tekutého Chleba; U Tomana; Pivní Palác; Na Stojáka; Pivovar HARRY; Lokál U Caipla" },

];

function BrnoTipCard({ tip, i }: { tip: (typeof BRNO_TIPS)[number]; i: number }) {
  return (
    <div className="paper-card p-5" style={{ transform: `rotate(${(i % 2 === 0 ? -1 : 1) * 0.5}deg)` }}>
      <h3 className="font-display text-xl text-[color:var(--bordo)]">{tip.title}</h3>
      <p className="mt-2 font-hand text-base leading-relaxed text-[color:var(--ink)]/80">{tip.desc}</p>
    </div>
  );
}

function BrnoTipGroup({
  label,
  tips,
  tone = "blush",
}: {
  label: string;
  tips: typeof BRNO_TIPS;
  tone?: "blush" | "turquoise" | "dresscode-gold";
}) {
  const toneClass =
    tone === "turquoise"
      ? {
          border: "border-[color:var(--turquoise)]/70",
          badgeBorder: "border-[color:var(--turquoise)]/70",
        }
      : tone === "dresscode-gold"
        ? {
            border: "border-[#c8942c]/80",
            badgeBorder: "border-[#c8942c]/80",
          }
        : {
            border: "border-[color:var(--blush)]/70",
            badgeBorder: "border-[color:var(--blush)]/70",
          };

  return (
    <div className={`relative rounded-xl border-2 border-dashed bg-transparent ${toneClass.border} p-4 pt-7 sm:p-5 sm:pt-8`}>
      <span className={`absolute right-4 top-0 -translate-y-1/2 rounded-full border border-dashed ${toneClass.badgeBorder} bg-[color:var(--bordo-deep)] px-3 py-0.5 font-marker text-xs uppercase tracking-widest text-[color:var(--gold)] sm:right-5`}>
        {label}
      </span>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tips.map((tip, i) => (
          <BrnoTipCard key={tip.title} tip={tip} i={i} />
        ))}
      </div>
    </div>
  );
}

function BrnoSection() {
  const centrumTips = BRNO_TIPS.slice(0, 6);
  const okoloTips = BRNO_TIPS.slice(6, 13);
  const gastroTips = BRNO_TIPS.slice(13);

  return (
    <Section id="brno" level="Level 09" title="Brno DLC">
      <p className="font-hand text-2xl text-[color:var(--gold)] mb-8 max-w-[60.4rem] leading-relaxed">
        Plánuješ si návštevu Brna predĺžiť? Mesto má rozhodne čo ponúknuť! Skús na mape objaviť napríklad:
      </p>
      <div className="space-y-4">
        <BrnoTipGroup label="Centrum" tips={centrumTips} />
        <BrnoTipGroup label="Širšie centrum" tips={okoloTips} tone="turquoise" />
        <BrnoTipGroup label="Gastro tipy" tips={gastroTips} tone="dresscode-gold" />
      </div>
    </Section>
  );
}

// ============ FAQ ============
const FAQ = [
  { q: "Čo ak bude pršať?", a: "Obrad je v kostole, hostina v budove KUMSTu — oboje teda pod strechou. Dáždnik si pre istotu nechaj v inventári, ale náš quest pokračuje za každého počasia!" },
  { q: "V akom jazyku bude obrad?", a: "Celý obrad aj omša budú po slovensky až na kázeň, ktorá bude v češtine." },
  { q: "Mám kde zaparkovať auto?", a: "Jasné! V hoteli Continental je za príplatok - 390 Kč/noc k dispozícii parkovisko a počas víkendu je v modrých zónach Brnenských ulíc možné parkovať bezplatne, no v najhoršom scenári sú blízko aj parkovacie domy. Počas pobytu odporúčame presúvať sa po meste peši alebo verejnou dopravou." },
  // { q: "Musím v Brne nocovať?", a: "Samozrejme nemusíš, ale budeme radi, ak nám o tom dáš vopred vedieť v developerskej poznámke, aby sme vedeli s kým kedy rátať." },
  { q: "Čo ubytovanie?", a: "Máme predbežnú rezerváciu v Hoteli Continental na noc z 10.10. do 11.10., ktorú nám v prípade záujmu potvrď pomocou formuláru v sekcii vyššie. Alternatívne si môžeš nájsť alternatívny nocľah po vlastnej osi, ale nie je to odporúčané." },
  { q: "Prečo práve Hotel Continental?", a: "Na základe dôkladného prieskumu pomerov cena–kvalita–vzdialenosť vyšiel Continental najlepšie. Dali sme si záležať na tom, aby boli s voľbou všetci spokojní a mohli sme vás mať všetkých pekne po ruke." },
  // { q: "Predlžujeme pobyt v hoteli, ako na to?", a: "Brno ťa privíta s otvorenou náručou, no nezabudni určite vyplniť aj formulár na nami rezervovanú noc! Odporúčame však predĺžovanie až na dni po svadbe – pred našim termínom je kvôli Medzinárodnému strojárenskému veľtrhu Brno vybookované. Predĺženie či akékoľvek iné požiadavky rieš priamo s hotelom a pri komunikácii uvádzaj heslo „Svadba Schultz“ a meno hlavnej osoby z rezervácie." },
  { q: "Predlžujeme pobyt v hoteli, ako na to?", a: "Jednoducho! Navyše ku vyplneniu nášho formuláru s rezerváciou izby na noc z 10.10. na 11.10., sa skontaktuj priamo s hotelom pod heslom „Svadba Schultz“ a menom hlavnej osoby na koho je vedená izba v rezervácii. Odporúčame si pobyt predlžiť však až po dni svadby, nakoľko je z dôvodu Medzinárodnému strojárenskému veľtrhu pred týmto termínom Brno takmer plne vybookované a tým výrazne drahšie." },
  { q: "Kde sa môžem prezliecť pred oslavou?", a: "Check-in v hoteli je od 13:00 — izbu dostaneš včas, aby si sa stihol/stihla pripraviť pred zrazom o 14:30." },
  { q: "Môžem so sebou vziať +1?", a: "Tento deň slávime v kruhu tých bezprostredne najbližších. Preto na každej pozvánke sú oslovení práve tí, s ktorými na svadobnej hostine rátame a radi uvidíme." },
  // { q: "Môžem prísť sám/sama?", a: "Samozrejme! Ak nemáš +1, príď sám/sama — na obrade, počas hostiny alebo na tanečnom parkete si určite parťáka nájdeš." },
  { q: "Čo s deťmi?", a: "Deti sú vítané, len stačí ich uviesť v RSVP formulári, aby sme s nimi rátali. Avšak uvažujte tak, aby ste si vedeli náš veľký deň i vy čo najviac užiť. Teda ak máte niekoho na stráženie, odporúčame túto možnosť využiť." },
  { q: "Kedy končí oslava?", a: "Oficiálny program končí odchodom DJ o 02:00 a pokračuje dozvukmi. KUMST nás (dúfajme) nechá tancovať dokiaľ nám to nohy dovolia, ae nie je zlý nápad sa pred odjazdom domov trochu aj vyspať." },
  { q: "Ako sa dostaneme z KUMSTu naspäť do hotela?", a: "Pre menej unavených a mladších je to 10 minútová prechádzka. Ostatným odporúčame využiť taxi ako Bolt, Wolt alebo Uber na rýchly prevoz." },
  { q: "Ako sa presunieme z hotelu ku kostolu?", a: "Peši, vzdialenosť z hotelu Continental je 10 minút pomalou chôdzou. Pre unavených odporúčame odvoz taxikom či alternatívou. "},
  { q: "Aký je dresscode a je záväzný?", a: "Nami navrhované farby od nikoho striktne nebudeme vyžadovať, ide skôr o náladu a dôležité bude cítiť sa dobre popčas celej tancovačky až do 02:00. Viac info v leveli Dresscode." },
  { q: "Ako postupovať s darom?", a: "Radi prijmeme finančný príspevok na naše ďalšie kroky formou obálky, QR platby alebo prevodu. Detaily nájdete pod levelom Loot & kvety." },
  { q: "Môžem prísť so psíkom?", a: "Do kostola a na hostinu ho prosím neber. Ak sa ti však v krajnom prípade nepodarí zohnať stráženie, môže byť za príplatok v hoteli - 500 Kč/noc, prípadne vo vedľajšej miestnosti v budove KUMSTu. Viac v leveli Hotel ala čik-čik domček." },
  { q: "Čo ak mám alergiu alebo intoleranciu alebo som vegetarián/ka?", a: "Akékoľvek svoje špeciálne diéty, požiadavky či ďalšie adaptácie pokrmu nám napíš v poznámke a my kuchyňu vopred upozorníme." },
  { q: "Na koho sa obrátiť?", a: "V núdzi napíš alebo zavolaj mladomanželom - Natálii či Otovi, ich kontakty sú v poslednom leveli." },
  { q: "Koľko vychádza hotel na noc za jednu osobu ?", a: "Hradí sa cena na izbu, tak ako je uvedená vo formulári - necháme na vás ako si to podelíte podľa lôžok, medzi možnosťami je i jednolôžková izba." },
  { q: "Chýba tu nejaká otázka?", a: "Napíš nám ju do sekcie poznámka pod našimi kontaktmi." },
];

function FaqSection() {
  const [messages, setMessages] = useState<{ role: "bot" | "user"; text: string }[]>([
    { role: "bot", text: "Ja som mocný svadobný NPC poradca 🧙 Pýtaj sa, ak si trúfaš..." },
  ]);

  function ask(item: (typeof FAQ)[number]) {
    setMessages((m) => [...m, { role: "user", text: item.q }, { role: "bot", text: item.a }]);
    setTimeout(() => {
      document.getElementById("faq-scroll")?.scrollTo({ top: 99999, behavior: "smooth" });
    }, 50);
  }

  return (
    <Section id="faq" level="Level 11" title="Svadobný NPC poradca">
      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="paper-card flex flex-col p-4">
          <p className="mb-3 font-marker text-sm uppercase text-[color:var(--bordo)]">Vyber otázku</p>
          <div className="flex max-h-[420px] flex-col gap-1.5 overflow-y-auto pr-1">
            {FAQ.map((f) => (
              <button
                key={f.q}
                onClick={() => ask(f)}
                className="shrink-0 rounded-md border border-dashed border-[color:var(--ink)]/30 bg-white/40 px-3 py-2 text-left font-hand text-lg text-[color:var(--ink)] hover:bg-[color:var(--gold)]/20 transition"
              >
                <HelpCircle className="mr-2 inline h-4 w-4 text-[color:var(--bordo)]" />
                {f.q}
              </button>
            ))}
          </div>
        </div>
        <div className="paper-card flex h-[500px] flex-col p-4">
          <div id="faq-scroll" className="flex-1 space-y-3 overflow-y-auto pr-2">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : ""}`}>
                {m.role === "bot" && (
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[color:var(--turquoise)]">
                    <Bot className="h-4 w-4 text-[color:var(--bordo-deep)]" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    m.role === "user"
                      ? "bg-[color:var(--bordo)] text-[color:var(--gold)] font-marker text-sm"
                      : "bg-white/70 text-[color:var(--ink)]"
                  }`}
                >
                  {m.text}
                </div>
                {m.role === "user" && (
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[color:var(--blush)]">
                    <UserIcon className="h-4 w-4 text-[color:var(--bordo-deep)]" />
                  </div>
                )}
              </div>
            ))}
          </div>
          <p className="mt-2 text-center text-xs text-[color:var(--ink)]/50">
            {/* Statický NPC poradca · {FAQ.length} otázok */}
          </p>
        </div>
      </div>
    </Section>
  );
}

// ============ KONTAKT ============
function KontaktSection() {
  const stickman = useContext(StickmanContext);
  const meetClose = isStickmanMeetClose(stickman.sectionId, stickman.linePos);
  const meetHeartPos = (stickman.linePos + FOOTER_PARTNER_LINE_POS) / 2;
  const guests = useGuests();
  const rsvpName =
    (guests.find((g) => g.id === "main") ?? guests[0])?.name?.trim() || "";
  const [contactName, setContactName] = useState("");
  const [notes, setNotes] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(KONTAKT_SENT_KEY) === "1") setSent(true);
      const raw = window.localStorage.getItem(KONTAKT_DATA_KEY);
      let savedName = "";
      if (raw) {
        const data = JSON.parse(raw) as { notes?: string; contactName?: string };
        if (typeof data.notes === "string") setNotes(data.notes);
        if (typeof data.contactName === "string") savedName = data.contactName.trim();
      }
      setContactName(savedName || getMainRsvpName());
    } catch { /* noop */ }
  }, []);

  // Keď host dokončí RSVP neskôr, predvyplň meno (ak ešte nie je vlastné).
  useEffect(() => {
    if (!rsvpName) return;
    setContactName((prev) => prev.trim() || rsvpName);
  }, [rsvpName]);

  function editKontakt() {
    setSent(false);
    try { window.localStorage.removeItem(KONTAKT_SENT_KEY); } catch { /* noop */ }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    const fd = new FormData(e.currentTarget);
    const name = rsvpName || contactName.trim();
    if (!name) {
      toast.error("Napíš prosím svoje meno — aby sme vedeli, od koho poznámka je.", { id: "poznamka" });
      return;
    }
    if (!notes.trim()) {
      toast.error("Napíš prosím poznámku.", { id: "poznamka" });
      return;
    }
    setLoading(true);
    const r = await submitForm("poznamka", {
      notes: notes.trim(),
      mainPerson: name,
      name,
      hp: fd.get("hp"),
    });
    setLoading(false);
    if (r.ok) {
      setSent(true);
      try {
        window.localStorage.setItem(KONTAKT_SENT_KEY, "1");
        window.localStorage.setItem(
          KONTAKT_DATA_KEY,
          JSON.stringify({ notes: notes.trim(), contactName: name }),
        );
      } catch { /* noop */ }
      markSectionChecked("kontakt");
      toast.success("Poznámka odoslaná ✨", { id: "poznamka" });
    } else toast.error("Skús to prosím znova.", { id: "poznamka" });
  }

  return (
    <section
      id="kontakt"
      className="flex min-h-[calc(100dvh-4.25rem)] flex-col py-16 lg:min-h-[calc(100dvh-1rem)] lg:py-24"
    >
      <div className="relative mb-8 flex items-end gap-4">
        <span className="font-marker text-sm uppercase tracking-widest text-[color:var(--turquoise)]">
          Level 12
        </span>
        <div className="relative flex-1 pt-[22px]" data-stickman-rail="kontakt">
          <div className="pointer-events-none absolute inset-x-0 bottom-0 border-t-2 border-dashed border-[color:var(--gold)]/40" />
          <SectionStickmanRail
            linePos={stickman.linePos}
            visible={stickman.sectionId === "kontakt"}
            jumping={stickman.jumping}
          />
        </div>
      </div>
      <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-[color:var(--paper)] mb-8">
        Odkaz developerom
      </h2>
      <p className="font-hand text-2xl text-[color:var(--gold)] mb-8 max-w-[50.4rem] leading-relaxed">
        Stratil/a si sa v komplexnosti questu? Ozvi sa nám, alebo niekomu, kto vyzerá, že vie, čo robí...
      </p>
      <div className="grid gap-6 md:grid-cols-2">
        {[
          { name: "Natália", ...CONFIG.contacts.natalia },
          { name: "Oto", ...CONFIG.contacts.oto },
        ].map((c) => (
          <div key={c.name} className="paper-card p-6">
            <div className="mb-3 flex items-center gap-3">
              <div className="grid h-14 w-14 place-items-center rounded-full text-2xl font-display text-[color:var(--bordo-deep)]" style={{ background: `var(--${c.name === "Natália" ? "blush" : "turquoise"})` }}>
                {c.name[0]}
              </div>
              <h3 className="font-display text-3xl text-[color:var(--bordo)]">{c.name}</h3>
            </div>
            <div className="space-y-2">
              <a className="flex items-center gap-2 font-hand text-lg text-[color:var(--ink)] hover:text-[color:var(--bordo)]" href={`tel:${c.phone.replace(/\s/g, "")}`}>
                <Phone className="h-4 w-4" /> {c.phone}
              </a>
              <a className="flex items-center gap-2 font-hand text-lg text-[color:var(--ink)] hover:text-[color:var(--bordo)]" href={`mailto:${c.email}`}>
                <Mail className="h-4 w-4" /> {c.email}
              </a>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={onSubmit} className="paper-card mt-6 p-6 md:p-8">
        <input type="text" name="hp" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
        {sent ? (
          <div className="text-center">
            <p className="font-hand text-xl text-[color:var(--bordo)]">Ďakujeme za tvoje slová, pokúsime sa ich nezapatrošiť...</p>
            <button
              type="button"
              onClick={editKontakt}
              className="mt-5 font-hand text-base text-[color:var(--ink)]/60 hover:text-[color:var(--bordo)]"
            >
              Zmeniť odpoveď
            </button>
          </div>
        ) : (
          <>
            {!rsvpName ? (
              <div>
                <label className="form-label text-sm">Tvoje meno</label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Aby sme vedeli, od koho poznámka je"
                  autoComplete="name"
                  className="mt-1 w-full rounded-md border border-[color:var(--ink)]/30 bg-white/60 px-3 py-2 text-[color:var(--ink)] placeholder:text-[color:var(--ink)]/40 focus:outline-none focus:ring-2 focus:ring-[color:var(--gold)]"
                />
                <p className="mt-1 font-hand text-sm text-[color:var(--ink)]/55">
                  RSVP ešte nemáš vyplnené — meno sem prosím napíš ručne.
                </p>
              </div>
            ) : null}
            <div className={rsvpName ? undefined : "mt-4"}>
              <label className="form-label text-sm">Poznámka</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Máš otázku, tip alebo niečo, čo sa nám hodí vedieť? Sem s tým!"
                className="mt-1 w-full rounded-md border border-[color:var(--ink)]/30 bg-white/60 px-3 py-2 text-[color:var(--ink)] placeholder:text-[color:var(--ink)]/40 focus:outline-none focus:ring-2 focus:ring-[color:var(--gold)]"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-[color:var(--bordo)] px-6 py-3 font-marker text-sm uppercase tracking-wide text-[color:var(--gold)] disabled:opacity-60"
            >
              <Send className="h-4 w-4" /> {loading ? "Odosielam..." : "Odoslať"}
            </button>
          </>
        )}
      </form>

      <div className="flex-1 min-h-[4rem]" />
      <footer id="quest-footer" className="mt-auto pb-6 text-center">
        <div id="quest-footer-line" className="relative mb-8 pt-[22px]">
          <div className="pointer-events-none absolute inset-x-0 bottom-0 border-t-2 border-dashed border-[color:var(--gold)]/30" />
          <FooterPartnerStickman />
          <StickmanMeetHeart leftPos={meetHeartPos} visible={meetClose} />
          <SectionStickmanRail
            linePos={stickman.linePos}
            visible={stickman.sectionId === "footer"}
            jumping={stickman.jumping}
          />
        </div>
        <p className="font-marker text-lg text-[color:var(--gold)]">
          Natália &amp; Oto · 10.10.2026 · Brno
        </p>
        <p className="mt-2 font-hand text-lg text-[color:var(--paper)]/60">
          Quest log done · Tešíme sa na Vás !!
        </p>
        <a
          href="https://github.com/WhybCode/wedding_quest/commits/main/"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block font-hand text-xs tracking-wide text-[color:var(--paper)]/20 transition-colors hover:text-[color:var(--paper)]/40"
        >
          Last updated {viteEnv("VITE_LAST_UPDATED", "19.07.2026")}
        </a>
      </footer>
    </section>
  );
}
