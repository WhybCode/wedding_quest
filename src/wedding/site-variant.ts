import type { LucideIcon } from "lucide-react";
import {
  Calendar as CalendarIcon,
  Camera,
  Car,
  Check,
  Gift,
  HelpCircle,
  MapPin,
  Music,
  Phone,
  Shirt,
  Sparkles,
  Utensils,
} from "lucide-react";

export type SiteVariant = "full" | "afterparty";

export type SectionDef = {
  id: string;
  label: string;
  icon: LucideIcon;
  form?: boolean;
};

export type ProgramStop = {
  time: string;
  title: string;
  icon: string;
  place: string | null;
  url: string | null;
};

export type TrailPoint = { x: number; y: number };

export type StorageKeys = {
  guests: string;
  rsvpSent: string;
  pokrmSent: string;
  pokrmData: string;
  ubytovanieSent: string;
  ubytovanieData: string;
  kontaktSent: string;
  kontaktData: string;
  checked: string;
  achievement: string;
};

type VariantConfig = {
  sections: SectionDef[];
  sectionIds: string[];
  program: ProgramStop[];
  programTrailStops: TrailPoint[];
  programTrailBulges: number[];
  programTrailWide: Set<string>;
  programTrailLift: Set<string>;
  storage: StorageKeys;
  formPrefix: string;
  showRsvp: boolean;
  showPokrm: boolean;
  showDresscode: boolean;
  showFaq: boolean;
  /** Hotel mimo checklistu, default skrytý */
  hotelOptional: boolean;
  levels: Record<string, string>;
};

const FULL_SECTIONS: SectionDef[] = [
  { id: "hero", label: "Poznač si termín", icon: CalendarIcon },
  { id: "program", label: "Naplánuj si deň", icon: MapPin },
  { id: "lokacie", label: "Naplánuj si cestu", icon: Car },
  { id: "rsvp", label: "Potvrď účasť", icon: Check, form: true },
  { id: "ubytovanie", label: "Rezervuj si izbu", icon: Sparkles, form: true },
  { id: "pokrm", label: "Vyber si pokrm", icon: Utensils, form: true },
  { id: "dresscode", label: "Nachystaj si odev", icon: Shirt },
  { id: "dary", label: "Priprav dar", icon: Gift },
  { id: "den", label: "Uži si náš deň", icon: Music },
  { id: "brno", label: "Objav Brno", icon: MapPin },
  { id: "fotky", label: "Zdieľaj s nami fotky", icon: Camera },
  { id: "faq", label: "Dopýtaj sa", icon: HelpCircle },
  { id: "kontakt", label: "Posledné veci", icon: Phone },
];

const FRIENDS_SECTIONS: SectionDef[] = [
  { id: "hero", label: "Poznač si termín", icon: CalendarIcon },
  { id: "program", label: "Naplánuj si večer", icon: MapPin },
  { id: "lokacie", label: "Naplánuj si cestu", icon: Car },
  { id: "rsvp", label: "Potvrď účasť", icon: Check, form: true },
  { id: "dresscode", label: "Nachystaj si odev", icon: Shirt },
  { id: "dary", label: "Priprav dar", icon: Gift },
  { id: "den", label: "Uži si náš deň", icon: Music },
  { id: "brno", label: "Objav Brno", icon: MapPin },
  { id: "fotky", label: "Zdieľaj s nami fotky", icon: Camera },
  { id: "kontakt", label: "Posledné veci", icon: Phone },
];

function keys(prefix: string): StorageKeys {
  return {
    guests: `${prefix}-guests-v1`,
    rsvpSent: `${prefix}-rsvp-sent-v1`,
    pokrmSent: `${prefix}-pokrm-sent-v1`,
    pokrmData: `${prefix}-pokrm-data-v1`,
    ubytovanieSent: `${prefix}-ubytovanie-sent-v1`,
    ubytovanieData: `${prefix}-ubytovanie-data-v1`,
    kontaktSent: `${prefix}-kontakt-sent-v1`,
    kontaktData: `${prefix}-kontakt-data-v1`,
    checked: `${prefix}-checked-v1`,
    achievement: `${prefix}-quest-achievement-v1`,
  };
}

