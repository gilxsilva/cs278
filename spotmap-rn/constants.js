export const CATEGORIES = [
  { id: 'study',         label: 'Study',       icon: '📚', color: '#a78bfa' },
  { id: 'food',          label: 'Food',         icon: '🍜', color: '#fb923c' },
  { id: 'coffee',        label: 'Coffee',       icon: '☕', color: '#fbbf24' },
  { id: 'events',        label: 'Events',       icon: '🎭', color: '#34d399' },
  { id: 'hidden',        label: 'Hidden gem',   icon: '💎', color: '#f472b6' },
  { id: 'entertainment', label: 'Fun',          icon: '🎮', color: '#60a5fa' },
];

export const getCat = (id) => CATEGORIES.find(c => c.id === id) || CATEGORIES[0];

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
    bg:       '#f5f3ee',
    surface:  '#eceae4',
    surface2: '#e0ddd6',
    border:   'rgba(0,0,0,0.10)',
    text:     '#0f0f0f',
    muted:    'rgba(15,15,15,0.45)',
    accent:   '#7ab800',
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
