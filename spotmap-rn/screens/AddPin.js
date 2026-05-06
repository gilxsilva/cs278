import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, Image,
  Modal, StyleSheet, SafeAreaView, Alert, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { CATEGORIES, NEARBY_PLACES } from '../constants';

const T = {
  bg:       '#FAF7F2',
  surface:  '#F2ECE4',
  surface2: '#E8DDD2',
  border:   'rgba(28,23,20,0.07)',
  text:     '#1C1714',
  muted:    'rgba(28,23,20,0.38)',
  accent:   '#2D3F5C',
};

export default function AddPin({ navigation, user }) {
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [category, setCategory] = useState('');
  const [photo, setPhoto] = useState(null);
  const [location, setLocation] = useState(null);
  const [showLocModal, setShowLocModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo access to add a photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled) setPhoto(result.assets[0]);
  };

  const handleSubmit = async () => {
    if (!title || !category || !location) {
      Alert.alert('Almost there', 'Add a name, type, and location for your gem.');
      return;
    }
    setLoading(true);
    try {
      let photoURL = null;
      if (photo) {
        const response = await fetch(photo.uri);
        const blob = await response.blob();
        const storageRef = ref(storage, `pins/${Date.now()}_${photo.fileName || 'photo.jpg'}`);
        await uploadBytes(storageRef, blob);
        photoURL = await getDownloadURL(storageRef);
      }
      await addDoc(collection(db, 'pins'), {
        title: title.trim(),
        note: note.trim(),
        category,
        photoURL,
        lat: location.latitude,
        lng: location.longitude,
        locationName: location.name,
        authorId: user.uid,
        authorName: user.displayName,
        authorPhoto: user.photoURL,
        createdAt: serverTimestamp(),
      });
      navigation.goBack();
    } catch (e) {
      console.error(e);
      Alert.alert('Something went wrong', 'Try again.');
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.page, { backgroundColor: T.bg }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: T.surface }]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={18} color={T.text} />
        </TouchableOpacity>
        <Text style={[styles.pageTitle, { color: T.text }]}>leave a gem</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.field}>
          <Text style={[styles.label, { color: T.muted }]}>NAME YOUR GEM</Text>
          <TextInput
            style={[styles.input, { backgroundColor: T.surface, color: T.text }]}
            placeholder="e.g. Coupa Café back patio"
            placeholderTextColor={T.muted}
            value={title}
            onChangeText={setTitle}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: T.muted }]}>TYPE OF GEM</Text>
          <View style={styles.catGrid}>
            {CATEGORIES.map(c => (
              <TouchableOpacity
                key={c.id}
                style={[
                  styles.catOption,
                  { backgroundColor: T.surface, borderColor: 'transparent' },
                  category === c.id && { backgroundColor: c.color + '20', borderColor: c.color + '60' },
                ]}
                onPress={() => setCategory(c.id)}
                activeOpacity={0.75}
              >
                <Ionicons name={c.icon} size={20} color={category === c.id ? c.color : T.muted} />
                <Text style={[styles.catLabel, { color: category === c.id ? c.color : T.muted }]}>
                  {c.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: T.muted }]}>WHAT MADE IT SPECIAL?</Text>
          <TextInput
            style={[styles.input, styles.textarea, { backgroundColor: T.surface, color: T.text }]}
            placeholder="what would you tell a friend?"
            placeholderTextColor={T.muted}
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: T.muted }]}>ADD A PHOTO</Text>
          {photo ? (
            <View style={styles.photoPreview}>
              <Image source={{ uri: photo.uri }} style={styles.photoImg} />
              <TouchableOpacity style={styles.photoRemove} onPress={() => setPhoto(null)}>
                <Ionicons name="close" size={14} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.photoUpload, { backgroundColor: T.surface }]}
              onPress={pickPhoto}
              activeOpacity={0.75}
            >
              <Ionicons name="camera-outline" size={24} color={T.muted} />
              <Text style={[styles.photoUploadText, { color: T.muted }]}>tap to add a photo</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: T.muted }]}>WHERE IS IT?</Text>
          <TouchableOpacity
            style={[styles.locationRow, { backgroundColor: T.surface }]}
            onPress={() => setShowLocModal(true)}
            activeOpacity={0.75}
          >
            <Ionicons name="location-outline" size={18} color={location ? T.accent : T.muted} />
            <Text style={[styles.locationText, { color: location ? T.text : T.muted }]}>
              {location ? location.name : 'choose a location'}
            </Text>
            <Ionicons name="chevron-forward" size={14} color={T.muted} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      <TouchableOpacity
        style={[
          styles.submitBtn,
          { backgroundColor: T.accent, opacity: (!title || !category || !location || loading) ? 0.4 : 1 },
        ]}
        onPress={handleSubmit}
        disabled={!title || !category || !location || loading}
        activeOpacity={0.85}
      >
        {loading
          ? <ActivityIndicator color="#FAF7F2" />
          : <Text style={styles.submitText}>leave this gem  ✦</Text>
        }
      </TouchableOpacity>

      <Modal
        visible={showLocModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLocModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowLocModal(false)}
        >
          <View style={[styles.modalSheet, { backgroundColor: T.surface }]}>
            <View style={[styles.modalHandle, { backgroundColor: T.surface2 }]} />
            <Text style={[styles.modalTitle, { color: T.text }]}>where is it?</Text>
            {NEARBY_PLACES.map((place, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.locOption, { backgroundColor: T.bg }]}
                onPress={() => { setLocation(place); setShowLocModal(false); }}
                activeOpacity={0.75}
              >
                <Ionicons name="location-outline" size={16} color={T.accent} />
                <View style={styles.locOptionInfo}>
                  <Text style={[styles.locOptionName, { color: T.text }]}>{place.name}</Text>
                  <Text style={[styles.locOptionAddress, { color: T.muted }]}>{place.address}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  pageTitle: { fontSize: 18, fontWeight: '700', letterSpacing: -0.4 },

  scroll: { flex: 1 },
  scrollContent: { padding: 20, gap: 24 },

  field: { gap: 10 },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  input: { borderRadius: 14, padding: 14, fontSize: 15 },
  textarea: { minHeight: 90, textAlignVertical: 'top' },

  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  catOption: {
    width: '47%', borderRadius: 14, paddingVertical: 14,
    alignItems: 'center', gap: 6, borderWidth: 1.5,
  },
  catLabel: { fontSize: 12, fontWeight: '600', textAlign: 'center' },

  photoUpload: { borderRadius: 14, padding: 32, alignItems: 'center', gap: 8 },
  photoUploadText: { fontSize: 14 },
  photoPreview: { borderRadius: 14, overflow: 'hidden', aspectRatio: 4 / 3, position: 'relative' },
  photoImg: { width: '100%', height: '100%' },
  photoRemove: {
    position: 'absolute', top: 10, right: 10,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center',
  },

  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, padding: 14 },
  locationText: { fontSize: 14, flex: 1 },

  submitBtn: {
    marginHorizontal: 20, marginBottom: 32, borderRadius: 100,
    paddingVertical: 16, alignItems: 'center',
  },
  submitText: { fontSize: 16, fontWeight: '600', color: '#FAF7F2', letterSpacing: 0.2 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingBottom: 48, gap: 10 },
  modalHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 8 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 4, letterSpacing: -0.3 },
  locOption: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12 },
  locOptionInfo: { flex: 1 },
  locOptionName: { fontSize: 14, fontWeight: '600' },
  locOptionAddress: { fontSize: 12, marginTop: 2 },
});
