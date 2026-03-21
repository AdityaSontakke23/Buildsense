import React, { useMemo, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { resetForm } from '@/src/store/redux/formSlice';
import { useTheme } from '@/src/hooks/useTheme';
import { useAuth } from '@/src/hooks/useAuth';
import { useProjects } from '@/src/hooks/useProjects';
import StepProgressBar from '@/src/components/features/StepProgressBar';
import ScoreGauge from '@/src/components/features/ScoreGauge';
import Loader from '@/src/components/common/Loader';
import { SPACING, TYPOGRAPHY, WALL_TYPES, ROOF_TYPES, PASSIVE_STRATEGIES } from '@/src/utils/constants';
import { calculateThermalScore, getOrientationLabel } from '@/src/utils/helpers';

const ReviewSection = ({ title, icon, onEdit, children, colors }) => (
  <View style={[styles.reviewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
    <View style={styles.reviewCardHeader}>
      <View style={styles.reviewCardLeft}>
        <Ionicons name={icon} size={18} color={colors.primary} />
        <Text style={[styles.reviewCardTitle, { color: colors.text }]}>{title}</Text>
      </View>
      <Pressable onPress={onEdit} hitSlop={8}>
        <Ionicons name="pencil-outline" size={16} color={colors.primary} />
      </Pressable>
    </View>
    {children}
  </View>
);

const ReviewRow = ({ label, value, colors }) => (
  <View style={styles.reviewRow}>
    <Text style={[styles.reviewLabel, { color: colors.textLight }]}>{label}</Text>
    <Text style={[styles.reviewValue, { color: colors.text }]}>{value}</Text>
  </View>
);

export default function ReviewScreen() {
  const { colors } = useTheme();
  const dispatch = useDispatch();
  const form = useSelector((state) => state.newProjectForm);
  const { user } = useAuth();
  const { createProject } = useProjects();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const results = useMemo(() => {
    return calculateThermalScore(
      {
        wallType: form.wallType,
        roofType: form.roofType,
        wwr: form.wwr,
        orientation: form.orientation,
        passiveStrategies: form.passiveStrategies,
      },
      form.weather
    );
  }, [form]);

  const getLabel = (options, value) =>
    options.find((o) => o.value === value)?.label ?? value;

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    const { error } = await createProject({
      userId: user.id,
      name: form.name,
      city: form.city,
      lat: form.lat,
      lon: form.lon,
      area: form.area,
      floors: form.floors,
      orientation: form.orientation,
      wallType: form.wallType,
      roofType: form.roofType,
      wwr: form.wwr,
      passiveStrategies: form.passiveStrategies,
      weather: form.weather,
      score: results.score,
    });
    setIsSaving(false);
    if (error) {
      setSaveError('Failed to save. Please try again.');
      return;
    }
    dispatch(resetForm());
    router.replace('/(tabs)/saved');
  };

  const riskColor = {
    Low: colors.success,
    Medium: colors.warning,
    High: colors.error,
  }[results.overheatingRisk] ?? colors.textLight;

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
          <Text style={[styles.headerTitle, { color: colors.text }]}>Review</Text>
          <Pressable onPress={() => router.replace('/(tabs)/home')} hitSlop={8}>
            <Text style={[styles.cancelText, { color: colors.error }]}>Cancel</Text>
          </Pressable>
        </View>

        <StepProgressBar currentStep={5} totalSteps={5} />

        {/* Score section */}
        <View style={[styles.scoreCard, { backgroundColor: colors.primary }]}>
          <Text style={styles.scoreCardTitle}>Performance Score</Text>
          <View style={styles.scoreRow}>
            <ScoreGauge score={results.score} size={140} />
            <View style={styles.scoreDetails}>
              <View style={[styles.riskBadge, { backgroundColor: riskColor + '25' }]}>
                <Text style={[styles.riskLabel, { color: riskColor }]}>
                  {results.overheatingRisk} Risk
                </Text>
              </View>
              <View style={styles.metricMini}>
                <Text style={styles.metricMiniLabel}>Comfort Index</Text>
                <Text style={styles.metricMiniValue}>{results.comfortIndex}%</Text>
              </View>
              <View style={styles.metricMini}>
                <Text style={styles.metricMiniLabel}>Climate Stress</Text>
                <Text style={styles.metricMiniValue}>{results.climateStress}%</Text>
              </View>
            </View>
          </View>

          {/* Score breakdown */}
          <View style={[styles.breakdownCard, { backgroundColor: '#FFFFFF15' }]}>
            <Text style={styles.breakdownTitle}>Score Breakdown</Text>
            {[
              { label: 'Base Score', value: '+60' },
              { label: 'Material Impact', value: `${results.materialScore >= 0 ? '+' : ''}${results.materialScore}` },
              { label: 'Orientation Impact', value: `${results.orientationScore >= 0 ? '+' : ''}${results.orientationScore}` },
              { label: 'Passive Bonus', value: `+${results.strategyBonus}` },
              { label: 'Climate Penalty', value: `-${results.climatePenalty}` },
            ].map((item) => (
              <View key={item.label} style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>{item.label}</Text>
                <Text style={styles.breakdownValue}>{item.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Review sections */}
        <ReviewSection
          title="Location + Weather"
          icon="location-outline"
          onEdit={() => router.push('/new-project')}
          colors={colors}
        >
          <ReviewRow label="City" value={form.city} colors={colors} />
          {form.weather && (
            <>
              <ReviewRow label="Temperature" value={`${form.weather.temp}°C`} colors={colors} />
              <ReviewRow label="Humidity" value={`${form.weather.humidity}%`} colors={colors} />
              <ReviewRow label="Wind Speed" value={`${form.weather.windSpeed} m/s`} colors={colors} />
              <ReviewRow label="Condition" value={form.weather.description} colors={colors} />
            </>
          )}
        </ReviewSection>

        <ReviewSection
          title="Building Details"
          icon="business-outline"
          onEdit={() => router.push('/new-project/step2')}
          colors={colors}
        >
          <ReviewRow label="Project Name" value={form.name} colors={colors} />
          <ReviewRow label="Area" value={`${form.area} m²`} colors={colors} />
          <ReviewRow label="Floors" value={form.floors} colors={colors} />
          <ReviewRow label="Orientation" value={getOrientationLabel(form.orientation)} colors={colors} />
        </ReviewSection>

        <ReviewSection
          title="Envelope"
          icon="layers-outline"
          onEdit={() => router.push('/new-project/step3')}
          colors={colors}
        >
          <ReviewRow label="Wall Type" value={getLabel(WALL_TYPES, form.wallType)} colors={colors} />
          <ReviewRow label="Roof Type" value={getLabel(ROOF_TYPES, form.roofType)} colors={colors} />
          <ReviewRow label="WWR" value={`${form.wwr}%`} colors={colors} />
        </ReviewSection>

        <ReviewSection
          title="Passive Strategies"
          icon="leaf-outline"
          onEdit={() => router.push('/new-project/step4')}
          colors={colors}
        >
          {PASSIVE_STRATEGIES.map((s) => {
            const enabled = form.passiveStrategies.includes(s.id);
            return (
              <View key={s.id} style={styles.strategyRow}>
                <Ionicons
                  name={enabled ? 'checkmark-circle' : 'ellipse-outline'}
                  size={16}
                  color={enabled ? colors.success : colors.textLight}
                />
                <Text style={[styles.strategyText, { color: enabled ? colors.text : colors.textLight }]}>
                  {s.label}
                </Text>
              </View>
            );
          })}
        </ReviewSection>

        {/* Recommendations */}
        {results.recommendations.length > 0 && (
          <View style={[styles.recCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.recHeader}>
              <Ionicons name="bulb-outline" size={18} color={colors.warning} />
              <Text style={[styles.recTitle, { color: colors.text }]}>Recommendations</Text>
            </View>
            {results.recommendations.map((rec, i) => {
              const pColor = rec.priority === 'High' ? colors.error : rec.priority === 'Medium' ? colors.warning : colors.success;
              return (
                <View key={i} style={[styles.recItem, { borderLeftColor: pColor }]}>
                  <View style={styles.recItemTop}>
                    <Text style={[styles.recItemTitle, { color: colors.text }]}>{rec.title}</Text>
                    <View style={[styles.priorityBadge, { backgroundColor: pColor + '20' }]}>
                      <Text style={[styles.priorityText, { color: pColor }]}>{rec.priority}</Text>
                    </View>
                  </View>
                  <Text style={[styles.recItemReason, { color: colors.textLight }]}>{rec.reason}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Save error */}
        {saveError && (
          <View style={[styles.errorBanner, { backgroundColor: colors.error + '15', borderColor: colors.error + '30' }]}>
            <Ionicons name="alert-circle-outline" size={15} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.error }]}>{saveError}</Text>
          </View>
        )}

      </ScrollView>

      {/* Sticky save button */}
      <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.backBtn, { borderColor: colors.border }]}
        >
          <Ionicons name="arrow-back" size={18} color={colors.text} />
          <Text style={[styles.backBtnText, { color: colors.text }]}>Back</Text>
        </Pressable>
        <Pressable
          onPress={handleSave}
          disabled={isSaving}
          style={({ pressed }) => [
            styles.saveBtn,
            { backgroundColor: colors.success, opacity: isSaving ? 0.6 : pressed ? 0.88 : 1 },
          ]}
        >
          {isSaving
            ? <Loader size="small" color="#FFFFFF" />
            : <><Ionicons name="cloud-upload-outline" size={18} color="#FFFFFF" />
              <Text style={styles.saveBtnText}>Save Project</Text></>
          }
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: SPACING.lg, paddingBottom: SPACING.xl },
  topRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: SPACING.lg,
  },
  headerTitle: { ...TYPOGRAPHY.h3, fontWeight: '700' },
  cancelText: { ...TYPOGRAPHY.bodySmall, fontWeight: '600' },

  scoreCard: {
    borderRadius: 16, padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  scoreCardTitle: { ...TYPOGRAPHY.bodySmall, color: '#FFFFFFB0', fontWeight: '600', marginBottom: SPACING.md },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.lg, marginBottom: SPACING.md },
  scoreDetails: { flex: 1, gap: SPACING.sm },
  riskBadge: {
    alignSelf: 'flex-start', paddingHorizontal: SPACING.sm,
    paddingVertical: 4, borderRadius: 20,
  },
  riskLabel: { ...TYPOGRAPHY.bodySmall, fontWeight: '700' },
  metricMini: { gap: 2 },
  metricMiniLabel: { ...TYPOGRAPHY.caption, color: '#FFFFFFB0' },
  metricMiniValue: { ...TYPOGRAPHY.h3, color: '#FFFFFF', fontWeight: '700' },

  breakdownCard: { borderRadius: 10, padding: SPACING.md, gap: SPACING.xs },
  breakdownTitle: { ...TYPOGRAPHY.caption, color: '#FFFFFFB0', fontWeight: '700', marginBottom: SPACING.xs, letterSpacing: 0.5 },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between' },
  breakdownLabel: { ...TYPOGRAPHY.bodySmall, color: '#FFFFFFC0' },
  breakdownValue: { ...TYPOGRAPHY.bodySmall, color: '#FFFFFF', fontWeight: '700' },

  reviewCard: {
    borderRadius: 14, borderWidth: 1.5,
    padding: SPACING.md, marginBottom: SPACING.md,
  },
  reviewCardHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: SPACING.sm,
    paddingBottom: SPACING.sm, borderBottomWidth: 1,
  },
  reviewCardLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  reviewCardTitle: { ...TYPOGRAPHY.body, fontWeight: '700' },
  reviewRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
  },
  reviewLabel: { ...TYPOGRAPHY.bodySmall },
  reviewValue: { ...TYPOGRAPHY.bodySmall, fontWeight: '600', textTransform: 'capitalize' },

  strategyRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: SPACING.xs },
  strategyText: { ...TYPOGRAPHY.bodySmall },

  recCard: {
    borderRadius: 14, borderWidth: 1.5,
    padding: SPACING.md, marginBottom: SPACING.md,
  },
  recHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md },
  recTitle: { ...TYPOGRAPHY.body, fontWeight: '700' },
  recItem: {
    borderLeftWidth: 3, paddingLeft: SPACING.sm,
    marginBottom: SPACING.sm, gap: 4,
  },
  recItemTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  recItemTitle: { ...TYPOGRAPHY.bodySmall, fontWeight: '700', flex: 1 },
  priorityBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: 20 },
  priorityText: { ...TYPOGRAPHY.caption, fontWeight: '700' },
  recItemReason: { ...TYPOGRAPHY.caption, lineHeight: 18 },

  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    padding: SPACING.sm, borderRadius: 10, borderWidth: 1, marginBottom: SPACING.sm,
  },
  errorText: { ...TYPOGRAPHY.bodySmall, flex: 1 },

  footer: {
    flexDirection: 'row', gap: SPACING.sm,
    padding: SPACING.lg, borderTopWidth: 1,
  },
  backBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: SPACING.sm + 4, paddingHorizontal: SPACING.lg,
    borderRadius: 12, borderWidth: 1.5,
  },
  backBtnText: { ...TYPOGRAPHY.body, fontWeight: '600' },
  saveBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: SPACING.sm,
    paddingVertical: SPACING.sm + 4, borderRadius: 12,
  },
  saveBtnText: { ...TYPOGRAPHY.body, color: '#FFFFFF', fontWeight: '700' },
});