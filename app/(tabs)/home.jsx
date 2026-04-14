import React, { useEffect, useCallback, useState, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable,
  Image, Animated
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

const splitName = (name = '') => {
  const parts = name.trim().split(' ');
  return { first: parts[0] ?? name, last: parts.slice(1).join(' ') || null };
};

const getInitials = (name = '') => {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (parts[0]?.[0] ?? '?').toUpperCase();
};

function PressScale({ onPress, style, children, scaleTo = 0.96 }) {
  const scale = useRef(new Animated.Value(1)).current;
  const onPressIn = () =>
    Animated.spring(scale, { toValue: scaleTo, useNativeDriver: true, speed: 50, bounciness: 4 }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 8 }).start();
  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

function StaggerCard({ children, index }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1, useNativeDriver: true,
      speed: 18, bounciness: 5, delay: index * 80,
    }).start();
  }, []);
  return (
    <Animated.View style={{
      opacity: anim,
      transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
    }}>
      {children}
    </Animated.View>
  );
}

function PulsingBulb({ color }) {
  const scale   = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Scale pulse in place
    const runPulse = () =>
      Animated.sequence([
        Animated.spring(scale, { toValue: 1.3, useNativeDriver: true, speed: 20, bounciness: 8 }),
        Animated.spring(scale, { toValue: 1,   useNativeDriver: true, speed: 14, bounciness: 4 }),
        Animated.delay(2800),
      ]).start(() => runPulse());
    runPulse();

    // Flicker
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.6, duration: 120, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1,   duration: 100, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.8, duration: 80,  useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1,   duration: 120, useNativeDriver: true }),
        Animated.delay(3500),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={{
      transform: [{ scale }],
      opacity,
      alignSelf: 'flex-start',   // ← prevents layout shift
      alignItems: 'center',  // ← keeps icon centred during scale
      justifyContent: 'center',
    }}>
      <Ionicons name="bulb-outline" size={18} color={color} />
    </Animated.View>
  );
}

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const { projects, isLoading, refreshProjects, deleteProject } = useProjects();
  const [showScoringModal, setShowScoringModal] = useState(false);

  // ── Animation refs ──
  const shimmerAnim  = useRef(new Animated.Value(0)).current;
  const heroAnim     = useRef(new Animated.Value(0)).current;
  const savedAnim    = useRef(new Animated.Value(0)).current;
  const gridAnim     = useRef(new Animated.Value(0)).current;
  const sectionAnim  = useRef(new Animated.Value(0)).current;
  const insightAnim  = useRef(new Animated.Value(0)).current;

  // ── Icon animation refs ──
  // FIX: drive sunRotate to 360 directly so native driver sees continuous forward movement
  const sunRotate    = useRef(new Animated.Value(0)).current;
  const hatBounce    = useRef(new Animated.Value(1)).current;
  const folderBounce = useRef(new Animated.Value(1)).current;

  // Pre-compute interpolation outside JSX so it's stable across renders
  const sunDeg = sunRotate.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  // ── Modal row refs ──
  const modalAnims = useRef(
    Array.from({ length: 5 }, () => new Animated.Value(0))
  ).current;

  useEffect(() => {
    refreshProjects();

    // Shimmer sweeps across name every 3s
    const startShimmer = () => {
      shimmerAnim.setValue(0);
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.delay(2100),
      ]).start(() => startShimmer());
    };
    startShimmer();

    // Sun spins — value climbs to 360 continuously, never resets
    Animated.loop(
      Animated.timing(sunRotate, {
        toValue: 360,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();

    // Hat pulses every 2.5s
    const pulseHat = () => {
      Animated.sequence([
        Animated.spring(hatBounce, { toValue: 1.2, useNativeDriver: true, speed: 40, bounciness: 12 }),
        Animated.spring(hatBounce, { toValue: 1,   useNativeDriver: true, speed: 20, bounciness: 6  }),
        Animated.delay(2000),
      ]).start(() => pulseHat());
    };
    pulseHat();

    // Folder nudges every 4s
    const nudgeFolder = () => {
      Animated.sequence([
        Animated.spring(folderBounce, { toValue: 1.18, useNativeDriver: true, speed: 50, bounciness: 14 }),
        Animated.spring(folderBounce, { toValue: 0.92, useNativeDriver: true, speed: 40, bounciness: 6  }),
        Animated.spring(folderBounce, { toValue: 1,    useNativeDriver: true, speed: 30, bounciness: 4  }),
        Animated.delay(3200),
      ]).start(() => nudgeFolder());
    };
    nudgeFolder();

    // Section mount stagger
    Animated.stagger(80, [
      heroAnim, savedAnim, gridAnim, sectionAnim, insightAnim,
    ].map(anim =>
      Animated.timing(anim, { toValue: 1, duration: 400, useNativeDriver: true })
    )).start();
  }, []);

  useEffect(() => {
    if (showScoringModal) {
      modalAnims.forEach(a => a.setValue(0));
      Animated.stagger(60, modalAnims.map(anim =>
        Animated.spring(anim, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 6 })
      )).start();
    }
  }, [showScoringModal]);

  const makeSlideStyle = (anim, offsetY = 18) => ({
    opacity: anim,
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [offsetY, 0] }) }],
  });

  const displayName = user?.user_metadata?.display_name
    ?? user?.email?.split('@')[0]
    ?? 'there';
  const { first, last } = splitName(truncateText(displayName, 24));
  const initials  = getInitials(displayName);
  const avatarUrl = user?.user_metadata?.avatar_url ?? null;
  const recentProjects = projects.slice(0, 3);

  const handleProjectPress = useCallback((project) => {
    router.push(`/details/${project.id}`);
  }, []);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <LinearGradient
          colors={isDark ? GRADIENTS.headerBg.dark : GRADIENTS.headerBg.light}
          style={styles.headerGradient}
        >
          <View style={styles.headerInner}>
            <View style={styles.headerLeft}>
              <Text style={[styles.greeting, { color: colors.textLight }]}>Hello,</Text>

              {/* Gradient name + shimmer */}
              <View style={styles.nameShimmerWrap}>
                <MaskedView
                  maskElement={
                    <Text style={[styles.firstName, { color: '#000' }]}>{first}</Text>
                  }
                >
                  <LinearGradient
                    colors={['#9760d2', '#7ee887', '#d0f183', '#F5D9B0']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  >
                    <Text style={[styles.firstName, { opacity: 0 }]}>{first}</Text>
                  </LinearGradient>
                </MaskedView>

                <MaskedView
                  style={StyleSheet.absoluteFill}
                  maskElement={
                    <Text style={[styles.firstName, { color: '#000' }]}>{first}</Text>
                  }
                >
                  <Animated.View style={[
                    styles.shimmerStrip,
                    { transform: [{ translateX: shimmerAnim.interpolate({ inputRange: [0, 1], outputRange: [-120, 220] }) }] },
                  ]}>
                    <LinearGradient
                      colors={['transparent', 'rgba(255,255,255,0.55)', 'transparent']}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={styles.shimmerGradient}
                    />
                  </Animated.View>
                </MaskedView>
              </View>

              {last && (
                <Text style={[styles.lastName, { color: colors.textLight }]}>{last}</Text>
              )}
              <View style={styles.accentRow}>
                <Text style={[styles.accentLabel, { color: colors.primary }]}>BuildSense</Text>
              </View>
            </View>

            {/* Avatar */}
            <Pressable
              onPress={() => router.push('/(tabs)/profile')}
              style={[styles.avatar, {
                backgroundColor: colors.primary + '18',
                borderColor: colors.primary + '50',
              }]}
            >
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} resizeMode="cover" />
              ) : (
                <Text style={[styles.avatarInitials, { color: colors.primary }]}>{initials}</Text>
              )}
              <View style={[styles.avatarOnline, { backgroundColor: colors.success }]} />
            </Pressable>
          </View>
        </LinearGradient>

        {/* ── Hero CTA ── */}
        <Animated.View style={[makeSlideStyle(heroAnim), { marginHorizontal: SPACING.lg, marginBottom: SPACING.md }]}>
          <LinearGradient
            colors={['#6366F1', '#8B5CF6', '#06B6D4']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            <PressScale onPress={() => router.push('/new-project')} scaleTo={0.97}>
              <View style={styles.heroCard}>
                <View style={styles.heroTop}>
                  <View style={[styles.heroBadge, { backgroundColor: '#FFFFFF30' }]}>
                    <Ionicons name="checkmark-circle" size={13} color="#FFFFFF" />
                    <Text style={styles.heroBadgeText}>READY</Text>
                  </View>
                </View>
                <Text style={styles.heroTitle}>Start a new analysis</Text>
                <Text style={styles.heroSub}>
                  Calculate passive thermal performance for your building design.
                </Text>
                <View style={[styles.heroBtn, { backgroundColor: '#FFFFFF20' }]}>
                  <Ionicons name="add" size={16} color="#FFFFFF" />
                  <Text style={styles.heroBtnText}>New Project</Text>
                </View>
              </View>
            </PressScale>
          </LinearGradient>
        </Animated.View>

        {/* ── Saved Projects card ── */}
        <Animated.View style={makeSlideStyle(savedAnim)}>
          <PressScale
            onPress={() => router.push('/(tabs)/saved')}
            style={[styles.savedCard, {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            }]}
          >
            <View style={styles.savedLeft}>
              <View style={[styles.iconCircle, { backgroundColor: colors.secondary + '15' }]}>
                <Animated.View style={{ transform: [{ scale: folderBounce }] }}>
                  <Ionicons name="folder-open-outline" size={20} color={colors.secondary} />
                </Animated.View>
              </View>
              <View style={{ marginLeft: SPACING.sm }}>
                <Text style={[styles.savedTitle, { color: colors.text }]}>Saved Projects</Text>
                <Text style={[styles.savedMeta, { color: colors.textLight }]}>
                  {projects.length} Active
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
          </PressScale>
        </Animated.View>

        {/* ── Quick Action Grid ── */}
        <Animated.View style={[makeSlideStyle(gridAnim), styles.grid]}>

          {/* Climate Explorer */}
          <PressScale
            onPress={() => router.push('/(tabs)/explore')}
            scaleTo={0.95}
            style={[styles.gridCard, {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            }]}
          >
            {/* FIX: sunDeg pre-computed above, not inline interpolate */}
            <Animated.View style={{
              alignSelf: 'flex-start',
              transform: [{ rotate: sunDeg }],
            }}>
              <Ionicons name="sunny-outline" size={25} color={colors.warning} />
            </Animated.View>
            <Text style={[styles.gridTitle, { color: colors.text }]}>Climate Explorer</Text>
            <Text style={[styles.gridSub, { color: colors.textLight }]}>Local weather data</Text>
          </PressScale>

          {/* How Scoring Works */}
          <PressScale
            onPress={() => setShowScoringModal(true)}
            scaleTo={0.95}
            style={[styles.gridCard, {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            }]}
          >
            <Animated.View style={{
              alignSelf: 'flex-start',
              transform: [{ scale: hatBounce }],
            }}>
              <Ionicons name="school-outline" size={24} color={colors.primary} />
            </Animated.View>
            <Text style={[styles.gridTitle, { color: colors.text }]}>How Scoring Works</Text>
            <Text style={[styles.gridSub, { color: colors.textLight }]}>Learn the metrics</Text>
          </PressScale>

        </Animated.View>

        {/* ── Recent Projects ── */}
        <Animated.View style={[makeSlideStyle(sectionAnim), styles.section]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Projects</Text>
            {projects.length > 3 && (
              <Pressable onPress={() => router.push('/(tabs)/saved')}>
                <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
              </Pressable>
            )}
          </View>

          {isLoading ? (
            <View style={styles.loaderWrap}><Loader /></View>
          ) : recentProjects.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="cube-outline" size={32} color={colors.textLight} />
              <Text style={[styles.emptyText, { color: colors.textLight }]}>
                No projects yet. Tap New Project to begin.
              </Text>
            </View>
          ) : (
            recentProjects.map((project, index) => (
              <StaggerCard key={project.id} index={index}>
                <ProjectCard
                  project={project}
                  onPress={handleProjectPress}
                  onDelete={deleteProject}
                />
              </StaggerCard>
            ))
          )}
        </Animated.View>

        {/* ── Recent Insight ── */}
        <Animated.View style={makeSlideStyle(insightAnim)}>
          <View style={[styles.insightCard, {
            backgroundColor: colors.warning + '12',
            borderColor: colors.warning + '40',
          }]}>
            <PulsingBulb color={colors.warning} />
            <Text style={[styles.insightLabel, { color: colors.warning }]}>RECENT INSIGHT</Text>
            <Text style={[styles.insightText, { color: colors.text }]}>
              West-facing buildings in hot-humid climates benefit most from
              external shading devices and cross ventilation.
            </Text>
          </View>
        </Animated.View>

      </ScrollView>

      {/* ── How Scoring Works Modal ── */}
      <Modal visible={showScoringModal} onClose={() => setShowScoringModal(false)}>
        <View>
          <View style={scoringStyles.header}>
            <Text style={[scoringStyles.title, { color: colors.text }]}>How Scoring Works</Text>
            <Pressable onPress={() => setShowScoringModal(false)} hitSlop={8}>
              <Ionicons name="close" size={24} color={colors.textLight} />
            </Pressable>
          </View>

          {[
            { icon: 'cube-outline',        title: 'Base Score (60pts)',       desc: 'Every project starts at 60 — a code-minimum build with no passive features.',              color: colors.primary   },
            { icon: 'layers-outline',      title: 'Material Impact (±15pts)', desc: 'Wall and roof thermal mass, U-values and reflectivity adjust the score up or down.',       color: colors.secondary },
            { icon: 'compass-outline',     title: 'Orientation (±10pts)',     desc: 'North-facing scores best. South-west in hot climates scores lowest.',                       color: colors.warning   },
            { icon: 'leaf-outline',        title: 'Passive Bonus (+15pts)',   desc: 'Each active passive strategy adds points. Shading and ventilation score highest.',          color: colors.success   },
            { icon: 'thermometer-outline', title: 'Climate Penalty (−10pts)', desc: 'High ambient heat and humidity reduce the effectiveness of passive strategies.',            color: colors.error     },
          ].map((item, i) => (
            <Animated.View
              key={i}
              style={[
                scoringStyles.item,
                { borderBottomColor: colors.border },
                {
                  opacity: modalAnims[i],
                  transform: [{
                    translateX: modalAnims[i].interpolate({ inputRange: [0, 1], outputRange: [24, 0] }),
                  }],
                },
              ]}
            >
              <View style={[scoringStyles.iconBox, { backgroundColor: item.color + '15' }]}>
                <Ionicons name={item.icon} size={20} color={item.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[scoringStyles.itemTitle, { color: colors.text }]}>{item.title}</Text>
                <Text style={[scoringStyles.itemDesc, { color: colors.textLight }]}>{item.desc}</Text>
              </View>
            </Animated.View>
          ))}

          <View style={[scoringStyles.note, {
            backgroundColor: colors.primary + '10',
            borderColor: colors.primary + '30',
          }]}>
            <Ionicons name="information-circle-outline" size={15} color={colors.primary} />
            <Text style={[scoringStyles.noteText, { color: colors.primary }]}>
              Scores are indicative estimates for early-stage design decisions, not engineering certifications.
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
  headerInner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerLeft: { flex: 1, gap: 1 },
  greeting: { ...TYPOGRAPHY.bodySmall, fontWeight: '400', letterSpacing: 0.2 },
  firstName: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5, lineHeight: 34 },
  lastName: { fontSize: 18, fontWeight: '500', letterSpacing: 0.1, lineHeight: 22, marginTop: -2 },
  accentRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginTop: SPACING.sm },
  accentLabel: { ...TYPOGRAPHY.caption, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' },

  // Shimmer
  nameShimmerWrap: { position: 'relative' },
  shimmerStrip: { position: 'absolute', top: 0, bottom: 0, width: 80 },
  shimmerGradient: { flex: 1, width: 80 },

  // Avatar
  avatar: {
    width: 48, height: 48, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, marginLeft: SPACING.md,
    position: 'relative', overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%', borderRadius: 12 },
  avatarInitials: { fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  avatarOnline: {
    position: 'absolute', width: 9, height: 9, borderRadius: 5,
    bottom: -2, right: -2, borderWidth: 1.5, borderColor: '#FFFFFF',
  },

  // Hero
  heroGradient: { borderRadius: 16 },
  heroCard: { borderRadius: 16, padding: SPACING.lg },
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
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: 10, gap: 6,
  },
  heroBtnText: { ...TYPOGRAPHY.body, color: '#FFFFFF', fontWeight: '700' },

  // Saved card
  savedCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: 14, padding: SPACING.md,
    borderWidth: 1.5, marginBottom: SPACING.md,
    marginHorizontal: SPACING.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  savedLeft: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  savedTitle: { ...TYPOGRAPHY.body, fontWeight: '600' },
  savedMeta: { ...TYPOGRAPHY.caption, marginTop: 2 },

  // Grid
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

  // Recent Projects
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

  // Insight
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
  iconBox: { width: 42, height: 42, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  itemTitle: { ...TYPOGRAPHY.bodySmall, fontWeight: '700', marginBottom: 3 },
  itemDesc: { ...TYPOGRAPHY.caption, lineHeight: 18 },
  note: {
    flexDirection: 'row', alignItems: 'flex-start',
    gap: SPACING.sm, padding: SPACING.sm,
    borderRadius: 8, borderWidth: 1, marginTop: SPACING.md,
  },
  noteText: { ...TYPOGRAPHY.caption, flex: 1, lineHeight: 18 },
});