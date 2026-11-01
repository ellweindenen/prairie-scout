import { useState, useEffect, useRef, useMemo } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { lodges } from './data.js'

export default function App() {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const markers = useRef([])
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState('')
  const [stateFilter, setStateFilter] = useState('all')
  const [speciesFilter, setSpeciesFilter] = useState('all')
  const [mapReady, setMapReady] = useState(false)
  const [mapError, setMapError] = useState(null)

  const filtered = useMemo(() => {
    return lodges.filter(l => {
      const q = search.toLowerCase().trim()
      const matchSearch = !q || 
        l.name.toLowerCase().includes(q) ||
        l.city.toLowerCase().includes(q) ||
        l.state.toLowerCase().includes(q)
      const matchState = stateFilter === 'all' || l.state === stateFilter
      const matchSpecies = speciesFilter === 'all' || 
        l.species.some(s => s.toLowerCase().includes(speciesFilter.toLowerCase()))
      return matchSearch && matchState && matchSpecies
    })
  }, [search, stateFilter, speciesFilter])

  // Initialize map
  useEffect(() => {
    if (map.current || !mapContainer.current) return

    try {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
        center: [-99.5, 44.5],
        zoom: 5.5,
        attributionControl: true
      })

      map.current.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')

      map.current.on('load', () => {
        setMapReady(true)
        setMapError(null)
      })

      map.current.on('error', (e) => {
        console.warn('Map error:', e)
        setMapError('Map failed to load. Check your connection.')
      })

    } catch (err) {
      console.error('Map init failed:', err)
      setMapError('Map could not be initialized.')
    }

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [])

  // Update markers when filtered list or map changes
  useEffect(() => {
    if (!map.current || !mapReady) return

    // Clear old markers
    markers.current.forEach(m => m.remove())
    markers.current = []

    filtered.forEach(lodge => {
      const el = document.createElement('div')
      el.className = 'custom-marker'
      el.innerHTML = `<div class="marker-dot"></div>`
      el.title = lodge.name

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([lodge.lng, lodge.lat])
        .addTo(map.current)

      el.addEventListener('click', (e) => {
        e.stopPropagation()
        setSelected(lodge)
        map.current.flyTo({
          center: [lodge.lng, lodge.lat],
          zoom: 8,
          duration: 800,
          essential: true
        })
      })

      markers.current.push(marker)
    })

    // Fit bounds if we have results and no selection
    if (filtered.length > 0 && !selected) {
      const bounds = new maplibregl.LngLatBounds()
      filtered.forEach(l => bounds.extend([l.lng, l.lat]))
      map.current.fitBounds(bounds, { padding: 60, maxZoom: 7, duration: 800 })
    }
  }, [filtered, mapReady, selected])

  const selectLodge = (lodge) => {
    setSelected(lodge)
    if (map.current && mapReady) {
      map.current.flyTo({
        center: [lodge.lng, lodge.lat],
        zoom: 8,
        duration: 800,
        essential: true
      })
    }
  }

  const clearFilters = () => {
    setSearch('')
    setStateFilter('all')
    setSpeciesFilter('all')
    setSelected(null)
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="header">
          <h1>Prairie Scout</h1>
          <p>Find hunting lodges across the Prairie Pothole Region</p>
        </div>

        <div className="search-bar">
          <input
            type="text"
            placeholder="Search lodges, towns, or states..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label="Search lodges"
          />
          <div className="filters">
            <select value={stateFilter} onChange={e => setStateFilter(e.target.value)} aria-label="Filter by state">
              <option value="all">All States</option>
              <option value="SD">South Dakota</option>
              <option value="ND">North Dakota</option>
              <option value="NE">Nebraska</option>
            </select>
            <select value={speciesFilter} onChange={e => setSpeciesFilter(e.target.value)} aria-label="Filter by species">
              <option value="all">All Species</option>
              <option value="waterfowl">Waterfowl</option>
              <option value="pheasant">Pheasant</option>
              <option value="deer">Deer</option>
              <option value="whitetail">Whitetail</option>
            </select>
          </div>
          {(search || stateFilter !== 'all' || speciesFilter !== 'all') && (
            <button className="clear-btn" onClick={clearFilters}>Clear filters</button>
          )}
        </div>

        <div className="lodge-list">
          {filtered.length === 0 ? (
            <div className="empty-state">
              <p>No lodges match your filters.</p>
              <button onClick={clearFilters}>Show all</button>
            </div>
          ) : (
            filtered.map(lodge => (
              <div
                key={lodge.id}
                className={`lodge-card ${selected?.id === lodge.id ? 'active' : ''}`}
                onClick={() => selectLodge(lodge)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && selectLodge(lodge)}
              >
                <h3>{lodge.name}</h3>
                <div className="meta">
                  <span>{lodge.city}, {lodge.state}</span>
                </div>
                <div className="species">{lodge.species.join(' · ')}</div>
              </div>
            ))
          )}
        </div>

        <div className="footer-note">
          {filtered.length} of {lodges.length} lodges shown · Data for demo only
        </div>
      </aside>

      <main className="map-container">
        <div id="map" ref={mapContainer} />

        {mapError && (
          <div className="map-error">
            <p>{mapError}</p>
            <small>The list still works. Try refreshing if the map is blank.</small>
          </div>
        )}

        {!mapReady && !mapError && (
          <div className="map-loading">Loading map…</div>
        )}

        {selected && (
          <div className="detail-panel">
            <button className="close" onClick={() => setSelected(null)} aria-label="Close details">×</button>
            <h2>{selected.name}</h2>
            <p className="location"><strong>{selected.city}, {selected.state}</strong></p>
            <p>{selected.description}</p>
            <p><strong>Species:</strong> {selected.species.join(', ')}</p>
            <p><strong>Amenities:</strong> {selected.amenities.join(', ')}</p>
            <div className="contact">
              <strong>Contact:</strong><br />
              <a href={`tel:${selected.phone.replace(/[^\d+]/g, '')}`}>{selected.phone}</a>
              {selected.website && (
                <>
                  <br />
                  <a href={selected.website} target="_blank" rel="noopener noreferrer">Visit website</a>
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
