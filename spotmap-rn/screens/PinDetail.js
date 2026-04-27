import React, { useState, useEffect } from 'react';
import {
  View, Text, Image, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { getCat } from '../constants';

const T = {
  bg: '#f5f3ee', surface: '#eceae4', surface2: '#e0ddd6',
  border: 'rgba(0,0,0,0.10)', text: '#0f0f0f',
  muted: 'rgba(15,15,15,0.45)', accent: '#7ab800',
};

export default function PinDetail({ navigation, route }) {
  const { pinId } = route.params;
  const [pin, setPin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDoc(doc(db, 'pins', pinId)).then(d => {
      if (d.exists()) setPin({ id: d.id, ...d.data() });
      setLoading(false);
    });
  }, [pinId]);

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: T.bg }]}>
        <ActivityIndicator color={T.accent} />
      </View>
    );
  }

  if (!pin) {
    return (
      <SafeAreaView style={[styles.page, { backgroundColor: T.bg }]}>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: T.surface, borderColor: T.border }]} onPress={() => navigation.goBack()}>
          <Text style={[styles.backArrow, { color: T.text }]}>‹</Text>
        </TouchableOpacity>
        <View style={styles.centered}>
          <Text style={{ fontSize: 48 }}>📍</Text>
          <Text style={[styles.notFound, { color: T.muted }]}>Pin not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const cat = getCat(pin.category);
  const date = pin.createdAt?.toDate?.()?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <View style={[styles.page, { backgroundColor: T.bg }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero image */}
        <View style={styles.heroWrap}>
          {pin.photoURL
            ? <Image source={{ uri: pin.photoURL }} style={styles.heroImg} />
            : <View style={[styles.heroPlaceholder, { backgroundColor: T.surface2 }]}>
                <Text style={styles.heroPlaceholderIcon}>{cat.icon}</Text>
              </View>
          }
          <TouchableOpacity
            style={styles.backBtnOverlay}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backArrowLight}>‹</Text>
          </TouchableOpacity>
        </View>

        {/* Body */}
        <View style={styles.body}>
          <Text style={[styles.catLabel, { color: cat.color }]}>
            {cat.icon}  {cat.label.toUpperCase()}
          </Text>

          <Text style={[styles.title, { color: T.text }]}>{pin.title}</Text>

          {pin.note ? (
            <View style={[styles.noteWrap, { borderLeftColor: T.accent }]}>
              <Text style={[styles.note, { color: T.muted }]}>{pin.note}</Text>
            </View>
          ) : null}

          <View style={[styles.authorCard, { backgroundColor: T.surface, borderColor: T.border }]}>
            {pin.authorPhoto
              ? <Image source={{ uri: pin.authorPhoto }} style={styles.authorAvatar} />
              : <View style={[styles.authorAvatarFallback, { backgroundColor: T.surface2 }]}>
                  <Text style={{ fontSize: 16 }}>👤</Text>
                </View>
            }
            <View>
              <Text style={[styles.authorName, { color: T.text }]}>{pin.authorName}</Text>
              <Text style={[styles.authorDate, { color: T.muted }]}>
                pinned{date ? ` · ${date}` : ''}
              </Text>
            </View>
          </View>

          {pin.locationName ? (
            <View style={styles.locationRow}>
              <Text style={{ color: T.accent, fontSize: 15 }}>📍</Text>
              <Text style={[styles.locationText, { color: T.muted }]}>{pin.locationName}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  notFound: { fontSize: 14 },

  heroWrap: { position: 'relative' },
  heroImg: { width: '100%', aspectRatio: 4 / 3 },
  heroPlaceholder: { width: '100%', aspectRatio: 4 / 3, alignItems: 'center', justifyContent: 'center' },
  heroPlaceholderIcon: { fontSize: 72 },
  backBtnOverlay: { position: 'absolute', top: 52, left: 16, width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  backArrowLight: { color: '#fff', fontSize: 28, lineHeight: 32 },

  backBtn: { margin: 16, width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  backArrow: { fontSize: 26, lineHeight: 30 },

  body: { padding: 24, gap: 16 },
  catLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 0.7 },
  title: { fontSize: 32, fontWeight: '800', letterSpacing: -1, lineHeight: 36 },
  noteWrap: { borderLeftWidth: 2, paddingLeft: 14 },
  note: { fontSize: 16, fontStyle: 'italic', lineHeight: 24 },
  authorCard: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12, borderWidth: 1 },
  authorAvatar: { width: 36, height: 36, borderRadius: 18 },
  authorAvatarFallback: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  authorName: { fontSize: 14, fontWeight: '500' },
  authorDate: { fontSize: 12, marginTop: 2 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  locationText: { fontSize: 14 },
});
