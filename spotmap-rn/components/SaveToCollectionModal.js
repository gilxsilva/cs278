import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, Modal, Animated, TouchableOpacity, Pressable,
  TextInput, ScrollView, StyleSheet, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MOCK_COLLECTIONS } from '../mockData';

const { width: SW } = Dimensions.get('window');
const GRID_PAD  = 16;
const CARD_GAP  = 10;
const CARD_W    = (SW - GRID_PAD * 2 - CARD_GAP) / 2;
const CARD_H    = 112;
const NAVY      = '#0D1F3C';
const MUTED     = 'rgba(28,23,20,0.38)';
const BORDER    = 'rgba(28,23,20,0.09)';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Toast({ message }) {
  if (!message) return null;
  return (
    <View style={styles.toast}>
      <Ionicons name="checkmark-circle" size={14} color="#3A7D44" />
      <Text style={styles.toastText}>{message}</Text>
    </View>
  );
}

function NewCollectionCard({ onPress }) {
  return (
    <TouchableOpacity style={styles.newCard} onPress={onPress} activeOpacity={0.78}>
      <View style={styles.newCardPlus}>
        <Ionicons name="add" size={22} color={NAVY} />
      </View>
      <Text style={styles.newCardLabel}>New collection</Text>
    </TouchableOpacity>
  );
}

