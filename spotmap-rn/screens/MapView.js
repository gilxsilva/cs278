import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Image,
  StyleSheet, Animated,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { CATEGORIES, getCat, STANFORD, MAP_STYLES_DARK, MAP_STYLES_LIGHT, THEMES } from '../constants';
import { USE_MOCK_DATA, MOCK_PINS } from '../mockData';

const PREVIEW_H = 200;

export default function MapScreen({ navigation, user, theme, toggleTheme }) {
  const [pins, setPins] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedPin, setSelectedPin] = useState(null);
  const [region, setRegion] = useState({
    ...STANFORD,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  });
  const mapRef = useRef(null);
  const slideAnim = useRef(new Animated.Value(PREVIEW_H)).current;
  const t = THEMES[theme];

  useEffect(() => {
    if (USE_MOCK_DATA) {
      setPins(MOCK_PINS);
      return;
    }
    const q = query(collection(db, 'pins'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, snap => {
      setPins(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, err => console.error('Map snapshot error:', err));
  }, []);

  const zoomIn = () => {
    const next = { ...region, latitudeDelta: region.latitudeDelta / 2, longitudeDelta: region.longitudeDelta / 2 };
    mapRef.current?.animateToRegion(next, 250);
    setRegion(next);
  };

  const zoomOut = () => {
    const next = { ...region, latitudeDelta: region.latitudeDelta * 2, longitudeDelta: region.longitudeDelta * 2 };
    mapRef.current?.animateToRegion(next, 250);
    setRegion(next);
  };

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: selectedPin ? 0 : PREVIEW_H,
      useNativeDriver: true,
      bounciness: 4,
    }).start();
  }, [selectedPin]);

  const filtered = activeCategory === 'all'
    ? pins
    : pins.filter(p => p.category === activeCategory);

  const handleMarkerPress = (pin) => {
    setSelectedPin(pin);
    mapRef.current?.animateToRegion({
      latitude: pin.lat,
      longitude: pin.lng,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }, 400);
  };

  const cat = selectedPin ? getCat(selectedPin.category) : null;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFill}
        initialRegion={region}
        userInterfaceStyle={theme}
        customMapStyle={theme === 'dark' ? MAP_STYLES_DARK : MAP_STYLES_LIGHT}
        onPress={() => setSelectedPin(null)}
        onRegionChangeComplete={setRegion}
        showsUserLocation
        showsCompass={false}
        toolbarEnabled={false}
      >
        {filtered.map(pin => {
          const c = getCat(pin.category);
          const isSelected = selectedPin?.id === pin.id;
          return (
            <Marker
              key={pin.id}
              coordinate={{ latitude: pin.lat, longitude: pin.lng }}
              onPress={() => handleMarkerPress(pin)}
              tracksViewChanges={isSelected}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View style={[
            styles.pinOuter,
            { backgroundColor: c.base + '20' },
          ]}>
            <View style={[
              styles.pinInner,
              {
                backgroundColor: isSelected ? c.base : '#fff',
                borderColor: c.base + '80',
              }
            ]}>
              <Ionicons
                name={c.icon}
                size={14}
                color={isSelected ? '#fff' : c.base}
              />
            </View>
          </View>
            </Marker>
          );
        })}
      </MapView>

      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={styles.topRow}>
          <Text style={[styles.wordmark, { color: '#405973' }]}>spot</Text>
          <View style={styles.topRight}>
            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: t.accent, borderColor: t.accent }]}
              onPress={() => navigation.navigate('AddPin')}
            >
              <Ionicons name="add" size={20} color="#ffffff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.avatarBtn, { backgroundColor: t.surface, borderColor: t.accent }]}
              onPress={() => navigation.navigate('Profile', { user })}
            >
              {user.photoURL
                ? <Image source={{ uri: user.photoURL }} style={styles.avatarImg} />
                : <Text style={styles.avatarFallback}>👤</Text>
              }
            </TouchableOpacity>
          </View>
        </View>

        {/* Category chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catScroll}
        >
          <TouchableOpacity
            style={[styles.chip, activeCategory === 'all' && styles.chipActive,
              { backgroundColor: theme === 'dark' ? 'rgba(15,15,15,0.85)' : 'rgba(245,243,238,0.92)',
                borderColor: activeCategory === 'all' ? t.text : t.border }]}
            onPress={() => setActiveCategory('all')}
          >
            <Text style={[styles.chipText, { color: activeCategory === 'all' ? t.text : t.muted }]}>
              All spots
            </Text>
          </TouchableOpacity>
          {CATEGORIES.map(c => (
            <TouchableOpacity
              key={c.id}
              style={[styles.chip,
                { backgroundColor: theme === 'dark' ? 'rgba(15,15,15,0.85)' : 'rgba(245,243,238,0.92)',
                  borderColor: activeCategory === c.id ? t.text : t.border }]}
              onPress={() => setActiveCategory(c.id)}
            >
              <Ionicons name={c.icon} size={14} color={activeCategory === c.id ? t.text : c.color} />
              <Text style={[styles.chipText, { color: activeCategory === c.id ? t.text : t.muted }]}>
                {c.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Zoom controls */}
      <View style={styles.zoomControls}>
        <TouchableOpacity
          style={[styles.zoomBtn, { backgroundColor: t.surface, borderColor: t.border }]}
          onPress={zoomIn}
          activeOpacity={0.75}
        >
          <Ionicons name="add" size={20} color={t.text} />
        </TouchableOpacity>
        <View style={[styles.zoomDivider, { backgroundColor: t.border }]} />
        <TouchableOpacity
          style={[styles.zoomBtn, { backgroundColor: t.surface, borderColor: t.border }]}
          onPress={zoomOut}
          activeOpacity={0.75}
        >
          <Ionicons name="remove" size={20} color={t.text} />
        </TouchableOpacity>
      </View>

      {/* Pin preview sheet */}
      <Animated.View
        style={[styles.sheet, { backgroundColor: t.surface, borderColor: t.border },
          { transform: [{ translateY: slideAnim }] }]}
      >
        <View style={[styles.handle, { backgroundColor: t.border }]} />
        {selectedPin && cat && (
          <>
            <View style={styles.previewInner}>
              {selectedPin.photoURL
                ? <Image source={{ uri: selectedPin.photoURL }} style={styles.previewPhoto} />
                : <View style={[styles.previewPhotoPlaceholder, { backgroundColor: t.surface2 }]}>
                    <Ionicons name={cat.icon} size={26} color={cat.color} />
                  </View>
              }
              <View style={styles.previewInfo}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                  <Ionicons name={cat.icon} size={11} color={cat.color} />
                  <Text style={[styles.previewCat, { color: cat.color, marginBottom: 0 }]}>
                    {cat.label.toUpperCase()}
                  </Text>
                </View>
                <Text style={[styles.previewTitle, { color: t.text }]} numberOfLines={1}>
                  {selectedPin.title}
                </Text>
                {selectedPin.note ? (
                  <Text style={[styles.previewNote, { color: t.muted }]} numberOfLines={1}>
                    "{selectedPin.note}"
                  </Text>
                ) : null}
                <View style={styles.previewBy}>
                  {selectedPin.authorPhoto
                    ? <Image source={{ uri: selectedPin.authorPhoto }} style={styles.byAvatar} />
                    : null}
                  <Text style={[styles.byName, { color: t.muted }]}>
                    pinned by {selectedPin.authorName?.split(' ')[0]}
                  </Text>
                </View>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.viewBtn, { backgroundColor: t.accent }]}
              onPress={() => navigation.navigate('PinDetail', { pinId: selectedPin.id })}
              activeOpacity={0.85}
            >
              <Text style={styles.viewBtnText}>see full pin</Text>
            </TouchableOpacity>
          </>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  pinOuter: {
  width: 40,
  height: 40,
  borderRadius: 20,
  alignItems: 'center',
  justifyContent: 'center',
  },
  pinOuterSelected: {
    width: 46, height: 46, borderRadius: 23,
    shadowOpacity: 0.38, shadowRadius: 12,
  },
  pinInner: {
  width: 28,
  height: 28,
  borderRadius: 14,
  alignItems: 'center',
  justifyContent: 'center',
  borderWidth: 1,
  shadowColor: '#000',
  shadowOpacity: 0.15,
  shadowRadius: 6,
  shadowOffset: { width: 0, height: 2 },
  elevation: 3,
  },
  pinInnerSelected: {
    width: 32, height: 32, borderRadius: 16,
  },

  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    paddingTop: 56, paddingBottom: 12, paddingHorizontal: 16, gap: 10,
    backgroundColor: '#ffffff',
    shadowColor: '#000', shadowOpacity: 0.10, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 5,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  wordmark: { fontSize: 28, fontWeight: '800', letterSpacing: -1 },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  iconBtnText: { fontSize: 16 },
  avatarBtn: { width: 38, height: 38, borderRadius: 19, overflow: 'hidden', borderWidth: 0, alignItems: 'center', justifyContent: 'center' },
  avatarImg: { width: 38, height: 38 },
  avatarFallback: { fontSize: 16 },

  zoomControls: {
    position: 'absolute', right: 16, bottom: 120,
    borderRadius: 14, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 4,
  },
  zoomBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  zoomDivider: { height: 1 },

  catScroll: { gap: 8, paddingBottom: 4 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 100, paddingVertical: 7, paddingHorizontal: 14 },
  chipActive: {},
  chipText: { fontSize: 13, fontWeight: '500' },
  dot: { width: 7, height: 7, borderRadius: 4 },

  sheet: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 1, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 44 },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  previewInner: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  previewPhoto: { width: 64, height: 64, borderRadius: 12 },
  previewPhotoPlaceholder: { width: 64, height: 64, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  placeholderIcon: { fontSize: 26 },
  previewInfo: { flex: 1 },
  previewCat: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 },
  previewTitle: { fontSize: 18, fontWeight: '700', letterSpacing: -0.5, marginBottom: 2 },
  previewNote: { fontSize: 13, fontStyle: 'italic', marginBottom: 8 },
  previewBy: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  byAvatar: { width: 20, height: 20, borderRadius: 10 },
  byName: { fontSize: 12 },
  viewBtn: { marginTop: 14, borderRadius: 100, paddingVertical: 13, alignItems: 'center' },
  viewBtnText: { fontSize: 14, fontWeight: '600', color: '#0f0f0f' },
});
