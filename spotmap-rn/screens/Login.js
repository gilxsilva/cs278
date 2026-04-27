import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Alert,
} from 'react-native';

export default function Login({ onGuestLogin }) {
  const handleGoogleLogin = () => {
    Alert.alert(
      'Google Sign-In',
      'Firebase is not configured yet. Use "Skip for now" to explore the app.',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.wordmark}>spot</Text>
        <Text style={styles.tagline}>your friends' favorite places, on one map</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleLogin} activeOpacity={0.85}>
          <Text style={styles.googleG}>G</Text>
          <Text style={styles.googleBtnText}>Continue with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onGuestLogin} activeOpacity={0.7}>
          <Text style={styles.guestText}>Skip for now (demo only)</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f3ee',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  hero: {
    alignItems: 'center',
    gap: 16,
  },
  wordmark: {
    fontSize: 80,
    fontWeight: '900',
    color: '#7ab800',
    letterSpacing: -4,
    lineHeight: 84,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(15,15,15,0.5)',
    textAlign: 'center',
    maxWidth: 220,
    lineHeight: 24,
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
    backgroundColor: '#0f0f0f',
    borderRadius: 100,
    paddingVertical: 16,
    paddingHorizontal: 28,
    width: '100%',
  },
  googleG: {
    fontSize: 17,
    fontWeight: '700',
    color: '#f0ede8',
  },
  googleBtnText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#f0ede8',
  },
  guestText: {
    fontSize: 14,
    color: 'rgba(15,15,15,0.5)',
    textDecorationLine: 'underline',
  },
});
