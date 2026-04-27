import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleMap, useJsApiLoader, OverlayView } from '@react-google-maps/api';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';
import { db, auth } from '../firebase';
import { CATEGORIES, getCat, GOOGLE_MAPS_API_KEY, MAP_STYLES } from '../constants';

const CENTER = { lat: 37.4275, lng: -122.1697 }; // Stanford

export default function MapView({ user }) {
  const [pins, setPins] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedPin, setSelectedPin] = useState(null);
  const [mapRef, setMapRef] = useState(null);
  const previewRef = useRef(null);
  const navigate = useNavigate();

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  });

  useEffect(() => {
    const q = query(collection(db, 'pins'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, snap => {
      setPins(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, []);

  const filtered = activeCategory === 'all'
    ? pins
    : pins.filter(p => p.category === activeCategory);

  const handleMarkerClick = useCallback((pin) => {
    setSelectedPin(pin);
    if (mapRef) {
      mapRef.panTo({ lat: pin.lat, lng: pin.lng });
    }
  }, [mapRef]);

  const handleMapClick = () => setSelectedPin(null);

  const cat = selectedPin ? getCat(selectedPin.category) : null;

  return (
    <div className="map-page">
      {isLoaded ? (
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={CENTER}
          zoom={15}
          options={{
            styles: MAP_STYLES,
            disableDefaultUI: true,
            clickableIcons: false,
          }}
          onLoad={map => setMapRef(map)}
          onClick={handleMapClick}
        >
          {filtered.map(pin => {
            const c = getCat(pin.category);
            return (
              <OverlayView
                key={pin.id}
                position={{ lat: pin.lat, lng: pin.lng }}
                mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
              >
                <div
                  className="map-marker"
                  style={{ backgroundColor: c.color }}
                  onClick={(e) => { e.stopPropagation(); handleMarkerClick(pin); }}
                >
                  <span>{c.icon}</span>
                </div>
              </OverlayView>
            );
          })}
        </GoogleMap>
      ) : (
        <div style={{ flex: 1, background: '#1a1a1a' }} />
      )}

      <div className="top-bar">
        <div className="top-row">
          <span className="wordmark">spot</span>
          <button className="avatar-btn" onClick={() => signOut(auth)}>
            <img src={user.photoURL} alt={user.displayName} referrerPolicy="no-referrer" />
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
