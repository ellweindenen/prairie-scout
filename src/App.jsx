import { useState, useEffect, useRef } from 'react'
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

  const filtered = lodges.filter(l => {
    const matchSearch = l.name.toLowerCase().includes(search.toLowerCase()) ||
                        l.city.toLowerCase().includes(search.toLowerCase())
    const matchState = stateFilter === 'all' || l.state === stateFilter
    const matchSpecies = speciesFilter === 'all' || l.species.some(s => s.toLowerCase().includes(speciesFilter.toLowerCase()))
    return matchSearch && matchState && matchSpecies
  })

  useEffect(() => {
    if (map.current) return

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      center: [-99.5, 44.5],
      zoom: 5.5
    })

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right')

    return () => map.current?.remove()
  }, [])

  useEffect(() => {
    if (!map.current) return

    markers.current.forEach(m => m.remove())
    markers.current = []

    filtered.forEach(lodge => {
      const el = document.createElement('div')
      el.className = 'marker'
      el.style.cssText = `
        width: 28px; height: 28px;
        background: #c4a574;
        border: 2px solid #fff;
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 2px 6px rgba(0,0,0,0.4);
      `

      const marker = new maplibregl.Marker(el)
        .setLngLat([lodge.lng, lodge.lat])
        .addTo(map.current)

      el.addEventListener('click', () => {
        setSelected(lodge)
        map.current.flyTo({ center: [lodge.lng, lodge.lat], zoom: 8, duration: 800 })
      })

      markers.current.push(marker)
    })
  }, [filtered])

  const selectLodge = (lodge) => {
    setSelected(lodge)
    if (map.current) {
      map.current.flyTo({ center: [lodge.lng, lodge.lat], zoom: 8, duration: 800 })
    }
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
            placeholder="Search lodges or towns..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className="filters">
            <select value={stateFilter} onChange={e => setStateFilter(e.target.value)}>
              <option value="all">All States</option>
              <option value="SD">South Dakota</option>
              <option value="ND">North Dakota</option>
              <option value="NE">Nebraska</option>
            </select>
            <select value={speciesFilter} onChange={e => setSpeciesFilter(e.target.value)}>
              <option value="all">All Species</option>
              <option value="waterfowl">Waterfowl</option>
              <option value="pheasant">Pheasant</option>
              <option value="deer">Deer</option>
              <option value="whitetail">Whitetail</option>
            </select>
          </div>
        </div>

        <div className="lodge-list">
          {filtered.map(lodge => (
            <div
              key={lodge.id}
              className={`lodge-card ${selected?.id === lodge.id ? 'active' : ''}`}
              onClick={() => selectLodge(lodge)}
            >
              <h3>{lodge.name}</h3>
              <div className="meta">
                <span>{lodge.city}, {lodge.state}</span>
              </div>
              <div className="species">{lodge.species.join(' · ')}</div>
            </div>
          ))}
          {filtered.length === 0 && (
            <p style={{ textAlign: 'center', color: 'var(--muted)', padding: 20 }}>
              No lodges match your filters.
            </p>
          )}
        </div>
      </aside>

      <main className="map-container">
        <div id="map" ref={mapContainer} />

        {selected && (
          <div className="detail-panel">
            <button className="close" onClick={() => setSelected(null)}>×</button>
            <h2>{selected.name}</h2>
            <p><strong>{selected.city}, {selected.state}</strong></p>
            <p>{selected.description}</p>
            <p><strong>Species:</strong> {selected.species.join(', ')}</p>
            <p><strong>Amenities:</strong> {selected.amenities.join(', ')}</p>
            <div className="contact">
              <strong>Contact:</strong><br />
              {selected.phone}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
