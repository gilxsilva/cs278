import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, Image, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getCat, THEMES } from '../constants';
import { MOCK_PINS, MOCK_USERS } from '../mockData';

const HEADER_BG = '#E4EBF5';

const RECENT_SEARCHES = ['Coupa Café', 'Dish Trail sunset', 'Sightglass', 'hidden study spots', 'SF gems'];

const SUGGESTED_UIDS = ['mock_eva', 'mock_priya', 'mock_jordan', 'mock_maya', 'mock_yujen', 'mock_alex'];

const TOP_SPOTS = MOCK_PINS.filter(p => p.saveCount >= 9).slice(0, 5);

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ label, t }) {
  return (
    <Text style={[styles.sectionLabel, { color: t.muted }]}>{label}</Text>
  );
}

function Divider({ t }) {
  return <View style={[styles.divider, { backgroundColor: t.border }]} />;
}

function PersonRow({ user, onPress, t }) {
  const handle = '@' + (user.displayName?.toLowerCase().replace(/\s/g, '') ?? 'user');
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.72}>
      {user.photoURL
        ? <Image source={{ uri: user.photoURL }} style={styles.personAvatar} />
        : <View style={[styles.personAvatarFallback, { backgroundColor: t.surface2 }]}>
            <Ionicons name="person" size={16} color={t.muted} />
          </View>
      }
      <View style={styles.rowBody}>
        <Text style={[styles.rowTitle, { color: t.text }]}>{user.displayName}</Text>
        <Text style={[styles.rowSub, { color: t.muted }]}>{handle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={t.muted} />
    </TouchableOpacity>
  );
}

function PlaceRow({ pin, onPress, t }) {
  const cat = getCat(pin.category);
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.72}>
      <View style={[styles.placeIcon, { backgroundColor: cat.color + '18' }]}>
        <Ionicons name={cat.icon} size={16} color={cat.color} />
      </View>
      <View style={styles.rowBody}>
        <Text style={[styles.rowTitle, { color: t.text }]} numberOfLines={1}>{pin.title}</Text>
        {pin.locationName
          ? <Text style={[styles.rowSub, { color: t.muted }]} numberOfLines={1}>{pin.locationName}</Text>
          : null}
      </View>
      <Ionicons name="chevron-forward" size={16} color={t.muted} />
    </TouchableOpacity>
  );
}

