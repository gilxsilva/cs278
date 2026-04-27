import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, Image,
  Modal, StyleSheet, SafeAreaView, Alert, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { CATEGORIES, NEARBY_PLACES } from '../constants';

const T = {
  bg: '#f5f3ee', surface: '#eceae4', surface2: '#e0ddd6',
  border: 'rgba(0,0,0,0.10)', text: '#0f0f0f',
  muted: 'rgba(15,15,15,0.45)', accent: '#7ab800',
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
      Alert.alert('Permission needed', 'Allow photo access to add a photo to your pin.');
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
      Alert.alert('Missing info', 'Fill in a name, category and location.');
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
      Alert.alert('Error', 'Something went wrong. Try again.');
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.page, { backgroundColor: T.bg }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: T.surface, borderColor: T.border }]} onPress={() => navigation.goBack()}>
          <Text style={[styles.backArrow, { color: T.text }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.pageTitle, { color: T.text }]}>drop a pin</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Name */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: T.muted }]}>SPOT NAME</Text>
          <TextInput
            style={[styles.input, { backgroundColor: T.surface, borderColor: T.border, color: T.text }]}
            placeholder="e.g. Moffitt 3rd floor"
            placeholderTextColor={T.muted}
            value={title}
            onChangeText={setTitle}
          />
        </View>

        {/* Category */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: T.muted }]}>CATEGORY</Text>
          <View style={styles.catGrid}>
            {CATEGORIES.map(c => (
              <TouchableOpacity
                key={c.id}
                style={[styles.catOption, { backgroundColor: T.surface, borderColor: category === c.id ? c.color : T.border }]}
                onPress={() => setCategory(c.id)}
                activeOpacity={0.75}
              >
                <Text style={styles.catIcon}>{c.icon}</Text>
                <Text style={[styles.catLabel, { color: category === c.id ? T.text : T.muted }]}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Note */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: T.muted }]}>YOUR NOTE</Text>
          <TextInput
            style={[styles.input, styles.textarea, { backgroundColor: T.surface, borderColor: T.border, color: T.text }]}
            placeholder="what would you tell a friend?"
            placeholderTextColor={T.muted}
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Photo */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: T.muted }]}>PHOTO (OPTIONAL)</Text>
          {photo ? (
            <View style={styles.photoPreview}>
              <Image source={{ uri: photo.uri }} style={styles.photoImg} />
              <TouchableOpacity style={styles.photoRemove} onPress={() => setPhoto(null)}>
                <Text style={styles.photoRemoveText}>✕</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.photoUpload, { backgroundColor: T.surface, borderColor: T.border }]}
              onPress={pickPhoto}
              activeOpacity={0.75}
            >
              <Text style={[styles.photoUploadText, { color: T.muted }]}>📷  tap to add a photo</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Location */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: T.muted }]}>LOCATION</Text>
          <TouchableOpacity
            style={[styles.locationRow, { backgroundColor: T.surface, borderColor: T.border }]}
            onPress={() => setShowLocModal(true)}
            activeOpacity={0.75}
          >
            <Text style={{ color: T.accent, fontSize: 16 }}>📍</Text>
            <Text style={[styles.locationText, { color: location ? T.text : T.muted }]}>
              {location ? location.name : 'choose a location'}
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      <TouchableOpacity
        style={[styles.submitBtn, { backgroundColor: T.accent, opacity: (!title || !category || !location || loading) ? 0.4 : 1 }]}
        onPress={handleSubmit}
        disabled={!title || !category || !location || loading}
        activeOpacity={0.85}
      >
        {loading
          ? <ActivityIndicator color="#0f0f0f" />
          : <Text style={styles.submitText}>drop pin on map</Text>
        }
      </TouchableOpacity>

      {/* Location modal */}
      <Modal visible={showLocModal} transparent animationType="slide" onRequestClose={() => setShowLocModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowLocModal(false)}>
          <View style={[styles.modalSheet, { backgroundColor: T.surface }]}>
            <Text style={[styles.modalTitle, { color: T.text }]}>pick a location</Text>
            {NEARBY_PLACES.map((place, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.locOption, { backgroundColor: T.surface2, borderColor: T.border }]}
                onPress={() => { setLocation(place); setShowLocModal(false); }}
                activeOpacity={0.75}
              >
                <Text style={{ color: T.accent, fontSize: 16 }}>📍</Text>
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
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
  backBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  backArrow: { fontSize: 26, lineHeight: 30 },
  pageTitle: { fontSize: 22, fontWeight: '700', letterSpacing: -0.5 },

  scroll: { flex: 1 },
  scrollContent: { padding: 20, gap: 20 },

  field: { gap: 8 },
  label: { fontSize: 12, fontWeight: '600', letterSpacing: 0.8 },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 15 },
  textarea: { minHeight: 90, textAlignVertical: 'top' },

  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catOption: { width: '31%', borderWidth: 1.5, borderRadius: 12, paddingVertical: 12, alignItems: 'center', gap: 6 },
  catIcon: { fontSize: 22 },
  catLabel: { fontSize: 12, fontWeight: '500' },

  photoUpload: { borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 12, padding: 28, alignItems: 'center' },
  photoUploadText: { fontSize: 14 },
  photoPreview: { borderRadius: 12, overflow: 'hidden', aspectRatio: 4 / 3, position: 'relative' },
  photoImg: { width: '100%', height: '100%' },
  photoRemove: { position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  photoRemoveText: { color: '#fff', fontSize: 13 },

  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 12, padding: 14 },
  locationText: { fontSize: 14, flex: 1 },

  submitBtn: { marginHorizontal: 20, marginBottom: 32, borderRadius: 100, paddingVertical: 16, alignItems: 'center' },
  submitText: { fontSize: 16, fontWeight: '600', color: '#0f0f0f' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 48, gap: 10 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  locOption: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, borderWidth: 1 },
  locOptionInfo: { flex: 1 },
  locOptionName: { fontSize: 14, fontWeight: '500' },
  locOptionAddress: { fontSize: 12, marginTop: 2 },
});
