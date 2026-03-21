import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  Pressable, Alert, Share
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/hooks/useTheme';
import { useProjects } from '@/src/hooks/useProjects';
import ScoreGauge from '@/src/components/features/ScoreGauge';
import WeatherWidget from '@/src/components/features/WeatherWidget';
import Modal from '@/src/components/common/Modal';
import Loader from '@/src/components/common/Loader';
import { SPACING, TYPOGRAPHY, WALL_TYPES, ROOF_TYPES, PASSIVE_STRATEGIES } from '@/src/utils/constants';
import { formatDate, getOrientationLabel, calculateThermalScore } from '@/src/utils/helpers';

const SectionCard = ({ title, icon, children, colors }) => (
  <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
    <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
      <Ionicons name={icon} size={16} color={colors.primary} />
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
    </View>
    {children}
  </View>
);

const DataRow = ({ label, value, colors }) => (
  <View style={[styles.dataRow, { borderBottomColor: colors.border }]}>
    <Text style={[styles.dataLabel, { color: colors.textLight }]}>{label}</Text>
    <Text style={[styles.dataValue, { color: colors.text }]}>{value ?? '—'}</Text>
  </View>
);

const MetricPill = ({ icon, label, value, color, colors }) => (
  <View style={[styles.metricPill, { backgroundColor: color + '15', borderColor: color + '30' }]}>
    <Ionicons name={icon} size={18} color={color} />
    <Text style={[styles.metricValue, { color }]}>{value}</Text>
    <Text style={[styles.metricLabel, { color: colors.textLight }]}>{label}</Text>
  </View>
);

// Safely parse passiveStrategies regardless of how Supabase returns it
const parseStrategies = (raw) => {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try { return JSON.parse(raw); } catch { return []; }
  }
  return [];
};

// Safely parse weather regardless of how Supabase returns it
const parseWeather = (raw) => {
  if (!raw) return null;
  if (typeof raw === 'object') return raw;
  if (typeof raw === 'string') {
    try { return JSON.parse(raw); } catch { return null; }
  }
  return null;
};

