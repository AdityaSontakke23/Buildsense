import React from 'react';
import {
  View, Text, StyleSheet, Alert,
  ScrollView, Pressable, Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Button from '@/src/components/common/Button';
import { useAuth } from '@/src/hooks/useAuth';
import { useTheme } from '@/src/hooks/useTheme';
import { useProjects } from '@/src/hooks/useProjects';
import { SPACING, TYPOGRAPHY } from '@/src/utils/constants';
import { getAverageScore } from '@/src/utils/helpers';

const getInitials = (name = '') => {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (parts[0]?.[0] ?? '?').toUpperCase();
};

const SettingRow = ({ icon, label, value, onPress, rightEl, colors, active }) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      styles.settingRow,
      {
        borderBottomColor: colors.border,
        opacity: pressed && onPress ? 0.7 : 1,
        backgroundColor: active ? colors.primary + '10' : 'transparent',
      },
    ]}
  >
    <View style={[styles.settingIcon, { backgroundColor: colors.primary + '15' }]}>
      <Ionicons name={icon} size={18} color={colors.primary} />
    </View>
    <Text style={[styles.settingLabel, { color: colors.text }]}>{label}</Text>
    <View style={styles.settingRight}>
      {value && (
        <Text style={[styles.settingValue, { color: colors.textLight }]}>{value}</Text>
      )}
      {rightEl ?? (onPress
        ? <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
        : null
      )}
    </View>
  </Pressable>
);

