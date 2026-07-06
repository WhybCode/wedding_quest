import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast, Toaster } from "sonner";
import {
  Heart, MapPin, Calendar as CalendarIcon, Music, Utensils, Sparkles,
  Camera, Gift, Shirt, HelpCircle, Phone, Mail, Check, ChevronDown,
  ChevronRight, Send, Bot, User as UserIcon, Download, ExternalLink,
} from "lucide-react";

export const Route = createFileRoute("/")({ component: WeddingSite });

// ============ CONFIG (easy to edit) ============
const CONFIG = {
  brideName: "Natália",
  groomName: "Oto",
  dateISO: "2026-10-10T14:00:00+02:00",
  dateHuman: "10.10.2026",
  city: "Brno, Česká republika",
  // Nahraď reálnym endpointom (Formspree / Getform / Basin / Google Forms)
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
  photoUploadUrl: "#", // Google Drive / WedUploader link
};

// ============ CHECKLIST ============
const SECTIONS = [
  { id: "rsvp", label: "Potvrď účasť", icon: Check },
  { id: "hero", label: "Poznač si termín", icon: CalendarIcon },
  { id: "program", label: "Naplánuj si deň", icon: MapPin },
  { id: "ubytovanie", label: "Zariaď si ubytovanie", icon: Sparkles },
  { id: "pokrm", label: "Vyber si pokrm", icon: Utensils },
  { id: "dresscode", label: "Nachystaj si dresscode", icon: Shirt },
  { id: "dary", label: "Priprav dar", icon: Gift },
  { id: "den", label: "Uži si náš deň", icon: Music },
  { id: "fotky", label: "Zdieľaj s nami fotky", icon: Camera },
  { id: "kontakt", label: "Kontakt", icon: Phone },
];

