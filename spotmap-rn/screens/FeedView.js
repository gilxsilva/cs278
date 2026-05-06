import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Image,
  StyleSheet, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  collection, onSnapshot, query, orderBy,
  doc, setDoc, deleteDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { getCat, CATEGORIES, THEMES } from '../constants';
import { USE_MOCK_DATA, MOCK_PINS } from '../mockData';

function timeAgo(timestamp) {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const SAVER_PHOTOS = {
  mock_eva:   'https://i.pravatar.cc/150?img=47',
  mock_yujen: 'https://i.pravatar.cc/150?img=33',
  mock_alex:  'https://i.pravatar.cc/150?img=15',
  guest:      'https://i.pravatar.cc/150?img=12',
};

export default function FeedView({ navigation, user, theme }) {
  const [pins, setPins] = useState([]);
  const [saves, setSaves] = useState({});
  const [saveCounts, setSaveCounts] = useState({});
  const [activeFilter, setActiveFilter] = useState('all');
  const t = THEMES[theme];

  useEffect(() => {
    if (USE_MOCK_DATA) {
      setPins(MOCK_PINS);
      const initialSaves = {};
      const initialCounts = {};
      MOCK_PINS.forEach(p => {
        initialSaves[p.id] = (p.savedBy ?? []).includes(user.uid);
        initialCounts[p.id] = p.saveCount ?? 0;
      });
      setSaves(initialSaves);
      setSaveCounts(initialCounts);
      return;
    }
    const q = query(collection(db, 'pins'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      const loaded = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setPins(loaded);
      const counts = {};
      loaded.forEach(p => { counts[p.id] = p.saveCount ?? 0; });
      setSaveCounts(counts);
    }, err => console.error('Feed snapshot error:', err));
    return unsub;
  }, [user.uid]);

  const toggleSave = async (pin) => {
    const isSaved = saves[pin.id];
    const delta = isSaved ? -1 : 1;
    setSaves(prev => ({ ...prev, [pin.id]: !isSaved }));
    setSaveCounts(prev => ({ ...prev, [pin.id]: (prev[pin.id] ?? 0) + delta }));
    if (!USE_MOCK_DATA) {
      const ref = doc(db, 'pins', pin.id, 'saves', user.uid);
      isSaved ? await deleteDoc(ref) : await setDoc(ref, { savedAt: new Date() });
    }
  };

  const filteredPins = activeFilter === 'all'
    ? pins
    : pins.filter(p => p.category === activeFilter);

  const trendingGems = [...pins]
    .sort((a, b) => (saveCounts[b.id] ?? 0) - (saveCounts[a.id] ?? 0))
    .slice(0, 5)
    .filter(p => (saveCounts[p.id] ?? 0) > 0);

  const SaverAvatars = ({ pin }) => {
    const savers = (pin.savedBy ?? []).slice(0, 3);
    if (savers.length === 0) return null;
    return (
      <View style={styles.saverAvatars}>
        {savers.map((uid, i) => (
          SAVER_PHOTOS[uid]
            ? <Image
                key={uid}
                source={{ uri: SAVER_PHOTOS[uid] }}
                style={[styles.saverAvatar, { marginLeft: i === 0 ? 0 : -8, zIndex: 3 - i }]}
              />
            : null
        ))}
      </View>
    );
  };

  const renderTrendingGem = (pin) => {
    const cat = getCat(pin.category);
    return (
      <TouchableOpacity
        key={pin.id}
        style={[styles.trendCard, { backgroundColor: t.surface }]}
        onPress={() => navigation.navigate('PinDetail', { pinId: pin.id, userId: user.uid })}
        activeOpacity={0.85}
      >
        {pin.photoURL
          ? <Image source={{ uri: pin.photoURL }} style={styles.trendCardPhoto} />
          : <View style={[styles.trendCardPhotoPlaceholder, { backgroundColor: t.surface2 }]}>
              <Ionicons name={cat.icon} size={22} color={cat.color} />
            </View>
        }
        <View style={styles.trendCatBadgeWrap}>
          <View style={[styles.trendCatBadge, { backgroundColor: cat.color + 'CC' }]}>
            <Ionicons name={cat.icon} size={9} color="#fff" />
          </View>
        </View>
        <View style={styles.trendCardBody}>
          <Text style={[styles.trendCardTitle, { color: t.text }]} numberOfLines={1}>{pin.title}</Text>
          <View style={styles.trendCardFooter}>
            <SaverAvatars pin={pin} />
            <Text style={[styles.trendCardCount, { color: t.muted }]}>
              {saveCounts[pin.id]} saved
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderPin = ({ item: pin }) => {
    const cat = getCat(pin.category);
    const isSaved = saves[pin.id] ?? false;
    const count = saveCounts[pin.id] ?? 0;
    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: t.surface }]}
        onPress={() => navigation.navigate('PinDetail', { pinId: pin.id, userId: user.uid })}
        activeOpacity={0.92}
      >
        {pin.photoURL
          ? <Image source={{ uri: pin.photoURL }} style={styles.cardPhoto} />
          : null
        }

        <View style={styles.cardBody}>
          <View style={styles.cardAuthorRow}>
            {pin.authorPhoto
              ? <Image source={{ uri: pin.authorPhoto }} style={styles.authorAvatar} />
              : <View style={[styles.authorAvatarFallback, { backgroundColor: t.surface2 }]}>
                  <Ionicons name="person" size={14} color={t.muted} />
                </View>
            }
            <View style={{ flex: 1 }}>
              <Text style={[styles.authorName, { color: t.text }]}>
                {pin.authorName?.split(' ')[0] ?? 'Someone'}
              </Text>
              <Text style={[styles.timeAgo, { color: t.muted }]}>{timeAgo(pin.createdAt)}</Text>
            </View>
            <View style={[styles.catBadge, { backgroundColor: cat.color + '18' }]}>
              <Ionicons name={cat.icon} size={11} color={cat.color} />
              <Text style={[styles.catBadgeLabel, { color: cat.color }]}>{cat.label}</Text>
            </View>
          </View>

          <Text style={[styles.pinTitle, { color: t.text }]}>{pin.title}</Text>

          {pin.note
            ? <Text style={[styles.pinNote, { color: t.muted }]}>"{pin.note}"</Text>
            : null
          }

          {pin.locationName
            ? <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={12} color={t.muted} />
                <Text style={[styles.locationText, { color: t.muted }]}>{pin.locationName}</Text>
              </View>
            : null
          }
        </View>

        <View style={[styles.cardActions, { borderTopColor: t.border }]}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => toggleSave(pin)} activeOpacity={0.7}>
            <Ionicons
              name={isSaved ? 'bookmark' : 'bookmark-outline'}
              size={17}
              color={isSaved ? t.accent : t.muted}
            />
            <Text style={[styles.actionLabel, { color: isSaved ? t.accent : t.muted }]}>
              {count > 0 ? count : 'Save'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('PinDetail', { pinId: pin.id, userId: user.uid, focusComment: true })}
            activeOpacity={0.7}
          >
            <Ionicons name="chatbubble-outline" size={16} color={t.muted} />
            <Text style={[styles.actionLabel, { color: t.muted }]}>Thoughts</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-redo-outline" size={17} color={t.muted} />
            <Text style={[styles.actionLabel, { color: t.muted }]}>Share</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const ListHeader = () => (
    trendingGems.length > 0 ? (
      <View style={styles.trendSection}>
        <View style={styles.trendSectionHeader}>
          <Text style={styles.trendStar}>✦</Text>
          <Text style={[styles.trendSectionTitle, { color: t.text }]}>Trending gems</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.trendScroll}
        >
          {trendingGems.map(renderTrendingGem)}
        </ScrollView>
        <View style={[styles.divider, { backgroundColor: t.border }]} />
      </View>
    ) : null
  );

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: t.bg }}>
        <View style={styles.header}>
          <Text style={[styles.wordmark, { color: t.accent }]}>gem</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={[styles.addBtn, { backgroundColor: t.accent }]}
              onPress={() => navigation.navigate('AddPin')}
            >
              <Ionicons name="add" size={20} color="#FAF7F2" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.avatarBtn, { backgroundColor: t.surface }]}
              onPress={() => navigation.navigate('Profile', { user })}
            >
              {user.photoURL
                ? <Image source={{ uri: user.photoURL }} style={styles.avatarImg} />
                : <Ionicons name="person" size={16} color={t.muted} />
              }
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'all' && { backgroundColor: t.accent }]}
            onPress={() => setActiveFilter('all')}
          >
            <Text style={[styles.filterChipText, { color: activeFilter === 'all' ? '#FAF7F2' : t.muted }]}>
              All
            </Text>
          </TouchableOpacity>
          {CATEGORIES.map(c => (
            <TouchableOpacity
              key={c.id}
              style={[styles.filterChip, activeFilter === c.id && { backgroundColor: t.accent }]}
              onPress={() => setActiveFilter(c.id)}
            >
              <Ionicons
                name={c.icon}
                size={12}
                color={activeFilter === c.id ? '#FAF7F2' : c.color}
              />
              <Text style={[styles.filterChipText, { color: activeFilter === c.id ? '#FAF7F2' : t.muted }]}>
                {c.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>

      <FlatList
        data={filteredPins}
        keyExtractor={item => item.id}
        renderItem={renderPin}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={[styles.list, filteredPins.length === 0 && styles.listEmpty]}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyGem}>✦</Text>
            <Text style={[styles.emptyTitle, { color: t.text }]}>No gems here yet</Text>
            <Text style={[styles.emptySub, { color: t.muted }]}>Be the first to leave one</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8,
  },
  wordmark: { fontSize: 28, fontWeight: '800', letterSpacing: -1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  addBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  avatarBtn: {
    width: 36, height: 36, borderRadius: 18,
    overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
  },
  avatarImg: { width: 36, height: 36 },

  filterScroll: { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 100, backgroundColor: 'rgba(28,23,20,0.06)',
  },
  filterChipText: { fontSize: 12, fontWeight: '600' },

  list: { paddingTop: 4, paddingBottom: 40 },
  listEmpty: { flex: 1 },

  trendSection: { paddingBottom: 16, paddingHorizontal: 16 },
  trendSectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12,
  },
  trendStar: { fontSize: 14, color: '#C4A882' },
  trendSectionTitle: { fontSize: 14, fontWeight: '700', letterSpacing: -0.2 },
  trendScroll: { gap: 12, paddingRight: 2 },
  trendCard: {
    width: 160, borderRadius: 16, overflow: 'hidden',
    shadowColor: '#1C1714', shadowOpacity: 0.07, shadowRadius: 10, shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  trendCardPhoto: { width: '100%', height: 110 },
  trendCardPhotoPlaceholder: { width: '100%', height: 110, alignItems: 'center', justifyContent: 'center' },
  trendCatBadgeWrap: { position: 'absolute', top: 8, right: 8 },
  trendCatBadge: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  trendCardBody: { padding: 10, gap: 6 },
  trendCardTitle: { fontSize: 13, fontWeight: '700', letterSpacing: -0.2 },
  trendCardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  trendCardCount: { fontSize: 11 },
  saverAvatars: { flexDirection: 'row' },
  saverAvatar: { width: 16, height: 16, borderRadius: 8, borderWidth: 1.5, borderColor: '#FAF7F2' },

  divider: { height: 1, marginTop: 4 },

  card: {
    marginHorizontal: 16,
    borderRadius: 20, overflow: 'hidden',
    shadowColor: '#1C1714', shadowOpacity: 0.07, shadowRadius: 14, shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardPhoto: { width: '100%', aspectRatio: 4 / 3 },
  cardBody: { padding: 16, gap: 8 },
  cardAuthorRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  authorAvatar: { width: 32, height: 32, borderRadius: 16 },
  authorAvatarFallback: {
    width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
  },
  authorName: { fontSize: 13, fontWeight: '600' },
  timeAgo: { fontSize: 11, marginTop: 1 },
  catBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  catBadgeLabel: { fontSize: 11, fontWeight: '600' },

  pinTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.4, lineHeight: 22 },
  pinNote: { fontSize: 14, fontStyle: 'italic', lineHeight: 20 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { fontSize: 12 },

  cardActions: {
    flexDirection: 'row', borderTopWidth: 1,
    paddingVertical: 10, paddingHorizontal: 8,
  },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 5, paddingVertical: 4,
  },
  actionLabel: { fontSize: 12, fontWeight: '500' },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 40 },
  emptyGem: { fontSize: 40, color: '#C4A882', marginBottom: 4 },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
