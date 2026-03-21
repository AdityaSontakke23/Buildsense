import React from 'react';
import {
  View, Text, StyleSheet, Alert,
  ScrollView, Pressable, Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Button from '@/src/components/common/Button';
import { useAuth } from '@/src/hooks/useAuth';
import { useTheme } from '@/src/hooks/useTheme';
import { useProjects } from '@/src/hooks/useProjects';
import { SPACING, TYPOGRAPHY } from '@/src/utils/constants';
import { getAverageScore } from '@/src/utils/helpers';

const SettingRow = ({ icon, label, value, onPress, rightEl, colors }) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      styles.settingRow,
      { borderBottomColor: colors.border, opacity: pressed && onPress ? 0.7 : 1 },
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

        {/* Header */}
        <Text style={[styles.pageTitle, { color: colors.text }]}>Profile</Text>

        {/* Avatar + identity card */}
        <View style={[styles.identityCard, { backgroundColor: colors.primary }]}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarLetter}>
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.nameText}>{displayName}</Text>
          <Text style={styles.emailText}>{email}</Text>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{totalProjects}</Text>
            <Text style={[styles.statLabel, { color: colors.textLight }]}>Projects</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.statValue, { color: totalProjects > 0 ? colors.primary : colors.textLight }]}>
              {totalProjects > 0 ? avgScore : '—'}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textLight }]}>Avg Score</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="cloud-done-outline" size={22} color={colors.secondary} />
            <Text style={[styles.statLabel, { color: colors.textLight }]}>Synced</Text>
          </View>
        </View>

        {/* Preferences section */}
        <Text style={[styles.sectionLabel, { color: colors.textLight }]}>PREFERENCES</Text>
        <View style={[styles.settingsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <SettingRow
            icon="moon-outline"
            label="Dark Mode"
            colors={colors}
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

        {/* About section */}
        <Text style={[styles.sectionLabel, { color: colors.textLight }]}>ABOUT</Text>
        <View style={[styles.settingsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <SettingRow
            icon="information-circle-outline"
            label="What this app does"
            colors={colors}
            value=""
            rightEl={null}
          />
          <View style={styles.aboutContent}>
            {[
              'Rapid passive thermal analysis for early-stage design decisions.',
              'Estimates thermal comfort using local climate data + building inputs.',
              'Helps visualise impact of orientation, WWR, and envelope choices.',
            ].map((item, i) => (
              <View key={i} style={styles.bulletRow}>
                <View style={[styles.bullet, { backgroundColor: colors.secondary }]} />
                <Text style={[styles.bulletText, { color: colors.textLight }]}>{item}</Text>
              </View>
            ))}
          </View>

          <SettingRow
            icon="shield-checkmark-outline"
            label="Data & Privacy"
            colors={colors}
            value=""
            rightEl={null}
          />
          <Text style={[styles.privacyText, { color: colors.textLight }]}>
            All project data is securely stored on Supabase. We do not sell your data.
            Climate data is fetched live from OpenWeatherMap API.
          </Text>
        </View>

        {/* App version */}
        <View style={styles.versionRow}>
          <Ionicons name="apps-outline" size={16} color={colors.textLight} />
          <Text style={[styles.versionText, { color: colors.textLight }]}>
            BuildSense v1.0
          </Text>
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

  identityCard: {
    borderRadius: 16, padding: SPACING.lg,
    alignItems: 'center', marginBottom: SPACING.md,
  },
  avatarCircle: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: '#FFFFFF30',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  avatarLetter: { fontSize: 30, fontWeight: '800', color: '#FFFFFF' },
  nameText: { ...TYPOGRAPHY.h3, color: '#FFFFFF', fontWeight: '700' },
  emailText: { ...TYPOGRAPHY.bodySmall, color: '#FFFFFFB0', marginTop: 4 },

  statsRow: {
    flexDirection: 'row', gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1, borderRadius: 12, padding: SPACING.md,
    alignItems: 'center', borderWidth: 1.5, gap: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  statValue: { ...TYPOGRAPHY.h2, fontWeight: '800' },
  statLabel: { ...TYPOGRAPHY.caption },

  sectionLabel: {
    ...TYPOGRAPHY.caption, fontWeight: '700',
    letterSpacing: 1, marginBottom: SPACING.sm,
    marginTop: SPACING.sm,
  },
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
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm, marginBottom: SPACING.xs },
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