export function buildVariantConfig(
  maps: { hotel: string; kostol: string; kumst: string },
): Record<SiteVariant, VariantConfig> {
  const fullProgram: ProgramStop[] = [
    { time: "10:00–11:00", title: "Výjazd z domu", icon: "🚗", place: null, url: null },
    { time: "13:00", title: "Check-in v hoteli", icon: "🛏️", place: "Hotel Continental", url: maps.hotel },
    { time: "14:30–15:00", title: "Zraz", icon: "🥂", place: "Recepcia hotela Continental", url: maps.hotel },
    { time: "15:30", title: "Obrad", icon: "💍", place: "Kostol sv. Jakuba", url: maps.kostol },
    { time: "18:00", title: "Hostina", icon: "🍽️", place: "Kumst", url: maps.kumst },
    { time: "19:30", title: "Prvý tanec", icon: "💃", place: null, url: null },
    { time: "22:00", title: "Nočný raut", icon: "🌮", place: null, url: null },
    { time: "02:00", title: "Dozvuky", icon: "🪩", place: null, url: null },
  ];

  const afterpartyProgram: ProgramStop[] = [
    { time: "15:30", title: "Obrad", icon: "💍", place: "Kostol sv. Jakuba", url: maps.kostol },
    { time: "21:00", title: "Afterka", icon: "🎉", place: "Kumst", url: maps.kumst },
    { time: "22:00", title: "Nočný raut", icon: "🌮", place: null, url: null },
    { time: "02:00", title: "Dozvuky", icon: "🪩", place: null, url: null },
  ];

  return {
    full: {
      sections: FULL_SECTIONS,
      sectionIds: FULL_SECTIONS.map((s) => s.id),
      program: fullProgram,
      programTrailStops: [
        { x: 10, y: 3 },
        { x: 32, y: 17 },
        { x: 14, y: 31 },
        { x: 34, y: 45 },
        { x: 16, y: 59 },
        { x: 31, y: 73 },
        { x: 22, y: 85 },
        { x: 38, y: 97 },
      ],
      programTrailBulges: [9, -13, 8, -14, 11, -10, 16],
      programTrailWide: new Set(["Check-in v hoteli", "Zraz"]),
      programTrailLift: new Set(["Zraz", "Hostina", "Nočný raut"]),
      storage: keys("no-wedding"),
      formPrefix: "",
      showRsvp: true,
      showPokrm: true,
      showDresscode: true,
      showFaq: true,
      hotelOptional: false,
      levels: {
        program: "Level 01",
        lokacie: "Level 02",
        rsvp: "Level 03",
        ubytovanie: "Level 04",
        pokrm: "Level 05",
        dresscode: "Level 06",
        dary: "Level 07",
        den: "Level 08",
        brno: "Level 09",
        fotky: "Level 10",
        faq: "Level 11",
        kontakt: "Level 12",
      },
    },
    afterparty: {
      sections: FRIENDS_SECTIONS,
      sectionIds: FRIENDS_SECTIONS.map((s) => s.id),
      program: afterpartyProgram,
      programTrailStops: [
        { x: 14, y: 8 },
        { x: 34, y: 32 },
        { x: 16, y: 56 },
        { x: 34, y: 80 },
      ],
      programTrailBulges: [11, -12, 10],
      programTrailWide: new Set(),
      programTrailLift: new Set(["Nočný raut"]),
      storage: keys("no-wedding-afterparty"),
      formPrefix: "",
      showRsvp: true,
      showPokrm: false,
      showDresscode: true,
      showFaq: false,
      hotelOptional: true,
      levels: {
        program: "Level 01",
        lokacie: "Level 02",
        rsvp: "Level 03",
        ubytovanie: "Side quest",
        dresscode: "Level 04",
        dary: "Level 05",
        den: "Level 06",
        brno: "Level 07",
        fotky: "Level 08",
        kontakt: "Level 09",
      },
    },
  };
}
