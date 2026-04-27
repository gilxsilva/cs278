import React, { useState, useEffect } from 'react';
import {
  View, Text, Image, TouchableOpacity, FlatList,
  StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth } from '../firebase';
import { getCat, THEMES } from '../constants';
import { USE_MOCK_DATA, MOCK_PINS } from '../mockData';

export default function Profile({ navigation, route, theme }) {
  const { user } = route.params;
  const [pins, setPins] = useState([]);
  const t = THEMES[theme];

  useEffect(() => {
    if (USE_MOCK_DATA) {
      setPins(MOCK_PINS.filter(p => p.authorId === user.uid));
      return;
    }
    getDocs(
      query(collection(db, 'pins'), where('authorId', '==', user.uid), orderBy('createdAt', 'desc'))
    ).then(snap => setPins(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [user.uid]);

  const uniqueCategories = [...new Set(pins.map(p => p.category))];

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => signOut(auth) },
    ]);
  };

  const renderPin = ({ item: pin }) => {
    const cat = getCat(pin.category);
    return (
      <TouchableOpacity
        style={[styles.pinCard, { backgroundColor: t.surface, borderColor: t.border }]}
        onPress={() => navigation.navigate('PinDetail', { pinId: pin.id, userId: user.uid })}
        activeOpacity={0.85}
      >
        {pin.photoURL
          ? <Image source={{ uri: pin.photoURL }} style={styles.pinPhoto} resizeMode="cover" />
          : <View style={[styles.pinPhotoPlaceholder, { backgroundColor: t.surface2 }]}>
              <Text style={styles.pinPhotoEmoji}>{cat.icon}</Text>
            </View>
        }
        <View style={styles.pinInfo}>
          <View style={[styles.catPill, { backgroundColor: cat.color + '22', borderColor: cat.color + '44' }]}>
            <Text style={[styles.catPillText, { color: cat.color }]}>{cat.icon} {cat.label}</Text>
          </View>
          <Text style={[styles.pinTitle, { color: t.text }]} numberOfLines={1}>{pin.title}</Text>
          {pin.note
            ? <Text style={[styles.pinNote, { color: t.muted }]} numberOfLines={1}>"{pin.note}"</Text>
            : null
          }
          {pin.locationName
            ? <View style={styles.locRow}>
                <Ionicons name="location-outline" size={11} color={t.muted} />
                <Text style={[styles.locText, { color: t.muted }]} numberOfLines={1}>{pin.locationName}</Text>
              </View>
            : null
          }
        </View>
      </TouchableOpacity>
    );
  };

  const ListHeader = () => (
    <>
      {/* Profile hero */}
      <View style={[styles.hero, { backgroundColor: t.bg }]}>
        {user.photoURL
          ? <Image source={{ uri: user.photoURL }} style={styles.avatar} />
          : <View style={[styles.avatarFallback, { backgroundColor: t.surface2 }]}>
              <Text style={styles.avatarEmoji}>👤</Text>
            </View>
        }
        <Text style={[styles.displayName, { color: t.text }]}>{user.displayName}</Text>
        <Text style={[styles.handle, { color: t.muted }]}>
          @{user.displayName?.toLowerCase().replace(' ', '') ?? 'user'}
        </Text>

        {/* Stats row */}
        <View style={[styles.statsRow, { borderColor: t.border }]}>
          <View style={styles.stat}>
            <Text style={[styles.statNum, { color: t.text }]}>{pins.length}</Text>
            <Text style={[styles.statLabel, { color: t.muted }]}>pins</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: t.border }]} />
          <View style={styles.stat}>
            <Text style={[styles.statNum, { color: t.text }]}>{uniqueCategories.length}</Text>
            <Text style={[styles.statLabel, { color: t.muted }]}>categories</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: t.border }]} />
          <View style={styles.stat}>
            <Text style={[styles.statNum, { color: t.text }]}>
              {[...new Set(pins.map(p => p.locationName).filter(Boolean))].length}
            </Text>
            <Text style={[styles.statLabel, { color: t.muted }]}>locations</Text>
          </View>
        </View>
      </View>

      {/* Category badges the user has used */}
      {uniqueCategories.length > 0 && (
        <View style={styles.catsUsed}>
          {uniqueCategories.map(id => {
            const c = getCat(id);
            return (
              <View key={id} style={[styles.catPill, { backgroundColor: c.color + '22', borderColor: c.color + '44' }]}>
                <Text style={[styles.catPillText, { color: c.color }]}>{c.icon} {c.label}</Text>
              </View>
            );
          })}
        </View>
      )}

      <Text style={[styles.sectionTitle, { color: t.text }]}>your spots</Text>
    </>
  );

  const ListEmpty = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>📍</Text>
      <Text style={[styles.emptyText, { color: t.muted }]}>No pins yet — drop one on the map!</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      {/* Header bar */}
      <SafeAreaView edges={['top']} style={{ backgroundColor: t.bg }}>
        <View style={[styles.headerBar, { borderBottomColor: t.border }]}>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: t.surface, borderColor: t.border }]}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={18} color={t.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: t.text }]}>profile</Text>
          <TouchableOpacity
            style={[styles.signOutBtn, { borderColor: t.border }]}
            onPress={handleSignOut}
          >
            <Ionicons name="log-out-outline" size={18} color={t.muted} />
          </TouchableOpacity>
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

  headerBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 16, fontWeight: '700', letterSpacing: -0.3 },
  backBtn: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  signOutBtn: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },

  hero: { alignItems: 'center', paddingTop: 32, paddingBottom: 24, paddingHorizontal: 24 },
  avatar: { width: 88, height: 88, borderRadius: 44, marginBottom: 12 },
  avatarFallback: {
    width: 88, height: 88, borderRadius: 44, marginBottom: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarEmoji: { fontSize: 36 },
  displayName: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  handle: { fontSize: 14, marginTop: 4, marginBottom: 20 },

  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: 16,
    paddingVertical: 16, paddingHorizontal: 24, gap: 24,
  },
  stat: { alignItems: 'center', flex: 1 },
  statNum: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  statLabel: { fontSize: 12, marginTop: 2 },
  statDivider: { width: 1, height: 28 },

  catsUsed: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
    paddingHorizontal: 16, paddingBottom: 16,
  },
  catPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 100, borderWidth: 1,
  },
  catPillText: { fontSize: 12, fontWeight: '600' },

  sectionTitle: {
    fontSize: 18, fontWeight: '800', letterSpacing: -0.5,
    paddingHorizontal: 16, paddingBottom: 12,
  },

  list: { paddingBottom: 40 },

  pinCard: {
    marginHorizontal: 16, marginBottom: 12,
    borderRadius: 14, borderWidth: 1, overflow: 'hidden',
    flexDirection: 'row',
  },
  pinPhoto: { width: 88, height: 88 },
  pinPhotoPlaceholder: {
    width: 88, height: 88,
    alignItems: 'center', justifyContent: 'center',
  },
  pinPhotoEmoji: { fontSize: 28 },
  pinInfo: { flex: 1, padding: 12, gap: 4, justifyContent: 'center' },
  pinTitle: { fontSize: 15, fontWeight: '700' },
  pinNote: { fontSize: 12, fontStyle: 'italic' },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  locText: { fontSize: 11 },

  emptyState: { alignItems: 'center', padding: 40, gap: 10 },
  emptyIcon: { fontSize: 40 },
  emptyText: { fontSize: 14, textAlign: 'center' },
});
