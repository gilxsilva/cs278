import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, Image, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, TextInput, KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { getCat, THEMES } from '../constants';
import { USE_MOCK_DATA, MOCK_PINS, MOCK_COMMENTS } from '../mockData';

const T_LIGHT = {
  bg: '#f5f3ee', surface: '#eceae4', surface2: '#e0ddd6',
  border: 'rgba(0,0,0,0.10)', text: '#0f0f0f',
  muted: 'rgba(15,15,15,0.45)', accent: '#435ca7',
};

function timeAgo(timestamp) {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const SAVER_PHOTOS = {
  mock_eva:   'https://i.pravatar.cc/150?img=47',
  mock_yujen: 'https://i.pravatar.cc/150?img=33',
  mock_alex:  'https://i.pravatar.cc/150?img=15',
  guest:      'https://i.pravatar.cc/150?img=12',
};

export default function PinDetail({ navigation, route }) {
  const { pinId, userId, focusComment } = route.params ?? {};
  const [pin, setPin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [saveCount, setSaveCount] = useState(0);
  const commentInputRef = useRef(null);
  const scrollRef = useRef(null);

  // Use light theme always in detail (can be extended to receive theme prop)
  const t = T_LIGHT;

  useEffect(() => {
    if (USE_MOCK_DATA) {
      const found = MOCK_PINS.find(p => p.id === pinId);
      if (found) {
        setPin(found);
        setIsSaved((found.savedBy ?? []).includes(userId ?? 'guest'));
        setSaveCount(found.saveCount ?? 0);
      }
      setComments(MOCK_COMMENTS[pinId] ?? []);
      setLoading(false);
      return;
    }
    getDoc(doc(db, 'pins', pinId)).then(d => {
      if (d.exists()) {
        const data = { id: d.id, ...d.data() };
        setPin(data);
        setSaveCount(data.saveCount ?? 0);
      }
      setLoading(false);
    });
    const commentsUnsub = onSnapshot(
      query(collection(db, 'pins', pinId, 'comments'), orderBy('createdAt', 'asc')),
      snap => setComments(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    return commentsUnsub;
  }, [pinId, userId]);

  useEffect(() => {
    if (focusComment && commentInputRef.current) {
      setTimeout(() => commentInputRef.current?.focus(), 400);
    }
  }, [focusComment, loading]);

  const toggleSave = async () => {
    const next = !isSaved;
    setIsSaved(next);
    setSaveCount(c => c + (next ? 1 : -1));
    if (!USE_MOCK_DATA) {
      const ref = doc(db, 'pins', pinId, 'saves', userId);
      next ? await setDoc(ref, { savedAt: new Date() }) : await deleteDoc(ref);
    }
  };

  const submitComment = async () => {
    if (!commentText.trim() || submitting) return;
    setSubmitting(true);
    const newComment = {
      id: `local_${Date.now()}`,
      text: commentText.trim(),
      authorId: userId ?? 'guest',
      authorName: 'Demo User',
      authorPhoto: 'https://i.pravatar.cc/150?img=12',
      createdAt: { toDate: () => new Date() },
    };
    if (USE_MOCK_DATA) {
      setComments(prev => [...prev, newComment]);
    } else {
      await addDoc(collection(db, 'pins', pinId, 'comments'), {
        ...newComment,
        createdAt: serverTimestamp(),
      });
    }
    setCommentText('');
    setSubmitting(false);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: t.bg }]}>
        <ActivityIndicator color={t.accent} />
      </View>
    );
  }

  if (!pin) {
    return (
      <SafeAreaView style={[styles.page, { backgroundColor: t.bg }]}>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: t.surface, borderColor: t.border }]} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={18} color={t.text} />
        </TouchableOpacity>
        <View style={styles.centered}>
          <Text style={{ fontSize: 48 }}>📍</Text>
          <Text style={[{ color: t.muted, fontSize: 14 }]}>Pin not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const cat = getCat(pin.category);
  const date = pin.createdAt?.toDate?.()?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const savers = (pin.savedBy ?? []).slice(0, 4);

  return (
    <KeyboardAvoidingView
      style={[styles.page, { backgroundColor: t.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Hero */}
        <View style={styles.heroWrap}>
          {pin.photoURL
            ? <Image source={{ uri: pin.photoURL }} style={styles.heroImg} />
            : <View style={[styles.heroPlaceholder, { backgroundColor: t.surface2 }]}>
                <Text style={styles.heroEmoji}>{cat.icon}</Text>
              </View>
          }
          <TouchableOpacity style={styles.backBtnOverlay} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          {/* Category + save row */}
          <View style={styles.topRow}>
            <View style={[styles.catPill, { backgroundColor: cat.color + '22', borderColor: cat.color + '44' }]}>
              <Text style={[styles.catPillText, { color: cat.color }]}>{cat.icon}  {cat.label}</Text>
            </View>
            <TouchableOpacity style={styles.saveBtn} onPress={toggleSave} activeOpacity={0.75}>
              <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={22} color={isSaved ? t.accent : t.muted} />
              <Text style={[styles.saveBtnText, { color: isSaved ? t.accent : t.muted }]}>
                {saveCount > 0 ? saveCount : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.title, { color: t.text }]}>{pin.title}</Text>

          {pin.note
            ? <View style={[styles.noteWrap, { borderLeftColor: t.accent }]}>
                <Text style={[styles.note, { color: t.muted }]}>{pin.note}</Text>
              </View>
            : null
          }

          {/* Author */}
          <View style={[styles.authorCard, { backgroundColor: t.surface, borderColor: t.border }]}>
            {pin.authorPhoto
              ? <Image source={{ uri: pin.authorPhoto }} style={styles.authorAvatar} />
              : <View style={[styles.authorAvatarFallback, { backgroundColor: t.surface2 }]}>
                  <Text>👤</Text>
                </View>
            }
            <View>
              <Text style={[styles.authorName, { color: t.text }]}>{pin.authorName}</Text>
              <Text style={[styles.authorDate, { color: t.muted }]}>
                pinned{date ? ` · ${date}` : ''}
              </Text>
            </View>
          </View>

          {/* Location */}
          {pin.locationName
            ? <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={15} color={t.accent} />
                <Text style={[styles.locationText, { color: t.muted }]}>{pin.locationName}</Text>
              </View>
            : null
          }

          {/* Saved by */}
          {savers.length > 0 && (
            <View style={[styles.savedByRow, { backgroundColor: t.surface, borderColor: t.border }]}>
              <View style={styles.savedByAvatars}>
                {savers.map((uid, i) => (
                  SAVER_PHOTOS[uid]
                    ? <Image
                        key={uid}
                        source={{ uri: SAVER_PHOTOS[uid] }}
                        style={[styles.savedByAvatar, { marginLeft: i === 0 ? 0 : -8, zIndex: 4 - i }]}
                      />
                    : null
                ))}
              </View>
              <Text style={[styles.savedByText, { color: t.muted }]}>
                {saveCount === 1
                  ? '1 person saved this'
                  : `${saveCount} people saved this`}
              </Text>
            </View>
          )}

          {/* ── Comments ── */}
          <View style={styles.commentsSection}>
            <Text style={[styles.commentsSectionTitle, { color: t.text }]}>
              {comments.length > 0 ? `${comments.length} comment${comments.length !== 1 ? 's' : ''}` : 'Comments'}
            </Text>

            {comments.length === 0 && (
              <Text style={[styles.noComments, { color: t.muted }]}>Be the first to comment</Text>
            )}

            {comments.map(c => (
              <View key={c.id} style={styles.comment}>
                {c.authorPhoto
                  ? <Image source={{ uri: c.authorPhoto }} style={styles.commentAvatar} />
                  : <View style={[styles.commentAvatarFallback, { backgroundColor: t.surface2 }]}>
                      <Text style={{ fontSize: 12 }}>👤</Text>
                    </View>
                }
                <View style={[styles.commentBubble, { backgroundColor: t.surface }]}>
                  <View style={styles.commentHeader}>
                    <Text style={[styles.commentAuthor, { color: t.text }]}>
                      {c.authorName?.split(' ')[0]}
                    </Text>
                    <Text style={[styles.commentTime, { color: t.muted }]}>{timeAgo(c.createdAt)}</Text>
                  </View>
                  <Text style={[styles.commentText, { color: t.text }]}>{c.text}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Comment input */}
      <View style={[styles.inputBar, { backgroundColor: t.bg, borderTopColor: t.border }]}>
        <TextInput
          ref={commentInputRef}
          style={[styles.commentInput, { backgroundColor: t.surface, borderColor: t.border, color: t.text }]}
          placeholder="add a comment…"
          placeholderTextColor={t.muted}
          value={commentText}
          onChangeText={setCommentText}
          multiline
          maxLength={280}
          returnKeyType="send"
          onSubmitEditing={submitComment}
        />
        <TouchableOpacity
          style={[styles.sendBtn, { backgroundColor: commentText.trim() ? t.accent : t.surface2 }]}
          onPress={submitComment}
          disabled={!commentText.trim() || submitting}
        >
          <Ionicons name="arrow-up" size={18} color={commentText.trim() ? '#0f0f0f' : t.muted} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },

  heroWrap: { position: 'relative' },
  heroImg: { width: '100%', aspectRatio: 4 / 3 },
  heroPlaceholder: { width: '100%', aspectRatio: 4 / 3, alignItems: 'center', justifyContent: 'center' },
  heroEmoji: { fontSize: 72 },
  backBtnOverlay: {
    position: 'absolute', top: 52, left: 16,
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center', justifyContent: 'center',
  },
  backBtn: { margin: 16, width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },

  body: { padding: 20, gap: 16, paddingBottom: 8 },

  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  catPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100, borderWidth: 1 },
  catPillText: { fontSize: 13, fontWeight: '600' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  saveBtnText: { fontSize: 14, fontWeight: '600' },

  title: { fontSize: 30, fontWeight: '800', letterSpacing: -1, lineHeight: 34 },
  noteWrap: { borderLeftWidth: 2, paddingLeft: 14 },
  note: { fontSize: 16, fontStyle: 'italic', lineHeight: 24 },

  authorCard: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12, borderWidth: 1 },
  authorAvatar: { width: 36, height: 36, borderRadius: 18 },
  authorAvatarFallback: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  authorName: { fontSize: 14, fontWeight: '500' },
  authorDate: { fontSize: 12, marginTop: 2 },

  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  locationText: { fontSize: 14 },

  savedByRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, borderWidth: 1 },
  savedByAvatars: { flexDirection: 'row' },
  savedByAvatar: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: '#f5f3ee' },
  savedByText: { fontSize: 13 },

  // Comments
  commentsSection: { gap: 12, paddingBottom: 16 },
  commentsSectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  noComments: { fontSize: 14, fontStyle: 'italic' },
  comment: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  commentAvatar: { width: 30, height: 30, borderRadius: 15, marginTop: 2 },
  commentAvatarFallback: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  commentBubble: { flex: 1, borderRadius: 12, padding: 10, gap: 3 },
  commentHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  commentAuthor: { fontSize: 13, fontWeight: '600' },
  commentTime: { fontSize: 11 },
  commentText: { fontSize: 14, lineHeight: 20 },

  // Input bar
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: 16, paddingVertical: 10,
    borderTopWidth: 1, paddingBottom: Platform.OS === 'ios' ? 28 : 12,
  },
  commentInput: {
    flex: 1, borderWidth: 1, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 15, maxHeight: 100,
  },
  sendBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
});
