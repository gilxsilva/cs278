import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { CATEGORIES } from '../constants';

const STANFORD = { lat: 37.4275, lng: -122.1697 };

const NEARBY_PLACES = [
  { name: 'Green Library', address: 'Stanford Libraries', lat: 37.4264, lng: -122.1673 },
  { name: 'Coupa Café', address: 'School of Business, Stanford', lat: 37.4281, lng: -122.1651 },
  { name: 'Meyer Library', address: 'Stanford University', lat: 37.4267, lng: -122.1680 },
  { name: 'The Axe & Palm', address: 'Stanford, CA', lat: 37.4295, lng: -122.1698 },
  { name: 'Cantor Arts Center', address: '328 Lomita Dr, Stanford', lat: 37.4343, lng: -122.1669 },
  { name: 'Dish Trail', address: 'Stanford, CA', lat: 37.4085, lng: -122.1693 },
  { name: 'Zareen\'s', address: '1026 N California Ave, Palo Alto', lat: 37.4489, lng: -122.1463 },
  { name: 'Philz Coffee', address: '855 El Camino Real, Palo Alto', lat: 37.4421, lng: -122.1601 },
  { name: 'Current location', address: 'Use GPS location', lat: STANFORD.lat, lng: STANFORD.lng },
];

export default function AddPin({ user }) {
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [category, setCategory] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [location, setLocation] = useState(null);
  const [showLocModal, setShowLocModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');
  const fileRef = useRef();
  const navigate = useNavigate();

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPhoto(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!title || !category || !location) return showToast('Fill in title, category & location');
    setLoading(true);
    try {
      let photoURL = null;
      if (photoFile) {
        const storageRef = ref(storage, `pins/${Date.now()}_${photoFile.name}`);
        await uploadBytes(storageRef, photoFile);
        photoURL = await getDownloadURL(storageRef);
      }
      await addDoc(collection(db, 'pins'), {
        title: title.trim(),
        note: note.trim(),
        category,
        photoURL,
        lat: location.lat,
        lng: location.lng,
        locationName: location.name,
        authorId: user.uid,
        authorName: user.displayName,
        authorPhoto: user.photoURL,
        createdAt: serverTimestamp(),
      });
      navigate('/');
    } catch (e) {
      console.error(e);
      showToast('Something went wrong');
      setLoading(false);
    }
  };

  const canSubmit = title && category && location && !loading;

  return (
    <div className="page">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span className="page-title">drop a pin</span>
      </div>

      <div className="page-scroll">
        <div className="field">
          <label className="field-label">spot name</label>
          <input
            className="field-input"
            placeholder="e.g. Moffitt 3rd floor"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
        </div>

        <div className="field">
          <label className="field-label">category</label>
          <div className="cat-grid">
            {CATEGORIES.map(c => (
              <div
                key={c.id}
                className={`cat-option ${category === c.id ? 'selected' : ''}`}
                onClick={() => setCategory(c.id)}
                style={category === c.id ? { borderColor: c.color } : {}}
              >
                <span className="icon">{c.icon}</span>
                <span className="label">{c.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="field">
          <label className="field-label">your note</label>
          <textarea
            className="field-input"
            placeholder="what would you tell a friend? e.g. 'go after 3pm, way quieter'"
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={3}
          />
        </div>

        <div className="field">
          <label className="field-label">photo (optional)</label>
          {photo ? (
            <div className="photo-preview">
              <img src={photo} alt="" />
              <button className="photo-remove" onClick={() => { setPhoto(null); setPhotoFile(null); }}>✕</button>
            </div>
          ) : (
            <div className="photo-upload" onClick={() => fileRef.current.click()}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <span>tap to add a photo</span>
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhoto} />
        </div>

        <div className="field">
          <label className="field-label">location</label>
          <div className="location-row" onClick={() => setShowLocModal(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span className={location ? 'loc-text' : ''}>
              {location ? location.name : 'choose a location'}
            </span>
          </div>
        </div>
      </div>

      <button className="submit-btn" disabled={!canSubmit} onClick={handleSubmit}>
        {loading ? 'dropping...' : 'drop pin on map'}
      </button>

      {showLocModal && (
        <div className="location-modal-overlay" onClick={() => setShowLocModal(false)}>
          <div className="location-modal" onClick={e => e.stopPropagation()}>
            <p className="loc-modal-title">pick a location</p>
            {NEARBY_PLACES.map((place, i) => (
              <div key={i} className="loc-option" onClick={() => { setLocation(place); setShowLocModal(false); }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <div className="loc-option-info">
                  <p>{place.name}</p>
                  <span>{place.address}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={`toast ${toast ? 'show' : ''}`}>{toast}</div>
    </div>
  );
}
