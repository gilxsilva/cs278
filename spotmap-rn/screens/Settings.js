import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../supabase';

const CREAM  = '#FAF7F2';
const NAVY   = '#0D1F3C';
const MUTED  = 'rgba(28,23,20,0.38)';
const BORDER = 'rgba(28,23,20,0.09)';

function Row({ icon, iconColor, iconBg, title, subtitle, onPress, destructive }) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={[styles.rowIcon, { backgroundColor: iconBg ?? 'rgba(13,31,60,0.06)' }]}>
        <Ionicons name={icon} size={17} color={iconColor ?? NAVY} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowTitle, destructive && styles.rowTitleDestructive]}>
          {title}
        </Text>
        {subtitle ? <Text style={styles.rowSub}>{subtitle}</Text> : null}
      </View>
      {!destructive && <Ionicons name="chevron-forward" size={15} color={MUTED} />}
    </TouchableOpacity>
  );
}

export default function Settings({ navigation }) {
  const handleSignOut = () => {
    Alert.alert('Sign out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => supabase.auth.signOut() },
    ]);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: CREAM }}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-back" size={20} color={NAVY} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>settings</Text>
          <View style={{ width: 34 }} />
        </View>
      </SafeAreaView>

      <View style={styles.content}>

        {/* ── Learn ──────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>LEARN</Text>
        <View style={styles.card}>
          <Row
            icon="play-circle-outline"
            iconColor="#7A9FC2"
            iconBg="rgba(122,159,194,0.14)"
            title="How gem works"
            subtitle="Replay the onboarding"
            onPress={() => navigation.navigate('OnboardingReview')}
          />
          <View style={styles.divider} />
          <Row
            icon="compass-outline"
            iconColor="#A98BBE"
            iconBg="rgba(169,139,190,0.14)"
            title="Community Guide"
            subtitle="Principles, examples, and norms"
            onPress={() => navigation.navigate('CommunityGuide')}
          />
        </View>

        {/* ── Account ────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>ACCOUNT</Text>
        <View style={styles.card}>
          <Row
            icon="log-out-outline"
            iconColor="rgba(192,57,43,0.80)"
            iconBg="rgba(192,57,43,0.08)"
            title="Sign out"
            onPress={handleSignOut}
            destructive
          />
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CREAM },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  backBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(13,31,60,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: NAVY, letterSpacing: -0.3 },

  content: { padding: 20, gap: 6 },

  sectionLabel: {
    fontSize: 10, fontWeight: '700', color: MUTED,
    letterSpacing: 0.8, marginBottom: 8, marginTop: 16,
    paddingHorizontal: 4,
  },

  card: {
    backgroundColor: '#FFFFFF', borderRadius: 18,
    borderWidth: 1, borderColor: BORDER, overflow: 'hidden',
  },
  divider: { height: 1, backgroundColor: BORDER, marginHorizontal: 16 },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  rowIcon: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  rowTitle: { fontSize: 15, fontWeight: '600', color: NAVY, letterSpacing: -0.1 },
  rowTitleDestructive: { color: 'rgba(192,57,43,0.90)' },
  rowSub: { fontSize: 12, color: MUTED, marginTop: 1 },
});
