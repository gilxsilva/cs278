import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Alert } from 'react-native';

export default function Login({ onGuestLogin }) {
  const handleGoogleLogin = () => {
    Alert.alert(
      'Google Sign-In',
      'Firebase is not configured yet. Use "explore as guest" to try the app.',
      [{ text: 'Got it' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.gemStar}>✦</Text>
        <Text style={styles.wordmark}>gem</Text>
        <Text style={styles.tagline}>places worth remembering</Text>
      </View>

      <View style={styles.pillars}>
        <View style={styles.pillar}>
          <Text style={styles.pillarEmoji}>🗺</Text>
          <Text style={styles.pillarText}>friends' hidden spots</Text>
        </View>
        <View style={styles.pillar}>
          <Text style={styles.pillarEmoji}>✨</Text>
          <Text style={styles.pillarText}>ambient memories</Text>
        </View>
        <View style={styles.pillar}>
          <Text style={styles.pillarEmoji}>💎</Text>
          <Text style={styles.pillarText}>campus discoveries</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleLogin} activeOpacity={0.85}>
          <Text style={styles.googleG}>G</Text>
          <Text style={styles.googleBtnText}>Continue with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onGuestLogin} activeOpacity={0.7}>
          <Text style={styles.guestText}>explore as guest</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F2',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 72,
    paddingHorizontal: 32,
  },
  hero: {
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
  },
  gemStar: {
    fontSize: 28,
    color: '#2D3F5C',
    marginBottom: 4,
  },
  wordmark: {
    fontSize: 80,
    fontWeight: '900',
    color: '#2D3F5C',
    letterSpacing: -4,
    lineHeight: 84,
  },
  tagline: {
    fontSize: 15,
    color: 'rgba(28,23,20,0.40)',
    textAlign: 'center',
    letterSpacing: 0.3,
    marginTop: 4,
  },
  pillars: {
    flexDirection: 'row',
    gap: 20,
    justifyContent: 'center',
  },
  pillar: {
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  pillarEmoji: { fontSize: 22 },
  pillarText: {
    fontSize: 11,
    color: 'rgba(28,23,20,0.40)',
    textAlign: 'center',
    lineHeight: 16,
    letterSpacing: 0.2,
  },
  actions: {
    width: '100%',
    alignItems: 'center',
    gap: 20,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#2D3F5C',
    borderRadius: 100,
    paddingVertical: 16,
    paddingHorizontal: 28,
    width: '100%',
  },
  googleG: { fontSize: 17, fontWeight: '700', color: '#FAF7F2' },
  googleBtnText: { fontSize: 15, fontWeight: '500', color: '#FAF7F2' },
  guestText: {
    fontSize: 14,
    color: 'rgba(28,23,20,0.40)',
    textDecorationLine: 'underline',
    letterSpacing: 0.2,
  },
});
