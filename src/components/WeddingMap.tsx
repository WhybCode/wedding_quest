import { useEffect, useRef } from "react";
import type { Map as LeafletMap } from "leaflet";
import { Bed, Heart, Utensils, type LucideIcon } from "lucide-react";
import "leaflet/dist/leaflet.css";

export type WeddingMapLocation = {
  id: string;
  name: string;
  desc: string;
  addr: string;
  lat: number;
  lng: number;
  url: string;
};

type WeddingMapProps = {
  locations: WeddingMapLocation[];
  /** Voliteľná vlastná ilustrácia namiesto OpenStreetMap (cesta k súboru v public/) */
  customImage?: string;
};

const MARKER_ICONS: Record<string, LucideIcon> = {
  hotel: Bed,
  kostol: Heart,
  kumst: Utensils,
};

const MARKER_SVG_HTML: Record<string, string> = {
  hotel: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 12h20"/><path d="M6 8v9"/></svg>`,
  kostol: `<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`,
  kumst: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>`,
};

const LEAFLET_MARKER_SIZE = 30;
const LEAFLET_MARKER_ANCHOR: [number, number] = [15, 27];

export function MapMarkerIcon({ id, className = "h-3.5 w-3.5" }: { id: string; className?: string }) {
  const Icon = MARKER_ICONS[id] ?? Bed;
  if (id === "kostol") {
    return <Heart className={className} fill="currentColor" strokeWidth={1.75} aria-hidden />;
  }
  return <Icon className={className} strokeWidth={2.25} aria-hidden />;
}

function MapMarkerPin({ id }: { id: string }) {
  const Icon = MARKER_ICONS[id] ?? Bed;
  const heart = id === "kostol";
  return (
    <span className={`wedding-map-marker__pin wedding-map-marker__pin--${id}`} aria-hidden>
      <Icon className="h-3.5 w-3.5" fill={heart ? "currentColor" : undefined} strokeWidth={heart ? 1.75 : 2.25} />
    </span>
  );
}

function latLngToPercent(
  lat: number,
  lng: number,
  bounds: { north: number; south: number; west: number; east: number },
) {
  const x = ((lng - bounds.west) / (bounds.east - bounds.west)) * 100;
  const y = ((bounds.north - lat) / (bounds.north - bounds.south)) * 100;
  return {
    x: Math.min(96, Math.max(4, x)),
    y: Math.min(92, Math.max(8, y)),
  };
}

function CustomImageMap({ locations, customImage }: WeddingMapProps) {
  const bounds = {
    north: Math.max(...locations.map((l) => l.lat)) + 0.004,
    south: Math.min(...locations.map((l) => l.lat)) - 0.004,
    west: Math.min(...locations.map((l) => l.lng)) - 0.006,
    east: Math.max(...locations.map((l) => l.lng)) + 0.006,
  };

  return (
    <div className="wedding-map relative aspect-[16/7] overflow-hidden rounded-md border border-[color:var(--ink)]/15 bg-[color:var(--paper)]/40 shadow-inner">
      <img src={customImage} alt="Mapa svadobných lokácií v Brne" className="absolute inset-0 h-full w-full object-cover" />
      {locations.map((spot) => {
        const { x, y } = latLngToPercent(spot.lat, spot.lng, bounds);
        return (
          <a
            key={spot.id}
            href={spot.url}
            target="_blank"
            rel="noreferrer"
            className="wedding-map-marker group absolute z-10"
            style={{ left: `${x}%`, top: `${y}%` }}
            aria-label={`${spot.name} — otvoriť v mapách`}
          >
            <MapMarkerPin id={spot.id} />
            <span className="wedding-map-marker__label">{spot.name}</span>
          </a>
        );
      })}
    </div>
  );
}

export function WeddingMap({ locations, customImage }: WeddingMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    if (customImage || !containerRef.current) return;

    let cancelled = false;
    let map: LeafletMap | null = null;

    (async () => {
      const L = await import("leaflet");
      if (cancelled || !containerRef.current) return;

      map = L.map(containerRef.current, {
        scrollWheelZoom: false,
        zoomControl: true,
      });
      mapRef.current = map;

      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 19,
      }).addTo(map);

      const bounds = L.latLngBounds([]);

      for (const spot of locations) {
        const pos: L.LatLngExpression = [spot.lat, spot.lng];
        bounds.extend(pos);

        const icon = L.divIcon({
          className: `wedding-leaflet-marker wedding-leaflet-marker--${spot.id}`,
          html: `<span class="wedding-leaflet-marker__pin wedding-leaflet-marker__pin--${spot.id}">${MARKER_SVG_HTML[spot.id] ?? MARKER_SVG_HTML.hotel}</span>`,
          iconSize: [LEAFLET_MARKER_SIZE, LEAFLET_MARKER_SIZE],
          iconAnchor: LEAFLET_MARKER_ANCHOR,
          popupAnchor: [0, -24],
        });

        const marker = L.marker(pos, { icon }).addTo(map);
        marker.bindPopup(
          `<div class="wedding-map-popup">
            <strong>${spot.name}</strong>
            <p>${spot.desc}</p>
            <small>${spot.addr}</small>
            <a href="${spot.url}" target="_blank" rel="noreferrer">Navigovať v Google Maps</a>
          </div>`,
        );
      }

      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 15 });
    })();

    return () => {
      cancelled = true;
      map?.remove();
      mapRef.current = null;
    };
  }, [customImage, locations]);

  if (customImage) {
    return <CustomImageMap locations={locations} customImage={customImage} />;
  }

  return (
    <div
      ref={containerRef}
      className="wedding-map-leaflet aspect-[16/7] overflow-hidden rounded-md border border-[color:var(--ink)]/15 bg-[color:var(--paper)]/40 shadow-inner"
      role="region"
      aria-label="Interaktívna mapa svadobných lokácií v Brne"
    />
  );
}