function CollectionCard({ item, selected, onPress }) {
  const isShared = item.visibility === 'shared';
  return (
    <TouchableOpacity
      style={[styles.collCard, selected && styles.collCardSelected]}
      onPress={onPress}
      activeOpacity={0.78}
    >
      {selected && (
        <View style={styles.checkBadge}>
          <Ionicons name="checkmark" size={11} color="#fff" />
        </View>
      )}
      <Text style={[styles.collName, selected && styles.collNameSelected]} numberOfLines={2}>
        {item.name}
      </Text>
      <View style={styles.collMeta}>
        <Text style={[styles.collCount, selected && { color: 'rgba(255,255,255,0.6)' }]}>
          {item.count} gems
        </Text>
        <View style={[
          styles.visPill,
          isShared && styles.visPillShared,
          selected && styles.visPillSelected,
        ]}>
          <Ionicons
            name={isShared ? 'people-outline' : 'lock-closed-outline'}
            size={9}
            color={selected ? 'rgba(255,255,255,0.75)' : (isShared ? NAVY : MUTED)}
          />
          <Text style={[styles.visText, selected && { color: 'rgba(255,255,255,0.75)' }, isShared && !selected && { color: NAVY }]}>
            {item.visibility}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function CreateCollectionForm({ onCancel, onCreate }) {
  const [name, setName] = useState('');
  const canCreate = name.trim().length > 0;
  return (
    <View style={styles.createForm}>
      <Text style={styles.createLabel}>Name your collection</Text>
      <TextInput
        autoFocus
        value={name}
        onChangeText={setName}
        placeholder="e.g. SF Gems, Study Spots…"
        placeholderTextColor={MUTED}
        style={styles.createInput}
        returnKeyType="done"
        onSubmitEditing={() => canCreate && onCreate(name.trim())}
      />
      <View style={styles.createActions}>
        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} activeOpacity={0.75}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.createBtn, !canCreate && { opacity: 0.38 }]}
          onPress={() => canCreate && onCreate(name.trim())}
          activeOpacity={0.82}
          disabled={!canCreate}
        >
          <Text style={styles.createBtnText}>Create</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────

export default function SaveToCollectionModal({ visible, pin, onClose, onSave }) {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(600)).current;

  const [collections, setCollections] = useState([...MOCK_COLLECTIONS]);
  const [savedIds, setSavedIds] = useState(new Set());
  const [isCreating, setIsCreating] = useState(false);
  const [toast, setToast] = useState('');

  // Slide in on open
  useEffect(() => {
    if (visible) {
      setIsCreating(false);
      slideAnim.setValue(600);
      Animated.spring(slideAnim, {
        toValue: 0, useNativeDriver: true, bounciness: 2, speed: 16,
      }).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: 620, duration: 210, useNativeDriver: true,
    }).start(() => onClose());
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2400);
  };

  const toggleCollection = (coll) => {
    setSavedIds(prev => {
      const next = new Set(prev);
      if (next.has(coll.id)) {
        next.delete(coll.id);
      } else {
        next.add(coll.id);
        showToast(`Saved to ${coll.name}`);
      }
      onSave?.(pin?.id, [...next]);
      return next;
    });
  };

  const handleCreate = (name) => {
    const newColl = {
      id: `coll_${Date.now()}`,
      name,
      count: 0,
      visibility: 'private',
    };
    setCollections(prev => [...prev, newColl]);
    setSavedIds(prev => {
      const next = new Set(prev);
      next.add(newColl.id);
      onSave?.(pin?.id, [...next]);
      return next;
    });
    showToast(`Saved to ${name}`);
    setIsCreating(false);
  };

  // Build 2-col grid: "New" card first, then collections
  const cards = [{ __isNew: true }, ...collections];
  const rows  = [];
  for (let i = 0; i < cards.length; i += 2) rows.push(cards.slice(i, i + 2));

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose} />

      <Animated.View
        style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) },
          { transform: [{ translateY: slideAnim }] }]}
      >
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.sheetHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sheetTitle}>Save to collection</Text>
            <Text style={styles.sheetSub}>Choose where this gem should live</Text>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={handleClose} activeOpacity={0.75}>
            <Ionicons name="close" size={18} color={NAVY} />
          </TouchableOpacity>
        </View>

        <Toast message={toast} />

        {isCreating ? (
          <CreateCollectionForm
            onCancel={() => setIsCreating(false)}
            onCreate={handleCreate}
          />
        ) : (
          <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
            {rows.map((row, ri) => (
              <View key={ri} style={styles.gridRow}>
                {row.map(item =>
                  item.__isNew
                    ? <NewCollectionCard key="new" onPress={() => setIsCreating(true)} />
                    : <CollectionCard
                        key={item.id}
                        item={item}
                        selected={savedIds.has(item.id)}
                        onPress={() => toggleCollection(item)}
                      />
                )}
                {/* Fill empty slot in odd-length rows */}
                {row.length === 1 && <View style={{ width: CARD_W }} />}
              </View>
            ))}
          </ScrollView>
        )}
      </Animated.View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.48)',
  },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 26, borderTopRightRadius: 26,
    maxHeight: '82%',
    paddingHorizontal: GRID_PAD,
    paddingTop: 12,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(28,23,20,0.14)',
    alignSelf: 'center', marginBottom: 18,
  },

  // Header
  sheetHeader: {
    flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14,
  },
  sheetTitle: {
    fontSize: 18, fontWeight: '800', color: NAVY,
    letterSpacing: -0.4, marginBottom: 3,
  },
  sheetSub: { fontSize: 12, color: MUTED },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(28,23,20,0.06)',
    alignItems: 'center', justifyContent: 'center',
    marginLeft: 12,
  },

  // Toast
  toast: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: '#EEF7EE',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9,
    marginBottom: 14,
  },
  toastText: { fontSize: 13, fontWeight: '600', color: '#2D6035' },

  // Grid
  grid: { gap: CARD_GAP, paddingBottom: 8 },
  gridRow: { flexDirection: 'row', gap: CARD_GAP },

  // New collection card
  newCard: {
    width: CARD_W, height: CARD_H,
    borderRadius: 16,
    borderWidth: 1.5, borderColor: 'rgba(45,63,92,0.20)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(45,63,92,0.03)',
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  newCardPlus: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(45,63,92,0.09)',
    alignItems: 'center', justifyContent: 'center',
  },
  newCardLabel: {
    fontSize: 13, fontWeight: '600', color: NAVY, textAlign: 'center',
  },

  // Collection card — normal
  collCard: {
    width: CARD_W, height: CARD_H,
    borderRadius: 16,
    borderWidth: 1.5, borderColor: BORDER,
    backgroundColor: '#F7F4F0',
    alignItems: 'center', justifyContent: 'center',
    padding: 12, gap: 6,
  },
  collCardSelected: {
    backgroundColor: NAVY,
    borderColor: NAVY,
  },
  checkBadge: {
    position: 'absolute', top: 10, right: 10,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center', justifyContent: 'center',
  },
  collName: {
    fontSize: 15, fontWeight: '700', color: NAVY,
    textAlign: 'center', letterSpacing: -0.3,
  },
  collNameSelected: { color: '#FFFFFF' },
  collMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  collCount: { fontSize: 11, color: MUTED },
  visPill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 100,
    borderWidth: 1, borderColor: BORDER,
    backgroundColor: 'rgba(28,23,20,0.04)',
  },
  visPillShared: {
    borderColor: 'rgba(45,63,92,0.18)',
    backgroundColor: 'rgba(45,63,92,0.06)',
  },
  visPillSelected: {
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  visText: { fontSize: 9, fontWeight: '600', color: MUTED, letterSpacing: 0.2 },

  // Create form
  createForm: { paddingVertical: 8 },
  createLabel: {
    fontSize: 13, fontWeight: '700', color: NAVY, marginBottom: 10,
  },
  createInput: {
    borderWidth: 1.5, borderColor: 'rgba(28,23,20,0.12)',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: '#1C1714', marginBottom: 16,
  },
  createActions: { flexDirection: 'row', gap: 10 },
  cancelBtn: {
    flex: 1, borderWidth: 1.5, borderColor: 'rgba(28,23,20,0.12)',
    borderRadius: 12, paddingVertical: 13, alignItems: 'center',
  },
  cancelText: { fontSize: 14, fontWeight: '600', color: MUTED },
  createBtn: {
    flex: 1, backgroundColor: NAVY,
    borderRadius: 12, paddingVertical: 13, alignItems: 'center',
  },
  createBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});