export default function ProfileScreen() {
  const { user, signOut, isLoading } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();
  const { projects } = useProjects();

  const displayName = user?.user_metadata?.display_name ?? user?.email?.split('@')[0] ?? 'User';
  const email = user?.email ?? '';
  const totalProjects = projects.length;
  const avgScore = getAverageScore(projects);
  const initials = getInitials(displayName);

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >

        {/* Page title */}
        <Text style={[styles.pageTitle, { color: colors.text }]}>Profile</Text>

        {/* Identity card */}
        <LinearGradient
          colors={['#6366F1', '#8B5CF6', '#06B6D4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.identityCard}
        >
          {/* Decorative circles */}
          <View style={styles.decCircle1} />
          <View style={styles.decCircle2} />

          {/* Avatar with gradient ring */}
          <LinearGradient
            colors={['#9760d2', '#7ee887', '#F5D9B0']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatarRing}
          >
            <View style={styles.avatarInner}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          </LinearGradient>

          <Text style={styles.nameText}>{displayName}</Text>
          <Text style={styles.emailText}>{email}</Text>

          {/* Verified chip */}
          <View style={styles.verifiedChip}>
            <Ionicons name="checkmark-circle" size={12} color="#FFFFFF" />
            <Text style={styles.verifiedText}>Verified Account</Text>
          </View>
        </LinearGradient>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.statTopBar, { backgroundColor: colors.primary }]} />
            <Text style={[styles.statValue, { color: colors.primary }]}>{totalProjects}</Text>
            <Text style={[styles.statLabel, { color: colors.textLight }]}>Projects</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.statTopBar, { backgroundColor: colors.success }]} />
            <Text style={[styles.statValue, { color: totalProjects > 0 ? colors.success : colors.textLight }]}>
              {totalProjects > 0 ? avgScore : '—'}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textLight }]}>Avg Score</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.statTopBar, { backgroundColor: colors.secondary }]} />
            <Ionicons name="cloud-done-outline" size={22} color={colors.secondary} />
            <Text style={[styles.statLabel, { color: colors.textLight }]}>Synced</Text>
          </View>
        </View>

        {/* Preferences */}
        <View style={styles.sectionLabelRow}>
          <View style={[styles.sectionAccent, { backgroundColor: colors.primary }]} />
          <Text style={[styles.sectionLabel, { color: colors.textLight }]}>PREFERENCES</Text>
        </View>
        <View style={[styles.settingsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <SettingRow
            icon="moon-outline"
            label="Dark Mode"
            colors={colors}
            active={isDark}
            rightEl={
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.border, true: colors.primary + '80' }}
                thumbColor={isDark ? colors.primary : colors.textLight}
              />
            }
          />
          <SettingRow
            icon="compass-outline"
            label="Climate Explorer"
            colors={colors}
            onPress={() => router.push('/(tabs)/explore')}
          />
        </View>

        {/* About */}
        <View style={styles.sectionLabelRow}>
          <View style={[styles.sectionAccent, { backgroundColor: colors.secondary }]} />
          <Text style={[styles.sectionLabel, { color: colors.textLight }]}>ABOUT</Text>
        </View>
        <View style={[styles.settingsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <SettingRow
            icon="information-circle-outline"
            label="What this app does"
            colors={colors}
            rightEl={null}
          />
          <View style={styles.aboutContent}>
            {[
              'Rapid passive thermal analysis for early-stage design decisions.',
              'Estimates thermal comfort using local climate data + building inputs.',
              'Helps visualise impact of orientation, WWR, and envelope choices.',
            ].map((item, i) => (
              <View key={i} style={styles.bulletRow}>
                <LinearGradient
                  colors={['#9760d2', '#7ee887']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.bullet}
                />
                <Text style={[styles.bulletText, { color: colors.textLight }]}>{item}</Text>
              </View>
            ))}
          </View>

          <SettingRow
            icon="shield-checkmark-outline"
            label="Data & Privacy"
            colors={colors}
            rightEl={null}
          />
          <Text style={[styles.privacyText, { color: colors.textLight }]}>
            All project data is securely stored on Supabase. We do not sell your data.
            Climate data is fetched live from OpenWeatherMap API.
          </Text>
        </View>

        {/* Version */}
        <View style={styles.versionRow}>
          <Ionicons name="apps-outline" size={16} color={colors.textLight} />
          <Text style={[styles.versionText, { color: colors.textLight }]}>BuildSense v1.0</Text>
        </View>

        {/* Logout */}
        <Button
          title="Log Out"
          onPress={handleLogout}
          variant="danger"
          isLoading={isLoading}
          style={styles.logoutBtn}
        />

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: SPACING.lg, paddingBottom: SPACING.xl + 16 },

  pageTitle: { ...TYPOGRAPHY.h2, fontWeight: '800', marginBottom: SPACING.lg },

  // Identity card
  identityCard: {
    borderRadius: 20, padding: SPACING.lg,
    alignItems: 'center', marginBottom: SPACING.md,
    overflow: 'hidden', paddingVertical: SPACING.xl,
  },
  decCircle1: {
    position: 'absolute', width: 140, height: 140,
    borderRadius: 70, backgroundColor: '#FFFFFF08',
    top: -40, right: -30,
  },
  decCircle2: {
    position: 'absolute', width: 100, height: 100,
    borderRadius: 50, backgroundColor: '#FFFFFF08',
    bottom: -20, left: -20,
  },
  avatarRing: {
    width: 80, height: 80, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.md, padding: 2.5,
  },
  avatarInner: {
    flex: 1, width: '100%', borderRadius: 20,
    backgroundColor: '#1E1040',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitials: { fontSize: 28, fontWeight: '800', color: '#FFFFFF' },
  nameText: { ...TYPOGRAPHY.h3, color: '#FFFFFF', fontWeight: '700' },
  emailText: { ...TYPOGRAPHY.bodySmall, color: '#FFFFFFB0', marginTop: 4 },
  verifiedChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#FFFFFF20', borderRadius: 20,
    paddingHorizontal: SPACING.sm, paddingVertical: 4,
    marginTop: SPACING.md,
  },
  verifiedText: { ...TYPOGRAPHY.caption, color: '#FFFFFF', fontWeight: '600' },

  // Stats
  statsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
  statCard: {
    flex: 1, borderRadius: 12, borderWidth: 1.5,
    alignItems: 'center', overflow: 'hidden',
    paddingBottom: SPACING.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  statTopBar: { width: '100%', height: 3, marginBottom: SPACING.sm },
  statValue: { ...TYPOGRAPHY.h2, fontWeight: '800' },
  statLabel: { ...TYPOGRAPHY.caption },

  // Section labels
  sectionLabelRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: SPACING.xs, marginBottom: SPACING.sm, marginTop: SPACING.sm,
  },
  sectionAccent: { width: 3, height: 14, borderRadius: 2 },
  sectionLabel: { ...TYPOGRAPHY.caption, fontWeight: '700', letterSpacing: 1 },

  // Settings card
  settingsCard: {
    borderRadius: 14, borderWidth: 1.5,
    overflow: 'hidden', marginBottom: SPACING.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  settingRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: SPACING.md, borderBottomWidth: 1,
  },
  settingIcon: {
    width: 34, height: 34, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
    marginRight: SPACING.md,
  },
  settingLabel: { ...TYPOGRAPHY.body, flex: 1 },
  settingRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  settingValue: { ...TYPOGRAPHY.bodySmall },

  aboutContent: { paddingHorizontal: SPACING.md, paddingBottom: SPACING.md },
  bulletRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    gap: SPACING.sm, marginBottom: SPACING.xs,
  },
  bullet: { width: 6, height: 6, borderRadius: 3, marginTop: 6 },
  bulletText: { ...TYPOGRAPHY.bodySmall, flex: 1, lineHeight: 20 },

  privacyText: {
    ...TYPOGRAPHY.bodySmall, lineHeight: 20,
    paddingHorizontal: SPACING.md, paddingBottom: SPACING.md,
  },

  versionRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: SPACING.xs,
    marginBottom: SPACING.lg,
  },
  versionText: { ...TYPOGRAPHY.caption },
  logoutBtn: { marginBottom: SPACING.sm },
});