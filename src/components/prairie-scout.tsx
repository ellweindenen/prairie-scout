import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import type { Map as MlMap, Marker } from "maplibre-gl";
import maplibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";
import { Binoculars, LocateFixed, Navigation, Phone, Search, Star, X } from "lucide-react";
import {
  directionsHref,
  lodges,
  matchesSpecies,
  milesBetween,
  phoneHref,
  speciesOptions,
  STATE_LABEL,
  type Lodge,
} from "@/data/lodges";

const SPECIES = speciesOptions();
const FAV_KEY = "prairie-scout:favorites";
const MOBILE_QUERY = "(max-width: 900px)";
const CLUSTER_PX = 30;

type StateFilter = "all" | Lodge["state"];

function motionMs(ms: number) {
  if (typeof window === "undefined") return ms;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : ms;
}

function isMobile() {
  return typeof window !== "undefined" && window.matchMedia(MOBILE_QUERY).matches;
}

function isNativeApp() {
  if (typeof window === "undefined") return false;
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return Boolean(cap?.isNativePlatform?.());
}

/** A framed preview cannot open the phone app; a desktop browser errors on tel:. */
function canPlaceCall() {
  if (typeof navigator === "undefined" || typeof window === "undefined") return false;
  if (isNativeApp()) return true;
  if (window.parent !== window) return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text).catch(() => copyWithSelection(text));
  }
  return copyWithSelection(text);
}

function copyWithSelection(text: string) {
  const input = document.createElement("textarea");
  input.value = text;
  input.setAttribute("readonly", "");
  input.style.position = "fixed";
  input.style.left = "-9999px";
  document.body.appendChild(input);
  input.select();
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  input.remove();
  return ok ? Promise.resolve() : Promise.reject(new Error("copy failed"));
}

function readUrlFilters() {
  if (typeof window === "undefined") return null;
  const p = new URLSearchParams(window.location.search);
  const state = p.get("state");
  return {
    q: p.get("q") ?? "",
    state: (state === "SD" || state === "ND" || state === "NE" ? state : "all") as StateFilter,
    species: p.get("species") && SPECIES.includes(p.get("species")!) ? p.get("species")! : "all",
    saved: p.get("saved") === "1",
    lodge: Number(p.get("lodge")) || null,
  };
}

