import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { getCat } from '../constants';

export default function PinDetail({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pin, setPin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDoc(doc(db, 'pins', id)).then(d => {
      if (d.exists()) setPin({ id: d.id, ...d.data() });
      setLoading(false);
    });
  }, [id]);

  if (loading) return (
    <div className="splash"><div className="splash-logo">spot</div></div>
  );

  if (!pin) return (
    <div className="page">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      </div>
      <div className="empty-state">
        <span className="icon">📍</span>
        <p>Pin not found</p>
      </div>
    </div>
  );

  const cat = getCat(pin.category);
  const date = pin.createdAt?.toDate?.()?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div className="page" style={{ overflowY: 'auto' }}>
      <div style={{ position: 'relative' }}>
        {pin.photoURL
          ? <img className="pin-detail-photo" src={pin.photoURL} alt={pin.title} />
          : <div className="pin-detail-photo-placeholder">{cat.icon}</div>
        }
        <button
          className="back-btn"
          onClick={() => navigate('/')}
          style={{ position: 'absolute', top: 16, left: 16, background: 'rgba(15,15,15,0.7)', backdropFilter: 'blur(8px)' }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      </div>

      <div className="detail-body">
        <div className="detail-cat" style={{ color: cat.color }}>
          {cat.icon} {cat.label}
        </div>

        <h1 className="detail-title">{pin.title}</h1>

        {pin.note && (
          <p className="detail-note">{pin.note}</p>
        )}

        <div className="detail-who">
          <img src={pin.authorPhoto} alt={pin.authorName} referrerPolicy="no-referrer" />
          <div className="detail-who-info">
            <p>{pin.authorName}</p>
            <span>pinned{date ? ` · ${date}` : ''}</span>
          </div>
        </div>

        {pin.locationName && (
          <div className="detail-location">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            {pin.locationName}
          </div>
        )}
      </div>
    </div>
  );
}
