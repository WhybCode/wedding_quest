import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast, Toaster } from "sonner";
import {
  Heart, MapPin, Calendar as CalendarIcon, Music, Utensils, Sparkles,
  Camera, Gift, Shirt, HelpCircle, Phone, Mail, Check, ChevronDown,
  Send, Bot, User as UserIcon, Download, ExternalLink, Plus, Trash2,
  Map as MapIcon, Route as RouteIcon,
} from "lucide-react";

export const Route = createFileRoute("/")({ component: WeddingSite });

// ============ CONFIG ============
const CONFIG = {
  brideName: "Natália",
  groomName: "Oto",
  dateISO: "2026-10-10T14:00:00+02:00",
  dateHuman: "10.10.2026",
  city: "Brno, Česká republika",
  formEndpoint: "https://formspree.io/f/your-endpoint",
  contacts: {
    natalia: { phone: "+421 900 000 000", email: "natalia@example.com" },
    oto: { phone: "+421 900 000 001", email: "oto@example.com" },
  },
  maps: {
    hotel: "https://www.google.com/maps/search/Hotel+Continental+Brno",
    zraz: "https://www.google.com/maps/search/Moravsk%C3%A9+n%C3%A1m%C4%9Bst%C3%AD+Brno",
    kostol: "https://www.google.com/maps/search/Kostel+sv.+Jakuba+Brno",
    kumst: "https://www.google.com/maps/search/Kumst+Brno",
  },
  qrPayment: "https://placehold.co/220x220/f5e9c8/3a1418?text=QR+platba",
  qrPhotos: "https://placehold.co/220x220/f5e9c8/3a1418?text=QR+fotky",
  photoUploadUrl: "#",
  couplePhoto: "", // URL fotky páru — placeholder
};

// Ceny izieb (Kč / noc, s raňajkami)
const ROOM_TYPES = [
  { key: "single", label: "Jednolôžková", price: 1950 },
  { key: "double", label: "Dvojlôžková DBL (manželská)", price: 2500 },
  { key: "twin",   label: "Dvojlôžková TWIN (2 postele)", price: 2500 },
] as const;
type RoomTypeKey = typeof ROOM_TYPES[number]["key"];

const EXTRA_BED_PRICE = 600;   // Kč / noc
const COT_PRICE = 0;           // detská postieľka do 3r
const PET_PRICE = 500;         // Kč / noc
const CITY_TAX = 40;           // Kč / osoba / noc
const PARKING_PRICE = 390;     // Kč / noc (info)

// Menu — 3 jedlá
const DISHES = [
  { key: "meat", emoji: "🥩", label: "Sviečková na smotane", desc: "hovädzia sviečková, karlovarská knedľa" },
  { key: "poultry", emoji: "🍗", label: "Kuracie supreme", desc: "grilované kura, gratinované zemiaky" },
  { key: "veg", emoji: "🥗", label: "Vegetariánske rizoto", desc: "hríbové rizoto s parmezánom" },
] as const;
type DishKey = typeof DISHES[number]["key"];

// ============ Checklist ============
const SECTIONS = [
  { id: "hero",       label: "Poznač si termín",     icon: CalendarIcon },
  { id: "program",    label: "Naplánuj si deň",      icon: MapPin },
  { id: "lokacie",    label: "Naplánuj si cestu",    icon: RouteIcon },
  { id: "rsvp",       label: "Potvrď účasť",         icon: Check },
  { id: "pokrm",      label: "Vyber si pokrm",       icon: Utensils },
  { id: "ubytovanie", label: "Zariaď si ubytovanie", icon: Sparkles },
  { id: "dresscode",  label: "Nachystaj si dresscode", icon: Shirt },
  { id: "dary",       label: "Priprav dar",          icon: Gift },
  { id: "den",        label: "Uži si náš deň",       icon: Music },
  { id: "fotky",      label: "Zdieľaj s nami fotky", icon: Camera },
  { id: "brno",       label: "Poznaj Brno",          icon: MapIcon },
];

// ============ Guest list (shared) ============
type Guest = { id: string; name: string; attending: boolean };
const GUESTS_KEY = "no-wedding-guests-v1";

function useGuests() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(GUESTS_KEY);
      if (raw) setGuests(JSON.parse(raw));
    } catch { /* ignore */ }
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(GUESTS_KEY, JSON.stringify(guests)); } catch { /* ignore */ }
    window.dispatchEvent(new CustomEvent("guests-changed"));
  }, [guests, hydrated]);
  useEffect(() => {
    const onChange = () => {
      try {
        const raw = localStorage.getItem(GUESTS_KEY);
        setGuests(raw ? JSON.parse(raw) : []);
      } catch { /* ignore */ }
    };
    window.addEventListener("guests-changed", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("guests-changed", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);
  return { guests, setGuests, hydrated };
}

// ============ Root ============
function WeddingSite() {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [active, setActive] = useState<string>("hero");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("no-wedding-checked-v1");
      if (raw) setChecked(new Set(JSON.parse(raw)));
    } catch { /* ignore */ }
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("no-wedding-checked-v1", JSON.stringify(Array.from(checked)));
    } catch { /* ignore */ }
  }, [checked]);

  const scrollerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = scrollerRef.current ?? undefined;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { root, threshold: 0.55 }
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    setMobileOpen(false);
  };

  const toggleCheck = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const progress = Math.round((checked.size / SECTIONS.length) * 100);

  return (
    <div ref={scrollerRef} className="relative snap-scroller">
      <Toaster position="top-center" richColors />
      <PaperTexture />
      <TetrisBorders />

      <MobileChecklist
        open={mobileOpen}
        onToggle={() => setMobileOpen((o) => !o)}
        checked={checked}
        active={active}
        onPick={scrollTo}
        onToggle2={toggleCheck}
        progress={progress}
      />

      <div className="mx-auto max-w-[1400px] px-4 pt-14 lg:pt-4 lg:pr-[340px]">
        <HeroSection />
        <ProgramSection />
        <LokacieSection />
        <RsvpSection />
        <PokrmSection />
        <UbytovanieSection />
        <DresscodeSection />
        <DarySection />
        <DenSection />
        <FotkySection />
        <FaqSection />
        <BrnoSection />
        <Footer />
      </div>

      <DesktopChecklist
        checked={checked}
        active={active}
        onPick={scrollTo}
        onToggle={toggleCheck}
        progress={progress}
      />
    </div>
  );
}

// ============ Backgrounds ============
function PaperTexture() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 opacity-[0.08] mix-blend-overlay z-0"
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/></svg>\")",
      }}
    />
  );
}

// Tetris-block decorative border on left edge (desktop only)
function TetrisBorders() {
  const blocks = [
    "#c8942c", "#4bb3a7", "#c78bbf", "#8b1e1e",
    "#c8942c", "#4bb3a7", "#c78bbf", "#8b1e1e",
    "#c8942c", "#4bb3a7", "#c78bbf", "#8b1e1e",
  ];
  return (
    <div aria-hidden className="pointer-events-none fixed inset-y-0 left-0 z-0 hidden w-3 flex-col lg:flex">
      {blocks.map((c, i) => (
        <div key={i} className="flex-1 border-b border-black/20" style={{ background: c, opacity: 0.55 }} />
      ))}
    </div>
  );
}

