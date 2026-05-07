import React, { useState, useEffect } from 'react';
import {
  View, Text, Image, TouchableOpacity, FlatList,
  StyleSheet, Alert, ScrollView, Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth } from '../firebase';
import { getCat, THEMES } from '../constants';
import { USE_MOCK_DATA, MOCK_PINS, MOCK_USER_PROFILES } from '../mockData';

const NAVY = '#0D1F3C';

const EMPTY_PROFILE = {
  bio: null, tasteTags: [], socialProof: null,
  followers: 0, following: 0, collections: [],
};

export default function Profile({ navigation, route, theme }) {
  const { user, isOwnProfile = false } = route.params;
  const [pins, setPins] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const t = THEMES[theme];

  const profile = MOCK_USER_PROFILES?.[user.uid] ?? EMPTY_PROFILE;
  const firstName = user.displayName?.split(' ')[0] ?? 'User';
  const handle = '@' + (user.displayName?.toLowerCase().replace(/\s/g, '') ?? 'user');

  useEffect(() => {
    if (USE_MOCK_DATA) {
      setPins(MOCK_PINS.filter(p => p.authorId === user.uid));
      return;
    }
    getDocs(
      query(collection(db, 'pins'), where('authorId', '==', user.uid), orderBy('createdAt', 'desc'))
    ).then(snap => setPins(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [user.uid]);

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => signOut(auth) },
    ]);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${firstName}'s gems on gem — hidden spots, study places, and memories worth remembering.`,
      });
    } catch (_) {}
  };

  // ── List header sections ──────────────────────────────────────────────────

  const ListHeader = () => (
    <>
      {/* ── Identity ─────────────────────────────────────────────── */}
      <View style={[styles.hero, { backgroundColor: t.bg }]}>
        {user.photoURL
          ? <Image source={{ uri: user.photoURL }} style={styles.avatar} />
          : <View style={[styles.avatarFallback, { backgroundColor: t.surface }]}>
              <Ionicons name="person" size={36} color={t.muted} />
            </View>
        }
        <Text style={[styles.displayName, { color: t.text }]}>{user.displayName}</Text>
        <Text style={[styles.handle, { color: t.muted }]}>{handle}</Text>
        {profile.bio ? (
          <Text style={[styles.bio, { color: t.muted }]}>{profile.bio}</Text>
        ) : null}

        {/* Stats */}
        <View style={[styles.statsRow, { backgroundColor: t.surface }]}>
          <View style={styles.stat}>
            <Text style={[styles.statNum, { color: t.text }]}>{pins.length}</Text>
            <Text style={[styles.statLabel, { color: t.muted }]}>gems</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: t.border }]} />
          <View style={styles.stat}>
            <Text style={[styles.statNum, { color: t.text }]}>{profile.followers}</Text>
            <Text style={[styles.statLabel, { color: t.muted }]}>followers</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: t.border }]} />
          <View style={styles.stat}>
            <Text style={[styles.statNum, { color: t.text }]}>{profile.following}</Text>
            <Text style={[styles.statLabel, { color: t.muted }]}>following</Text>
          </View>
        </View>
      </View>

      {/* ── Actions ──────────────────────────────────────────────── */}
      <View style={styles.actionsBlock}>
        {isOwnProfile ? (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.editBtn, { borderColor: t.border }]}
              activeOpacity={0.8}
            >
              <Text style={[styles.editBtnText, { color: t.text }]}>Edit profile</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: t.surface }]}
              onPress={handleShare}
              activeOpacity={0.8}
            >
              <Ionicons name="share-outline" size={17} color={t.text} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[
                styles.followBtn,
                isFollowing && { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: t.border },
              ]}
              onPress={() => setIsFollowing(v => !v)}
              activeOpacity={0.82}
            >
              {isFollowing && (
                <Ionicons name="checkmark" size={14} color={NAVY} style={{ marginRight: 4 }} />
              )}
              <Text style={[styles.followBtnText, isFollowing && { color: NAVY }]}>
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: t.surface }]}
              onPress={handleShare}
              activeOpacity={0.8}
            >
              <Ionicons name="share-outline" size={17} color={t.text} />
            </TouchableOpacity>
          </View>
        )}

        {/* Social proof */}
        {profile.socialProof ? (
          <Text style={[styles.socialProof, { color: t.muted }]}>
            ✦{'  '}{profile.socialProof}
          </Text>
        ) : null}
      </View>

      {/* ── Taste tags ───────────────────────────────────────────── */}
      {profile.tasteTags?.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tasteScroll}
        >
          {profile.tasteTags.map(tag => (
            <View key={tag} style={[styles.tasteTag, { backgroundColor: t.surface }]}>
              <Text style={[styles.tasteTagText, { color: t.muted }]}>{tag}</Text>
            </View>
          ))}
        </ScrollView>
      ) : null}

      {/* ── Collections preview ──────────────────────────────────── */}
      {profile.collections?.length > 0 ? (
        <View style={styles.collectionsSection}>
          <Text style={[styles.collectionsLabel, { color: t.muted }]}>COLLECTIONS</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.collectionsScroll}
          >
            {profile.collections.map(coll => (
              <TouchableOpacity
                key={coll.id}
                style={[styles.collCard, { backgroundColor: t.surface, borderColor: t.border }]}
                activeOpacity={0.8}
              >
                <View style={[styles.collIconWrap, { backgroundColor: (coll.color ?? NAVY) + '14' }]}>
                  <Ionicons name={coll.icon ?? 'bookmark-outline'} size={15} color={coll.color ?? NAVY} />
                </View>
                <Text style={[styles.collName, { color: t.text }]} numberOfLines={2}>{coll.name}</Text>
                <View style={styles.collFooter}>
                  <Text style={[styles.collCount, { color: t.muted }]}>{coll.count} gems</Text>
                  {coll.visibility === 'shared' && (
                    <View style={styles.sharedDot}>
                      <Ionicons name="people-outline" size={9} color={NAVY} />
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {/* ── Gems section header ──────────────────────────────────── */}
      <View style={[styles.gemsSectionHeader, { borderTopColor: t.border }]}>
        <Text style={[styles.gemsSectionTitle, { color: t.text }]}>
          {isOwnProfile ? 'your gems' : `${firstName}'s gems`}
        </Text>
        <Text style={[styles.gemsSectionCount, { color: t.muted }]}>{pins.length}</Text>
      </View>
    </>
  );

  const ListEmpty = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyGem}>✦</Text>
      <Text style={[styles.emptyText, { color: t.muted }]}>No gems yet — leave one!</Text>
    </View>
  );

  const renderPin = ({ item: pin }) => {
    const cat = getCat(pin.category);
    return (
      <TouchableOpacity
        style={[styles.pinCard, { backgroundColor: t.surface }]}
        onPress={() => navigation.navigate('PinDetail', { pinId: pin.id, userId: user.uid })}
        activeOpacity={0.85}
      >
        {pin.photoURL
          ? <Image source={{ uri: pin.photoURL }} style={styles.pinPhoto} resizeMode="cover" />
          : <View style={[styles.pinPhotoPlaceholder, { backgroundColor: t.surface2 }]}>
              <Ionicons name={cat.icon} size={24} color={cat.color} />
            </View>
        }
        <View style={styles.pinInfo}>
          <View style={[styles.catPill, { backgroundColor: cat.color + '18' }]}>
            <Ionicons name={cat.icon} size={10} color={cat.color} />
            <Text style={[styles.catPillText, { color: cat.color }]}>{cat.label}</Text>
          </View>
          <Text style={[styles.pinTitle, { color: t.text }]} numberOfLines={1}>{pin.title}</Text>
          {pin.note
            ? <Text style={[styles.pinNote, { color: t.muted }]} numberOfLines={1}>"{pin.note}"</Text>
            : null}
          {pin.locationName
            ? <View style={styles.locRow}>
                <Ionicons name="location-outline" size={11} color={t.muted} />
                <Text style={[styles.locText, { color: t.muted }]} numberOfLines={1}>{pin.locationName}</Text>
              </View>
            : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: t.bg }}>
        <View style={[styles.headerBar, { borderBottomColor: t.border }]}>
          <TouchableOpacity
            style={[styles.navBtn, { backgroundColor: t.surface }]}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={18} color={t.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: t.text }]}>profile</Text>
          {isOwnProfile
            ? <TouchableOpacity
                style={[styles.navBtn, { backgroundColor: t.surface }]}
                onPress={handleSignOut}
              >
                <Ionicons name="log-out-outline" size={17} color={t.muted} />
              </TouchableOpacity>
            : <View style={{ width: 34 }} />
          }
        </View>
      </SafeAreaView>

      <FlatList
        data={pins}
        keyExtractor={item => item.id}
        renderItem={renderPin}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Top nav
  headerBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 16, fontWeight: '700', letterSpacing: -0.3 },
  navBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },

  // Identity
  hero: { alignItems: 'center', paddingTop: 32, paddingBottom: 24, paddingHorizontal: 24 },
  avatar: { width: 88, height: 88, borderRadius: 44, marginBottom: 12 },
  avatarFallback: {
    width: 88, height: 88, borderRadius: 44, marginBottom: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  displayName: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  handle: { fontSize: 14, marginTop: 4 },
  bio: {
    fontSize: 13, textAlign: 'center', lineHeight: 19,
    marginTop: 8, paddingHorizontal: 16,
  },

  // Stats
  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 18, paddingVertical: 16, paddingHorizontal: 16,
    gap: 0, marginTop: 20, width: '100%',
  },
  stat: { alignItems: 'center', flex: 1 },
  statNum: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  statLabel: { fontSize: 12, marginTop: 2 },
  statDivider: { width: 1, height: 28 },

  // Actions
  actionsBlock: {
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, gap: 10,
  },
  actionsRow: { flexDirection: 'row', gap: 10 },
  followBtn: {
    flex: 1, backgroundColor: NAVY, borderRadius: 12, paddingVertical: 11,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
  },
  followBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  editBtn: {
    flex: 1, borderWidth: 1.5, borderRadius: 12,
    paddingVertical: 11, alignItems: 'center',
  },
  editBtnText: { fontSize: 14, fontWeight: '600' },
  iconBtn: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  socialProof: { fontSize: 12, textAlign: 'center', lineHeight: 17 },

  // Taste tags
  tasteScroll: { paddingHorizontal: 16, paddingBottom: 16, paddingTop: 2, gap: 8 },
  tasteTag: { paddingHorizontal: 13, paddingVertical: 7, borderRadius: 100 },
  tasteTagText: { fontSize: 12, fontWeight: '500' },

  // Collections
  collectionsSection: { paddingBottom: 8 },
  collectionsLabel: {
    fontSize: 10, fontWeight: '700', letterSpacing: 0.8,
    paddingHorizontal: 16, paddingBottom: 10,
  },
  collectionsScroll: { paddingHorizontal: 16, gap: 10, paddingBottom: 4 },
  collCard: { width: 130, borderRadius: 14, borderWidth: 1, padding: 14, gap: 4 },
  collIconWrap: {
    width: 30, height: 30, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', marginBottom: 6,
  },
  collName: { fontSize: 13, fontWeight: '700', letterSpacing: -0.2 },
  collFooter: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  collCount: { fontSize: 11 },
  sharedDot: {
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: 'rgba(45,63,92,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },

  // Gems section
  gemsSectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderTopWidth: 1, marginTop: 8,
  },
  gemsSectionTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.5 },
  gemsSectionCount: { fontSize: 13, fontWeight: '600' },

  list: { paddingBottom: 40 },

  // Pin cards
  pinCard: {
    marginHorizontal: 16, marginBottom: 10,
    borderRadius: 16, overflow: 'hidden', flexDirection: 'row',
    shadowColor: '#1C1714', shadowOpacity: 0.06, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  pinPhoto: { width: 88, height: 88 },
  pinPhotoPlaceholder: { width: 88, height: 88, alignItems: 'center', justifyContent: 'center' },
  pinInfo: { flex: 1, padding: 12, gap: 4, justifyContent: 'center' },
  pinTitle: { fontSize: 15, fontWeight: '700' },
  pinNote: { fontSize: 12, fontStyle: 'italic' },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  locText: { fontSize: 11 },
  catPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100,
  },
  catPillText: { fontSize: 12, fontWeight: '600' },

  emptyState: { alignItems: 'center', padding: 40, gap: 10 },
  emptyGem: { fontSize: 36, color: '#C4A882' },
  emptyText: { fontSize: 14, textAlign: 'center' },
});
