import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import Login from './pages/Login';
import MapView from './pages/MapView';
import AddPin from './pages/AddPin';
import PinDetail from './pages/PinDetail';
import './App.css';

export default function App() {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u || null));
    return unsub;
  }, []);

  if (user === undefined) return (
    <div className="splash">
      <div className="splash-logo">spot</div>
    </div>
  );

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        <Route path="/" element={user ? <MapView user={user} /> : <Navigate to="/login" />} />
        <Route path="/add" element={user ? <AddPin user={user} /> : <Navigate to="/login" />} />
        <Route path="/pin/:id" element={user ? <PinDetail user={user} /> : <Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}