// ============ Checklist UI ============
function ChecklistItem({
  s, done, active, onPick, onToggle,
}: {
  s: (typeof SECTIONS)[number];
  done: boolean; active: boolean;
  onPick: (id: string) => void;
  onToggle: (id: string) => void;
}) {
  return (
    <div
      className={`group flex w-full items-center gap-2 rounded-md px-2 py-1.5 transition-colors ${
        active ? "bg-[color:var(--gold)]/15" : "hover:bg-[color:var(--ink)]/5"
      }`}
    >
      <button
        onClick={() => onToggle(s.id)}
        aria-label={done ? "Odškrtnúť" : "Odčiarknuť"}
        className="grid h-6 w-6 shrink-0 place-items-center rounded border-2 transition-colors cursor-pointer hover:border-[color:var(--bordo)]"
        style={{
          borderColor: done ? "var(--turquoise)" : "color-mix(in oklab, var(--ink) 40%, transparent)",
          background: done ? "color-mix(in oklab, var(--turquoise) 20%, transparent)" : "transparent",
          transform: done ? "rotate(-3deg)" : "none",
        }}
      >
        {done && (
          <svg viewBox="0 0 20 20" className="h-5 w-5 text-[color:var(--bordo-deep)]">
            <path d="M3 11 L8 15 L17 4" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
      <button
        onClick={() => onPick(s.id)}
        className="flex-1 text-left cursor-pointer font-hand text-lg leading-tight text-[color:var(--ink)]"
        style={{ textDecoration: done ? "line-through" : "none", opacity: done ? 0.65 : 1 }}
      >
        {s.label}
      </button>
    </div>
  );
}

function DesktopChecklist({
  checked, active, onPick, onToggle, progress,
}: {
  checked: Set<string>; active: string; progress: number;
  onPick: (id: string) => void;
  onToggle: (id: string) => void;
}) {
  return (
    <aside className="fixed right-6 top-6 bottom-6 z-30 hidden w-[320px] lg:block">
      <div className="paper-card notebook-lines relative h-full overflow-hidden p-5">
        <div className="tape" />
        <div className="mb-3 flex items-baseline justify-between border-b-2 border-dashed border-[color:var(--ink)]/20 pb-2">
          <h2 className="font-marker text-xl text-[color:var(--bordo)]">Quest log</h2>
          <span className="font-hand text-xl text-[color:var(--ink)]/70">{progress}%</span>
        </div>
        <div className="mb-3 h-2 overflow-hidden rounded-full bg-[color:var(--ink)]/10">
          <div className="h-full rounded-full bg-[color:var(--turquoise)] transition-all" style={{ width: `${progress}%` }} />
        </div>
        <div className="space-y-0.5 overflow-y-auto pr-1" style={{ maxHeight: "calc(100% - 100px)" }}>
          {SECTIONS.map((s) => (
            <ChecklistItem
              key={s.id} s={s}
              done={checked.has(s.id)} active={active === s.id}
              onPick={onPick} onToggle={onToggle}
            />
          ))}
        </div>
      </div>
    </aside>
  );
}

function MobileChecklist({
  open, onToggle, checked, active, onPick, onToggle2, progress,
}: {
  open: boolean; onToggle: () => void;
  checked: Set<string>; active: string; progress: number;
  onPick: (id: string) => void;
  onToggle2: (id: string) => void;
}) {
  return (
    <div className="fixed inset-x-0 top-0 z-40 lg:hidden">
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 border-b border-[color:var(--gold)]/30 bg-[color:var(--bordo-deep)]/95 px-4 py-2.5 backdrop-blur cursor-pointer"
      >
        <span className="font-marker text-sm text-[color:var(--gold)]">Quest log</span>
        <div className="flex-1 h-1.5 rounded-full bg-[color:var(--paper)]/15 overflow-hidden">
          <div className="h-full bg-[color:var(--turquoise)]" style={{ width: `${progress}%` }} />
        </div>
        <span className="font-hand text-lg text-[color:var(--paper)]">{progress}%</span>
        <ChevronDown className={`h-4 w-4 text-[color:var(--paper)] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="paper-card mx-3 mt-2 max-h-[70vh] overflow-y-auto p-3">
          {SECTIONS.map((s) => (
            <ChecklistItem
              key={s.id} s={s}
              done={checked.has(s.id)} active={active === s.id}
              onPick={onPick} onToggle={onToggle2}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============ Section wrapper (snap) ============
function Section({
  id, level, title, children,
}: { id: string; level: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="snap-section scroll-mt-16 py-14 lg:py-20 min-h-[100svh]">
      <div className="mb-6 flex items-end gap-4">
        <span className="font-marker text-sm uppercase tracking-widest text-[color:var(--turquoise)]">
          {level}
        </span>
        <div className="h-px flex-1 border-t-2 border-dashed border-[color:var(--gold)]/40" />
      </div>
      <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-[color:var(--paper)] mb-6">
        {title}
      </h2>
      {children}
    </section>
  );
}

// ============ Countdown (SSR-safe) ============
function useCountdown(iso: string) {
  const target = useMemo(() => new Date(iso).getTime(), [iso]);
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  if (now === null) return { days: null, hours: null, minutes: null, seconds: null };
  const diff = Math.max(0, target - now);
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };
}

function downloadIcs() {
  const ics = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Natalia-Oto//Wedding//SK",
    "BEGIN:VEVENT", "UID:natalia-oto-2026@wedding",
    "DTSTAMP:20260101T000000Z",
    "DTSTART:20261010T120000Z", "DTEND:20261011T000000Z",
    "SUMMARY:Svadba Natália & Oto", "LOCATION:Brno, Česká republika",
    "DESCRIPTION:Co-op quest začína. Tešíme sa na Vás.",
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
  const blob = new Blob([ics], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "svadba-natalia-oto.ics"; a.click();
  URL.revokeObjectURL(url);
}

// ============ HERO ============
function HeroSection() {
  const c = useCountdown(CONFIG.dateISO);
  return (
    <section id="hero" className="snap-section scroll-mt-16 pt-6 lg:pt-12 pb-10 min-h-[100svh]">
      <div className="mb-3 flex items-center gap-3">
        <span className="font-marker text-xs uppercase tracking-widest text-[color:var(--turquoise)]">
          Level 00 · Save the date
        </span>
      </div>
      <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] items-center">
        <div>
          <p className="font-hand text-2xl text-[color:var(--gold)] mb-2">
            Zdá sa, že si dostal/a pozvánku na svadbu.
          </p>
          <h1 className="font-display text-6xl md:text-8xl lg:text-9xl leading-[0.9] text-[color:var(--paper)]">
            <span className="italic">Natália</span>
            <span className="block font-hand text-5xl md:text-7xl text-[color:var(--blush)] my-2">&amp;</span>
            <span className="italic">Oto</span>
          </h1>
          <div className="ticker-line my-6 max-w-xl" />
          <p className="max-w-xl text-lg text-[color:var(--paper)]/85 leading-relaxed">
            Spúšťame náš najväčší co-op quest a chceli by sme, aby si bol/a pri tom.
            Prejdi checklist vpravo a daj nám vedieť, či sa vidíme na tanečnom parkete.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#rsvp"
              className="cursor-pointer inline-flex items-center gap-2 rounded-full bg-[color:var(--gold)] px-6 py-3 font-marker text-sm uppercase tracking-wide text-[color:var(--bordo-deep)] shadow-[0_6px_0_-2px_rgba(0,0,0,0.4)] hover:translate-y-0.5 hover:shadow-[0_4px_0_-2px_rgba(0,0,0,0.4)] transition"
            >
              <Heart className="h-4 w-4" /> Potvrdzujem účasť
            </a>
          </div>
        </div>

        {/* Foto páru + Save the date */}
        <div className="relative">
          <div className="paper-card relative mx-auto max-w-sm p-4 -rotate-2 mb-4">
            <div className="tape" />
            <div className="grid aspect-[4/5] place-items-center rounded-md bg-gradient-to-br from-[color:var(--blush)]/40 via-[color:var(--gold)]/30 to-[color:var(--turquoise)]/40 text-center p-4">
              {CONFIG.couplePhoto ? (
                <img src={CONFIG.couplePhoto} alt="Natália a Oto" className="h-full w-full rounded object-cover" />
              ) : (
                <div>
                  <p className="font-marker text-lg text-[color:var(--bordo)]">📸 sem príde naša foto</p>
                  <p className="mt-2 font-hand text-sm text-[color:var(--ink)]/70">placeholder</p>
                </div>
              )}
            </div>
            <p className="mt-2 text-center font-hand text-lg text-[color:var(--ink)]">Natália &amp; Oto</p>
          </div>

          <div className="paper-card relative mx-auto max-w-sm p-6 rotate-1">
            <p className="font-marker text-xs uppercase tracking-widest text-[color:var(--bordo)]">Save the date</p>
            <p className="mt-2 text-center font-display text-8xl leading-none text-[color:var(--bordo)]">10</p>
            <p className="mt-1 text-center font-hand text-2xl text-[color:var(--ink)]/80">október 2026</p>
            <p className="mt-1 text-center font-hand text-lg text-[color:var(--ink)]/60">{CONFIG.city}</p>
            <MiniCalendar />
            <div className="mt-4 border-t-2 border-dashed border-[color:var(--ink)]/20 pt-3">
              <p className="font-marker text-xs uppercase text-[color:var(--bordo)] mb-2">Pridať do kalendára</p>
              <div className="flex flex-wrap gap-2">
                <a
                  target="_blank" rel="noreferrer"
                  href="https://calendar.google.com/calendar/render?action=TEMPLATE&text=Svadba+Nat%C3%A1lia+%26+Oto&dates=20261010T120000Z/20261011T000000Z&location=Brno&details=Co-op+quest"
                  className="cursor-pointer rounded-full border-2 border-dashed border-[color:var(--turquoise)] px-3 py-1 font-hand text-sm text-[color:var(--bordo)] hover:bg-[color:var(--turquoise)]/15"
                >
                  Google
                </a>
                <button onClick={downloadIcs} className="cursor-pointer rounded-full border-2 border-dashed border-[color:var(--gold)] px-3 py-1 font-hand text-sm text-[color:var(--bordo)] hover:bg-[color:var(--gold)]/15">
                  Apple .ics
                </button>
                <button onClick={downloadIcs} className="cursor-pointer rounded-full border-2 border-dashed border-[color:var(--blush)] px-3 py-1 font-hand text-sm text-[color:var(--bordo)] hover:bg-[color:var(--blush)]/15">
                  Outlook .ics
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 grid grid-cols-4 gap-3 max-w-2xl">
        {[
          { l: "dní", v: c.days },
          { l: "hodín", v: c.hours },
          { l: "minút", v: c.minutes },
          { l: "sekúnd", v: c.seconds },
        ].map((x, i) => (
          <div key={x.l} className="paper-card p-3 text-center" style={{ transform: `rotate(${i % 2 ? 1 : -1}deg)` }}>
            <div className="font-display text-3xl md:text-4xl text-[color:var(--bordo)] tabular-nums">
              {x.v === null ? "—" : String(x.v).padStart(2, "0")}
            </div>
            <div className="font-hand text-sm text-[color:var(--ink)]/70">{x.l}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function MiniCalendar() {
  // Október 2026: 1. = štvrtok
  const startDay = 4;
  const days = 31;
  const cells: (number | null)[] = [];
  for (let i = 1; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);
  return (
    <div className="mt-4 rounded-md border border-[color:var(--ink)]/20 bg-[color:var(--paper)] p-3">
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
                is10 ? "bg-[color:var(--bordo)] text-[color:var(--gold)] font-bold ring-2 ring-[color:var(--gold)] scale-110" : "text-[color:var(--ink)]/80"
              }`}
            >
              {is10 ? (
                <span className="relative">
                  10
                  <Heart className="absolute -right-2 -top-2 h-3 w-3 fill-[color:var(--blush)] text-[color:var(--blush)]" />
                </span>
              ) : d}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============ PROGRAM (wavy line with electric tram) ============
const PROGRAM = [
  { time: "13:00", title: "Check-in v hoteli", icon: "🛏️", place: "Hotel Continental", url: CONFIG.maps.hotel },
  { time: "14:00", title: "Zraz",              icon: "👋", place: "Moravské náměstí",   url: CONFIG.maps.zraz },
  { time: "15:30", title: "Obrad",             icon: "💍", place: "Kostol sv. Jakuba",  url: CONFIG.maps.kostol, tram: true },
  { time: "17:30", title: "Hostina",           icon: "🍽️", place: "Kumst",              url: CONFIG.maps.kumst },
  { time: "18:30", title: "Prvý tanec",        icon: "💃", place: null, url: null },
  { time: "22:00", title: "Raut",              icon: "🍕", place: null, url: null },
  { time: "02:00", title: "Dozvuky",           icon: "🌙", place: null, url: null },
];

function ProgramSection() {
  return (
    <Section id="program" level="Level 01" title="Program dňa">
      <p className="font-hand text-2xl text-[color:var(--gold)] mb-8 max-w-2xl">
        Level 10.10.2026 má viac checkpointov. Nasleduj vlnitú trať — nikde po ceste sa nestratíš.
      </p>

      <div className="relative">
        {/* Wavy SVG line (desktop side, mobile hidden below sm) */}
        <svg
          className="pointer-events-none absolute left-0 top-0 hidden h-full w-24 md:block"
          viewBox="0 0 100 800" preserveAspectRatio="none"
          aria-hidden
        >
          <path
            d="M 50 0 C 90 80, 10 160, 50 240 S 90 400, 50 480 S 10 640, 50 720 L 50 800"
            fill="none"
            stroke="var(--gold)"
            strokeWidth="3"
            strokeDasharray="6 8"
            strokeLinecap="round"
          />
        </svg>

        <ol className="relative space-y-8 md:pl-28">
          {PROGRAM.map((p, i) => (
            <li key={i} className="relative">
              {p.tram && (
                <div className="absolute -top-6 -left-2 md:-left-16 rotate-[-8deg] font-marker text-xs text-[color:var(--turquoise)] flex items-center gap-1">
                  🚋 <span>električka č.4</span>
                </div>
              )}
              <div className="paper-card p-4 md:p-5" style={{ transform: `rotate(${(i % 2 ? 0.6 : -0.6)}deg)` }}>
                <div className="flex items-center gap-3">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[color:var(--gold)] text-2xl shadow-lg">
                    {p.icon}
                  </span>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-baseline gap-3">
                      <span className="font-marker text-lg text-[color:var(--bordo)]">{p.time}</span>
                      <h3 className="font-display text-2xl text-[color:var(--ink)]">{p.title}</h3>
                    </div>
                    {p.place && (
                      <p className="mt-1 font-hand text-lg text-[color:var(--ink)]/70">📍 {p.place}</p>
                    )}
                    {p.url && (
                      <a href={p.url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-sm text-[color:var(--bordo)] underline cursor-pointer">
                        Otvoriť v mapách <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}

// ============ LOKÁCIE ============
const LOKACIE = [
  { name: "Hotel Continental", desc: "Ubytovanie & check-in. Naša štartovacia zóna.", addr: "Brno – Kounicova, placeholder", url: CONFIG.maps.hotel },
  { name: "Kostol sv. Jakuba", desc: "Obrad. Prosíme, príďte s 15 min rezervou.", addr: "Jakubské náměstí, Brno", url: CONFIG.maps.kostol },
  { name: "Kumst", desc: "Hostina, prvý tanec, raut a dozvuky.", addr: "Údolní, Brno – placeholder", url: CONFIG.maps.kumst },
];

function LokacieSection() {
  return (
    <Section id="lokacie" level="Level 02" title="Naplánuj si cestu">
      <div className="grid gap-6 md:grid-cols-3">
        {LOKACIE.map((l, i) => (
          <div key={l.name} className="paper-card p-5" style={{ transform: `rotate(${(i - 1) * 0.6}deg)` }}>
            <div className="mb-3 grid aspect-video place-items-center rounded-md bg-gradient-to-br from-[color:var(--turquoise)]/30 to-[color:var(--blush)]/30 text-4xl">
              <MapPin className="h-10 w-10 text-[color:var(--bordo)]" />
            </div>
            <h3 className="font-display text-2xl text-[color:var(--bordo)]">{l.name}</h3>
            <p className="mt-1 font-hand text-lg text-[color:var(--ink)]/80">{l.desc}</p>
            <p className="mt-2 text-sm text-[color:var(--ink)]/60">{l.addr}</p>
            <a
              href={l.url} target="_blank" rel="noreferrer"
              className="cursor-pointer mt-3 inline-flex items-center gap-1 rounded-full border border-[color:var(--bordo)] px-3 py-1.5 text-sm text-[color:var(--bordo)] hover:bg-[color:var(--bordo)] hover:text-[color:var(--paper)] transition"
            >
              Navigovať v Google Maps <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ============ FORMS UTIL ============
async function submitForm(formName: string, data: Record<string, unknown>) {
  if ((data as { hp?: string }).hp) return { ok: true };
  try {
    const res = await fetch(CONFIG.formEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ _form: formName, ...data }),
    });
    return { ok: res.ok };
  } catch {
    return { ok: false };
  }
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

// ============ RSVP ============
function RsvpSection() {
  const { guests, setGuests, hydrated } = useGuests();
  const [primaryName, setPrimaryName] = useState("");
  const [attending, setAttending] = useState<"yes" | "no">("yes");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  // Ensure at least a primary guest slot when marked yes
  const primary = guests[0];
  const plusOnes = guests.slice(1);

  useEffect(() => {
    if (hydrated && guests.length === 0 && attending === "yes") {
      setGuests([{ id: uid(), name: "", attending: true }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  useEffect(() => {
    if (primary) setPrimaryName(primary.name);
  }, [primary?.name]);

  function updatePrimary(name: string) {
    setPrimaryName(name);
    setGuests((prev) => {
      if (prev.length === 0) return [{ id: uid(), name, attending: true }];
      const next = [...prev];
      next[0] = { ...next[0], name, attending: true };
      return next;
    });
  }

  function addPlusOne() {
    setGuests((prev) => [...prev, { id: uid(), name: "", attending: true }]);
  }
  function updatePlusOne(id: string, patch: Partial<Guest>) {
    setGuests((prev) => prev.map((g) => (g.id === id ? { ...g, ...patch } : g)));
  }
  function removePlusOne(id: string) {
    setGuests((prev) => prev.filter((g) => g.id !== id));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!primaryName.trim()) { toast.error("Vyplň prosím svoje meno."); return; }
    setLoading(true);
    const payload = {
      primaryName,
      phone,
      attending,
      guests: attending === "yes" ? guests.map((g) => ({ name: g.name, attending: g.attending })) : [],
    };
    const r = await submitForm("rsvp", payload);
    setLoading(false);
    if (r.ok) { setSent(true); toast.success("Quest completed! RSVP odoslané ✨"); }
    else toast.error("Nepodarilo sa odoslať. Skús to znova alebo nám napíš.");
  }

  return (
    <Section id="rsvp" level="Level 03" title="Potvrď účasť">
      {sent ? (
        <div className="paper-card p-8 text-center">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[color:var(--turquoise)] text-[color:var(--bordo-deep)]">
            <Check className="h-10 w-10" strokeWidth={3} />
          </div>
          <h3 className="mt-4 font-display text-3xl text-[color:var(--bordo)]">Quest completed</h3>
          <p className="mt-2 font-hand text-xl text-[color:var(--ink)]">
            Ďakujeme! Uložili sme si tvoju odpoveď. Vidíme sa 10.10.2026.
          </p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="paper-card p-6 md:p-8 space-y-5">
          <input type="text" name="hp" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="font-marker text-xs uppercase tracking-wider text-[color:var(--bordo)]">Meno a priezvisko *</label>
              <input
                required value={primaryName} onChange={(e) => updatePrimary(e.target.value)}
                className="mt-1 w-full rounded-md border border-[color:var(--ink)]/30 bg-white/60 px-3 py-2 text-[color:var(--ink)]"
              />
            </div>
            <Field label="Telefón" name="phone" type="tel" value={phone} onChange={(e) => setPhone((e.target as HTMLInputElement).value)} />
          </div>

          <div>
            <label className="font-marker text-xs uppercase tracking-wider text-[color:var(--bordo)]">Prídeš?</label>
            <div className="mt-2 flex gap-2">
              <button
                type="button" onClick={() => setAttending("yes")}
                className={`cursor-pointer rounded-full px-4 py-2 font-marker text-sm uppercase tracking-wide transition ${
                  attending === "yes" ? "bg-[color:var(--turquoise)] text-[color:var(--bordo-deep)]" : "border-2 border-dashed border-[color:var(--ink)]/30 text-[color:var(--ink)] hover:bg-[color:var(--turquoise)]/15"
                }`}
              >Áno, prídem</button>
              <button
                type="button" onClick={() => setAttending("no")}
                className={`cursor-pointer rounded-full px-4 py-2 font-marker text-sm uppercase tracking-wide transition ${
                  attending === "no" ? "bg-[color:var(--destructive)] text-white" : "border-2 border-dashed border-[color:var(--ink)]/30 text-[color:var(--ink)] hover:bg-[color:var(--destructive)]/15"
                }`}
              >Nie, žiaľ neprídem</button>
            </div>
          </div>

          {attending === "yes" && (
            <div>
              <label className="font-marker text-xs uppercase tracking-wider text-[color:var(--bordo)]">Prichádzaš s niekým?</label>
              <p className="mt-1 text-sm text-[color:var(--ink)]/60">Pridaj ďalšieho hosťa. Ku každému označ, či príde.</p>
              <div className="mt-3 space-y-2">
                {plusOnes.map((g) => (
                  <div key={g.id} className="flex flex-wrap items-center gap-2 rounded-md border border-dashed border-[color:var(--ink)]/30 bg-white/40 p-2">
                    <input
                      placeholder="Meno a priezvisko"
                      value={g.name}
                      onChange={(e) => updatePlusOne(g.id, { name: e.target.value })}
                      className="flex-1 min-w-[180px] rounded-md border border-[color:var(--ink)]/30 bg-white/70 px-3 py-2 text-[color:var(--ink)]"
                    />
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => updatePlusOne(g.id, { attending: true })}
                        className={`cursor-pointer rounded-full px-3 py-1.5 text-sm font-marker uppercase ${g.attending ? "bg-[color:var(--turquoise)] text-[color:var(--bordo-deep)]" : "border border-[color:var(--ink)]/30 text-[color:var(--ink)]"}`}
                      >Áno</button>
                      <button
                        type="button"
                        onClick={() => updatePlusOne(g.id, { attending: false })}
                        className={`cursor-pointer rounded-full px-3 py-1.5 text-sm font-marker uppercase ${!g.attending ? "bg-[color:var(--destructive)] text-white" : "border border-[color:var(--ink)]/30 text-[color:var(--ink)]"}`}
                      >Nie</button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removePlusOne(g.id)}
                      className="cursor-pointer rounded-md p-1.5 text-[color:var(--destructive)] hover:bg-[color:var(--destructive)]/10"
                      aria-label="Odstrániť hosťa"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addPlusOne}
                className="cursor-pointer mt-3 inline-flex items-center gap-1.5 rounded-full border-2 border-dashed border-[color:var(--gold)] px-4 py-2 font-marker text-xs uppercase tracking-wide text-[color:var(--bordo)] hover:bg-[color:var(--gold)]/15"
              >
                <Plus className="h-3.5 w-3.5" /> Pridať ďalšieho hosťa
              </button>
            </div>
          )}

          <button
            disabled={loading}
            className="cursor-pointer inline-flex items-center gap-2 rounded-full bg-[color:var(--bordo)] px-6 py-3 font-marker text-sm uppercase tracking-wide text-[color:var(--gold)] disabled:opacity-60"
          >
            <Send className="h-4 w-4" /> {loading ? "Odosielam..." : "Odoslať RSVP"}
          </button>
        </form>
      )}
    </Section>
  );
}

// ============ POKRM ============
type MealChoice = { dish: DishKey | ""; kids: boolean };
function PokrmSection() {
  const { guests } = useGuests();
  const attending = guests.filter((g) => g.attending && g.name.trim());
  const [choices, setChoices] = useState<Record<string, MealChoice>>({});
  const [sent, setSent] = useState(false);

  useEffect(() => {
    setChoices((prev) => {
      const next: Record<string, MealChoice> = {};
      attending.forEach((g) => {
        next[g.id] = prev[g.id] ?? { dish: "", kids: false };
      });
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guests.map((g) => g.id + g.name + g.attending).join("|")]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    for (const g of attending) {
      if (!choices[g.id]?.dish) { toast.error(`Vyber jedlo pre ${g.name}`); return; }
    }
    const r = await submitForm("pokrm", {
      choices: attending.map((g) => ({ name: g.name, ...choices[g.id] })),
    });
    if (r.ok) { setSent(true); toast.success("Power-up vybraný ⚡"); }
    else toast.error("Skús to prosím znova.");
  }

  return (
    <Section id="pokrm" level="Level 04" title="Vyber si pokrm">
      {attending.length === 0 ? (
        <div className="paper-card p-6">
          <p className="font-hand text-xl text-[color:var(--ink)]">
            Najprv vyplň RSVP vyššie — potom pre každého hosťa vyberieš jedlo.
          </p>
          <a href="#rsvp" className="cursor-pointer mt-3 inline-flex items-center gap-2 rounded-full bg-[color:var(--bordo)] px-4 py-2 font-marker text-xs uppercase text-[color:var(--gold)]">
            <Check className="h-4 w-4" /> Prejsť na RSVP
          </a>
        </div>
      ) : sent ? (
        <div className="paper-card p-6 text-center">
          <p className="font-hand text-2xl text-[color:var(--bordo)]">Ďakujeme, máme tvoju voľbu ✨</p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          {attending.map((g) => (
            <div key={g.id} className="paper-card p-4 md:p-5">
              <div className="mb-3 flex items-baseline justify-between gap-3">
                <h3 className="font-display text-2xl text-[color:var(--bordo)]">{g.name}</h3>
                <label className="inline-flex items-center gap-2 font-hand text-lg text-[color:var(--ink)] cursor-pointer">
                  <input
                    type="checkbox" className="h-4 w-4 accent-[color:var(--bordo)]"
                    checked={choices[g.id]?.kids ?? false}
                    onChange={(e) => setChoices((c) => ({ ...c, [g.id]: { ...(c[g.id] ?? { dish: "", kids: false }), kids: e.target.checked } }))}
                  />
                  🍟 detská porcia
                </label>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {DISHES.map((d) => {
                  const picked = choices[g.id]?.dish === d.key;
                  return (
                    <label
                      key={d.key}
                      className={`cursor-pointer rounded-xl border-2 p-3 text-center transition ${
                        picked ? "border-[color:var(--bordo)] bg-[color:var(--gold)]/20"
                               : "border-dashed border-[color:var(--ink)]/30 hover:border-[color:var(--bordo)]"
                      }`}
                    >
                      <input
                        type="radio" name={`meal-${g.id}`} value={d.key} className="sr-only"
                        checked={picked}
                        onChange={() => setChoices((c) => ({ ...c, [g.id]: { ...(c[g.id] ?? { dish: "", kids: false }), dish: d.key } }))}
                      />
                      <div className="text-3xl">{d.emoji}</div>
                      <div className="mt-2 font-hand text-lg text-[color:var(--ink)]">{d.label}</div>
                      <div className="mt-1 text-xs text-[color:var(--ink)]/60">{d.desc}</div>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
          <button className="cursor-pointer inline-flex items-center gap-2 rounded-full bg-[color:var(--bordo)] px-6 py-3 font-marker text-sm uppercase tracking-wide text-[color:var(--gold)]">
            <Send className="h-4 w-4" /> Odoslať výber
          </button>
        </form>
      )}
    </Section>
  );
}

// ============ UBYTOVANIE ============
type Room = {
  id: string;
  type: RoomTypeKey;
  guestId: string; // FK to Guest.id, or "" if custom
  customName?: string;
  cots: number;      // detské postieľky do 3r
  extraBeds: number; // prístelky
  pet: boolean;
};

function roomPrice(r: Room): number {
  const base = ROOM_TYPES.find((t) => t.key === r.type)?.price ?? 0;
  return base + r.cots * COT_PRICE + r.extraBeds * EXTRA_BED_PRICE + (r.pet ? PET_PRICE : 0);
}

function UbytovanieSection() {
  const { guests } = useGuests();
  const attending = guests.filter((g) => g.attending && g.name.trim());
  const [rooms, setRooms] = useState<Room[]>([]);
  const [sent, setSent] = useState(false);

  function addRoom() {
    setRooms((prev) => [...prev, {
      id: uid(), type: "double", guestId: attending[0]?.id ?? "",
      cots: 0, extraBeds: 0, pet: false,
    }]);
  }
  function updateRoom(id: string, patch: Partial<Room>) {
    setRooms((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }
  function removeRoom(id: string) {
    setRooms((prev) => prev.filter((r) => r.id !== id));
  }

  const total = rooms.reduce((s, r) => s + roomPrice(r), 0);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (rooms.length === 0) { toast.error("Pridaj aspoň jednu izbu."); return; }
    const payload = {
      rooms: rooms.map((r) => {
        const g = guests.find((x) => x.id === r.guestId);
        return {
          type: r.type,
          guest: g?.name ?? r.customName ?? "",
          cots: r.cots,
          extraBeds: r.extraBeds,
          pet: r.pet,
          price: roomPrice(r),
        };
      }),
      total,
    };
    const r = await submitForm("ubytovanie", payload);
    if (r.ok) { setSent(true); toast.success("Save point uložený ✨"); }
    else toast.error("Skús to prosím znova.");
  }

  return (
    <Section id="ubytovanie" level="Level 05" title="Zariaď si ubytovanie">
      <p className="max-w-3xl text-[color:var(--paper)]/85 leading-relaxed mb-6">
        Máme predbežne blokované izby v Hoteli Continental na noc <strong>10. → 11. 10. 2026</strong>.
        Naklikaj si izby, ktoré chceš, a ku každej priraď hosťa zo svojho RSVP.
      </p>

      {attending.length === 0 && (
        <div className="paper-card p-4 mb-4">
          <p className="font-hand text-lg text-[color:var(--ink)]">
            Tip: najprv vyplň RSVP — potom môžeš priradiť izbu konkrétnemu hosťovi.
          </p>
        </div>
      )}

      {sent ? (
        <div className="paper-card p-6 text-center">
          <p className="font-hand text-2xl text-[color:var(--bordo)]">Ďakujeme, ozveme sa s potvrdením ✨</p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          {rooms.map((r, idx) => (
            <div key={r.id} className="paper-card p-4 md:p-5">
              <div className="mb-3 flex items-baseline justify-between">
                <h3 className="font-marker text-lg text-[color:var(--bordo)]">Izba #{idx + 1}</h3>
                <button
                  type="button" onClick={() => removeRoom(r.id)}
                  className="cursor-pointer inline-flex items-center gap-1 text-sm text-[color:var(--destructive)] hover:underline"
                >
                  <Trash2 className="h-4 w-4" /> Odstrániť
                </button>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="font-marker text-xs uppercase text-[color:var(--bordo)]">Typ izby</label>
                  <div className="mt-1 grid gap-2">
                    {ROOM_TYPES.map((t) => (
                      <label key={t.key} className={`cursor-pointer flex items-center justify-between gap-2 rounded-md border-2 px-3 py-2 transition ${
                        r.type === t.key ? "border-[color:var(--bordo)] bg-[color:var(--gold)]/15" : "border-dashed border-[color:var(--ink)]/30 hover:border-[color:var(--bordo)]"
                      }`}>
                        <span className="flex items-center gap-2 font-hand text-lg text-[color:var(--ink)]">
                          <input type="radio" name={`type-${r.id}`} className="sr-only" checked={r.type === t.key} onChange={() => updateRoom(r.id, { type: t.key })} />
                          {t.label}
                        </span>
                        <span className="font-marker text-sm text-[color:var(--bordo)]">{t.price.toLocaleString("sk-SK")} Kč / noc</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="font-marker text-xs uppercase text-[color:var(--bordo)]">Izba na</label>
                    {attending.length > 0 ? (
                      <select
                        value={r.guestId}
                        onChange={(e) => updateRoom(r.id, { guestId: e.target.value })}
                        className="mt-1 w-full rounded-md border border-[color:var(--ink)]/30 bg-white/70 px-3 py-2 text-[color:var(--ink)]"
                      >
                        {attending.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                      </select>
                    ) : (
                      <input
                        placeholder="Meno hosťa"
                        value={r.customName ?? ""}
                        onChange={(e) => updateRoom(r.id, { customName: e.target.value })}
                        className="mt-1 w-full rounded-md border border-[color:var(--ink)]/30 bg-white/70 px-3 py-2 text-[color:var(--ink)]"
                      />
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <NumRow label="Detské postieľky (do 3r.)" hint={`${COT_PRICE} Kč`} value={r.cots} onChange={(n) => updateRoom(r.id, { cots: n })} />
                    <NumRow label="Prístelky" hint={`${EXTRA_BED_PRICE} Kč / noc`} value={r.extraBeds} onChange={(n) => updateRoom(r.id, { extraBeds: n })} />
                  </div>

                  <label className="flex cursor-pointer items-center justify-between gap-3 rounded-md border border-[color:var(--ink)]/20 bg-white/40 px-3 py-2 text-[color:var(--ink)]">
                    <span className="font-hand text-lg">🐾 Pes / zviera na izbe</span>
                    <span className="flex items-center gap-2">
                      <span className="font-marker text-xs text-[color:var(--bordo)]">{PET_PRICE} Kč / noc</span>
                      <input type="checkbox" checked={r.pet} onChange={(e) => updateRoom(r.id, { pet: e.target.checked })} className="h-4 w-4 accent-[color:var(--bordo)]" />
                    </span>
                  </label>
                </div>
              </div>

              <div className="mt-3 flex items-baseline justify-end gap-2 border-t border-dashed border-[color:var(--ink)]/20 pt-3">
                <span className="font-hand text-lg text-[color:var(--ink)]/70">Za izbu / noc:</span>
                <span className="font-display text-2xl text-[color:var(--bordo)]">{roomPrice(r).toLocaleString("sk-SK")} Kč</span>
              </div>
            </div>
          ))}

          <button
            type="button" onClick={addRoom}
            className="cursor-pointer inline-flex items-center gap-1.5 rounded-full border-2 border-dashed border-[color:var(--gold)] px-4 py-2 font-marker text-xs uppercase tracking-wide text-[color:var(--gold)] hover:bg-[color:var(--gold)]/15"
          >
            <Plus className="h-3.5 w-3.5" /> Pridať {rooms.length === 0 ? "izbu" : "ďalšiu izbu"}
          </button>

          {rooms.length > 0 && (
            <div className="rounded-lg border-2 border-dashed border-[color:var(--gold)] bg-[color:var(--gold)]/10 p-4">
              <p className="font-marker text-xs uppercase text-[color:var(--bordo)]">Predbežná kalkulácia</p>
              <p className="font-display text-4xl text-[color:var(--bordo)]">{total.toLocaleString("sk-SK")} Kč</p>
              <p className="text-xs text-[color:var(--ink)]/70">
                Za noc 10. → 11. 10. 2026. Mestská daň {CITY_TAX} Kč / osoba / noc bude pripočítaná hotelom pri check-ine.
              </p>
            </div>
          )}

          {rooms.length > 0 && (
            <button className="cursor-pointer inline-flex items-center gap-2 rounded-full bg-[color:var(--bordo)] px-6 py-3 font-marker text-sm uppercase tracking-wide text-[color:var(--gold)]">
              <Send className="h-4 w-4" /> Odoslať rezerváciu
            </button>
          )}
        </form>
      )}

      <div className="mt-6 rounded-lg border-2 border-dashed border-[color:var(--turquoise)]/60 bg-[color:var(--turquoise)]/5 p-4">
        <p className="font-marker text-xs uppercase text-[color:var(--turquoise)]">Pozor</p>
        <ul className="mt-2 space-y-1 font-hand text-lg text-[color:var(--paper)]/90">
          <li>· Parkovanie v hoteli: {PARKING_PRICE} Kč / noc (platí sa priamo na recepcii).</li>
          <li>· Raňajky sú v cene každej izby.</li>
          <li>· Chceš zostať dlhšie? Pokojne — ale <strong>predĺženie rieš priamo s hotelom až po svadbe</strong>. Pred termínom je v Brne veľtrh a hotel býva plný, chceme mať istotu, že naši hostia sa zmestia.</li>
        </ul>
      </div>
    </Section>
  );
}

function NumRow({ label, hint, value, onChange }: { label: string; hint?: string; value: number; onChange: (n: number) => void }) {
  return (
    <div className="rounded-md border border-[color:var(--ink)]/20 bg-white/40 p-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-hand text-sm text-[color:var(--ink)]">{label}</span>
        {hint && <span className="font-marker text-[10px] uppercase text-[color:var(--bordo)]">{hint}</span>}
      </div>
      <div className="mt-1 flex items-center gap-1">
        <button type="button" onClick={() => onChange(Math.max(0, value - 1))} className="cursor-pointer h-7 w-7 rounded border border-[color:var(--ink)]/30 text-[color:var(--ink)] hover:bg-[color:var(--ink)]/10">–</button>
        <input
          type="number" min={0} value={value} onChange={(e) => onChange(Math.max(0, Number(e.target.value)))}
          className="w-14 rounded-md border border-[color:var(--ink)]/30 bg-white/70 px-2 py-1 text-center text-[color:var(--ink)]"
        />
        <button type="button" onClick={() => onChange(value + 1)} className="cursor-pointer h-7 w-7 rounded border border-[color:var(--ink)]/30 text-[color:var(--ink)] hover:bg-[color:var(--ink)]/10">+</button>
      </div>
    </div>
  );
}

// ============ DRESSCODE (Tetris palette) ============
function DresscodeSection() {
  const palette = [
    { c: "#3a1418", name: "bordová" },
    { c: "#8b1e1e", name: "vínová" },
    { c: "#c8942c", name: "horčicová" },
    { c: "#f5c542", name: "zlatá" },
    { c: "#4bb3a7", name: "tyrkysová" },
    { c: "#c78bbf", name: "púdrová" },
    { c: "#2a3a2a", name: "tmavozelená" },
    { c: "#1c1c22", name: "grafitová" },
  ];
  // Tetris block shapes (offsets in a 4x4 grid)
  return (
    <Section id="dresscode" level="Level 06" title="Dresscode: elegantne, ale nebrať sa vážne">
      <p className="max-w-3xl text-[color:var(--paper)]/85 leading-relaxed mb-6">
        Príďte slávnostne, pohodlne a tak, aby ste sa cítili dobre.
        Farebná paleta je jesenne bordovo-zlato-tyrkysová — inšpirácia, nie povinnosť.
      </p>

      <div className="paper-card p-5 mb-6">
        <p className="font-marker text-xs uppercase text-[color:var(--bordo)] mb-3">Farebná paleta (tetris)</p>
        <div className="flex flex-wrap items-end gap-3">
          {palette.map((p, i) => {
            const heights = [2, 3, 1, 2, 3, 1, 2, 2];
            const h = heights[i % heights.length];
            return (
              <div key={p.c} className="text-center">
                <div className="flex flex-col-reverse gap-[2px]">
                  {Array.from({ length: h }).map((_, k) => (
                    <div
                      key={k}
                      className="h-8 w-14 rounded-[2px] shadow-[inset_0_-6px_0_rgba(0,0,0,0.25),inset_0_6px_0_rgba(255,255,255,0.15)]"
                      style={{ background: p.c }}
                    />
                  ))}
                </div>
                <p className="mt-1 font-hand text-xs text-[color:var(--ink)]">{p.name}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="paper-card p-6">
          <h3 className="font-marker text-xl text-[color:var(--turquoise)] mb-3">✅ Do&apos;s</h3>
          <ul className="space-y-2 font-hand text-lg text-[color:var(--ink)]">
            <li>· Slávnostné oblečenie</li>
            <li>· Pohodlné topánky na tanec</li>
            <li>· Jesenné tóny a vlastná osobnosť vítané</li>
            <li>· Doplnky, čo sa hodia k paletke vyššie</li>
          </ul>
        </div>
        <div className="paper-card p-6">
          <h3 className="font-marker text-xl text-[color:var(--destructive)] mb-3">🚫 Don&apos;ts</h3>
          <ul className="space-y-2 font-hand text-lg text-[color:var(--ink)]">
            <li>· Biele šaty (ak nie si nevesta)</li>
            <li>· Tepláky</li>
            <li>· Výrazné vzory, ktoré prekričia obrad — ideálne bez veľkých kvetinových či jednofarebne krikľavých motívov</li>
            <li>· Outfit, v ktorom nevydržíš tancovať</li>
          </ul>
        </div>
      </div>
    </Section>
  );
}

// ============ DARY ============
function DarySection() {
  return (
    <Section id="dary" level="Level 07" title="Loot & kytice">
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="paper-card p-6 md:p-8">
          <p className="font-hand text-2xl text-[color:var(--bordo)] mb-4">
            Najväčším darom je pre nás to, že prídeš osláviť náš deň.
          </p>
          <p className="text-[color:var(--ink)]/80 leading-relaxed">
            Ak by si nás predsa len chcel/a niečím potešiť, viac než vecné dary oceníme
            finančný príspevok na spoločný štart do manželstva.
          </p>
          <div className="mt-6 rounded-lg border-2 border-dashed border-[color:var(--blush)] p-4">
            <p className="font-marker text-sm uppercase text-[color:var(--bordo)]">💐 Kvety</p>
            <p className="mt-1 font-hand text-lg text-[color:var(--ink)]">
              Aby kvety neskončili smutne v kúte, budeme radi, ak to obmedzíme
              maximálne na jeden kvet na osobu.
            </p>
          </div>
        </div>
        <div className="paper-card p-5 rotate-1">
          <p className="font-marker text-xs uppercase text-[color:var(--bordo)]">Voliteľný fast travel pre dar</p>
          <p className="mt-1 font-hand text-lg text-[color:var(--ink)]/80">
            Pre tých, ktorí majú radšej rýchly checkout než obálkový inventory.
          </p>
          <div className="mt-3 grid place-items-center">
            <img src={CONFIG.qrPayment} alt="QR kód pre platbu" className="h-40 w-40 rounded-md" />
          </div>
          <p className="mt-2 text-center text-xs text-[color:var(--ink)]/60">QR placeholder</p>
        </div>
      </div>
    </Section>
  );
}

// ============ DEŇ ============
function DenSection() {
  const items = [
    { icon: "🎶", title: "Tanči do rána", txt: "Playlist bude legendárny — od svadobných klasík po playlist našich 30-tky." },
    { icon: "🥂", title: "Ochutnaj a doprajte si", txt: "Kumst rozumie chuti aj mierke. Nechajte sa viesť menu." },
    { icon: "🎭", title: "Prines hravú náladu", txt: "Máme pripravené drobné questy a rekvizity, ktoré čakajú na svojich hrdinov." },
    { icon: "💌", title: "Tvor spomienky", txt: "Zoznám sa s niekým novým, urob si spoločný záber, napíš nám odkaz do knihy." },
    { icon: "🌙", title: "Ostaň, kým vládzeš", txt: "Dozvuky sú vlastne bonus level. Nikto ťa nevyhodí." },
  ];
  return (
    <Section id="den" level="Level 08" title="Uži si náš deň">
      <div className="paper-card p-6 md:p-10 relative overflow-hidden">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-[color:var(--turquoise)]/30 blur-2xl" />
        <div className="absolute -left-8 -bottom-8 h-40 w-40 rounded-full bg-[color:var(--blush)]/30 blur-2xl" />
        <div className="relative grid gap-6 md:grid-cols-3">
          {items.map((c) => (
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
    <Section id="fotky" level="Level 09" title="Zdieľaj s nami svoje zábery">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="paper-card p-6">
          <p className="font-hand text-2xl text-[color:var(--bordo)]">
            Ideálne bude, ak si celý deň užijete <em>bez telefónu v ruke</em>.
          </p>
          <p className="mt-2 text-[color:var(--ink)]/80 leading-relaxed">
            Ale ak sa vám do galérie predsa len zatúla nejaký zázračný záber,
            budeme veľmi radi, ak sa oň s nami podelíte. Zbierame všetko na jedno miesto,
            aby sme si potom mohli poskladať kompletný recap.
          </p>
          <a
            href={CONFIG.photoUploadUrl}
            className="cursor-pointer mt-5 inline-flex items-center gap-2 rounded-full bg-[color:var(--bordo)] px-6 py-3 font-marker text-sm uppercase tracking-wide text-[color:var(--gold)]"
          >
            <Camera className="h-4 w-4" /> Nahrať fotky
          </a>
        </div>
        <div className="paper-card p-6 text-center">
          <p className="font-marker text-xs uppercase text-[color:var(--bordo)]">Alebo naskenuj</p>
          <div className="mt-3 grid place-items-center">
            <img src={CONFIG.qrPhotos} alt="QR kód na nahrávanie fotiek" className="h-48 w-48 rounded-md" />
          </div>
          <p className="mt-3 font-hand text-lg text-[color:var(--ink)]/70">QR placeholder</p>
        </div>
      </div>
    </Section>
  );
}

// ============ FAQ (NPC) ============
const FAQ = [
  { q: "Kedy máme prísť?", a: "Zraz je o 14:00 na Moravském náměstí. Obrad začína o 15:30 v Kostole sv. Jakuba — príďte s 15 min rezervou." },
  { q: "Kde je obrad?", a: "Kostol sv. Jakuba v Brne. Odkaz na Google Maps nájdeš v sekcii „Naplánuj si cestu“." },
  { q: "Kde zaparkovať?", a: "V Hoteli Continental je platené parkovanie (390 Kč / noc). V okolí Kumstu a kostola sú platené zóny — ideálne dôjsť MHD alebo taxi." },
  { q: "Ako sa dostanem z hotela na obrad?", a: "Peši ~10 min, alebo električkou č. 4 dve zastávky. V programe dňa máme trať aj vyznačenú." },
  { q: "Aký je dresscode?", a: "Slávnostne a pohodlne. Jesenná paleta bordová/zlatá/tyrkysová vítaná — nie povinná." },
  { q: "Môžem si vziať deti?", a: "Deti sú srdečne vítané. V RSVP ich pridaj ako ďalších hostí a v sekcii Pokrm im vyber detskú porciu." },
  { q: "Môžem prísť s partnerom/kou?", a: "Áno, v RSVP formulári vieš pridať ďalšieho hosťa. Kvôli miestam ideálne potvrď včas." },
  { q: "Môžem vziať psa?", a: "Do hotela áno (500 Kč / noc). Na obrad a hostinu radšej nie — bude tam hlučno a rušno." },
  { q: "Ako funguje ubytovanie?", a: "V Hoteli Continental máme predbežne blokované izby na noc 10. → 11.10. V sekcii Ubytovanie si nakliká typ izby a hostí, pošleme hotelu." },
  { q: "Chcem zostať dlhšie, dá sa?", a: "Áno, ale predĺženie rieš priamo s hotelom AŽ PO svadbe. Pred termínom je v Brne veľtrh a hotel býva plný." },
  { q: "Sú raňajky v cene?", a: "Áno, každá izba má raňajky v cene." },
  { q: "Aké je menu?", a: "Vyberáš z 3 jedál (sviečková, kuracie supreme, vegetariánske rizoto) + detská porcia. Alergie prosíme spomeň priamo Natálii/Otovi." },
  { q: "Bude polievka?", a: "Áno, jedna spoločná — netreba nič vyberať." },
  { q: "Bude bar?", a: "Áno — od uvítacieho aperitívu až po dozvuky. Rátaj s tým." },
  { q: "Do koľkých budeme hrať?", a: "Oficiálny program končí okolo 02:00, ale ak budeš vládať, nikto ťa nevyháňa." },
  { q: "Aký dar sa hodí?", a: "Najradšej finančný príspevok. Detaily v sekcii Loot & kytice, QR nájdeš tam." },
  { q: "Máme vziať kyticu?", a: "Ideálne max. jeden kvet na osobu, aby to nekončilo smutne v kúte." },
  { q: "Kam nahrať fotky?", a: "Do našej spoločnej galérie cez tlačidlo alebo QR kód v sekcii Fotky. Zvládni to pokojne až po víkende." },
  { q: "Môžem na svadbe fotiť?", a: "Radšej si to celé uži naživo. Ak však spravíš niečo krásne — pošli nám to potom." },
  { q: "Ako sa mám ozvať, ak niečo neviem?", a: "Napíš alebo zavolaj Natálii alebo Otovi — kontakty sú v pätičke stránky." },
];

function FaqSection() {
  const [messages, setMessages] = useState<{ role: "bot" | "user"; text: string }[]>([
    { role: "bot", text: "Ahoj, som svadobný NPC poradca 🧙 Vyber otázku vľavo — máme ich viac, len skroluj." },
  ]);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  function ask(item: (typeof FAQ)[number]) {
    setMessages((m) => [...m, { role: "user", text: item.q }, { role: "bot", text: item.a }]);
    setTimeout(() => scrollRef.current?.scrollTo({ top: 99999, behavior: "smooth" }), 50);
  }

  return (
    <Section id="faq" level="Level 10" title="Svadobný NPC poradca">
      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="paper-card p-4 flex flex-col h-[500px]">
          <p className="mb-3 font-marker text-sm uppercase text-[color:var(--bordo)]">Vyber otázku · {FAQ.length}</p>
          <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-1.5">
            {FAQ.map((f) => (
              <button
                key={f.q}
                onClick={() => ask(f)}
                className="cursor-pointer rounded-md border border-dashed border-[color:var(--ink)]/30 bg-white/40 px-3 py-2 text-left font-hand text-lg text-[color:var(--ink)] hover:bg-[color:var(--gold)]/20 transition"
              >
                <HelpCircle className="mr-2 inline h-4 w-4 text-[color:var(--bordo)]" />
                {f.q}
              </button>
            ))}
          </div>
        </div>
        <div className="paper-card flex h-[500px] flex-col p-4">
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto pr-2">
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
        </div>
      </div>
    </Section>
  );
}

// ============ BRNO TIPS ============
const BRNO = [
  { emoji: "🏛️", title: "Vila Tugendhat", txt: "UNESCO ikona modernej architektúry. Vstupenky rezervuj vopred." },
  { emoji: "🍺", title: "Lokál U Caipla / Bar, který neexistuje", txt: "Klasika a späť. Jedno pre jedlo, druhé pre koktaily." },
  { emoji: "🏰", title: "Špilberk", txt: "Hrad s výhľadom na celé Brno. Ideálne popoludňajšie decko-friendly kolečko." },
  { emoji: "🎨", title: "Moravská galerie", txt: "Umenie od gotiky po dizajn 20. storočia — jedna z najlepších v ČR." },
  { emoji: "☕", title: "Café Podnebí / SKØG", txt: "Lokálna kávová scéna. Sadni si a nikam sa neponáhľaj." },
  { emoji: "🌳", title: "Denisove sady", txt: "Park s panorámou. Krásne za slnka, ešte krajšie za západu." },
];

function BrnoSection() {
  return (
    <Section id="brno" level="Level 11" title="Poznaj Brno">
      <p className="max-w-3xl text-[color:var(--paper)]/85 leading-relaxed mb-6">
        Ak zostanete v Brne dlhšie (odporúčame), tu je pár tipov, čo sa oplatí.
        Budeme priebežne dopĺňať — pokojne nám pošlite vlastné návrhy.
      </p>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {BRNO.map((b, i) => (
          <div key={b.title} className="paper-card p-5" style={{ transform: `rotate(${(i % 2 ? 0.5 : -0.5)}deg)` }}>
            <div className="text-3xl">{b.emoji}</div>
            <h3 className="mt-2 font-display text-2xl text-[color:var(--bordo)]">{b.title}</h3>
            <p className="mt-1 font-hand text-lg text-[color:var(--ink)]">{b.txt}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ============ FOOTER ============
function Footer() {
  return (
    <footer className="snap-section mt-8 border-t-2 border-dashed border-[color:var(--gold)]/30 pt-8 pb-16 text-center">
      <p className="font-marker text-lg text-[color:var(--gold)]">
        Natália &amp; Oto · 10.10.2026 · Brno
      </p>
      <p className="mt-2 font-hand text-lg text-[color:var(--paper)]/60">
        End of quest log · vidíme sa čoskoro ❤️
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-6 text-sm text-[color:var(--paper)]/70">
        <a className="hover:text-[color:var(--gold)]" href={`tel:${CONFIG.contacts.natalia.phone.replace(/\s/g, "")}`}>
          <Phone className="inline h-3.5 w-3.5 mr-1" /> Natália {CONFIG.contacts.natalia.phone}
        </a>
        <a className="hover:text-[color:var(--gold)]" href={`tel:${CONFIG.contacts.oto.phone.replace(/\s/g, "")}`}>
          <Phone className="inline h-3.5 w-3.5 mr-1" /> Oto {CONFIG.contacts.oto.phone}
        </a>
        <a className="hover:text-[color:var(--gold)]" href={`mailto:${CONFIG.contacts.natalia.email}`}>
          <Mail className="inline h-3.5 w-3.5 mr-1" /> {CONFIG.contacts.natalia.email}
        </a>
      </div>
    </footer>
  );
}

// ============ FORM PRIMITIVES ============
function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const { label, ...rest } = props;
  return (
    <div>
      <label className="font-marker text-xs uppercase tracking-wider text-[color:var(--bordo)]">{label}</label>
      <input
        {...rest}
        className="mt-1 w-full rounded-md border border-[color:var(--ink)]/30 bg-white/60 px-3 py-2 text-[color:var(--ink)] placeholder:text-[color:var(--ink)]/40 focus:outline-none focus:ring-2 focus:ring-[color:var(--gold)]"
      />
    </div>
  );
}
