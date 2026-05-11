import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../supabase';

WebBrowser.maybeCompleteAuthSession();
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const NAVY   = '#0D1F3C';
const CREAM  = '#FAF7F2';
const MUTED  = 'rgba(28,23,20,0.38)';
const BORDER = 'rgba(28,23,20,0.09)';

const BENEFITS = [
  {
    icon: 'location-outline',
    label: 'Hidden spots',
    sub: 'Places your friends love but never post about',
  },
  {
    icon: 'bookmark-outline',
    label: 'Tied to moments',
    sub: 'Each place carries a memory, not just a pin',
  },
  {
    icon: 'people-outline',
    label: 'Your circle',
    sub: 'A map built by the people you actually trust',
  },
];

export default function Login({ onGuestLogin }) {
  const handleGoogleLogin = async () => {
    try {
      const redirectTo = 'gem://';

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, skipBrowserRedirect: true },
      });

      if (error || !data?.url) {
        Alert.alert('Sign-in error', error?.message ?? 'Could not start sign-in');
        return;
      }

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

      if (result.type === 'success') {
        // Tokens arrive in the URL hash fragment: ...#access_token=...&refresh_token=...
        const hash   = result.url.split('#')[1] ?? '';
        const params = Object.fromEntries(
          hash.split('&').filter(Boolean).map(p => p.split('=').map(decodeURIComponent))
        );
        if (params.access_token && params.refresh_token) {
          await supabase.auth.setSession({
            access_token:  params.access_token,
            refresh_token: params.refresh_token,
          });
          // onAuthStateChange in App.js picks up the session automatically
        }
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>

      {/* ── Brand cluster ──────────────────────────────────── */}
      <View style={styles.brandCluster}>
        <Image source={require('../assets/logo.png')} style={styles.logoImage} />
        <View style={styles.rule} />
        <Text style={styles.tagline}>places worth remembering</Text>
      </View>

      {/* ── Headline ───────────────────────────────────────── */}
      <View style={styles.headlineWrap}>
        <Text style={styles.headline}>
          discover the spots{'\n'}your friends actually love
        </Text>
      </View>

      {/* ── Benefits card ──────────────────────────────────── */}
      <View style={styles.benefitsCard}>
        {BENEFITS.map((b, i) => (
          <React.Fragment key={b.label}>
            {i > 0 && <View style={styles.benefitDivider} />}
            <View style={styles.benefitRow}>
              <View style={styles.benefitIconWrap}>
                <Ionicons name={b.icon} size={18} color={NAVY} />
              </View>
              <View style={styles.benefitText}>
                <Text style={styles.benefitLabel}>{b.label}</Text>
                <Text style={styles.benefitSub}>{b.sub}</Text>
              </View>
            </View>
          </React.Fragment>
        ))}
      </View>

      {/* ── Flex spacer ────────────────────────────────────── */}
      <View style={{ flex: 1 }} />

      {/* ── CTA section ────────────────────────────────────── */}
      <View style={styles.ctaSection}>
        <TouchableOpacity
          style={styles.googleBtn}
          onPress={handleGoogleLogin}
          activeOpacity={0.82}
        >
          <View style={styles.googleGCircle}>
            <Text style={styles.googleGText}>G</Text>
          </View>
          <Text style={styles.googleBtnText}>Continue with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.guestBtn}
          onPress={onGuestLogin}
          activeOpacity={0.7}
        >
          <Text style={styles.guestText}>browse without an account</Text>
          <Ionicons name="chevron-forward" size={13} color={MUTED} />
        </TouchableOpacity>

        <Text style={styles.trustCopy}>No account needed to explore</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CREAM,
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 20,
  },

  // Brand cluster
  brandCluster: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 36,
  },
  logoImage: {
    width: 96,
    height: 96,
    borderRadius: 22,
    marginBottom: 4,
  },
  rule: {
    width: 32,
    height: 2,
    backgroundColor: NAVY,
    opacity: 0.15,
    borderRadius: 1,
    marginTop: 14,
    marginBottom: 12,
  },
  tagline: {
    fontSize: 13,
    color: MUTED,
    letterSpacing: 0.4,
  },

  // Headline
  headlineWrap: {
    alignItems: 'center',
    marginBottom: 28,
  },
  headline: {
    fontSize: 22,
    fontWeight: '700',
    color: NAVY,
    textAlign: 'center',
    lineHeight: 30,
    letterSpacing: -0.5,
  },

  // Benefits
  benefitsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    paddingVertical: 4,
    shadowColor: '#1C1714',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  benefitIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(45,63,92,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitText: { flex: 1 },
  benefitLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: NAVY,
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  benefitSub: {
    fontSize: 12,
    color: MUTED,
    lineHeight: 17,
  },
  benefitDivider: {
    height: 1,
    backgroundColor: BORDER,
    marginHorizontal: 20,
  },

  // CTA
  ctaSection: {
    width: '100%',
    alignItems: 'center',
    gap: 14,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 15,
    width: '100%',
    borderWidth: 1.5,
    borderColor: BORDER,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  googleGCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#4285F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleGText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  googleBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: NAVY,
    letterSpacing: -0.2,
  },
  guestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  guestText: {
    fontSize: 14,
    color: MUTED,
  },
  trustCopy: {
    fontSize: 11,
    color: 'rgba(28,23,20,0.25)',
    letterSpacing: 0.2,
    marginTop: -4,
  },
});
