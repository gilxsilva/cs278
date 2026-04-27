import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Image,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth } from '../firebase';
import { getCat, THEMES } from '../constants';

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
  const t = THEMES[theme];

  useEffect(() => {
    const q = query(collection(db, 'pins'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setPins(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, err => console.error('Feed snapshot error:', err));
    return unsub;
  }, []);

  const renderPin = ({ item: pin }) => {
    const cat = getCat(pin.category);
    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}
        onPress={() => navigation.navigate('PinDetail', { pinId: pin.id })}
        activeOpacity={0.88}
      >
        {/* Card header row */}
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
              <Text style={[styles.timeAgo, { color: t.muted }]}>
                {timeAgo(pin.createdAt)}
              </Text>
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
      </TouchableOpacity>
    );
  };

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
              onPress={() => signOut(auth)}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  wordmark: { fontSize: 26, fontWeight: '800', letterSpacing: -1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  iconBtnEmoji: { fontSize: 15 },
  avatarBtn: {
    width: 34, height: 34, borderRadius: 17,
    overflow: 'hidden', borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarImg: { width: 34, height: 34 },
  avatarEmoji: { fontSize: 14 },

  list: { padding: 16, gap: 16 },
  listEmpty: { flex: 1 },

  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  cardAuthorRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  authorAvatar: { width: 36, height: 36, borderRadius: 18 },
  authorAvatarFallback: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  authorName: { fontSize: 14, fontWeight: '600' },
  timeAgo: { fontSize: 12, marginTop: 1 },

  catBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 100, borderWidth: 1,
  },
  catBadgeIcon: { fontSize: 12 },
  catBadgeLabel: { fontSize: 12, fontWeight: '600' },

  cardPhoto: { width: '100%', aspectRatio: 4 / 3 },

  cardBody: { padding: 12, gap: 6 },
  pinTitle: { fontSize: 17, fontWeight: '700', letterSpacing: -0.3 },
  pinNote: { fontSize: 14, fontStyle: 'italic', lineHeight: 20 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  locationText: { fontSize: 12 },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 40 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