function RecentRow({ label, onPress, onRemove, t }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.72}>
      <View style={[styles.recentIcon, { backgroundColor: t.surface2 }]}>
        <Ionicons name="time-outline" size={15} color={t.muted} />
      </View>
      <Text style={[styles.rowTitle, { color: t.text, flex: 1 }]}>{label}</Text>
      <TouchableOpacity onPress={onRemove} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} activeOpacity={0.6}>
        <Ionicons name="close" size={15} color={t.muted} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function Search({ navigation, theme, user }) {
  const t = THEMES[theme ?? 'light'];
  const inputRef = useRef(null);
  const [query, setQuery] = useState('');
  const [recents, setRecents] = useState(RECENT_SEARCHES);

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 150);
    return () => clearTimeout(timer);
  }, []);

  const removeRecent = (label) => setRecents(prev => prev.filter(r => r !== label));

  const q = query.trim().toLowerCase();

  const allPeople = Object.values(MOCK_USERS);
  const matchedPeople = q
    ? allPeople.filter(u => u.displayName.toLowerCase().includes(q))
    : [];
  const matchedPins = q
    ? MOCK_PINS.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.locationName ?? '').toLowerCase().includes(q) ||
        (p.note ?? '').toLowerCase().includes(q)
      )
    : [];

  const hasResults = matchedPeople.length > 0 || matchedPins.length > 0;

  const openPerson = (u) => navigation.navigate('Profile', { user: u, isOwnProfile: false });
  const openPin = (pin) => navigation.navigate('PinDetail', { pinId: pin.id, userId: user?.uid });

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: t.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* ── Header + Search Bar ─────────────────────────────────────────── */}
      <SafeAreaView edges={['top']} style={{ backgroundColor: HEADER_BG }}>
        <View style={styles.header}>
          <Image source={require('../assets/logo.png')} style={styles.wordmark} />
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.75}
          >
            <Ionicons name="close" size={20} color="#0D1F3C" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchBarWrap}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={16} color="rgba(28,23,20,0.38)" />
            <TextInput
              ref={inputRef}
              value={query}
              onChangeText={setQuery}
              placeholder="search a friend, location, etc."
              placeholderTextColor="rgba(28,23,20,0.38)"
              style={styles.searchInput}
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="none"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')} activeOpacity={0.6}>
                <Ionicons name="close-circle" size={16} color="rgba(28,23,20,0.38)" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </SafeAreaView>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
      >
        {!q ? (
          /* ── Recommendations (no query) ──────────────────────────────── */
          <View style={[styles.panel, { backgroundColor: t.surface }]}>

            {recents.length > 0 && (
              <>
                <SectionLabel label="Recent" t={t} />
                {recents.map((label, i) => (
                  <React.Fragment key={label}>
                    {i > 0 && <Divider t={t} />}
                    <RecentRow
                      label={label}
                      t={t}
                      onPress={() => setQuery(label)}
                      onRemove={() => removeRecent(label)}
                    />
                  </React.Fragment>
                ))}
                <Divider t={t} />
              </>
            )}

            <SectionLabel label="People" t={t} />
            {SUGGESTED_UIDS.map((uid, i) => {
              const u = MOCK_USERS[uid];
              return (
                <React.Fragment key={uid}>
                  {i > 0 && <Divider t={t} />}
                  <PersonRow user={u} onPress={() => openPerson(u)} t={t} />
                </React.Fragment>
              );
            })}

            <Divider t={t} />

            <SectionLabel label="Top spots" t={t} />
            {TOP_SPOTS.map((pin, i) => (
              <React.Fragment key={pin.id}>
                {i > 0 && <Divider t={t} />}
                <PlaceRow pin={pin} onPress={() => openPin(pin)} t={t} />
              </React.Fragment>
            ))}
          </View>
        ) : hasResults ? (
          /* ── Search results ──────────────────────────────────────────── */
          <View style={[styles.panel, { backgroundColor: t.surface }]}>
            {matchedPeople.length > 0 && (
              <>
                <SectionLabel label="People" t={t} />
                {matchedPeople.map((u, i) => (
                  <React.Fragment key={u.uid}>
                    {i > 0 && <Divider t={t} />}
                    <PersonRow user={u} onPress={() => openPerson(u)} t={t} />
                  </React.Fragment>
                ))}
              </>
            )}

            {matchedPeople.length > 0 && matchedPins.length > 0 && <Divider t={t} />}

            {matchedPins.length > 0 && (
              <>
                <SectionLabel label="Places" t={t} />
                {matchedPins.map((pin, i) => (
                  <React.Fragment key={pin.id}>
                    {i > 0 && <Divider t={t} />}
                    <PlaceRow pin={pin} onPress={() => openPin(pin)} t={t} />
                  </React.Fragment>
                ))}
              </>
            )}
          </View>
        ) : (
          /* ── Empty state ─────────────────────────────────────────────── */
          <View style={styles.emptyState}>
            <Text style={styles.emptyGem}>✦</Text>
            <Text style={[styles.emptyTitle, { color: t.text }]}>No results for "{q}"</Text>
            <Text style={[styles.emptySub, { color: t.muted }]}>Try a name, place, or category</Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 10,
  },
  wordmark: { width: 36, height: 36, borderRadius: 9 },
  closeBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(45,63,92,0.10)',
    alignItems: 'center', justifyContent: 'center',
  },

  // Search bar
  searchBarWrap: { paddingHorizontal: 16, paddingBottom: 14 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 24, paddingHorizontal: 16, paddingVertical: 11,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#1C1714' },

  // Body
  body: { padding: 16, paddingBottom: 40 },

  // Panel
  panel: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', letterSpacing: 0.6,
    textTransform: 'uppercase',
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6,
  },
  divider: { height: 1, marginHorizontal: 16 },

  // Rows
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
  },
  rowBody: { flex: 1 },
  rowTitle: { fontSize: 14, fontWeight: '600' },
  rowSub: { fontSize: 12, marginTop: 2 },

  personAvatar: { width: 36, height: 36, borderRadius: 18 },
  personAvatarFallback: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  placeIcon: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  recentIcon: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },

  // Empty
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyGem: { fontSize: 32, color: '#C4A882', marginBottom: 4 },
  emptyTitle: { fontSize: 16, fontWeight: '700' },
  emptySub: { fontSize: 13, textAlign: 'center' },
});
