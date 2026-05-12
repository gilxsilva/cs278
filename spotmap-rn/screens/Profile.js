import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, Image, TouchableOpacity, FlatList,
  StyleSheet, Alert, ScrollView, Share, Modal, TextInput, Switch, Pressable,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../supabase';
import { getCat, THEMES } from '../constants';
import { MOCK_PINS, MOCK_USER_PROFILES, MOCK_USERS } from '../mockData';
import SaveToCollectionModal from '../components/SaveToCollectionModal';

function resolveImageUrl(path) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return supabase.storage.from('gem-images').getPublicUrl(path).data.publicUrl;
}

const NAVY = '#0D1F3C';
const MUTED_C = 'rgba(28,23,20,0.38)';

const ALL_FRIENDS = Object.values(MOCK_USERS).filter(u => u.uid !== 'guest');

function EditCollectionModal({ collection: coll, onSave, onDelete, onClose }) {
  const [name, setName] = useState(coll?.name ?? '');
  const [isPublic, setIsPublic] = useState(coll?.visibility === 'public');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState(new Set(coll?.sharedWith ?? []));

  useEffect(() => {
    if (coll) {
      setName(coll.name);
      setIsPublic(coll.visibility === 'public');
      setSelectedFriends(new Set(coll.sharedWith ?? []));
      setPickerOpen(false);
    }
  }, [coll?.id]);

  const visibility = selectedFriends.size > 0 ? 'shared' : isPublic ? 'public' : 'private';

  const toggleFriend = uid => {
    setSelectedFriends(prev => {
      const next = new Set(prev);
      next.has(uid) ? next.delete(uid) : next.add(uid);
      return next;
    });
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete collection',
      `Delete "${coll.name}"? This can't be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(coll.id) },
      ]
    );
  };

  return (
    <Modal visible={!!coll} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={eStyles.backdrop} onPress={onClose} />
      <View style={eStyles.sheet}>
        <View style={eStyles.handle} />
        <Text style={eStyles.title}>Edit collection</Text>

        <View style={eStyles.section}>
          <Text style={eStyles.sectionLabel}>Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            style={eStyles.input}
            placeholderTextColor={MUTED_C}
            returnKeyType="done"
          />
        </View>

        <View style={eStyles.section}>
          <TouchableOpacity style={eStyles.optionRow} onPress={() => setPickerOpen(v => !v)} activeOpacity={0.75}>
            <View style={{ flex: 1 }}>
              <Text style={eStyles.optionTitle}>Share with a friend</Text>
              <Text style={eStyles.optionSub}>
                {selectedFriends.size > 0
                  ? `${selectedFriends.size} friend${selectedFriends.size > 1 ? 's' : ''} selected`
                  : 'They can add their favourite posts.'}
              </Text>
            </View>
            <Ionicons name={pickerOpen ? 'chevron-up' : 'chevron-forward'} size={18} color={MUTED_C} />
          </TouchableOpacity>

          {pickerOpen && (
            <View style={eStyles.friendList}>
              {ALL_FRIENDS.map(u => {
                const sel = selectedFriends.has(u.uid);
                return (
                  <TouchableOpacity key={u.uid} style={eStyles.friendRow} onPress={() => toggleFriend(u.uid)} activeOpacity={0.75}>
                    <Image source={{ uri: u.photoURL }} style={eStyles.friendAvatar} />
                    <Text style={eStyles.friendName}>{u.displayName}</Text>
                    <View style={[eStyles.friendCheck, sel && eStyles.friendCheckSel]}>
                      {sel && <Ionicons name="checkmark" size={12} color="#fff" />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <View style={eStyles.divider} />

          <View style={eStyles.optionRow}>
            <View style={{ flex: 1 }}>
              <Text style={eStyles.optionTitle}>Make public</Text>
              <Text style={eStyles.optionSub}>Show on your profile.</Text>
            </View>
            <Switch
              value={isPublic}
              onValueChange={setIsPublic}
              trackColor={{ false: 'rgba(28,23,20,0.12)', true: NAVY }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        <TouchableOpacity style={eStyles.deleteBtn} onPress={handleDelete} activeOpacity={0.8}>
          <Ionicons name="trash-outline" size={15} color="#C0392B" />
          <Text style={eStyles.deleteBtnText}>Delete collection</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[eStyles.saveBtn, !name.trim() && { opacity: 0.38 }]}
          onPress={() => name.trim() && onSave({ ...coll, name: name.trim(), visibility })}
          disabled={!name.trim()}
          activeOpacity={0.85}
        >
          <Text style={eStyles.saveBtnText}>Save changes</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const EMPTY_PROFILE = {
  display_name: null, handle: null, avatar_url: null,
  bio: null, taste_tags: [], taste_tagline: null,
  follower_count: 0, following_count: 0, gem_count: 0,
};

const isGuest = uid => uid === 'guest';

export default function Profile({ navigation, route, theme }) {
  const { user, isOwnProfile = false } = route.params;
  const [profileData, setProfileData] = useState(EMPTY_PROFILE);
  const [pins, setPins] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [userCollections, setUserCollections] = useState([]);
  const [collectionModalOpen, setCollectionModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const t = THEMES[theme];

  const displayName = profileData.display_name ?? user.displayName ?? 'User';
  const firstName = displayName.split(' ')[0];
  const handle = profileData.handle ? `@${profileData.handle}` : `@${user.displayName?.toLowerCase().replace(/\s/g, '') ?? 'user'}`;

  const loadAll = useCallback(async () => {
    if (isGuest(user.uid)) {
      const mock = MOCK_USER_PROFILES?.[user.uid];
      setPins(MOCK_PINS.filter(p => p.authorId === user.uid));
      setUserCollections(mock?.collections ?? []);
      return;
    }

    const [profileRes, gemsRes, collectionsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.uid).single(),
      supabase
        .from('gems')
        .select('*, places(name, city, latitude, longitude), gem_images(storage_path, order_index)')
        .eq('author_id', user.uid)
        .order('created_at', { ascending: false }),
      supabase
        .from('collections')
        .select('*')
        .eq('owner_id', user.uid)
        .order('created_at', { ascending: false }),
    ]);

    if (profileRes.data) setProfileData(profileRes.data);

    if (gemsRes.data) {
      const mapped = gemsRes.data.map(g => {
        const sortedImages = (g.gem_images ?? []).sort((a, b) => a.order_index - b.order_index);
        const firstImage = sortedImages[0]?.storage_path ?? null;
        return {
          id:           g.id,
          title:        g.title,
          note:         g.caption,
          category:     g.category,
          locationName: [g.places?.name, g.places?.city].filter(Boolean).join(', '),
          photoURL:     resolveImageUrl(firstImage),
          authorId:     g.author_id,
          latitude:     g.places?.latitude,
          longitude:    g.places?.longitude,
        };
      });
      setPins(mapped);
    }

    if (collectionsRes.data) {
      const mapped = collectionsRes.data.map(c => ({
        id:         c.id,
        name:       c.name,
        icon:       c.icon ?? 'bookmark-outline',
        color:      c.color ?? '#0D1F3C',
        count:      c.item_count ?? 0,
        visibility: c.visibility,
      }));
      setUserCollections(mapped);
    }
  }, [user.uid]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  }, [loadAll]);

  const handleSaveCollection = (updated) => {
    setUserCollections(prev => prev.map(c => c.id === updated.id ? updated : c));
    setEditingCollection(null);
  };

  const handleDeleteCollection = (id) => {
    setUserCollections(prev => prev.filter(c => c.id !== id));
    setEditingCollection(null);
  };

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => supabase.auth.signOut() },
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
        {(profileData.avatar_url ?? user.photoURL)
          ? <Image source={{ uri: profileData.avatar_url ?? user.photoURL }} style={styles.avatar} />
          : <View style={[styles.avatarFallback, { backgroundColor: t.surface }]}>
              <Ionicons name="person" size={36} color={t.muted} />
            </View>
        }
        <Text style={[styles.displayName, { color: t.text }]}>{displayName}</Text>
        <Text style={[styles.handle, { color: t.muted }]}>{handle}</Text>
        {profileData.bio ? (
          <Text style={[styles.bio, { color: t.muted }]}>{profileData.bio}</Text>
        ) : null}

        {/* Stats */}
        <View style={[styles.statsRow, { backgroundColor: t.surface }]}>
          <View style={styles.stat}>
            <Text style={[styles.statNum, { color: t.text }]}>{pins.length}</Text>
            <Text style={[styles.statLabel, { color: t.muted }]}>gems</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: t.border }]} />
          <View style={styles.stat}>
            <Text style={[styles.statNum, { color: t.text }]}>{profileData.follower_count}</Text>
            <Text style={[styles.statLabel, { color: t.muted }]}>followers</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: t.border }]} />
          <View style={styles.stat}>
            <Text style={[styles.statNum, { color: t.text }]}>{profileData.following_count}</Text>
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

        {/* Taste tagline */}
        {profileData.taste_tagline ? (
          <Text style={[styles.socialProof, { color: t.muted }]}>
            ✦{'  '}{profileData.taste_tagline}
          </Text>
        ) : null}
      </View>

      {/* ── Taste tags ───────────────────────────────────────────── */}
      {profileData.taste_tags?.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tasteScroll}
        >
          {profileData.taste_tags.map(tag => (
            <View key={tag} style={[styles.tasteTag, { backgroundColor: t.surface }]}>
              <Text style={[styles.tasteTagText, { color: t.muted }]}>{tag}</Text>
            </View>
          ))}
        </ScrollView>
      ) : null}

      {/* ── Collections preview ──────────────────────────────────── */}
      {(isOwnProfile || userCollections.length > 0) ? (
        <View style={styles.collectionsSection}>
          <View style={styles.collectionsHeader}>
            <Text style={[styles.collectionsLabel, { color: t.muted }]}>COLLECTIONS</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.collectionsScroll}
          >
            {userCollections.map(coll => (
              <View key={coll.id} style={{ position: 'relative' }}>
                <TouchableOpacity
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
                {isOwnProfile && (
                  <TouchableOpacity
                    style={styles.collEditIcon}
                    onPress={() => setEditingCollection(coll)}
                    hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
                  >
                    <Ionicons name="pencil" size={10} color={t.muted} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
            {isOwnProfile && (
              <TouchableOpacity
                style={[styles.collCardNew, { borderColor: t.border }]}
                onPress={() => setCollectionModalOpen(true)}
                activeOpacity={0.75}
              >
                <View style={[styles.collNewPlus, { backgroundColor: t.surface2 }]}>
                  <Ionicons name="add" size={20} color={t.muted} />
                </View>
                <Text style={[styles.collNewLabel, { color: t.muted }]}>New</Text>
              </TouchableOpacity>
            )}
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
                onPress={() => navigation.navigate('Settings')}
              >
                <Ionicons name="settings-outline" size={17} color={t.muted} />
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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.muted} />
        }
      />

      <SaveToCollectionModal
        visible={collectionModalOpen}
        pin={null}
        onClose={() => setCollectionModalOpen(false)}
        onCollectionCreated={coll => setUserCollections(prev => [...prev, coll])}
      />

      <EditCollectionModal
        collection={editingCollection}
        onSave={handleSaveCollection}
        onDelete={handleDeleteCollection}
        onClose={() => setEditingCollection(null)}
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
  collectionsHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 10,
  },
  collectionsLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
  editCollectionsBtn: { fontSize: 13, fontWeight: '600' },
  collectionsScroll: { paddingHorizontal: 16, gap: 10, paddingBottom: 4 },
  collCard: { width: 130, borderRadius: 14, borderWidth: 1, padding: 14, gap: 4 },
  collCardNew: {
    width: 130, borderRadius: 14, borderWidth: 1, borderStyle: 'dashed',
    padding: 14, gap: 6, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  collNewPlus: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  collNewLabel: { fontSize: 12, fontWeight: '600' },
  collEditIcon: {
    position: 'absolute', top: 8, right: 8,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.07)',
    alignItems: 'center', justifyContent: 'center',
  },
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

  // Settings / Community Guide row
  settingsSection: { paddingHorizontal: 16, paddingBottom: 16, paddingTop: 4 },
  settingsRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 14, borderWidth: 1, paddingVertical: 14,
    paddingHorizontal: 14,
  },
  settingsIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(122,159,194,0.14)',
    alignItems: 'center', justifyContent: 'center',
  },
  settingsRowTitle: { fontSize: 15, fontWeight: '600', letterSpacing: -0.1 },
  settingsRowSub:   { fontSize: 12, marginTop: 1 },
});

const eStyles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.48)',
  },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 26, borderTopRightRadius: 26,
    padding: 20, paddingBottom: 36, gap: 12,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(28,23,20,0.14)',
    alignSelf: 'center', marginBottom: 6,
  },
  title: { fontSize: 18, fontWeight: '800', color: NAVY, letterSpacing: -0.4, marginBottom: 4 },
  section: { backgroundColor: '#F5F5F5', borderRadius: 14, padding: 16, gap: 0 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: NAVY, marginBottom: 10 },
  input: {
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: 'rgba(28,23,20,0.10)',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: '#1C1714',
  },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  optionTitle: { fontSize: 15, fontWeight: '600', color: '#1C1714', marginBottom: 2 },
  optionSub: { fontSize: 12, color: MUTED_C, lineHeight: 16 },
  divider: { height: 1, backgroundColor: 'rgba(28,23,20,0.07)', marginVertical: 12 },
  friendList: { marginTop: 10, gap: 4 },
  friendRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, paddingHorizontal: 4 },
  friendAvatar: { width: 34, height: 34, borderRadius: 17 },
  friendName: { flex: 1, fontSize: 14, fontWeight: '500', color: '#1C1714' },
  friendCheck: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 1.5, borderColor: 'rgba(28,23,20,0.20)',
    alignItems: 'center', justifyContent: 'center',
  },
  friendCheckSel: { backgroundColor: NAVY, borderColor: NAVY },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1.5, borderColor: 'rgba(192,57,43,0.25)', borderRadius: 12,
    paddingVertical: 12,
  },
  deleteBtnText: { fontSize: 14, fontWeight: '600', color: '#C0392B' },
  saveBtn: {
    backgroundColor: NAVY, borderRadius: 100,
    paddingVertical: 15, alignItems: 'center',
  },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
});