export default function ProjectDetailsScreen() {
  const { id } = useLocalSearchParams();
  const { colors } = useTheme();
  const { projects, deleteProject } = useProjects();
  const [showScoringModal, setShowScoringModal] = useState(false);

  const project = projects.find((p) => p.id === id);

  const passiveStrategies = parseStrategies(project?.passiveStrategies);
  const weather = parseWeather(project?.weather);

  const results = project
    ? calculateThermalScore(
        {
          wallType: project.wallType,
          roofType: project.roofType,
          wwr: typeof project.wwr === 'number' ? project.wwr : parseFloat(project.wwr) || 30,
          orientation: project.orientation,
          passiveStrategies,
        },
        weather
      )
    : null;

  const getLabel = (options, value) =>
    options.find((o) => o.value === value)?.label ?? value ?? '—';

  const riskColor = {
    Low: colors.success,
    Medium: colors.warning,
    High: colors.error,
  }[results?.overheatingRisk] ?? colors.textLight;

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete Project',
      `Are you sure you want to delete "${project?.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteProject(id);
            router.replace('/(tabs)/saved');
          },
        },
      ]
    );
  }, [id, project?.name]);

  const handleShare = useCallback(async () => {
    if (!project || !results) return;
    await Share.share({
      message:
        `BuildSense Report — ${project.name}\n` +
        `City: ${project.city}\n` +
        `Score: ${results.score}/100\n` +
        `Overheating Risk: ${results.overheatingRisk}\n` +
        `Orientation: ${getOrientationLabel(project.orientation)}\n` +
        `Wall: ${getLabel(WALL_TYPES, project.wallType)}\n` +
        `Roof: ${getLabel(ROOF_TYPES, project.roofType)}\n` +
        `WWR: ${project.wwr}%`,
    });
  }, [project, results]);

  if (!project) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.loaderWrap}><Loader /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.topRow}>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
            {project.name}
          </Text>
          <View style={styles.topActions}>
            <Pressable onPress={handleShare} hitSlop={8} style={styles.iconBtn}>
              <Ionicons name="share-outline" size={22} color={colors.primary} />
            </Pressable>
            <Pressable onPress={handleDelete} hitSlop={8} style={styles.iconBtn}>
              <Ionicons name="trash-outline" size={22} color={colors.error} />
            </Pressable>
          </View>
        </View>

        {/* Meta row */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={13} color={colors.textLight} />
            <Text style={[styles.metaText, { color: colors.textLight }]}>{project.city}</Text>
          </View>
          <Text style={[styles.metaDot, { color: colors.border }]}>·</Text>
          <Text style={[styles.metaText, { color: colors.textLight }]}>
            {formatDate(project.created_at)}
          </Text>
        </View>

        {/* Score hero card */}
        <View style={[styles.heroCard, { backgroundColor: colors.primary }]}>
          <View style={styles.heroLeft}>
            <ScoreGauge score={results?.score ?? 0} size={130} />
          </View>
          <View style={styles.heroRight}>
            <View style={[styles.riskBadge, { backgroundColor: riskColor + '25' }]}>
              <Ionicons name="warning-outline" size={13} color={riskColor} />
              <Text style={[styles.riskText, { color: riskColor }]}>
                {results?.overheatingRisk ?? '—'} Risk
              </Text>
            </View>
            <Text style={styles.heroScoreLabel}>Performance</Text>
            <Text style={styles.heroScoreLabel}>Score</Text>
            <Pressable
              onPress={() => setShowScoringModal(true)}
              style={[styles.reportBtn, { backgroundColor: '#FFFFFF20' }]}
            >
              <Text style={styles.reportBtnText}>View Report</Text>
              <Ionicons name="chevron-forward" size={14} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>

        {/* 3 metric pills */}
        <View style={styles.pillRow}>
          <MetricPill
            icon="thermometer-outline"
            label="Climate Stress"
            value={results?.climateStress ?? '—'}
            color={colors.error}
            colors={colors}
          />
          <MetricPill
            icon="happy-outline"
            label="Comfort Index"
            value={results ? `${results.comfortIndex}%` : '—'}
            color={colors.success}
            colors={colors}
          />
          <MetricPill
            icon="leaf-outline"
            label="Vent Potential"
            value={
              results
                ? results.ventPotential > 60 ? 'High'
                  : results.ventPotential > 30 ? 'Fair' : 'Low'
                : '—'
            }
            color={colors.secondary}
            colors={colors}
          />
        </View>

        {/* Score breakdown */}
        {results && (
          <SectionCard title="Score Breakdown" icon="bar-chart-outline" colors={colors}>
            {[
              { label: 'Base Score', value: '+60' },
              { label: 'Material Impact', value: `${results.materialScore >= 0 ? '+' : ''}${results.materialScore}` },
              { label: 'Orientation Impact', value: `${results.orientationScore >= 0 ? '+' : ''}${results.orientationScore}` },
              { label: 'Passive Bonus', value: `+${results.strategyBonus}` },
              { label: 'Climate Penalty', value: `-${results.climatePenalty}` },
            ].map((item, i) => {
              const isPositive = item.value.startsWith('+');
              const isNegative = item.value.startsWith('-');
              const valColor = isPositive ? colors.success : isNegative ? colors.error : colors.text;
              return (
                <View key={i} style={[styles.breakdownRow, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.breakdownLabel, { color: colors.textLight }]}>{item.label}</Text>
                  <Text style={[styles.breakdownValue, { color: valColor }]}>{item.value}</Text>
                </View>
              );
            })}
            <View style={[styles.breakdownTotal, { borderTopColor: colors.primary + '40' }]}>
              <Text style={[styles.totalLabel, { color: colors.text }]}>Final Score</Text>
              <Text style={[styles.totalValue, { color: colors.primary }]}>{results.score}</Text>
            </View>
          </SectionCard>
        )}

        {/* Weather */}
        {weather && (
          <SectionCard title="Climate at Location" icon="partly-sunny-outline" colors={colors}>
            <WeatherWidget weather={weather} compact={false} />
          </SectionCard>
        )}

        {/* Building details */}
        <SectionCard title="Building Details" icon="business-outline" colors={colors}>
          <DataRow label="Area" value={`${project.area} m²`} colors={colors} />
          <DataRow label="Floors" value={project.floors} colors={colors} />
          <DataRow label="Orientation" value={getOrientationLabel(project.orientation)} colors={colors} />
        </SectionCard>

        {/* Envelope */}
        <SectionCard title="Envelope Configuration" icon="layers-outline" colors={colors}>
          <DataRow label="Wall Type" value={getLabel(WALL_TYPES, project.wallType)} colors={colors} />
          <DataRow label="Roof Type" value={getLabel(ROOF_TYPES, project.roofType)} colors={colors} />
          <DataRow label="WWR" value={`${project.wwr}%`} colors={colors} />
        </SectionCard>

        {/* Passive strategies */}
        <SectionCard title="Passive Strategies" icon="leaf-outline" colors={colors}>
          {PASSIVE_STRATEGIES.map((s) => {
            const enabled = passiveStrategies.includes(s.id);
            return (
              <View key={s.id} style={[styles.strategyRow, { borderBottomColor: colors.border }]}>
                <Ionicons
                  name={enabled ? 'checkmark-circle' : 'close-circle-outline'}
                  size={18}
                  color={enabled ? colors.success : colors.textLight}
                />
                <Text style={[styles.strategyText, { color: enabled ? colors.text : colors.textLight }]}>
                  {s.label}
                </Text>
                <Text style={[styles.strategyStatus, { color: enabled ? colors.success : colors.textLight }]}>
                  {enabled ? 'Active' : 'Not used'}
                </Text>
              </View>
            );
          })}
        </SectionCard>

        {/* Recommendations */}
        {results?.recommendations?.length > 0 && (
          <SectionCard title="Recommendations" icon="bulb-outline" colors={colors}>
            {results.recommendations.map((rec, i) => {
              const pColor = rec.priority === 'High'
                ? colors.error
                : rec.priority === 'Medium'
                ? colors.warning
                : colors.success;
              return (
                <View key={i} style={[styles.recItem, { borderLeftColor: pColor, backgroundColor: pColor + '08' }]}>
                  <View style={styles.recTop}>
                    <Text style={[styles.recTitle, { color: colors.text }]}>{rec.title}</Text>
                    <View style={[styles.priorityBadge, { backgroundColor: pColor + '20' }]}>
                      <Text style={[styles.priorityText, { color: pColor }]}>{rec.priority}</Text>
                    </View>
                  </View>
                  <Text style={[styles.recReason, { color: colors.textLight }]}>{rec.reason}</Text>
                </View>
              );
            })}
          </SectionCard>
        )}

      </ScrollView>

      {/* Scoring Modal */}
      <Modal visible={showScoringModal} onClose={() => setShowScoringModal(false)}>
        <View>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>How Scoring Works</Text>
            <Pressable onPress={() => setShowScoringModal(false)} hitSlop={8}>
              <Ionicons name="close" size={24} color={colors.textLight} />
            </Pressable>
          </View>

          {[
            { icon: 'cube-outline',        title: 'Base Score (60pts)',       desc: 'Every project starts at 60. This represents a code-minimum building with no passive features.',              color: colors.primary   },
            { icon: 'layers-outline',      title: 'Material Impact (±15pts)', desc: 'Wall and roof material thermal mass, U-values, and reflectivity adjust the score up or down.',             color: colors.secondary },
            { icon: 'compass-outline',     title: 'Orientation Impact (±10pts)', desc: 'North-facing = best. South-west facing in hot climates = worst. Based on solar exposure risk.',         color: colors.warning   },
            { icon: 'leaf-outline',        title: 'Passive Bonus (+15pts)',   desc: 'Each enabled passive strategy adds points. Shading and ventilation have the highest impact.',              color: colors.success   },
            { icon: 'thermometer-outline', title: 'Climate Penalty (−10pts)', desc: 'High ambient temperature and humidity reduce the effectiveness of passive strategies.',                    color: colors.error     },
          ].map((item, i) => (
            <View key={i} style={[styles.scoringItem, { borderBottomColor: colors.border }]}>
              <View style={[styles.scoringIcon, { backgroundColor: item.color + '15' }]}>
                <Ionicons name={item.icon} size={20} color={item.color} />
              </View>
              <View style={styles.scoringText}>
                <Text style={[styles.scoringTitle, { color: colors.text }]}>{item.title}</Text>
                <Text style={[styles.scoringDesc, { color: colors.textLight }]}>{item.desc}</Text>
              </View>
            </View>
          ))}

          <View style={[styles.scoringNote, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]}>
            <Ionicons name="information-circle-outline" size={15} color={colors.primary} />
            <Text style={[styles.scoringNoteText, { color: colors.primary }]}>
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
  scroll: { padding: SPACING.lg, paddingBottom: SPACING.xl + 16 },
  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  topRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: SPACING.xs,
  },
  headerTitle: { ...TYPOGRAPHY.h3, fontWeight: '700', flex: 1, marginHorizontal: SPACING.md },
  topActions: { flexDirection: 'row', gap: SPACING.sm },
  iconBtn: { padding: 4 },

  metaRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: SPACING.xs, marginBottom: SPACING.lg,
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { ...TYPOGRAPHY.caption },
  metaDot: { ...TYPOGRAPHY.caption },

  heroCard: {
    borderRadius: 16, padding: SPACING.lg,
    flexDirection: 'row', alignItems: 'center',
    gap: SPACING.lg, marginBottom: SPACING.md,
  },
  heroLeft: { alignItems: 'center' },
  heroRight: { flex: 1, gap: SPACING.sm },
  riskBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-start', paddingHorizontal: SPACING.sm,
    paddingVertical: 4, borderRadius: 20,
  },
  riskText: { ...TYPOGRAPHY.caption, fontWeight: '700' },
  heroScoreLabel: { ...TYPOGRAPHY.bodySmall, color: '#FFFFFFB0' },
  reportBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-start', paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2, borderRadius: 8, marginTop: SPACING.xs,
  },
  reportBtnText: { ...TYPOGRAPHY.caption, color: '#FFFFFF', fontWeight: '700' },

  pillRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  metricPill: {
    flex: 1, alignItems: 'center', borderRadius: 12,
    padding: SPACING.sm, borderWidth: 1.5, gap: 4,
  },
  metricValue: { ...TYPOGRAPHY.h3, fontWeight: '800' },
  metricLabel: { ...TYPOGRAPHY.caption, textAlign: 'center' },

  sectionCard: {
    borderRadius: 14, borderWidth: 1.5,
    padding: SPACING.md, marginBottom: SPACING.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    gap: SPACING.sm, marginBottom: SPACING.sm,
    paddingBottom: SPACING.sm, borderBottomWidth: 1,
  },
  sectionTitle: { ...TYPOGRAPHY.body, fontWeight: '700' },

  dataRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: SPACING.sm, borderBottomWidth: 1,
  },
  dataLabel: { ...TYPOGRAPHY.bodySmall },
  dataValue: { ...TYPOGRAPHY.bodySmall, fontWeight: '600', textTransform: 'capitalize' },

  breakdownRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: SPACING.sm, borderBottomWidth: 1,
  },
  breakdownLabel: { ...TYPOGRAPHY.bodySmall },
  breakdownValue: { ...TYPOGRAPHY.bodySmall, fontWeight: '700' },
  breakdownTotal: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingTop: SPACING.sm, borderTopWidth: 2,
  },
  totalLabel: { ...TYPOGRAPHY.body, fontWeight: '700' },
  totalValue: { ...TYPOGRAPHY.h3, fontWeight: '800' },

  strategyRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: SPACING.sm, paddingVertical: SPACING.sm, borderBottomWidth: 1,
  },
  strategyText: { ...TYPOGRAPHY.bodySmall, flex: 1 },
  strategyStatus: { ...TYPOGRAPHY.caption, fontWeight: '600' },

  recItem: {
    borderLeftWidth: 3, borderRadius: 8,
    padding: SPACING.sm, marginBottom: SPACING.sm, gap: 4,
  },
  recTop: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', gap: SPACING.sm,
  },
  recTitle: { ...TYPOGRAPHY.bodySmall, fontWeight: '700', flex: 1 },
  priorityBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: 20 },
  priorityText: { ...TYPOGRAPHY.caption, fontWeight: '700' },
  recReason: { ...TYPOGRAPHY.caption, lineHeight: 18 },

  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: SPACING.lg,
  },
  modalTitle: { ...TYPOGRAPHY.h3, fontWeight: '800' },

  scoringItem: {
    flexDirection: 'row', gap: SPACING.md,
    paddingVertical: SPACING.md, borderBottomWidth: 1,
  },
  scoringIcon: {
    width: 42, height: 42, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  scoringText: { flex: 1, gap: 4 },
  scoringTitle: { ...TYPOGRAPHY.bodySmall, fontWeight: '700' },
  scoringDesc: { ...TYPOGRAPHY.caption, lineHeight: 18 },

  scoringNote: {
    flexDirection: 'row', alignItems: 'flex-start',
    gap: SPACING.sm, padding: SPACING.sm,
    borderRadius: 8, borderWidth: 1, marginTop: SPACING.md,
  },
  scoringNoteText: { ...TYPOGRAPHY.caption, flex: 1, lineHeight: 18 },
});