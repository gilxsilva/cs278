import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';
import { db, auth } from '../firebase';
import { CATEGORIES, getCat } from '../constants';

const CENTER = [37.4275, -122.1697]; // Stanford

function MapLayer({ pins, setSelectedPin }) {
  const map = useMapEvents({
    click: () => setSelectedPin(null),
  });

  useEffect(() => {
    const markers = pins.map(pin => {
      const c = getCat(pin.category);
      const icon = L.divIcon({
        className: '',
        html: `<div class="map-marker" style="background-color:${c.color}"><span>${c.icon}</span></div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });
      return L.marker([pin.lat, pin.lng], { icon })
        .addTo(map)
        .on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          map.panTo([pin.lat, pin.lng]);
          setSelectedPin(pin);
        });
    });
    return () => markers.forEach(m => m.remove());
  }, [map, pins, setSelectedPin]);

  return null;
}

const TILE_DARK  = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const TILE_LIGHT = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

export default function MapView({ user, theme, toggleTheme }) {
  const [pins, setPins] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedPin, setSelectedPin] = useState(null);
  const previewRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(collection(db, 'pins'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, snap => {
      setPins(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, []);

  const filtered = activeCategory === 'all'
    ? pins
    : pins.filter(p => p.category === activeCategory);

  const cat = selectedPin ? getCat(selectedPin.category) : null;

  return (
    <div className="map-page">
      <MapContainer
        center={CENTER}
        zoom={15}
        style={{ position: 'absolute', inset: 0, zIndex: 0 }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer url={theme === 'dark' ? TILE_DARK : TILE_LIGHT} />
        <MapLayer pins={filtered} setSelectedPin={setSelectedPin} />
      </MapContainer>

      <div className="top-bar">
        <div className="top-row">
          <span className="wordmark">spot</span>
          <button className="theme-toggle-btn" onClick={toggleTheme} title="Toggle theme">
            {theme === 'dark' ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
          </button>
          <button className="avatar-btn" onClick={() => signOut(auth)}>
            {user.photoURL
              ? <img src={user.photoURL} alt={user.displayName} referrerPolicy="no-referrer" />
              : <span style={{ fontSize: 16 }}>👤</span>
            }
          </button>
        </div>
        <div className="cat-scroll">
          <div
            className={`cat-chip ${activeCategory === 'all' ? 'active' : ''}`}
            onClick={() => setActiveCategory('all')}
          >
            All spots
          </div>
          {CATEGORIES.map(c => (
            <div
              key={c.id}
              className={`cat-chip ${activeCategory === c.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(c.id)}
            >
              <span className="dot" style={{ background: c.color }} />
              {c.label}
            </div>
          ))}
        </div>
      </div>

      <button className="fab" onClick={() => navigate('/add')}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      <div className={`pin-preview ${selectedPin ? 'open' : ''}`} ref={previewRef}>
        <div className="sheet-handle" />
        {selectedPin && cat && (
          <>
            <div className="preview-inner">
              {selectedPin.photoURL
                ? <img className="preview-photo" src={selectedPin.photoURL} alt="" />
                : <div className="preview-photo-placeholder">{cat.icon}</div>
              }
              <div className="preview-info">
                <div className="preview-cat" style={{ color: cat.color }}>
                  {cat.icon} {cat.label}
                </div>
                <div className="preview-title">{selectedPin.title}</div>
                {selectedPin.note && (
                  <div className="preview-note">"{selectedPin.note}"</div>
                )}
                <div className="preview-by">
                  <img className="by-avatar" src={selectedPin.authorPhoto} alt="" referrerPolicy="no-referrer" />
                  <span className="by-name">pinned by {selectedPin.authorName?.split(' ')[0]}</span>
                </div>
              </div>
            </div>
            <Link to={`/pin/${selectedPin.id}`} className="view-btn">
              see full pin
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