function formatVerified(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export function PrairieScout() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const selectedRef = useRef<Lodge | null>(null);
  const mlRef = useRef<typeof import("maplibre-gl") | null>(null);
  const detailHeadingRef = useRef<HTMLHeadingElement>(null);
  const hydratedUrl = useRef(false);

  const [selected, setSelected] = useState<Lodge | null>(null);
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState<StateFilter>("all");
  const [speciesFilter, setSpeciesFilter] = useState<string>("all");
  const [savedOnly, setSavedOnly] = useState(false);
  const [favorites, setFavorites] = useState<Set<number>>(() => new Set());
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [tilesLoaded, setTilesLoaded] = useState(false);
  const [brokenPhotos, setBrokenPhotos] = useState<Set<number>>(() => new Set());
  const [mapError, setMapError] = useState<string | null>(null);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [viewTick, setViewTick] = useState(0);

  selectedRef.current = selected;

  // Restore favorites + URL filters once on the client.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(FAV_KEY);
      if (raw) setFavorites(new Set(JSON.parse(raw) as number[]));
    } catch {
      /* storage unavailable */
    }
    const f = readUrlFilters();
    if (f) {
      setSearch(f.q);
      setStateFilter(f.state);
      setSpeciesFilter(f.species);
      setSavedOnly(f.saved);
      if (f.lodge) setSelected(lodges.find((l) => l.id === f.lodge) ?? null);
    }
    hydratedUrl.current = true;
  }, []);

  // Keep filters in the URL so a search can be shared.
  useEffect(() => {
    if (!hydratedUrl.current) return;
    const p = new URLSearchParams();
    if (search) p.set("q", search);
    if (stateFilter !== "all") p.set("state", stateFilter);
    if (speciesFilter !== "all") p.set("species", speciesFilter);
    if (savedOnly) p.set("saved", "1");
    if (selected) p.set("lodge", String(selected.id));
    const qs = p.toString();
    const next = `${window.location.pathname}${qs ? `?${qs}` : ""}`;
    if (next !== `${window.location.pathname}${window.location.search}`) {
      window.history.replaceState(window.history.state, "", next);
    }
  }, [search, stateFilter, speciesFilter, savedOnly, selected]);

  // Offline support (production only; dev uses Vite's live modules).
  useEffect(() => {
    if (import.meta.env.DEV || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch((error) => console.warn("SW failed", error));
  }, []);

  const selectedId = selected?.id;
  useEffect(() => {
    setCopiedPhone(false);
    if (selectedId != null) window.requestAnimationFrame(() => detailHeadingRef.current?.focus());
  }, [selectedId]);

  function toggleFavorite(id: number) {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        window.localStorage.setItem(FAV_KEY, JSON.stringify([...next]));
      } catch {
        /* storage unavailable */
      }
      return next;
    });
  }

  const matchText = (lodge: Lodge, q: string) =>
    !q ||
    lodge.name.toLowerCase().includes(q) ||
    lodge.city.toLowerCase().includes(q) ||
    lodge.state.toLowerCase().includes(q) ||
    STATE_LABEL[lodge.state].toLowerCase().includes(q);

  const q = search.toLowerCase().trim();
  const base = useMemo(
    () => lodges.filter((l) => matchText(l, q) && (!savedOnly || favorites.has(l.id))),
    [q, savedOnly, favorites],
  );

  const filtered = useMemo(() => {
    const list = base.filter(
      (l) => (stateFilter === "all" || l.state === stateFilter) && matchesSpecies(l, speciesFilter),
    );
    if (userPos) {
      return [...list].sort(
        (a, b) => milesBetween(userPos, [a.lat, a.lng]) - milesBetween(userPos, [b.lat, b.lng]),
      );
    }
    return list;
  }, [base, stateFilter, speciesFilter, userPos]);

  const stateCounts = useMemo(() => {
    const c: Record<string, number> = { all: 0, SD: 0, ND: 0, NE: 0 };
    base
      .filter((l) => matchesSpecies(l, speciesFilter))
      .forEach((l) => {
        c.all++;
        c[l.state]++;
      });
    return c;
  }, [base, speciesFilter]);

  const speciesCounts = useMemo(() => {
    const scoped = base.filter((l) => stateFilter === "all" || l.state === stateFilter);
    const c: Record<string, number> = { all: scoped.length };
    SPECIES.forEach((s) => (c[s] = scoped.filter((l) => matchesSpecies(l, s)).length));
    return c;
  }, [base, stateFilter]);

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
        const mobile = isMobile();
        const map = new maplibregl.Map({
          container: mapContainer.current,
          style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
          center: [-99.5, 44.5],
          zoom: mobile ? 4.6 : 5.4,
          attributionControl: { compact: true },
        });
        map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-left");
        let loaded = false;
        const markLoaded = () => {
          if (loaded) return;
          loaded = true;
          window.clearTimeout(slowTimer);
          if (!cancelled) {
            setTilesLoaded(true);
            setMapError(null);
          }
        };
        map.on("style.load", markLoaded);
        map.on("load", markLoaded);
        map.on("zoomend", () => setViewTick((t) => t + 1));
        map.on("error", (event) => {
          if (loaded || cancelled) return;
          console.warn("Map error:", event.error);
        });
        const slowTimer = window.setTimeout(() => {
          if (!cancelled && !loaded) {
            setMapError("The map tiles didn’t load. The lodge list still works.");
          }
        }, 12000);
        mapRef.current = map;
        setMapReady(true);
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
      setTilesLoaded(false);
    };
  }, []);

  // Fit to the visible lodges when the filter set changes.
  useEffect(() => {
    const map = mapRef.current;
    const maplibregl = mlRef.current;
    if (!map || !maplibregl || !mapReady) return;
    const current = selectedRef.current;
    const stillVisible = current && filtered.some((lodge) => lodge.id === current.id);
    if (!stillVisible && filtered.length > 0) {
      const bounds = new maplibregl.LngLatBounds();
      filtered.forEach((lodge) => bounds.extend([lodge.lng, lodge.lat]));
      map.fitBounds(bounds, {
        padding: isMobile() ? 28 : 72,
        maxZoom: 6.6,
        duration: motionMs(700),
      });
    }
  }, [filtered, mapReady]);

  // Draw pins, grouping ones that overlap on screen into a count bubble.
  useEffect(() => {
    const map = mapRef.current;
    const maplibregl = mlRef.current;
    if (!map || !maplibregl || !mapReady) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    const groups: { lodges: Lodge[]; x: number; y: number }[] = [];
    const project = (l: Lodge) => map.project([l.lng, l.lat]);
    // Use the zoom the map is heading to, so clusters match the end of a flyTo.
    for (const lodge of filtered) {
      const pt = project(lodge);
      const hit = groups.find((g) => Math.hypot(g.x - pt.x, g.y - pt.y) < CLUSTER_PX);
      if (hit && map.getZoom() < 9) hit.lodges.push(lodge);
      else groups.push({ lodges: [lodge], x: pt.x, y: pt.y });
    }

    for (const group of groups) {
      const el = document.createElement("button");
      el.type = "button";
      let lngLat: [number, number];
      if (group.lodges.length === 1) {
        const lodge = group.lodges[0];
        lngLat = [lodge.lng, lodge.lat];
        el.className = selectedRef.current?.id === lodge.id ? "marker-pin is-active" : "marker-pin";
        el.setAttribute("aria-label", `${lodge.name}, ${lodge.city}, ${STATE_LABEL[lodge.state]}`);
        el.innerHTML = '<span class="marker-dot"></span>';
        el.addEventListener("click", (event) => {
          event.stopPropagation();
          setSelected(lodge);
        });
      } else {
        const lng = group.lodges.reduce((s, l) => s + l.lng, 0) / group.lodges.length;
        const lat = group.lodges.reduce((s, l) => s + l.lat, 0) / group.lodges.length;
        lngLat = [lng, lat];
        el.className = "marker-cluster";
        el.textContent = String(group.lodges.length);
        el.setAttribute(
          "aria-label",
          `${group.lodges.length} lodges: ${group.lodges.map((l) => l.name).join(", ")}. Zoom in.`,
        );
        el.addEventListener("click", (event) => {
          event.stopPropagation();
          const bounds = new maplibregl.LngLatBounds();
          group.lodges.forEach((l) => bounds.extend([l.lng, l.lat]));
          map.fitBounds(bounds, { padding: 80, maxZoom: 10, duration: motionMs(600) });
        });
      }
      markersRef.current.push(
        new maplibregl.Marker({ element: el, anchor: "center" }).setLngLat(lngLat).addTo(map),
      );
    }
  }, [filtered, mapReady, viewTick, selected?.id]);

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

  const filtersOn =
    search !== "" || stateFilter !== "all" || speciesFilter !== "all" || savedOnly || !!userPos;

  function markPhotoBroken(id: number) {
    setBrokenPhotos((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }

  function clearFilters() {
    setSearch("");
    setStateFilter("all");
    setSpeciesFilter("all");
    setSavedOnly(false);
    setUserPos(null);
    setLocateError(null);
    setSelected(null);
  }

  function locate() {
    if (!("geolocation" in navigator)) {
      setLocateError("Location isn’t available on this device.");
      return;
    }
    setLocating(true);
    setLocateError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        setUserPos([pos.coords.latitude, pos.coords.longitude]);
      },
      () => {
        setLocating(false);
        setLocateError("Couldn’t get your location.");
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  }

  const call = selected ? phoneHref(selected.phone) : null;

  function onCallClick(event: MouseEvent<HTMLAnchorElement>) {
    if (!selected || canPlaceCall()) return;
    event.preventDefault();
    copyText(selected.phone).then(
      () => {
        setCopiedPhone(true);
        window.setTimeout(() => setCopiedPhone(false), 2200);
      },
      () => setCopiedPhone(false),
    );
  }

  const distance = (lodge: Lodge) =>
    userPos ? `${Math.round(milesBetween(userPos, [lodge.lat, lodge.lng]))} mi` : null;

  return (
    <div className={selected ? "scout has-detail" : "scout"}>
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
              onChange={(event) => setStateFilter(event.target.value as StateFilter)}
              aria-label="Filter by state"
            >
              <option value="all">All states ({stateCounts.all})</option>
              {(["SD", "ND", "NE"] as const).map((s) => (
                <option key={s} value={s}>
                  {STATE_LABEL[s]} ({stateCounts[s]})
                </option>
              ))}
            </select>
            <select
              value={speciesFilter}
              onChange={(event) => setSpeciesFilter(event.target.value)}
              aria-label="Filter by species"
            >
              <option value="all">All species ({speciesCounts.all})</option>
              {SPECIES.map((species) => (
                <option key={species} value={species}>
                  {species === "Deer" ? "Deer / Whitetail" : species} ({speciesCounts[species]})
                </option>
              ))}
            </select>
          </div>
          <div className="chip-row">
            <button
              type="button"
              className={savedOnly ? "chip is-on" : "chip"}
              aria-pressed={savedOnly}
              onClick={() => setSavedOnly((v) => !v)}
            >
              <Star strokeWidth={1.75} aria-hidden="true" />
              Saved ({favorites.size})
            </button>
            <button
              type="button"
              className={userPos ? "chip is-on" : "chip"}
              aria-pressed={!!userPos}
              onClick={() => (userPos ? setUserPos(null) : locate())}
              disabled={locating}
            >
              <LocateFixed strokeWidth={1.75} aria-hidden="true" />
              {locating ? "Locating…" : userPos ? "Nearest first" : "Near me"}
            </button>
            {filtersOn ? (
              <button type="button" className="text-btn" onClick={clearFilters}>
                Clear filters
              </button>
            ) : null}
          </div>
          {locateError ? (
            <p className="hint" role="status">
              {locateError}
            </p>
          ) : null}
        </div>

        {filtered.length === 0 ? (
          <div className="lodge-list">
            <div className="empty-state">
              <p>
                {savedOnly && favorites.size === 0
                  ? "No saved lodges yet."
                  : "No lodges match that search."}
              </p>
              <button type="button" className="solid-btn" onClick={clearFilters}>
                Show every lodge
              </button>
            </div>
          </div>
        ) : (
          <ul className="lodge-list" aria-label="Lodges">
            {filtered.map((lodge) => (
              <li key={lodge.id} className="lodge-item">
                <button
                  type="button"
                  className={selected?.id === lodge.id ? "lodge-card is-active" : "lodge-card"}
                  aria-current={selected?.id === lodge.id ? "true" : undefined}
                  onClick={() => setSelected(lodge)}
                >
                  <span className="lodge-name">{lodge.name}</span>
                  {lodge.photo && !brokenPhotos.has(lodge.id) ? (
                    <img
                      className="lodge-photo"
                      src={lodge.photo}
                      alt={`${lodge.name}`}
                      loading="lazy"
                      decoding="async"
                      width={800}
                      height={533}
                      onError={() => markPhotoBroken(lodge.id)}
                    />
                  ) : null}
                  <span className="lodge-meta">
                    {lodge.city}, {lodge.state}
                    {distance(lodge) ? ` · ${distance(lodge)}` : ""}
                  </span>
                  <span className="lodge-species">{lodge.species.join(" · ")}</span>
                </button>
                <button
                  type="button"
                  className={favorites.has(lodge.id) ? "fav-btn is-on" : "fav-btn"}
                  aria-pressed={favorites.has(lodge.id)}
                  aria-label={`${favorites.has(lodge.id) ? "Unsave" : "Save"} ${lodge.name}`}
                  onClick={() => toggleFavorite(lodge.id)}
                >
                  <Star strokeWidth={1.75} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <p className="scout-foot" aria-live="polite">
          {filtered.length} of {lodges.length} lodges · directory info, confirm before you book
        </p>
      </aside>

      <section className="map-wrap" aria-label="Lodge map">
        <div id="map" ref={mapContainer} />
        {!tilesLoaded && !mapError ? (
          <div className="map-status is-loading" role="status">
            Loading map tiles… {filtered.length} lodges are in the list.
          </div>
        ) : null}
        {mapError ? (
          <div className="map-status is-error" role="alert">
            <p>{mapError}</p>
          </div>
        ) : null}
      </section>

      {selected ? (
        <article className="detail-card" aria-labelledby="detail-title">
          <button
            type="button"
            className="icon-btn"
            onClick={() => setSelected(null)}
            aria-label="Close details"
          >
            <X strokeWidth={1.75} />
          </button>
          <p className="detail-place">
            {selected.city}, {STATE_LABEL[selected.state]}
            {distance(selected) ? ` · ${distance(selected)} away` : ""}
          </p>
          <h2 id="detail-title" ref={detailHeadingRef} tabIndex={-1}>
            {selected.name}
          </h2>
          <div className="detail-actions">
            {call ? (
              <a className="action-btn" href={call} onClick={onCallClick}>
                <Phone strokeWidth={1.75} aria-hidden="true" />
                Call
              </a>
            ) : null}
            <a
              className="action-btn"
              href={directionsHref(selected)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Navigation strokeWidth={1.75} aria-hidden="true" />
              Directions
            </a>
            <button
              type="button"
              className={favorites.has(selected.id) ? "action-btn is-on" : "action-btn"}
              aria-pressed={favorites.has(selected.id)}
              onClick={() => toggleFavorite(selected.id)}
            >
              <Star strokeWidth={1.75} aria-hidden="true" />
              {favorites.has(selected.id) ? "Saved" : "Save"}
            </button>
          </div>
          {copiedPhone ? (
            <p className="copy-note" role="status">
              Number copied. Paste it into your phone.
            </p>
          ) : null}
          {selected.photo && !brokenPhotos.has(selected.id) ? (
            <img
              className="detail-photo"
              src={selected.photo}
              alt={`${selected.name}`}
              decoding="async"
              onError={() => markPhotoBroken(selected.id)}
            />
          ) : null}
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
            <p>
              <Phone strokeWidth={1.75} aria-hidden="true" />
              {selected.phone}
            </p>
            {selected.website ? (
              <a href={selected.website} target="_blank" rel="noopener noreferrer">
                Visit website
              </a>
            ) : null}
            {selected.locationNote ? <p className="detail-note">{selected.locationNote}</p> : null}
            {selected.verified ? (
              <p className="detail-note">Info checked {formatVerified(selected.verified)}</p>
            ) : null}
          </div>
        </article>
      ) : null}
    </div>
  );
}
