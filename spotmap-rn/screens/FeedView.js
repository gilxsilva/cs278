import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Image,
  StyleSheet, ScrollView, Modal, Pressable, TextInput,
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

const SAVER_NAMES = {
  mock_eva:   'Eva',
  mock_yujen: 'Yujen',
  mock_alex:  'Alex',
  guest:      'Demo',
};

export default function FeedView({ navigation, user, theme }) {
  const [pins, setPins] = useState([]);
  const [saves, setSaves] = useState({});
  const [saveCounts, setSaveCounts] = useState({});
  const [activeFilter, setActiveFilter] = useState('all');
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
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
    const firstName = pin.authorName?.split(' ')[0] ?? 'Someone';
    const saverNames = (pin.savedBy ?? [])
      .filter(uid => uid !== pin.authorId)
      .slice(0, 2)
      .map(uid => SAVER_NAMES[uid])
      .filter(Boolean);

    return (
      <View style={[styles.card, { backgroundColor: t.bg, borderBottomColor: t.border }]}>

        {/* Header: avatar · narrative · category sticker */}
        <View style={styles.cardHeader}>
          <Pressable onPress={() => pin.authorPhoto && setProfilePhoto(pin.authorPhoto)}>
            {pin.authorPhoto
              ? <Image source={{ uri: pin.authorPhoto }} style={styles.authorAvatar} />
              : <View style={[styles.authorAvatarFallback, { backgroundColor: t.surface }]}>
                  <Ionicons name="person" size={18} color={t.muted} />
                </View>
            }
          </Pressable>

          <View style={styles.narrativeWrap}>
            <TouchableOpacity
              onPress={() => navigation.navigate('PinDetail', { pinId: pin.id, userId: user.uid })}
              activeOpacity={0.75}
            >
              <Text style={[styles.narrativeLine, { color: t.text }]}>
                <Text style={styles.narrativeBold}>{firstName} </Text>
                {'found '}
                <Text style={styles.narrativeBold}>{pin.title}</Text>
                {saverNames.length > 0
                  ? <Text style={[styles.narrativeMuted, { color: t.muted }]}>{` with ${saverNames.join(' and ')}`}</Text>
                  : null
                }
              </Text>
            </TouchableOpacity>
            <Text style={[styles.cardTimestamp, { color: t.muted }]}>{timeAgo(pin.createdAt)}</Text>
          </View>

          <TouchableOpacity
            style={[styles.catSticker, { backgroundColor: cat.color + '20' }]}
            onPress={() => navigation.navigate('Profile', {
              user: { uid: pin.authorId, displayName: pin.authorName, photoURL: pin.authorPhoto },
              isOwnProfile: pin.authorId === user.uid,
            })}
            activeOpacity={0.75}
          >
            <Ionicons name={cat.icon} size={16} color={cat.color} />
          </TouchableOpacity>
        </View>

        {/* Photo (left) + Location (right) */}
        {(pin.photoURL || pin.locationName) ? (
          <View style={styles.mediaRow}>
            {pin.photoURL && (
              <TouchableOpacity
                onPress={() => navigation.navigate('PinDetail', { pinId: pin.id, userId: user.uid })}
                activeOpacity={0.88}
              >
                <Image source={{ uri: pin.photoURL }} style={styles.thumbnail} />
              </TouchableOpacity>
            )}
            {pin.locationName && (
              <View style={[styles.locationBlock, !pin.photoURL && { paddingLeft: 0 }]}>
                <Ionicons name="location-outline" size={18} color={t.muted} style={{ marginTop: 1 }} />
                <Text style={[styles.locationText, { color: t.text }]}>{pin.locationName}</Text>
              </View>
            )}
          </View>
        ) : null}

        {/* Note */}
        {pin.note ? (
          <Text style={[styles.noteText, { color: t.text }]}>
            <Text style={{ color: t.muted }}>Notes: </Text>
            {pin.note}
          </Text>
        ) : null}

        {/* Action bar */}
        <View style={styles.actionsRow}>
          <View style={styles.actionsLeft}>
            <TouchableOpacity style={styles.actionIcon} onPress={() => toggleSave(pin)} activeOpacity={0.7}>
              <Ionicons name={isSaved ? 'heart' : 'heart-outline'} size={23} color={isSaved ? '#C0505A' : t.muted} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionIcon}
              onPress={() => navigation.navigate('PostComments', { pin, userId: user.uid })}
              activeOpacity={0.7}
            >
              <Ionicons name="chatbubble-outline" size={22} color={t.muted} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionIcon} activeOpacity={0.7}>
              <Ionicons name="arrow-redo-outline" size={22} color={t.muted} />
            </TouchableOpacity>
          </View>
          <View style={styles.actionsRight}>
            {count > 0 && (
              <TouchableOpacity
                style={[styles.countPill, { backgroundColor: t.accent }]}
                onPress={() => toggleSave(pin)}
                activeOpacity={0.8}
              >
                <Text style={styles.countPillText}>+{count}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => toggleSave(pin)} activeOpacity={0.7}>
              <Ionicons
                name={isSaved ? 'bookmark' : 'bookmark-outline'}
                size={23}
                color={isSaved ? t.accent : t.muted}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
          {searchActive ? (
            <>
              <View style={[styles.searchInputWrap, { backgroundColor: t.surface }]}>
                <Ionicons name="search" size={15} color={t.muted} />
                <TextInput
                  autoFocus
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="search people…"
                  placeholderTextColor={t.muted}
                  style={[styles.searchInput, { color: t.text }]}
                />
              </View>
              <TouchableOpacity onPress={() => { setSearchActive(false); setSearchQuery(''); }}>
                <Text style={[styles.searchCancel, { color: t.accent }]}>Cancel</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={[styles.wordmark, { color: t.accent }]}>gem</Text>
              <View style={styles.headerRight}>
                <TouchableOpacity onPress={() => setSearchActive(true)}>
                  <Ionicons name="search" size={20} color={t.muted} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.addBtn, { backgroundColor: t.accent }]}
                  onPress={() => navigation.navigate('AddPin')}
                >
                  <Ionicons name="add" size={20} color="#FAF7F2" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.avatarBtn, { backgroundColor: t.surface }]}
                  onPress={() => navigation.navigate('Profile', { user, isOwnProfile: true })}
                >
                  {user.photoURL
                    ? <Image source={{ uri: user.photoURL }} style={styles.avatarImg} />
                    : <Ionicons name="person" size={16} color={t.muted} />
                  }
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        {!searchActive && <ScrollView
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
        </ScrollView>}
      </SafeAreaView>

      {searchActive && searchQuery.length > 0 && (() => {
        const seen = new Set();
        const users = pins
          .filter(p => p.authorName?.toLowerCase().includes(searchQuery.toLowerCase()))
          .filter(p => { if (seen.has(p.authorId)) return false; seen.add(p.authorId); return true; });
        return (
          <View style={[styles.searchResults, { backgroundColor: t.bg, borderColor: t.border }]}>
            {users.length === 0
              ? <Text style={[styles.searchEmpty, { color: t.muted }]}>No people found</Text>
              : users.map(p => (
                  <TouchableOpacity
                    key={p.authorId}
                    style={styles.searchResultRow}
                    onPress={() => {
                      setSearchActive(false);
                      setSearchQuery('');
                      navigation.navigate('Profile', {
                        user: { uid: p.authorId, displayName: p.authorName, photoURL: p.authorPhoto },
                        isOwnProfile: p.authorId === user.uid,
                      });
                    }}
                    activeOpacity={0.75}
                  >
                    {p.authorPhoto
                      ? <Image source={{ uri: p.authorPhoto }} style={styles.searchAvatar} />
                      : <View style={[styles.searchAvatarFallback, { backgroundColor: t.surface2 }]}>
                          <Ionicons name="person" size={16} color={t.muted} />
                        </View>
                    }
                    <Text style={[styles.searchName, { color: t.text }]}>{p.authorName}</Text>
                    <Ionicons name="chevron-forward" size={16} color={t.muted} style={{ marginLeft: 'auto' }} />
                  </TouchableOpacity>
                ))
            }
          </View>
        );
      })()}

      <FlatList
        data={filteredPins}
        keyExtractor={item => item.id}
        renderItem={renderPin}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={[styles.list, filteredPins.length === 0 && styles.listEmpty]}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={null}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyGem}>✦</Text>
            <Text style={[styles.emptyTitle, { color: t.text }]}>No gems here yet</Text>
            <Text style={[styles.emptySub, { color: t.muted }]}>Be the first to leave one</Text>
          </View>
        }
      />

      <Modal visible={!!profilePhoto} transparent animationType="fade" onRequestClose={() => setProfilePhoto(null)}>
        <Pressable style={styles.photoModalBackdrop} onPress={() => setProfilePhoto(null)}>
          {profilePhoto && (
            <Image source={{ uri: profilePhoto }} style={styles.photoModalImage} />
          )}
        </Pressable>
      </Modal>
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

  searchInputWrap: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8,
  },
  searchInput: { flex: 1, fontSize: 15 },
  searchCancel: { fontSize: 15, fontWeight: '600', paddingLeft: 10 },
  searchResults: {
    borderBottomWidth: 1, paddingVertical: 4,
  },
  searchResultRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingVertical: 12,
  },
  searchAvatar: { width: 36, height: 36, borderRadius: 18 },
  searchAvatarFallback: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  searchName: { fontSize: 15, fontWeight: '600' },
  searchEmpty: { fontSize: 14, textAlign: 'center', paddingVertical: 16 },

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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12,
  },
  authorAvatar: { width: 44, height: 44, borderRadius: 22 },
  authorAvatarFallback: {
    width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
  },
  narrativeWrap: { flex: 1 },
  narrativeLine: { fontSize: 14, lineHeight: 20 },
  narrativeBold: { fontWeight: '700' },
  narrativeMuted: { fontWeight: '400' },
  cardTimestamp: { fontSize: 12, marginTop: 3 },
  catSticker: {
    width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
  },

  mediaRow: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  thumbnail: { width: 130, height: 110, borderRadius: 10 },
  locationBlock: {
    flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 6, paddingTop: 2,
  },
  locationText: { flex: 1, fontSize: 13, lineHeight: 18, fontWeight: '500' },

  noteText: { fontSize: 14, lineHeight: 20, marginBottom: 10 },

  actionsRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginTop: 4,
  },
  actionsLeft: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  actionsRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  actionIcon: { padding: 6 },
  countPill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 100 },
  countPillText: { fontSize: 13, fontWeight: '700', color: '#FAF7F2' },

  photoModalBackdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center', justifyContent: 'center',
  },
  photoModalImage: { width: 240, height: 240, borderRadius: 120 },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 40 },
  emptyGem: { fontSize: 40, color: '#C4A882', marginBottom: 4 },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