function WeddingSite() {
  const [visited, setVisited] = useState<Set<string>>(new Set(["hero"]));
  const [active, setActive] = useState<string>("hero");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const id = e.target.id;
            setActive(id);
            setVisited((prev) => new Set(prev).add(id));
          }
        });
      },
      { rootMargin: "-40% 0px -50% 0px" }
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setMobileOpen(false);
  };

  const progress = Math.round((visited.size / SECTIONS.length) * 100);

  return (
    <div className="relative min-h-screen">
      <Toaster position="top-center" richColors />
      <PaperTexture />

      {/* Mobile progress bar */}
      <MobileChecklist
        open={mobileOpen}
        onToggle={() => setMobileOpen((o) => !o)}
        visited={visited}
        active={active}
        onPick={scrollTo}
        progress={progress}
      />

      <div className="mx-auto max-w-[1400px] px-4 pt-16 lg:pt-8 lg:pr-[340px]">
        <HeroSection />
        <ProgramSection />
        <LokacieSection />
        <RsvpSection />
        <UbytovanieSection />
        <PokrmSection />
        <DresscodeSection />
        <DarySection />
        <DenSection />
        <FotkySection />
        <FaqSection />
        <KontaktSection />
        <Footer />
      </div>

      {/* Desktop sidebar checklist */}
      <DesktopChecklist visited={visited} active={active} onPick={scrollTo} progress={progress} />
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
function ChecklistItem({
  s, done, active, onPick, index,
}: {
  s: (typeof SECTIONS)[number];
  done: boolean; active: boolean; index: number;
  onPick: (id: string) => void;
}) {
  return (
    <button
      onClick={() => onPick(s.id)}
      className={`group flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors ${
        active ? "bg-[color:var(--gold)]/15" : "hover:bg-[color:var(--ink)]/5"
      }`}
    >
      <span
        className={`grid h-6 w-6 shrink-0 place-items-center rounded border-2 ${
          done ? "border-[color:var(--turquoise)] bg-[color:var(--turquoise)]/20" : "border-[color:var(--ink)]/40"
        }`}
        style={{ transform: done ? "rotate(-3deg)" : "none" }}
      >
        {done && (
          <svg viewBox="0 0 20 20" className="h-5 w-5 text-[color:var(--bordo-deep)]">
            <path d="M3 11 L8 15 L17 4" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span className="font-hand text-lg leading-tight text-[color:var(--ink)]" style={{ textDecoration: done ? "line-through" : "none" }}>
        <span className="opacity-50 mr-1">{String(index + 1).padStart(2, "0")}.</span>
        {s.label}
      </span>
      {active && <ChevronRight className="ml-auto h-4 w-4 text-[color:var(--bordo)]" />}
    </button>
  );
}

function DesktopChecklist({
  visited, active, onPick, progress,
}: {
  visited: Set<string>; active: string; progress: number;
  onPick: (id: string) => void;
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
          <div
            className="h-full rounded-full bg-[color:var(--turquoise)] transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="space-y-0.5 overflow-y-auto pr-1" style={{ maxHeight: "calc(100% - 100px)" }}>
          {SECTIONS.map((s, i) => (
            <ChecklistItem
              key={s.id} s={s} index={i}
              done={visited.has(s.id)} active={active === s.id}
              onPick={onPick}
            />
          ))}
        </div>
      </div>
    </aside>
  );
}

function MobileChecklist({
  open, onToggle, visited, active, onPick, progress,
}: {
  open: boolean; onToggle: () => void;
  visited: Set<string>; active: string; progress: number;
  onPick: (id: string) => void;
}) {
  return (
    <div className="fixed inset-x-0 top-0 z-40 lg:hidden">
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 border-b border-[color:var(--gold)]/30 bg-[color:var(--bordo-deep)]/95 px-4 py-2.5 backdrop-blur"
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
          {SECTIONS.map((s, i) => (
            <ChecklistItem
              key={s.id} s={s} index={i}
              done={visited.has(s.id)} active={active === s.id}
              onPick={onPick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============ Section wrapper ============
function Section({
  id, chapter, title, children,
}: { id: string; chapter: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 py-16 lg:py-24">
      <div className="mb-8 flex items-end gap-4">
        <span className="font-marker text-sm uppercase tracking-widest text-[color:var(--turquoise)]">
          {chapter}
        </span>
        <div className="h-px flex-1 border-t-2 border-dashed border-[color:var(--gold)]/40" />
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
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
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

function HeroSection() {
  const c = useCountdown(CONFIG.dateISO);
  return (
    <section id="hero" className="scroll-mt-24 pt-8 lg:pt-16 pb-12">
      <div className="mb-4 flex items-center gap-3">
        <span className="font-marker text-xs uppercase tracking-widest text-[color:var(--turquoise)]">
          Prológ · Chapter 00
        </span>
      </div>
      <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr] items-center">
        <div>
          <p className="font-hand text-2xl text-[color:var(--gold)] mb-2">
            Zdá sa, že si bol/a pozvaný/á na svadbu.
          </p>
          <h1 className="font-display text-6xl md:text-8xl lg:text-9xl leading-[0.9] text-[color:var(--paper)]">
            <span className="italic">Natália</span>
            <span className="block font-hand text-5xl md:text-7xl text-[color:var(--blush)] my-2">&amp;</span>
            <span className="italic">Oto</span>
          </h1>
          <div className="ticker-line my-6 max-w-xl" />
          <p className="max-w-xl text-lg text-[color:var(--paper)]/80 leading-relaxed">
            Spúšťame náš najväčší co-op quest a veľmi chceme, aby si bol/a pri tom.
            Ulož si dátum, prejdi checklist a daj nám vedieť, či sa vidíme na tanečnom parkete.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#rsvp"
              className="inline-flex items-center gap-2 rounded-full bg-[color:var(--gold)] px-6 py-3 font-marker text-sm uppercase tracking-wide text-[color:var(--bordo-deep)] shadow-[0_6px_0_-2px_rgba(0,0,0,0.4)] hover:translate-y-0.5 hover:shadow-[0_4px_0_-2px_rgba(0,0,0,0.4)] transition"
            >
              <Heart className="h-4 w-4" /> Potvrdzujem účasť
            </a>
            <button
              onClick={downloadIcs}
              className="inline-flex items-center gap-2 rounded-full border-2 border-dashed border-[color:var(--turquoise)] px-6 py-3 font-hand text-lg text-[color:var(--turquoise)] hover:bg-[color:var(--turquoise)]/10 transition"
            >
              <Download className="h-4 w-4" /> Pridať do kalendára
            </button>
            <a
              href="#program"
              className="inline-flex items-center gap-2 rounded-full border-2 border-dashed border-[color:var(--blush)] px-6 py-3 font-hand text-lg text-[color:var(--blush)] hover:bg-[color:var(--blush)]/10 transition"
            >
              <MapPin className="h-4 w-4" /> Pozrieť program
            </a>
          </div>

          <div className="mt-6 flex flex-wrap gap-2 text-sm">
            <a className="underline text-[color:var(--paper)]/70 hover:text-[color:var(--gold)]" target="_blank" rel="noreferrer" href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=Svadba+Nat%C3%A1lia+%26+Oto&dates=20261010T120000Z/20261011T000000Z&location=Brno&details=Co-op+quest`}>Google Calendar</a>
            <span className="text-[color:var(--paper)]/40">·</span>
            <button onClick={downloadIcs} className="underline text-[color:var(--paper)]/70 hover:text-[color:var(--gold)]">Apple / Outlook (.ics)</button>
          </div>
        </div>

        <div className="relative">
          <div className="paper-card relative mx-auto max-w-sm p-6 rotate-2">
            <div className="tape" />
            <p className="font-marker text-xs uppercase tracking-widest text-[color:var(--bordo)]">Save the date</p>
            <div className="mt-3 text-center">
              <p className="font-hand text-2xl text-[color:var(--ink)]/70">Október</p>
              <p className="font-display text-8xl leading-none text-[color:var(--bordo)]">10</p>
              <p className="font-hand text-3xl text-[color:var(--ink)]">2026</p>
              <div className="mt-3 flex justify-center">
                <Heart className="h-6 w-6 fill-[color:var(--blush)] text-[color:var(--bordo)]" />
              </div>
              <p className="mt-2 font-hand text-xl text-[color:var(--ink)]/70">{CONFIG.city}</p>
            </div>
            <MiniCalendar />
          </div>
        </div>
      </div>

      <div className="mt-10 grid grid-cols-4 gap-3 max-w-2xl">
        {[
          { l: "dní", v: c.days },
          { l: "hodín", v: c.hours },
          { l: "minút", v: c.minutes },
          { l: "sekúnd", v: c.seconds },
        ].map((x) => (
          <div key={x.l} className="paper-card p-3 text-center -rotate-1 even:rotate-1">
            <div className="font-display text-3xl md:text-4xl text-[color:var(--bordo)]">
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
  // October 2026: 1st = Thursday
  const startDay = 4; // Thu (Mon=1)
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
            <div key={i} className={`aspect-square grid place-items-center rounded ${is10 ? "bg-[color:var(--bordo)] text-[color:var(--gold)] font-bold" : "text-[color:var(--ink)]/80"}`}>
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

// ============ PROGRAM ============
const PROGRAM = [
  { time: "10:00", title: "Výjazd z domu", icon: "🚗", place: null, url: null },
  { time: "13:00", title: "Check-in v hoteli", icon: "🛏️", place: "Hotel Continental", url: CONFIG.maps.hotel },
  { time: "14:00", title: "Zraz", icon: "👋", place: "Moravské náměstí", url: CONFIG.maps.zraz },
  { time: "15:30", title: "Obrad", icon: "💍", place: "Kostol sv. Jakuba", url: CONFIG.maps.kostol },
  { time: "17:30", title: "Hostina", icon: "🍽️", place: "Kumst", url: CONFIG.maps.kumst },
  { time: "18:30", title: "Prvý tanec", icon: "💃", place: null, url: null },
  { time: "22:00", title: "Raut", icon: "🍕", place: null, url: null },
  { time: "02:00", title: "Dozvuky", icon: "🌙", place: null, url: null },
];

function ProgramSection() {
  return (
    <Section id="program" chapter="Chapter 01" title="Program dňa">
      <p className="font-hand text-2xl text-[color:var(--gold)] mb-8 max-w-2xl">
        Level 10.10.2026 má viac checkpointov. Tu je mapa, aby si neskončil/a v side queste v zlom bare.
      </p>

      <ol className="relative space-y-6">
        <div className="absolute left-6 top-2 bottom-2 w-0.5 border-l-2 border-dashed border-[color:var(--gold)]/50" />
        {PROGRAM.map((p, i) => (
          <li key={i} className="relative pl-16">
            <span className="absolute left-0 top-1 grid h-12 w-12 place-items-center rounded-full bg-[color:var(--gold)] text-2xl shadow-lg" style={{ transform: `rotate(${(i % 2 ? 1 : -1) * 4}deg)` }}>
              {p.icon}
            </span>
            <div className="paper-card p-4">
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="font-marker text-lg text-[color:var(--bordo)]">{p.time}</span>
                <h3 className="font-display text-2xl text-[color:var(--ink)]">{p.title}</h3>
              </div>
              {p.place && (
                <p className="mt-1 font-hand text-lg text-[color:var(--ink)]/70">📍 {p.place}</p>
              )}
              {p.url && (
                <a href={p.url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm text-[color:var(--bordo)] underline">
                  Otvoriť v Google Maps <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}

// ============ LOKÁCIE ============
const LOKACIE = [
  { name: "Hotel Continental", desc: "Ubytovanie & check-in. Naša štartovacia zóna.", addr: "Brno – adresa placeholder", url: CONFIG.maps.hotel },
  { name: "Kostol sv. Jakuba", desc: "Obrad. Prosíme, príďte s 15 min rezervou.", addr: "Jakubské náměstí, Brno", url: CONFIG.maps.kostol },
  { name: "Kumst", desc: "Hostina, prvý tanec, raut a dozvuky.", addr: "Brno – adresa placeholder", url: CONFIG.maps.kumst },
];

function LokacieSection() {
  return (
    <Section id="lokacie" chapter="Chapter 02" title="Lokácie">
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
              className="mt-3 inline-flex items-center gap-1 rounded-full border border-[color:var(--bordo)] px-3 py-1.5 text-sm text-[color:var(--bordo)] hover:bg-[color:var(--bordo)] hover:text-[color:var(--paper)] transition"
            >
              Navigovať v Google Maps <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        ))}
      </div>

      <div className="paper-card mt-8 p-4">
        <p className="font-hand text-xl text-[color:var(--ink)] mb-3">🗺️ Spoločná mapa</p>
        <div className="grid aspect-[16/7] place-items-center rounded-md bg-gradient-to-br from-[color:var(--turquoise)]/40 via-[color:var(--gold)]/20 to-[color:var(--blush)]/40">
          <p className="font-marker text-lg text-[color:var(--bordo)]">Google Maps embed placeholder</p>
        </div>
      </div>
    </Section>
  );
}

// ============ FORM UTILITIES ============
async function submitForm(formName: string, data: Record<string, unknown>) {
  // Honeypot
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

// ============ RSVP ============
function RsvpSection() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [attending, setAttending] = useState("yes");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = Object.fromEntries(fd.entries());
    if (!data.name || !data.email) {
      toast.error("Vyplň prosím meno a e-mail.");
      return;
    }
    setLoading(true);
    const r = await submitForm("rsvp", data);
    setLoading(false);
    if (r.ok) {
      setSent(true);
      toast.success("Quest completed! RSVP odoslané ✨");
    } else {
      toast.error("Nepodarilo sa odoslať. Skús to znova alebo nám napíš.");
    }
  }

  if (sent) {
    return (
      <Section id="rsvp" chapter="Chapter 03" title="Potvrď účasť">
        <div className="paper-card p-8 text-center">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[color:var(--turquoise)] text-[color:var(--bordo-deep)]">
            <Check className="h-10 w-10" strokeWidth={3} />
          </div>
          <h3 className="mt-4 font-display text-3xl text-[color:var(--bordo)]">Quest completed</h3>
          <p className="mt-2 font-hand text-xl text-[color:var(--ink)]">
            Ďakujeme! Uložili sme si tvoju odpoveď. Uvidíme sa 10.10.2026.
          </p>
        </div>
      </Section>
    );
  }

  return (
    <Section id="rsvp" chapter="Chapter 03" title="Potvrď účasť">
      <p className="font-hand text-2xl text-[color:var(--gold)] mb-8 max-w-2xl">
        Bez potvrdenia účasti sa quest log neuloží. Prosíme, daj nám vedieť čo najskôr.
      </p>
      <form onSubmit={onSubmit} className="paper-card p-6 md:p-8 space-y-5">
        <input type="text" name="hp" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Meno a priezvisko *" name="name" required />
          <Field label="E-mail *" name="email" type="email" required />
          <Field label="Telefón" name="phone" type="tel" />
          <div>
            <label className="font-marker text-xs uppercase tracking-wider text-[color:var(--bordo)]">Prídeš?</label>
            <select
              name="attending" value={attending} onChange={(e) => setAttending(e.target.value)}
              className="mt-1 w-full rounded-md border border-[color:var(--ink)]/30 bg-white/60 px-3 py-2 text-[color:var(--ink)]"
            >
              <option value="yes">Áno, prídem</option>
              <option value="no">Nie, žiaľ neprídem</option>
              <option value="maybe">Ešte neviem</option>
            </select>
          </div>
          <Field label="Počet osôb" name="guests" type="number" defaultValue="1" min="1" />
          <Field label="Počet detí" name="children" type="number" defaultValue="0" min="0" />
        </div>
        <Field label="Mená ďalších osôb" name="others" placeholder="Meno 1, Meno 2, ..." />
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="font-marker text-xs uppercase tracking-wider text-[color:var(--bordo)]">Prídu s tebou zvieratá?</label>
            <div className="mt-2 flex gap-4 text-[color:var(--ink)]">
              <label className="inline-flex items-center gap-2"><input type="radio" name="pets" value="no" defaultChecked /> Nie</label>
              <label className="inline-flex items-center gap-2"><input type="radio" name="pets" value="yes" /> Áno</label>
            </div>
          </div>
          <Field label="Poznámka k zvieratám" name="petNote" />
        </div>
        <Textarea label="Poznámka pre nás" name="note" />
        <button
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-full bg-[color:var(--bordo)] px-6 py-3 font-marker text-sm uppercase tracking-wide text-[color:var(--gold)] disabled:opacity-60"
        >
          <Send className="h-4 w-4" /> {loading ? "Odosielam..." : "Odoslať RSVP"}
        </button>
      </form>
    </Section>
  );
}

// ============ UBYTOVANIE ============
function UbytovanieSection() {
  const [nights, setNights] = useState(1);
  const [rooms, setRooms] = useState(1);
  const [type, setType] = useState<"single" | "double" | "twin">("double");
  const [before, setBefore] = useState(false);
  const [extra, setExtra] = useState(false);
  const [cot, setCot] = useState(false);
  const [pet, setPet] = useState(false);
  const [parking, setParking] = useState(false);
  const [persons, setPersons] = useState(2);
  const [sent, setSent] = useState(false);

  const roomRate = before
    ? type === "single" ? 3400 : 3800
    : type === "single" ? 1950 : 2500;

  const price =
    rooms * nights * roomRate +
    (extra ? 600 * nights : 0) +
    (cot ? 0 : 0) +
    persons * 40 * nights +
    (parking ? 390 * nights : 0) +
    (pet ? 500 * nights : 0);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const r = await submitForm("ubytovanie", { ...Object.fromEntries(fd), estimatedPrice: price });
    if (r.ok) { setSent(true); toast.success("Save point uložený ✨"); }
    else toast.error("Skús to prosím znova.");
  }

  return (
    <Section id="ubytovanie" chapter="Chapter 04" title="Ubytovanie: spoločný save point">
      <p className="max-w-3xl text-[color:var(--paper)]/85 leading-relaxed mb-6">
        Pre hostí máme predbežne dohodnutú možnosť spoločného ubytovania v Hoteli Continental
        na noc zo soboty 10.10.2026 na nedeľu 11.10.2026. Môžeš sa pridať k spoločnej rezervácii
        alebo si ubytovanie vyriešiť po vlastnej osi.
      </p>

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        {[
          ["Hlavná rezervácia", "10. – 11.10.2026"],
          ["Check-in", "od 13:00"],
          ["Check-out", "do 12:00"],
          ["Raňajky", "v cene izby"],
          ["Predĺženie", "po dohode s hotelom"],
          ["Poznámka", "Predĺženie skôr po svadbe (v Brne je pred termínom veľtrh)."],
        ].map(([k, v]) => (
          <div key={k} className="paper-card p-4">
            <p className="font-marker text-xs uppercase text-[color:var(--bordo)]">{k}</p>
            <p className="mt-1 font-hand text-lg text-[color:var(--ink)]">{v}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        <div className="paper-card p-5">
          <h3 className="font-display text-2xl text-[color:var(--bordo)] mb-3">Cenník od 10.10.2026</h3>
          <PriceRow label="Dvojlôžková DBL / TWIN" price="2 500 Kč / noc" />
          <PriceRow label="Jednolôžková" price="1 950 Kč / noc" />
          <p className="mt-2 text-xs text-[color:var(--ink)]/60">Ceny s raňajkami.</p>
        </div>
        <div className="paper-card p-5">
          <h3 className="font-display text-2xl text-[color:var(--bordo)] mb-3">Cenník pred 10.10.2026</h3>
          <PriceRow label="Dvojlôžková DBL / TWIN" price="3 800 Kč / noc" />
          <PriceRow label="Jednolôžková" price="3 400 Kč / noc" />
          <p className="mt-2 text-xs text-[color:var(--ink)]/60">Ceny s raňajkami.</p>
        </div>
      </div>

      <div className="paper-card p-5 mb-8">
        <h3 className="font-display text-2xl text-[color:var(--bordo)] mb-3">Doplatky</h3>
        <div className="grid gap-1 md:grid-cols-2">
          <PriceRow label="Prístelka" price="600 Kč" />
          <PriceRow label="Detská postieľka (do 3 r.)" price="0 Kč" />
          <PriceRow label="Mestská daň" price="40 Kč / osoba" />
          <PriceRow label="Parkovanie" price="390 Kč" />
          <PriceRow label="Zvierací maznáčik" price="500 Kč" />
        </div>
      </div>

      {sent ? (
        <div className="paper-card p-6 text-center">
          <p className="font-hand text-2xl text-[color:var(--bordo)]">Ďakujeme, ozveme sa s potvrdením ✨</p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="paper-card p-6 md:p-8 space-y-5">
          <input type="text" name="hp" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
          <h3 className="font-display text-2xl text-[color:var(--bordo)]">Formulár ubytovania</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Meno a priezvisko *" name="name" required />
            <Field label="E-mail *" name="email" type="email" required />
            <div>
              <label className="font-marker text-xs uppercase text-[color:var(--bordo)]">Spoločná rezervácia?</label>
              <div className="mt-2 flex gap-4 text-[color:var(--ink)]">
                <label className="inline-flex items-center gap-2"><input type="radio" name="shared" value="yes" defaultChecked /> Áno</label>
                <label className="inline-flex items-center gap-2"><input type="radio" name="shared" value="no" /> Nie</label>
              </div>
            </div>
            <div>
              <label className="font-marker text-xs uppercase text-[color:var(--bordo)]">Typ izby</label>
              <select name="roomType" value={type} onChange={(e) => setType(e.target.value as never)} className="mt-1 w-full rounded-md border border-[color:var(--ink)]/30 bg-white/60 px-3 py-2 text-[color:var(--ink)]">
                <option value="single">Jednolôžková</option>
                <option value="double">Dvojlôžková DBL</option>
                <option value="twin">Dvojlôžková TWIN</option>
              </select>
            </div>
            <NumField label="Počet izieb" name="rooms" value={rooms} onChange={setRooms} />
            <NumField label="Počet nocí" name="nights" value={nights} onChange={setNights} />
            <NumField label="Počet osôb (mestská daň)" name="persons" value={persons} onChange={setPersons} />
            <Field label="Dátum príchodu" name="arrival" type="date" defaultValue="2026-10-10" onChange={(e) => setBefore(new Date(e.target.value) < new Date("2026-10-10"))} />
            <Field label="Dátum odchodu" name="departure" type="date" defaultValue="2026-10-11" />
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            <Toggle label="Detská postieľka (do 3 r.)" name="cot" checked={cot} onChange={setCot} />
            <Toggle label="Prístelka pre dieťa (nad 3 r.)" name="extraBed" checked={extra} onChange={setExtra} />
            <Toggle label="Beriem psa / zviera" name="pet" checked={pet} onChange={setPet} />
            <Toggle label="Potrebujem parkovanie" name="parking" checked={parking} onChange={setParking} />
          </div>
          <Textarea label="Poznámka" name="note" />
          <div className="rounded-lg border-2 border-dashed border-[color:var(--gold)] bg-[color:var(--gold)]/10 p-4">
            <p className="font-marker text-xs uppercase text-[color:var(--bordo)]">Orientačný výpočet</p>
            <p className="font-display text-4xl text-[color:var(--bordo)]">{price.toLocaleString("sk-SK")} Kč</p>
            <p className="text-xs text-[color:var(--ink)]/70">
              Ide o orientačnú kalkuláciu. Finálne potvrdenie pošleme my alebo hotel.
            </p>
          </div>
          <button className="inline-flex items-center gap-2 rounded-full bg-[color:var(--bordo)] px-6 py-3 font-marker text-sm uppercase tracking-wide text-[color:var(--gold)]">
            <Send className="h-4 w-4" /> Odoslať záujem
          </button>
        </form>
      )}
    </Section>
  );
}

function PriceRow({ label, price }: { label: string; price: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2 border-b border-dashed border-[color:var(--ink)]/20 py-1.5 last:border-0">
      <span className="font-hand text-lg text-[color:var(--ink)]">{label}</span>
      <span className="font-marker text-sm text-[color:var(--bordo)]">{price}</span>
    </div>
  );
}

function NumField({ label, name, value, onChange }: { label: string; name: string; value: number; onChange: (n: number) => void }) {
  return (
    <div>
      <label className="font-marker text-xs uppercase text-[color:var(--bordo)]">{label}</label>
      <input
        type="number" min={0} name={name} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full rounded-md border border-[color:var(--ink)]/30 bg-white/60 px-3 py-2 text-[color:var(--ink)]"
      />
    </div>
  );
}

function Toggle({ label, name, checked, onChange }: { label: string; name: string; checked: boolean; onChange: (b: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-md border border-[color:var(--ink)]/20 bg-white/40 px-3 py-2 text-[color:var(--ink)]">
      <input type="checkbox" name={name} checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-[color:var(--bordo)]" />
      <span className="font-hand text-lg">{label}</span>
    </label>
  );
}

// ============ POKRM ============
const DISHES = [
  { emoji: "🥩", label: "Mäsové", key: "meat" },
  { emoji: "🥗", label: "Vegetariánske", key: "veg" },
  { emoji: "🌾", label: "Bezlepkové", key: "gf" },
  { emoji: "🍟", label: "Detské menu", key: "kids" },
  { emoji: "✨", label: "Iné", key: "other" },
];

function PokrmSection() {
  const [pick, setPick] = useState("meat");
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const r = await submitForm("pokrm", Object.fromEntries(fd));
    if (r.ok) { setSent(true); toast.success("Power-up vybraný ⚡"); }
    else toast.error("Skús to prosím znova.");
  }

  return (
    <Section id="pokrm" chapter="Chapter 05" title="Vyber si svoj svadobný power-up">
      {sent ? (
        <div className="paper-card p-6 text-center">
          <p className="font-hand text-2xl text-[color:var(--bordo)]">Ďakujeme! Máme tvoju voľbu ✨</p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="paper-card p-6 md:p-8 space-y-5">
          <input type="text" name="hp" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
          <Field label="Meno hosťa *" name="name" required />
          <div>
            <label className="font-marker text-xs uppercase text-[color:var(--bordo)]">Preferencia večere</label>
            <div className="mt-3 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {DISHES.map((d) => (
                <label
                  key={d.key}
                  className={`cursor-pointer rounded-xl border-2 p-4 text-center transition ${
                    pick === d.key
                      ? "border-[color:var(--bordo)] bg-[color:var(--gold)]/20"
                      : "border-dashed border-[color:var(--ink)]/30 hover:border-[color:var(--bordo)]"
                  }`}
                >
                  <input type="radio" name="meal" value={d.key} className="sr-only" checked={pick === d.key} onChange={() => setPick(d.key)} />
                  <div className="text-4xl">{d.emoji}</div>
                  <div className="mt-2 font-hand text-lg text-[color:var(--ink)]">{d.label}</div>
                </label>
              ))}
            </div>
          </div>
          <Field label="Alergie a intolerancie" name="allergies" />
          <div>
            <label className="font-marker text-xs uppercase text-[color:var(--bordo)]">Polievka</label>
            <div className="mt-2 flex gap-4 text-[color:var(--ink)]">
              <label className="inline-flex items-center gap-2"><input type="radio" name="soup" value="yes" defaultChecked /> Áno</label>
              <label className="inline-flex items-center gap-2"><input type="radio" name="soup" value="no" /> Nie</label>
            </div>
          </div>
          <Textarea label="Poznámka" name="note" />
          <button className="inline-flex items-center gap-2 rounded-full bg-[color:var(--bordo)] px-6 py-3 font-marker text-sm uppercase tracking-wide text-[color:var(--gold)]">
            <Send className="h-4 w-4" /> Odoslať výber
          </button>
        </form>
      )}
    </Section>
  );
}

// ============ DRESSCODE ============
function DresscodeSection() {
  return (
    <Section id="dresscode" chapter="Chapter 06" title="Dresscode: elegantne, ale neberte sa príliš vážne">
      <p className="max-w-3xl text-[color:var(--paper)]/85 leading-relaxed mb-8">
        Budeme radi, keď prídete slávnostne, pohodlne a tak, aby ste sa cítili dobre.
        Farby a štýl nech pokojne ladia s jesennou, bordovo-zlatou, hravou náladou.
      </p>
      <div className="mb-6 flex flex-wrap gap-3">
        {["#3a1418", "#8b1e1e", "#c8942c", "#f5c542", "#4bb3a7", "#c78bbf"].map((c) => (
          <div key={c} className="paper-card p-2 -rotate-2 even:rotate-2">
            <div className="h-12 w-12 rounded" style={{ background: c }} />
            <p className="mt-1 text-center font-hand text-xs text-[color:var(--ink)]">{c}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="paper-card p-6">
          <h3 className="font-marker text-xl text-[color:var(--turquoise)] mb-3">✅ Do&apos;s</h3>
          <ul className="space-y-2 font-hand text-lg text-[color:var(--ink)]">
            <li>· Slávnostné oblečenie</li>
            <li>· Pohodlné topánky na tanec</li>
            <li>· Jesenné / bordové / zlaté / tmavé tóny vítané</li>
            <li>· Osobitosť povolená</li>
          </ul>
        </div>
        <div className="paper-card p-6">
          <h3 className="font-marker text-xl text-[color:var(--destructive)] mb-3">🚫 Don&apos;ts</h3>
          <ul className="space-y-2 font-hand text-lg text-[color:var(--ink)]">
            <li>· Biele šaty (ak nie si nevesta)</li>
            <li>· Tepláky</li>
            <li>· Outfit, v ktorom nevydržíš tancovať</li>
            <li>· Cosplay draka len po schválení nevestou</li>
          </ul>
        </div>
      </div>
    </Section>
  );
}

// ============ DARY ============
function DarySection() {
  return (
    <Section id="dary" chapter="Chapter 07" title="Loot & kytice">
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="paper-card p-6 md:p-8">
          <p className="font-hand text-2xl text-[color:var(--bordo)] mb-4">
            Najväčším darom je pre nás to, že prídete osláviť náš deň s nami.
          </p>
          <p className="text-[color:var(--ink)]/80 leading-relaxed">
            Ak by ste nás predsa len chceli niečím potešiť, viac než vecné dary oceníme
            finančný príspevok na spoločný štart do manželstva.
          </p>
          <div className="mt-6 rounded-lg border-2 border-dashed border-[color:var(--blush)] p-4">
            <p className="font-marker text-sm uppercase text-[color:var(--bordo)]">💐 Kvety</p>
            <p className="mt-1 font-hand text-lg text-[color:var(--ink)]">
              Aby kvety neskončili smutne v kúte, budeme radi, ak to obmedzíme
              maximálne na jeden kvietok na osobu.
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

// ============ DEŇ (Uži si) ============
function DenSection() {
  return (
    <Section id="den" chapter="Chapter 08" title="Uži si náš deň">
      <div className="paper-card p-6 md:p-10 relative overflow-hidden">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-[color:var(--turquoise)]/30 blur-2xl" />
        <div className="absolute -left-8 -bottom-8 h-40 w-40 rounded-full bg-[color:var(--blush)]/30 blur-2xl" />
        <div className="relative grid gap-6 md:grid-cols-3">
          {[
            { icon: "🎶", title: "Tanči", txt: "Playlist bude legendárny. Berieme rezervácie do dozvukov." },
            { icon: "🥂", title: "Jedz & pi", txt: "Kumst rozumie chuti aj mierke. Užite si to." },
            { icon: "❤️", title: "Buď pri tom", txt: "Najlepšie sekcie sa nedajú preskočiť. Buď tu s nami." },
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
    <Section id="fotky" chapter="Chapter 09" title="Zdieľaj s nami svoje zábery">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="paper-card p-6">
          <p className="font-hand text-2xl text-[color:var(--bordo)]">
            Vidíš moment, ktorý by nemal zmiznúť v galérii telefónu?
          </p>
          <p className="mt-2 text-[color:var(--ink)]/80 leading-relaxed">
            Nahraj ho k nám. Zbierame všetky fotky a videá na jedno miesto,
            aby sme si mohli poskladať kompletný recap dňa.
          </p>
          <a
            href={CONFIG.photoUploadUrl}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-[color:var(--bordo)] px-6 py-3 font-marker text-sm uppercase tracking-wide text-[color:var(--gold)]"
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

// ============ FAQ ============
const FAQ = [
  { q: "Kedy máme prísť?", a: "Zraz je o 14:00 na Moravském náměstí. Obrad začína o 15:30 v Kostole sv. Jakuba — príďte s 15 min rezervou." },
  { q: "Kde je obrad?", a: "Kostol sv. Jakuba v Brne. Odkaz na Google Maps nájdeš v sekcii Lokácie." },
  { q: "Kde zaparkovať?", a: "V Hoteli Continental je platené parkovanie (390 Kč). V okolí Kumstu a kostola sú platené parkoviská." },
  { q: "Ako funguje ubytovanie?", a: "Máme predbežnú rezerváciu v Hoteli Continental na noc 10. – 11.10. Detaily a formulár nájdeš v sekcii Ubytovanie." },
  { q: "Čo s deťmi?", a: "Deti sú vítané. V RSVP prosím uveď ich počet a v sekcii Pokrm vyber detské menu." },
  { q: "Čo s darom?", a: "Radi prijmeme finančný príspevok — obálka, QR platba alebo prevod. Detaily v sekcii Loot & kytice." },
  { q: "Aký je dresscode?", a: "Slávnostne a pohodlne. Jesenné, bordové, zlaté tóny vítané. Viac v sekcii Dresscode." },
  { q: "Kam nahrať fotky?", a: "Do našej spoločnej galérie cez tlačidlo alebo QR kód v sekcii Fotky." },
  { q: "Na koho sa obrátiť?", a: "Napíš alebo zavolaj Natálii alebo Otovi — kontakty sú v poslednej sekcii." },
];

function FaqSection() {
  const [messages, setMessages] = useState<{ role: "bot" | "user"; text: string }[]>([
    { role: "bot", text: "Ahoj, som svadobný NPC poradca 🧙 Vyber otázku nižšie alebo klikni na tému." },
  ]);

  function ask(item: (typeof FAQ)[number]) {
    setMessages((m) => [...m, { role: "user", text: item.q }, { role: "bot", text: item.a }]);
    setTimeout(() => {
      document.getElementById("faq-scroll")?.scrollTo({ top: 99999, behavior: "smooth" });
    }, 50);
  }

  return (
    <Section id="faq" chapter="Chapter 10" title="Svadobný NPC poradca">
      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="paper-card p-4">
          <p className="mb-3 font-marker text-sm uppercase text-[color:var(--bordo)]">Vyber otázku</p>
          <div className="flex flex-col gap-1.5">
            {FAQ.map((f) => (
              <button
                key={f.q}
                onClick={() => ask(f)}
                className="rounded-md border border-dashed border-[color:var(--ink)]/30 bg-white/40 px-3 py-2 text-left font-hand text-lg text-[color:var(--ink)] hover:bg-[color:var(--gold)]/20 transition"
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
            Statický režim · pripravené na dopojenie AI cez API
          </p>
        </div>
      </div>
    </Section>
  );
}

// ============ KONTAKT ============
function KontaktSection() {
  return (
    <Section id="kontakt" chapter="Chapter 11" title="Kontakt">
      <p className="font-hand text-2xl text-[color:var(--gold)] mb-8 max-w-2xl">
        Ak si sa stratil/a v queste, ozvi sa nám. Alebo niekomu z party, kto vyzerá, že vie, čo robí.
      </p>
      <div className="grid gap-6 md:grid-cols-2">
        {[
          { name: "Natália", ...CONFIG.contacts.natalia, color: "var(--blush)" },
          { name: "Oto", ...CONFIG.contacts.oto, color: "var(--turquoise)" },
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
    </Section>
  );
}

// ============ FOOTER ============
function Footer() {
  return (
    <footer className="mt-16 border-t-2 border-dashed border-[color:var(--gold)]/30 pt-8 pb-16 text-center">
      <p className="font-marker text-lg text-[color:var(--gold)]">
        Natália &amp; Oto · 10.10.2026 · Brno
      </p>
      <p className="mt-2 font-hand text-lg text-[color:var(--paper)]/60">
        End of quest log · vidíme sa čoskoro ❤️
      </p>
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

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  const { label, ...rest } = props;
  return (
    <div>
      <label className="font-marker text-xs uppercase tracking-wider text-[color:var(--bordo)]">{label}</label>
      <textarea
        rows={3}
        {...rest}
        className="mt-1 w-full rounded-md border border-[color:var(--ink)]/30 bg-white/60 px-3 py-2 text-[color:var(--ink)] placeholder:text-[color:var(--ink)]/40 focus:outline-none focus:ring-2 focus:ring-[color:var(--gold)]"
      />
    </div>
  );
}
