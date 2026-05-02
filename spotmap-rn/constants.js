export const CATEGORIES = [
  { id: 'study', label: 'Study', icon: 'book-outline', color: '#7A9FC2', base: '#5B7FA6' },
  { id: 'food', label: 'Food', icon: 'restaurant-outline', color: '#D4939B', base: '#B8626C' },
  { id: 'coffee', label: 'Coffee', icon: 'cafe-outline', color: '#C9A96E', base: '#A07C40' },
  { id: 'events', label: 'Events', icon: 'sparkles-outline', color: '#A98BBE', base: '#7E5E9A' },
  { id: 'hidden', label: 'Hidden gem', icon: 'diamond-outline', color: '#D47FA6', base: '#B8626C' },
  { id: 'entertainment', label: 'Fun', icon: 'game-controller-outline', color: '#7A9FC2', base: '#4E7BA0' },
];

export const getCat = (id) => CATEGORIES.find(c => c.id === id) || CATEGORIES[0];

export const getPinCat = (categoryId) => PIN_CATS[categoryId] ?? PIN_CATS.default;

export const STANFORD = { latitude: 37.4275, longitude: -122.1697 };

export const NEARBY_PLACES = [
  { name: 'Green Library',    address: 'Stanford Libraries',              latitude: 37.4264, longitude: -122.1673 },
  { name: 'Coupa Café',       address: 'School of Business, Stanford',    latitude: 37.4281, longitude: -122.1651 },
  { name: 'Meyer Library',    address: 'Stanford University',             latitude: 37.4267, longitude: -122.1680 },
  { name: 'The Axe & Palm',   address: 'Stanford, CA',                    latitude: 37.4295, longitude: -122.1698 },
  { name: 'Cantor Arts Center', address: '328 Lomita Dr, Stanford',       latitude: 37.4343, longitude: -122.1669 },
  { name: 'Dish Trail',       address: 'Stanford, CA',                    latitude: 37.4085, longitude: -122.1693 },
  { name: "Zareen's",         address: '1026 N California Ave, Palo Alto', latitude: 37.4489, longitude: -122.1463 },
  { name: 'Philz Coffee',     address: '855 El Camino Real, Palo Alto',   latitude: 37.4421, longitude: -122.1601 },
];

export const THEMES = {
  dark: {
    bg:       '#0f0f0f',
    surface:  '#1a1a1a',
    surface2: '#242424',
    border:   'rgba(255,255,255,0.08)',
    text:     '#f0ede8',
    muted:    'rgba(240,237,232,0.45)',
    accent:   '#c8f04a',
  },
  light: {
    bg:       '#ffffff',
    surface:  '#ffffff',
    surface2: '#f8f9fa',   // very subtle elevation instead of tint
    border:   'rgba(0,0,0,0.06)',
    text:     '#0f0f0f',
    muted:    'rgba(15,15,15,0.45)',
    accent:   '#3b5e7a',
  },
};

export const MAP_STYLES_DARK = [
  { elementType: 'geometry', stylers: [{ color: '#1a1a1a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0f0f0f' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#263c3f' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#746855' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#515c6d' }] },
];
export const MAP_STYLES_LIGHT = [
  // Base: Bright Paper White (Kills the brown immediately)
  { elementType: 'geometry', stylers: [{ color: '#FFFFFF' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#1A1A1A' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#FFFFFF' }] },

  // Roads: Light Cloud (Very light blue-tinted white for freshness)
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#F1F5F9' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#E2E8F0' }] },
  { featureType: 'road.local', elementType: 'labels.text.fill', stylers: [{ color: '#94A3B8' }] },

  // Highways: Lavender-Blue (Adds color without being brown/gray)
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#E0E7FF' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#C7D2FE' }] },

  // Water: Pure Sky Blue (Clear and punchy)
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#BAE6FD' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#0369A1' }] },

  // Parks: Emerald Mint (Vivid and fresh)
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#BBF7D0' }] },
  { featureType: 'poi.park', elementType: 'labels', stylers: [{ visibility: 'off' }] },

  // Natural land: Ultra-light Sage
  { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#F0FDF4' }] },

  // POI & Man-made: Very subtle cool tint
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#F8FAFC' }] },
  { featureType: 'landscape.man_made', elementType: 'geometry', stylers: [{ color: '#F1F5F9' }] },

  // Administrative
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#CBD5E1' }] },
];