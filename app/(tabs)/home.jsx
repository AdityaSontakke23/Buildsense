import React, { useEffect, useCallback, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/hooks/useTheme';
import { useAuth } from '@/src/hooks/useAuth';
import { useProjects } from '@/src/hooks/useProjects';
import ProjectCard from '@/src/components/features/ProjectCard';
import Loader from '@/src/components/common/Loader';
import Modal from '@/src/components/common/Modal';
import { SPACING, TYPOGRAPHY } from '@/src/utils/constants';
import { truncateText } from '@/src/utils/helpers';
import MaskedView from '@react-native-masked-view/masked-view';
import { GRADIENTS } from '@/src/hooks/useTheme';

// Splits "Aditya Sontakke" → { first: "Aditya", last: "Sontakke" }
const splitName = (name = '') => {
  const parts = name.trim().split(' ');
  return {
    first: parts[0] ?? name,
    last: parts.slice(1).join(' ') || null,
  };
};

// Gets initials — "Aditya Sontakke" → "AS", "aditya" → "A"
const getInitials = (name = '') => {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (parts[0]?.[0] ?? '?').toUpperCase();
};

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const { projects, isLoading, refreshProjects, deleteProject } = useProjects();
  const [showScoringModal, setShowScoringModal] = useState(false);
  

  useEffect(() => { refreshProjects(); }, []);

  const displayName = user?.user_metadata?.display_name
    ?? user?.email?.split('@')[0]
    ?? 'there';

  const { first, last } = splitName(truncateText(displayName, 24));
  const initials = getInitials(displayName);
  const recentProjects = projects.slice(0, 3);

  const handleProjectPress = useCallback((project) => {
    router.push(`/details/${project.id}`);
  }, []);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <LinearGradient
          colors={isDark ? GRADIENTS.headerBg.dark : GRADIENTS.headerBg.light}
          style={styles.headerGradient}
        >
          <View style={styles.headerInner}>
            {/* Left: greeting + name block */}
            <View style={styles.headerLeft}>
              <Text style={[styles.greeting, { color: colors.textLight }]}>
                Hello,
              </Text>
              <MaskedView
                maskElement={
                  <Text style={[styles.firstName, { color: "#000" }]}>
                    {first}
                  </Text>
                }
              >
                <LinearGradient
                  colors={["#9760d2", "#7ee887", "#d0f183", "#F5D9B0"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={[styles.firstName, { opacity: 0 }]}>
                    {first}
                  </Text>
                </LinearGradient>
              </MaskedView>
              {last && (
                <Text style={[styles.lastName, { color: colors.textLight }]}>
                  {last}
                </Text>
              )}

              {/* Accent line with BuildSense label */}
              <View style={styles.accentRow}>
                {/* <View
                  style={[
                    styles.accentDot,
                    { backgroundColor: colors.primary },
                  ]}
                /> */}
                <Text style={[styles.accentLabel, { color: colors.primary }]}>
                  BuildSense
                </Text>
                {/* <View
                  style={[
                    styles.accentLine,
                    { backgroundColor: colors.primary + "30" },
                  ]}
                /> */}
              </View>
            </View>

            {/* Right: square avatar with initials */}
            <Pressable
              onPress={() => router.push("/(tabs)/profile")}
              style={[
                styles.avatar,
                {
                  backgroundColor: colors.primary + "18",
                  borderColor: colors.primary + "50",
                },
              ]}
            >
              <Text style={[styles.avatarInitials, { color: colors.primary }]}>
                {initials}
              </Text>
              <View
                style={[
                  styles.avatarOnline,
                  { backgroundColor: colors.success },
                ]}
              />
            </Pressable>
          </View>
        </LinearGradient>

        {/* Hero CTA — New Project */}
        <LinearGradient
          colors={["#6366F1", "#8B5CF6", "#06B6D4"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.heroGradient,
            { marginHorizontal: SPACING.lg, marginBottom: SPACING.md },
          ]}
        >
          <Pressable
            onPress={() => router.push("/new-project")}
            style={({ pressed }) => [
              styles.heroCard,
              { opacity: pressed ? 0.92 : 1 },
            ]}
          >
            <View style={styles.heroTop}>
              <View
                style={[styles.heroBadge, { backgroundColor: "#FFFFFF30" }]}
              >
                <Ionicons name="checkmark-circle" size={13} color="#FFFFFF" />
                <Text style={styles.heroBadgeText}>READY</Text>
              </View>
            </View>
            <Text style={styles.heroTitle}>Start a new analysis</Text>
            <Text style={styles.heroSub}>
              Calculate passive thermal performance for your building design.
            </Text>
            <View style={[styles.heroBtn, { backgroundColor: "#FFFFFF20" }]}>
              <Ionicons name="add" size={16} color="#FFFFFF" />
              <Text style={styles.heroBtnText}>New Project</Text>
            </View>
          </Pressable>
        </LinearGradient>

        {/* Saved Projects card */}
        <Pressable
          onPress={() => router.push("/(tabs)/saved")}
          style={({ pressed }) => [
            styles.savedCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
        >
          <View style={styles.savedLeft}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: colors.secondary + "15" },
              ]}
            >
              <Ionicons
                name="folder-open-outline"
                size={20}
                color={colors.secondary}
              />
            </View>
            <View style={{ marginLeft: SPACING.sm }}>
              <Text style={[styles.savedTitle, { color: colors.text }]}>
                Saved Projects
              </Text>
              <Text style={[styles.savedMeta, { color: colors.textLight }]}>
                {projects.length} Active
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
        </Pressable>

        {/* Quick Action grid */}
        <View style={styles.grid}>
          <Pressable
            onPress={() => router.push("/(tabs)/explore")}
            style={({ pressed }) => [
              styles.gridCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                opacity: pressed ? 0.9 : 1,
              },
            ]}
          >
            <Ionicons name="sunny-outline" size={24} color={colors.warning} />
            <Text style={[styles.gridTitle, { color: colors.text }]}>
              Climate Explorer
            </Text>
            <Text style={[styles.gridSub, { color: colors.textLight }]}>
              Local weather data
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setShowScoringModal(true)}
            style={({ pressed }) => [
              styles.gridCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                opacity: pressed ? 0.9 : 1,
              },
            ]}
          >
            <Ionicons name="school-outline" size={24} color={colors.primary} />
            <Text style={[styles.gridTitle, { color: colors.text }]}>
              How Scoring Works
            </Text>
            <Text style={[styles.gridSub, { color: colors.textLight }]}>
              Learn the metrics
            </Text>
          </Pressable>
        </View>

        {/* Recent Projects */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Recent Projects
            </Text>
            {projects.length > 3 && (
              <Pressable onPress={() => router.push("/(tabs)/saved")}>
                <Text style={[styles.seeAll, { color: colors.primary }]}>
                  See all
                </Text>
              </Pressable>
            )}
          </View>

          {isLoading ? (
            <View style={styles.loaderWrap}>
              <Loader />
            </View>
          ) : recentProjects.length === 0 ? (
            <View
              style={[
                styles.emptyCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Ionicons
                name="cube-outline"
                size={32}
                color={colors.textLight}
              />
              <Text style={[styles.emptyText, { color: colors.textLight }]}>
                No projects yet. Tap New Project to begin.
              </Text>
            </View>
          ) : (
            recentProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onPress={handleProjectPress}
                onDelete={deleteProject}
              />
            ))
          )}
        </View>

        {/* Recent Insight */}
        <View
          style={[
            styles.insightCard,
            {
              backgroundColor: colors.warning + "12",
              borderColor: colors.warning + "40",
            },
          ]}
        >
          <Ionicons name="bulb-outline" size={18} color={colors.warning} />
          <Text style={[styles.insightLabel, { color: colors.warning }]}>
            RECENT INSIGHT
          </Text>
          <Text style={[styles.insightText, { color: colors.text }]}>
            West-facing buildings in hot-humid climates benefit most from
            external shading devices and cross ventilation.
          </Text>
        </View>
      </ScrollView>

      {/* How Scoring Works Modal */}
      <Modal
        visible={showScoringModal}
        onClose={() => setShowScoringModal(false)}
      >
        <View>
          <View style={scoringStyles.header}>
            <Text style={[scoringStyles.title, { color: colors.text }]}>
              How Scoring Works
            </Text>
            <Pressable onPress={() => setShowScoringModal(false)} hitSlop={8}>
              <Ionicons name="close" size={24} color={colors.textLight} />
            </Pressable>
          </View>

          {[
            {
              icon: "cube-outline",
              title: "Base Score (60pts)",
              desc: "Every project starts at 60 — a code-minimum build with no passive features.",
              color: colors.primary,
            },
            {
              icon: "layers-outline",
              title: "Material Impact (±15pts)",
              desc: "Wall and roof thermal mass, U-values and reflectivity adjust the score up or down.",
              color: colors.secondary,
            },
            {
              icon: "compass-outline",
              title: "Orientation (±10pts)",
              desc: "North-facing scores best. South-west in hot climates scores lowest.",
              color: colors.warning,
            },
            {
              icon: "leaf-outline",
              title: "Passive Bonus (+15pts)",
              desc: "Each active passive strategy adds points. Shading and ventilation score highest.",
              color: colors.success,
            },
            {
              icon: "thermometer-outline",
              title: "Climate Penalty (−10pts)",
              desc: "High ambient heat and humidity reduce the effectiveness of passive strategies.",
              color: colors.error,
            },
          ].map((item, i) => (
            <View
              key={i}
              style={[scoringStyles.item, { borderBottomColor: colors.border }]}
            >
              <View
                style={[
                  scoringStyles.iconBox,
                  { backgroundColor: item.color + "15" },
                ]}
              >
                <Ionicons name={item.icon} size={20} color={item.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[scoringStyles.itemTitle, { color: colors.text }]}>
                  {item.title}
                </Text>
                <Text
                  style={[scoringStyles.itemDesc, { color: colors.textLight }]}
                >
                  {item.desc}
                </Text>
              </View>
            </View>
          ))}

          <View
            style={[
              scoringStyles.note,
              {
                backgroundColor: colors.primary + "10",
                borderColor: colors.primary + "30",
              },
            ]}
          >
            <Ionicons
              name="information-circle-outline"
              size={15}
              color={colors.primary}
            />
            <Text style={[scoringStyles.noteText, { color: colors.primary }]}>
              Scores are indicative estimates for early-stage design decisions,
              not engineering certifications.
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingBottom: SPACING.xl + 16 },

  // ── Header ──
  headerGradient: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  headerInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
    gap: 1,
  },
  greeting: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '400',
    letterSpacing: 0.2,
  },
  firstName: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  lastName: {
    fontSize: 18,
    fontWeight: '500',
    letterSpacing: 0.1,
    lineHeight: 22,
    marginTop: -2,
  },
  accentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
  },
  accentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  accentLabel: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  accentLine: {
    flex: 1,
    height: 1,
  },

  // Square avatar with initials
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    marginLeft: SPACING.md,
    position: 'relative',
  },
  avatarInitials: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  avatarOnline: {
    position: 'absolute',
    width: 9,
    height: 9,
    borderRadius: 5,
    bottom: -2,
    right: -2,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },

  // Rest of content padded
  heroCard: {
  // remove backgroundColor here — gradient handles it
  borderRadius: 16,
  padding: SPACING.lg,
},
  heroTop: { marginBottom: SPACING.xs },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm, paddingVertical: 3, borderRadius: 20, gap: 4,
  },
  heroBadgeText: { ...TYPOGRAPHY.caption, color: '#FFFFFF', fontWeight: '700' },
  heroTitle: { ...TYPOGRAPHY.h2, color: '#FFFFFF', fontWeight: '800', marginBottom: SPACING.xs },
  heroSub: { ...TYPOGRAPHY.bodySmall, color: '#FFFFFFB0', marginBottom: SPACING.md },
  heroBtn: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderRadius: 10, gap: 6,
  },
  heroBtnText: { ...TYPOGRAPHY.body, color: '#FFFFFF', fontWeight: '700' },

  heroGradient: {
  borderRadius: 16,
},

  savedCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: 14, padding: SPACING.md,
    borderWidth: 1.5, marginBottom: SPACING.md,
    marginHorizontal: SPACING.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  savedLeft: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  savedTitle: { ...TYPOGRAPHY.body, fontWeight: '600' },
  savedMeta: { ...TYPOGRAPHY.caption, marginTop: 2 },

  grid: {
    flexDirection: 'row', gap: SPACING.sm,
    marginBottom: SPACING.lg,
    marginHorizontal: SPACING.lg,
  },
  gridCard: {
    flex: 1, borderRadius: 14, padding: SPACING.md,
    borderWidth: 1.5, gap: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  gridTitle: { ...TYPOGRAPHY.bodySmall, fontWeight: '600', marginTop: SPACING.xs },
  gridSub: { ...TYPOGRAPHY.caption },

  section: { marginBottom: SPACING.lg, marginHorizontal: SPACING.lg },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: SPACING.sm,
  },
  sectionTitle: { ...TYPOGRAPHY.h3 },
  seeAll: { ...TYPOGRAPHY.bodySmall, fontWeight: '600' },
  loaderWrap: { paddingVertical: SPACING.lg, alignItems: 'center' },
  emptyCard: {
    borderRadius: 12, padding: SPACING.lg,
    borderWidth: 1.5, alignItems: 'center', gap: SPACING.sm,
  },
  emptyText: { ...TYPOGRAPHY.bodySmall, textAlign: 'center' },

  insightCard: {
    borderRadius: 12, padding: SPACING.md,
    borderWidth: 1.5, gap: SPACING.xs,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  insightLabel: { ...TYPOGRAPHY.caption, fontWeight: '700', letterSpacing: 0.5 },
  insightText: { ...TYPOGRAPHY.bodySmall },
});

const scoringStyles = StyleSheet.create({
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: SPACING.lg,
  },
  title: { ...TYPOGRAPHY.h3, fontWeight: '800' },
  item: {
    flexDirection: 'row', gap: SPACING.md,
    paddingVertical: SPACING.md, borderBottomWidth: 1,
  },
  iconBox: {
    width: 42, height: 42, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  itemTitle: { ...TYPOGRAPHY.bodySmall, fontWeight: '700', marginBottom: 3 },
  itemDesc: { ...TYPOGRAPHY.caption, lineHeight: 18 },
  note: {
    flexDirection: 'row', alignItems: 'flex-start',
    gap: SPACING.sm, padding: SPACING.sm,
    borderRadius: 8, borderWidth: 1, marginTop: SPACING.md,
  },
  noteText: { ...TYPOGRAPHY.caption, flex: 1, lineHeight: 18 },
});