import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Image,
  StyleSheet, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { collection, onSnapshot, query, orderBy, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth } from '../firebase';
import { getCat, THEMES } from '../constants';
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

export default function FeedView({ navigation, user, theme, toggleTheme }) {
  const [pins, setPins] = useState([]);
  // saves: { [pinId]: boolean } — tracks whether current user has saved each pin
  const [saves, setSaves] = useState({});
  // saveCounts: { [pinId]: number } — live count per pin
  const [saveCounts, setSaveCounts] = useState({});
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
    // optimistic update
    setSaves(prev => ({ ...prev, [pin.id]: !isSaved }));
    setSaveCounts(prev => ({ ...prev, [pin.id]: (prev[pin.id] ?? 0) + delta }));
    if (!USE_MOCK_DATA) {
      const ref = doc(db, 'pins', pin.id, 'saves', user.uid);
      isSaved ? await deleteDoc(ref) : await setDoc(ref, { savedAt: new Date() });
    }
  };

  // Top spots: top 3 pins by save count, excluding ones with 0 saves
  const topSpots = [...pins]
    .sort((a, b) => (saveCounts[b.id] ?? 0) - (saveCounts[a.id] ?? 0))
    .slice(0, 3)
    .filter(p => (saveCounts[p.id] ?? 0) > 0);

  const SaverAvatars = ({ pin }) => {
    const savers = (pin.savedBy ?? []).slice(0, 3);
    if (savers.length === 0) return null;
    const users = {
      mock_eva:   { photo: 'https://i.pravatar.cc/150?img=47' },
      mock_yujen: { photo: 'https://i.pravatar.cc/150?img=33' },
      mock_alex:  { photo: 'https://i.pravatar.cc/150?img=15' },
      guest:      { photo: 'https://i.pravatar.cc/150?img=12' },
    };
    return (
      <View style={styles.saverAvatars}>
        {savers.map((uid, i) => (
          users[uid]?.photo
            ? <Image
                key={uid}
                source={{ uri: users[uid].photo }}
                style={[styles.saverAvatar, { marginLeft: i === 0 ? 0 : -8, zIndex: 3 - i }]}
              />
            : null
        ))}
      </View>
    );
  };

  const renderTopSpot = (pin) => {
    const cat = getCat(pin.category);
    return (
      <TouchableOpacity
        key={pin.id}
        style={[styles.topCard, { backgroundColor: t.surface, borderColor: t.border }]}
        onPress={() => navigation.navigate('PinDetail', { pinId: pin.id, userId: user.uid })}
        activeOpacity={0.85}
      >
        {pin.photoURL
          ? <Image source={{ uri: pin.photoURL }} style={styles.topCardPhoto} />
          : <View style={[styles.topCardPhotoPlaceholder, { backgroundColor: t.surface2 }]}>
              <Text style={{ fontSize: 28 }}>{cat.icon}</Text>
            </View>
        }
        <View style={styles.topCardBody}>
          <Text style={[styles.topCardTitle, { color: t.text }]} numberOfLines={1}>{pin.title}</Text>
          <View style={styles.topCardFooter}>
            <SaverAvatars pin={pin} />
            <Text style={[styles.topCardCount, { color: t.muted }]}>
              {saveCounts[pin.id]} saves
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
        style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}
        onPress={() => navigation.navigate('PinDetail', { pinId: pin.id, userId: user.uid })}
        activeOpacity={0.88}
      >
        {/* Card header */}
        <View style={styles.cardHeader}>
          <View style={styles.cardAuthorRow}>
            {pin.authorPhoto
              ? <Image source={{ uri: pin.authorPhoto }} style={styles.authorAvatar} />
              : <View style={[styles.authorAvatarFallback, { backgroundColor: t.surface2 }]}>
                  <Text style={styles.avatarEmoji}>👤</Text>
                </View>
            }
            <View>
              <Text style={[styles.authorName, { color: t.text }]}>
                {pin.authorName?.split(' ')[0] ?? 'Someone'}
              </Text>
              <Text style={[styles.timeAgo, { color: t.muted }]}>{timeAgo(pin.createdAt)}</Text>
            </View>
          </View>
          <View style={[styles.catBadge, { backgroundColor: cat.color + '22', borderColor: cat.color + '44' }]}>
            <Text style={styles.catBadgeIcon}>{cat.icon}</Text>
            <Text style={[styles.catBadgeLabel, { color: cat.color }]}>{cat.label}</Text>
          </View>
        </View>

        {/* Photo */}
        {pin.photoURL
          ? <Image source={{ uri: pin.photoURL }} style={styles.cardPhoto} resizeMode="cover" />
          : null
        }

        {/* Body */}
        <View style={styles.cardBody}>
          <Text style={[styles.pinTitle, { color: t.text }]}>{pin.title}</Text>
          {pin.note
            ? <Text style={[styles.pinNote, { color: t.muted }]}>"{pin.note}"</Text>
            : null
          }
          {pin.locationName
            ? <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={13} color={t.accent} />
                <Text style={[styles.locationText, { color: t.muted }]}>{pin.locationName}</Text>
              </View>
            : null
          }
        </View>

        {/* Action bar */}
        <View style={[styles.cardActions, { borderTopColor: t.border }]}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => toggleSave(pin)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isSaved ? 'bookmark' : 'bookmark-outline'}
              size={18}
              color={isSaved ? t.accent : t.muted}
            />
            <Text style={[styles.actionCount, { color: isSaved ? t.accent : t.muted }]}>
              {count > 0 ? count : 'Save'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('PinDetail', { pinId: pin.id, userId: user.uid, focusComment: true })}
            activeOpacity={0.7}
          >
            <Ionicons name="chatbubble-outline" size={17} color={t.muted} />
            <Text style={[styles.actionCount, { color: t.muted }]}>Comment</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-redo-outline" size={18} color={t.muted} />
            <Text style={[styles.actionCount, { color: t.muted }]}>Share</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const ListHeader = () => (
    <>
      {topSpots.length > 0 && (
        <View style={styles.topSection}>
          <View style={styles.topSectionHeader}>
            <Text style={[styles.topSectionTitle, { color: t.text }]}>🔥 top spots this week</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.topScroll}>
            {topSpots.map(renderTopSpot)}
          </ScrollView>
          <View style={[styles.divider, { backgroundColor: t.border }]} />
        </View>
      )}
    </>
  );

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: t.bg }}>
        <View style={[styles.header, { borderBottomColor: t.border }]}>
          <Text style={[styles.wordmark, { color: t.accent }]}>spot</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: t.surface, borderColor: t.border }]}
              onPress={toggleTheme}
            >
              <Text style={styles.iconBtnEmoji}>{theme === 'dark' ? '☀️' : '🌙'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: t.accent }]}
              onPress={() => navigation.navigate('AddPin')}
            >
              <Ionicons name="add" size={20} color="#0f0f0f" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.avatarBtn, { backgroundColor: t.surface, borderColor: t.accent }]}
              onPress={() => navigation.navigate('Profile', { user })}
            >
              {user.photoURL
                ? <Image source={{ uri: user.photoURL }} style={styles.avatarImg} />
                : <Text style={styles.avatarEmoji}>👤</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <FlatList
        data={pins}
        keyExtractor={item => item.id}
        renderItem={renderPin}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={[styles.list, pins.length === 0 && styles.listEmpty]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📍</Text>
            <Text style={[styles.emptyTitle, { color: t.text }]}>No pins yet</Text>
            <Text style={[styles.emptySub, { color: t.muted }]}>
              Switch to the Map tab and drop the first one
            </Text>
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
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
  },
  wordmark: { fontSize: 26, fontWeight: '800', letterSpacing: -1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  iconBtnEmoji: { fontSize: 15 },
  avatarBtn: { width: 34, height: 34, borderRadius: 17, overflow: 'hidden', borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  avatarImg: { width: 34, height: 34 },
  avatarEmoji: { fontSize: 14 },

  list: { paddingBottom: 32 },
  listEmpty: { flex: 1 },

  // Top spots
  topSection: { paddingTop: 16 },
  topSectionHeader: { paddingHorizontal: 16, marginBottom: 10 },
  topSectionTitle: { fontSize: 15, fontWeight: '700', letterSpacing: -0.3 },
  topScroll: { paddingHorizontal: 16, gap: 12, paddingBottom: 16 },
  topCard: { width: 160, borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  topCardPhoto: { width: '100%', height: 100 },
  topCardPhotoPlaceholder: { width: '100%', height: 100, alignItems: 'center', justifyContent: 'center' },
  topCardBody: { padding: 10, gap: 6 },
  topCardTitle: { fontSize: 13, fontWeight: '700' },
  topCardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topCardCount: { fontSize: 11 },
  saverAvatars: { flexDirection: 'row' },
  saverAvatar: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: '#fff' },

  divider: { height: 1, marginHorizontal: 16, marginBottom: 8 },

  // Feed cards
  card: { marginHorizontal: 16, marginBottom: 12, borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12 },
  cardAuthorRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  authorAvatar: { width: 36, height: 36, borderRadius: 18 },
  authorAvatarFallback: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  authorName: { fontSize: 14, fontWeight: '600' },
  timeAgo: { fontSize: 12, marginTop: 1 },
  catBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100, borderWidth: 1 },
  catBadgeIcon: { fontSize: 12 },
  catBadgeLabel: { fontSize: 12, fontWeight: '600' },

  cardPhoto: { width: '100%', aspectRatio: 4 / 3 },
  cardBody: { padding: 12, gap: 6 },
  pinTitle: { fontSize: 17, fontWeight: '700', letterSpacing: -0.3 },
  pinNote: { fontSize: 14, fontStyle: 'italic', lineHeight: 20 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  locationText: { fontSize: 12 },

  cardActions: { flexDirection: 'row', borderTopWidth: 1, paddingVertical: 8, paddingHorizontal: 8 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 6 },
  actionCount: { fontSize: 13, fontWeight: '500' },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 40 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
