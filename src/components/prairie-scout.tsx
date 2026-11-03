import { useEffect, useMemo, useRef, useState } from "react";
import type { Map as MlMap, Marker } from "maplibre-gl";
import maplibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";
import { Binoculars, Phone, Search, X } from "lucide-react";
import { lodges, phoneHref, STATE_LABEL, type Lodge } from "@/data/lodges";

const SPECIES = ["Waterfowl", "Pheasant", "Deer", "Whitetail"] as const;

function motionMs(ms: number) {
  if (typeof window === "undefined") return ms;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : ms;
}

export function PrairieScout() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const selectedRef = useRef<Lodge | null>(null);
  const mlRef = useRef<typeof import("maplibre-gl") | null>(null);

  const [selected, setSelected] = useState<Lodge | null>(null);
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState<"all" | Lodge["state"]>("all");
  const [speciesFilter, setSpeciesFilter] = useState<string>("all");
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  selectedRef.current = selected;

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return lodges.filter((lodge) => {
      const matchSearch =
        !q ||
        lodge.name.toLowerCase().includes(q) ||
        lodge.city.toLowerCase().includes(q) ||
        lodge.state.toLowerCase().includes(q) ||
        STATE_LABEL[lodge.state].toLowerCase().includes(q);
      const matchState = stateFilter === "all" || lodge.state === stateFilter;
      const matchSpecies =
        speciesFilter === "all" ||
        lodge.species.some((species) => species.toLowerCase().includes(speciesFilter.toLowerCase()));
      return matchSearch && matchState && matchSpecies;
    });
  }, [search, stateFilter, speciesFilter]);

  useEffect(() => {
    if (selected && !filtered.some((lodge) => lodge.id === selected.id)) {
      setSelected(null);
    }
  }, [filtered, selected]);

  useEffect(() => {
    const container = mapContainer.current;
    if (!container) return;
    let cancelled = false;

    (async () => {
      try {
        const maplibregl = await import("maplibre-gl");
        if (cancelled || !mapContainer.current) return;
        mlRef.current = maplibregl;
        maplibregl.setWorkerUrl(maplibreWorkerUrl);
        const map = new maplibregl.Map({
          container: mapContainer.current,
          style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
          center: [-99.5, 44.5],
          zoom: 5.4,
          attributionControl: { compact: true },
        });
        map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-left");
        let loaded = false;
        map.on("load", () => {
          loaded = true;
          if (!cancelled) {
            setMapReady(true);
            setMapError(null);
          }
        });
        map.on("error", (event) => {
          if (loaded || cancelled) return;
          console.warn("Map error:", event.error);
        });
        window.setTimeout(() => {
          if (!cancelled && !loaded) {
            setMapError("The map tiles didn’t load. The lodge list still works.");
          }
        }, 12000);
        mapRef.current = map;
      } catch (error) {
        console.error(error);
        if (!cancelled) setMapError("The map couldn’t start. The lodge list still works.");
      }
    })();

    return () => {
      cancelled = true;
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const maplibregl = mlRef.current;
    if (!map || !maplibregl || !mapReady) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    for (const lodge of filtered) {
      const el = document.createElement("button");
      el.type = "button";
      el.className = "marker-pin";
      el.setAttribute("aria-label", lodge.name);
      el.innerHTML = '<span class="marker-dot"></span>';
      el.addEventListener("click", (event) => {
        event.stopPropagation();
        setSelected(lodge);
      });
      const marker = new maplibregl.Marker({ element: el, anchor: "center" })
        .setLngLat([lodge.lng, lodge.lat])
        .addTo(map);
      markersRef.current.push(marker);
    }

    const current = selectedRef.current;
    const stillVisible = current && filtered.some((lodge) => lodge.id === current.id);
    if (!stillVisible && filtered.length > 0) {
      const bounds = new maplibregl.LngLatBounds();
      filtered.forEach((lodge) => bounds.extend([lodge.lng, lodge.lat]));
      map.fitBounds(bounds, { padding: 72, maxZoom: 6.6, duration: motionMs(700) });
    }
  }, [filtered, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !selected) return;
    map.flyTo({
      center: [selected.lng, selected.lat],
      zoom: Math.max(map.getZoom(), 8),
      duration: motionMs(800),
      essential: true,
    });
  }, [selected, mapReady]);

  const filtersOn = search !== "" || stateFilter !== "all" || speciesFilter !== "all";

  function clearFilters() {
    setSearch("");
    setStateFilter("all");
    setSpeciesFilter("all");
    setSelected(null);
  }

  const call = selected ? phoneHref(selected.phone) : null;

  return (
    <div className="scout">
      <aside className="scout-side">
        <header className="scout-head">
          <div className="scout-mark" aria-hidden="true">
            <Binoculars strokeWidth={1.75} />
          </div>
          <div>
            <p className="scout-kicker">Prairie Pothole Region</p>
            <h1>Prairie Scout</h1>
          </div>
        </header>

        <div className="scout-search">
          <label className="search-field">
            <Search strokeWidth={1.75} aria-hidden="true" />
            <input
              type="search"
              placeholder="Lodge, town, or state"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search lodges"
            />
          </label>
          <div className="filter-row">
            <select
              value={stateFilter}
              onChange={(event) => setStateFilter(event.target.value as "all" | Lodge["state"])}
              aria-label="Filter by state"
            >
              <option value="all">All states</option>
              <option value="SD">South Dakota</option>
              <option value="ND">North Dakota</option>
              <option value="NE">Nebraska</option>
            </select>
            <select
              value={speciesFilter}
              onChange={(event) => setSpeciesFilter(event.target.value)}
              aria-label="Filter by species"
            >
              <option value="all">All species</option>
              {SPECIES.map((species) => (
                <option key={species} value={species}>
                  {species}
                </option>
              ))}
            </select>
          </div>
          {filtersOn ? (
            <button type="button" className="text-btn" onClick={clearFilters}>
              Clear filters
            </button>
          ) : null}
        </div>

        <div className="lodge-list" role="list">
          {filtered.length === 0 ? (
            <div className="empty-state">
              <p>No lodges match that search.</p>
              <button type="button" className="solid-btn" onClick={clearFilters}>
                Show every lodge
              </button>
            </div>
          ) : (
            filtered.map((lodge) => (
              <button
                key={lodge.id}
                type="button"
                role="listitem"
                className={selected?.id === lodge.id ? "lodge-card is-active" : "lodge-card"}
                onClick={() => setSelected(lodge)}
              >
                <span className="lodge-name">{lodge.name}</span>
                <span className="lodge-meta">
                  {lodge.city}, {lodge.state}
                </span>
                <span className="lodge-species">{lodge.species.join(" · ")}</span>
              </button>
            ))
          )}
        </div>

        <p className="scout-foot">
          {filtered.length} of {lodges.length} lodges · directory info, confirm before you book
        </p>
      </aside>

      <section className="map-wrap" aria-label="Lodge map">
        <div id="map" ref={mapContainer} />
        {!mapReady && !mapError ? <div className="map-status">Loading the prairie…</div> : null}
        {mapError ? (
          <div className="map-status is-error">
            <p>{mapError}</p>
          </div>
        ) : null}
        {selected ? (
          <article className="detail-card">
            <button type="button" className="icon-btn" onClick={() => setSelected(null)} aria-label="Close details">
              <X strokeWidth={1.75} />
            </button>
            <p className="detail-place">
              {selected.city}, {STATE_LABEL[selected.state]}
            </p>
            <h2>{selected.name}</h2>
            <p className="detail-copy">{selected.description}</p>
            <p className="detail-line">
              <span>Species</span>
              {selected.species.join(", ")}
            </p>
            <p className="detail-line">
              <span>On site</span>
              {selected.amenities.join(", ")}
            </p>
            <div className="detail-contact">
              {call ? (
                <a href={call}>
                  <Phone strokeWidth={1.75} aria-hidden="true" />
                  {selected.phone}
                </a>
              ) : (
                <p>{selected.phone}</p>
              )}
              {selected.website ? (
                <a href={selected.website} target="_blank" rel="noopener noreferrer">
                  Visit website
                </a>
              ) : null}
            </div>
          </article>
        ) : null}
      </section>
    </div>
  );
}
