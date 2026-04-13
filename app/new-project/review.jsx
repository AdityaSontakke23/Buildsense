import React, { useMemo, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  Pressable, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useDispatch, useSelector } from 'react-redux';
import { resetForm } from '@/src/store/redux/formSlice';
import { useTheme } from '@/src/hooks/useTheme';
import { useAuth } from '@/src/hooks/useAuth';
import { useProjects } from '@/src/hooks/useProjects';
import StepProgressBar from '@/src/components/features/StepProgressBar';
import ScoreGauge from '@/src/components/features/ScoreGauge';
import Loader from '@/src/components/common/Loader';
import {
  SPACING, TYPOGRAPHY, WALL_TYPES, ROOF_TYPES, PASSIVE_STRATEGIES,
} from '@/src/utils/constants';
import { calculateThermalScore, getOrientationLabel } from '@/src/utils/helpers';
import { buildPdfHtml } from '@/src/utils/pdfTemplate';

// ─── Category icon map ────────────────────────────────────────
const CATEGORY_ICONS = {
  envelope:     'layers-outline',
  glazing:      'sunny-outline',
  shading:      'umbrella-outline',
  ventilation:  'wind-outline',
  thermal_mass: 'thermometer-outline',
  orientation:  'compass-outline',
};

// ─── Sub-components ───────────────────────────────────────────
const ReviewSection = ({ title, icon, onEdit, children, colors }) => (
  <View style={[styles.reviewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
    <View style={[styles.reviewCardHeader, { borderBottomColor: colors.border }]}>
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

// ─── Main Screen ──────────────────────────────────────────────
export default function ReviewScreen() {
  const { colors }        = useTheme();
  const dispatch          = useDispatch();
  const form              = useSelector((state) => state.newProjectForm);
  const { user }          = useAuth();
  const { createProject } = useProjects();

  const [isSaving,    setIsSaving]    = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [saveError,   setSaveError]   = useState(null);

  const results = useMemo(() => calculateThermalScore(
    {
      wallType:         form.wallType,
      roofType:         form.roofType,
      wwr:              form.wwr,
      orientation:      form.orientation,
      passiveStrategies: form.passiveStrategies,
    },
    form.weather
  ), [form]);

  const getLabel = (options, value) =>
    options.find((o) => o.value === value)?.label ?? value;

  const riskColor = {
    Low:    colors.success,
    Medium: colors.warning,
    High:   colors.error,
  }[results.overheatingRisk] ?? colors.textLight;

  // ── Save ────────────────────────────────────────────────────
  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    const { error } = await createProject({
      userId:            user.id,
      name:              form.name,
      city:              form.city,
      lat:               form.lat,
      lon:               form.lon,
      area:              form.area,
      floors:            form.floors,
      orientation:       form.orientation,
      wallType:          form.wallType,
      roofType:          form.roofType,
      wwr:               form.wwr,
      passiveStrategies: form.passiveStrategies,
      weather:           form.weather,
      score:             results.score,
    });
    setIsSaving(false);
    if (error) { setSaveError('Failed to save. Please try again.'); return; }
    dispatch(resetForm());
    router.replace('/(tabs)/saved');
  };

  // ── PDF Export ──────────────────────────────────────────────
  const handleDownloadPdf = async () => {
    setIsPdfLoading(true);
    try {
      // Build a project-shaped object from form state for the template
      const projectForPdf = {
        name:              form.name,
        city:              form.city,
        area:              form.area,
        floors:            form.floors,
        orientation:       form.orientation,
        wallType:          form.wallType,
        roofType:          form.roofType,
        wwr:               form.wwr,
        passiveStrategies: form.passiveStrategies,
        weather:           form.weather,
        created_at:        new Date().toISOString(),
      };
      const html = buildPdfHtml(projectForPdf, results);
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType:    'application/pdf',
          dialogTitle: `${form.name} — BuildSense Report`,
          UTI:         'com.adobe.pdf',
        });
      } else {
        Alert.alert('Saved', 'PDF saved to your device.');
      }
    } catch {
      Alert.alert('Error', 'Could not generate PDF. Please try again.');
    } finally {
      setIsPdfLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
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
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Review
          </Text>
          <Pressable onPress={() => router.replace("/(tabs)/home")} hitSlop={8}>
            <Text style={[styles.cancelText, { color: colors.error }]}>
              Cancel
            </Text>
          </Pressable>
        </View>

        <StepProgressBar currentStep={5} totalSteps={5} />

        {/* ── Score card ── */}
        <View style={[styles.scoreCard, { backgroundColor: colors.primary }]}>
          <Text style={styles.scoreCardTitle}>Performance Score</Text>
          <View style={styles.scoreRow}>
            <ScoreGauge score={results.score} size={140} onCard />
            <View style={styles.scoreDetails}>
              <View
                style={[
                  styles.riskBadge,
                  { backgroundColor: riskColor + "25" },
                ]}
              >
                <Text style={[styles.riskLabel, { color: riskColor }]}>
                  {results.overheatingRisk} Risk
                </Text>
              </View>
              <View style={styles.metricMini}>
                <Text style={styles.metricMiniLabel}>Comfort Index</Text>
                <Text style={styles.metricMiniValue}>
                  {results.comfortIndex}%
                </Text>
              </View>
              <View style={styles.metricMini}>
                <Text style={styles.metricMiniLabel}>Climate Stress</Text>
                <Text style={styles.metricMiniValue}>
                  {results.climateStress}%
                </Text>
              </View>
              {results.climate && (
                <View style={styles.metricMini}>
                  <Text style={styles.metricMiniLabel}>Climate Type</Text>
                  <Text style={styles.metricMiniValue}>
                    {results.climate.replace("_", " ")}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Score breakdown */}
          <View
            style={[styles.breakdownCard, { backgroundColor: "#FFFFFF15" }]}
          >
            <Text style={styles.breakdownTitle}>Score Breakdown</Text>
            {[
              ["Base Score", "+60"],
              [
                "Material Impact",
                `${results.materialScore >= 0 ? "+" : ""}${results.materialScore}`,
              ],
              [
                "Orientation Impact",
                `${results.orientationScore >= 0 ? "+" : ""}${results.orientationScore}`,
              ],
              ["Passive Bonus", `+${results.strategyBonus}`],
              ["Climate Penalty", `-${results.climatePenalty}`],
            ].map(([label, value]) => (
              <View key={label} style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>{label}</Text>
                <Text style={styles.breakdownValue}>{value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Review sections ── */}
        <ReviewSection
          title="Location + Weather"
          icon="location-outline"
          onEdit={() => router.push("/new-project")}
          colors={colors}
        >
          <ReviewRow label="City" value={form.city} colors={colors} />
          {form.weather && (
            <>
              <ReviewRow
                label="Temperature"
                value={`${form.weather.temp}°C`}
                colors={colors}
              />
              <ReviewRow
                label="Humidity"
                value={`${form.weather.humidity}%`}
                colors={colors}
              />
              <ReviewRow
                label="Wind Speed"
                value={`${form.weather.windSpeed} m/s`}
                colors={colors}
              />
              <ReviewRow
                label="Condition"
                value={form.weather.description}
                colors={colors}
              />
            </>
          )}
        </ReviewSection>

        <ReviewSection
          title="Building Details"
          icon="business-outline"
          onEdit={() => router.push("/new-project/step2")}
          colors={colors}
        >
          <ReviewRow label="Project Name" value={form.name} colors={colors} />
          <ReviewRow label="Area" value={`${form.area} m²`} colors={colors} />
          <ReviewRow label="Floors" value={form.floors} colors={colors} />
          <ReviewRow
            label="Orientation"
            value={getOrientationLabel(form.orientation)}
            colors={colors}
          />
        </ReviewSection>

        <ReviewSection
          title="Envelope"
          icon="layers-outline"
          onEdit={() => router.push("/new-project/step3")}
          colors={colors}
        >
          <ReviewRow
            label="Wall Type"
            value={getLabel(WALL_TYPES, form.wallType)}
            colors={colors}
          />
          <ReviewRow
            label="Roof Type"
            value={getLabel(ROOF_TYPES, form.roofType)}
            colors={colors}
          />
          <ReviewRow label="WWR" value={`${form.wwr}%`} colors={colors} />
        </ReviewSection>

        <ReviewSection
          title="Passive Strategies"
          icon="leaf-outline"
          onEdit={() => router.push("/new-project/step4")}
          colors={colors}
        >
          {PASSIVE_STRATEGIES.map((s) => {
            const enabled = form.passiveStrategies.includes(s.id);
            return (
              <View key={s.id} style={styles.strategyRow}>
                <Ionicons
                  name={enabled ? "checkmark-circle" : "ellipse-outline"}
                  size={16}
                  color={enabled ? colors.success : colors.textLight}
                />
                <Text
                  style={[
                    styles.strategyText,
                    { color: enabled ? colors.text : colors.textLight },
                  ]}
                >
                  {s.label}
                </Text>
              </View>
            );
          })}
        </ReviewSection>

        {/* ── Recommendations — upgraded cards ── */}
        {results.recommendations.length > 0 && (
          <View
            style={[
              styles.recCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.recHeader}>
              <Ionicons name="bulb-outline" size={18} color={colors.warning} />
              <Text style={[styles.recTitle, { color: colors.text }]}>
                Architectural Recommendations
              </Text>
            </View>

            {results.recommendations.map((rec, i) => {
              const pColor =
                rec.priority === "High"
                  ? colors.success
                  : rec.priority === "Medium"
                    ? colors.warning
                    : colors.error;

              const impactColor =
                rec.impact === "high"
                  ? colors.success
                  : rec.impact === "medium"
                    ? colors.warning
                    : colors.error;

              const catIcon = CATEGORY_ICONS[rec.category] ?? "bulb-outline";

              return (
                <View
                  key={i}
                  style={[
                    styles.recItem,
                    {
                      borderColor: colors.border,
                      backgroundColor: colors.background,
                    },
                  ]}
                >
                  {/* Title row */}
                  <View style={styles.recItemTop}>
                    <View
                      style={[
                        styles.recCatIcon,
                        { backgroundColor: colors.primary + "20" },
                      ]}
                    >
                      <Ionicons
                        name={catIcon}
                        size={14}
                        color={colors.primary}
                      />
                    </View>
                    <Text style={[styles.recItemTitle, { color: colors.text }]}>
                      {rec.title}
                    </Text>
                    <View
                      style={[
                        styles.priorityBadge,
                        { backgroundColor: pColor + "20" },
                      ]}
                    >
                      <Text style={[styles.priorityText, { color: pColor }]}>
                        {rec.priority}
                      </Text>
                    </View>
                  </View>

                  {/* Detailed reason */}
                  <Text
                    style={[styles.recItemReason, { color: colors.textLight }]}
                  >
                    {rec.reason}
                  </Text>

                  {/* Impact bar */}
                  <View style={styles.impactRow}>
                    <Text
                      style={[styles.impactLabel, { color: colors.textLight }]}
                    >
                      Impact
                    </Text>
                    <View
                      style={[
                        styles.impactTrack,
                        { backgroundColor: colors.border },
                      ]}
                    >
                      <View
                        style={[
                          styles.impactFill,
                          {
                            backgroundColor: impactColor,
                            width:
                              rec.impact === "high"
                                ? "90%"
                                : rec.impact === "medium"
                                  ? "55%"
                                  : "25%",
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.impactText, { color: impactColor }]}>
                      {rec.impact
                        ? rec.impact.charAt(0).toUpperCase() +
                          rec.impact.slice(1)
                        : ""}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ── PDF button ── */}
        <Pressable
          onPress={handleDownloadPdf}
          disabled={isPdfLoading}
          style={({ pressed }) => [
            styles.pdfBtn,
            {
              borderColor: colors.primary,
              backgroundColor: colors.primary + "0D",
              opacity: isPdfLoading ? 0.6 : pressed ? 0.8 : 1,
            },
          ]}
        >
          {isPdfLoading ? (
            <Loader size="small" color={colors.primary} />
          ) : (
            <>
              <Ionicons
                name="document-text-outline"
                size={18}
                color={colors.primary}
              />
              <Text style={[styles.pdfBtnText, { color: colors.primary }]}>
                Download Full Report (PDF)
              </Text>
            </>
          )}
        </Pressable>

        {/* Save error */}
        {saveError && (
          <View
            style={[
              styles.errorBanner,
              {
                backgroundColor: colors.error + "15",
                borderColor: colors.error + "30",
              },
            ]}
          >
            <Ionicons
              name="alert-circle-outline"
              size={15}
              color={colors.error}
            />
            <Text style={[styles.errorText, { color: colors.error }]}>
              {saveError}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* ── Sticky footer ── */}
      <View
        style={[
          styles.footer,
          {
            borderTopColor: colors.border,
            backgroundColor: colors.background,
          },
        ]}
      >
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
            {
              backgroundColor: colors.success,
              opacity: isSaving ? 0.6 : pressed ? 0.88 : 1,
            },
          ]}
        >
          {isSaving ? (
            <Loader size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="cloud-upload-outline" size={18} color="#FFFFFF" />
              <Text style={styles.saveBtnText}>Save Project</Text>
            </>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:   { flex: 1 },
  scroll: { padding: SPACING.lg, paddingBottom: SPACING.xl },

  topRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: SPACING.lg,
  },
  headerTitle: { ...TYPOGRAPHY.h3, fontWeight: '700' },
  cancelText:  { ...TYPOGRAPHY.bodySmall, fontWeight: '600' },

  // Score card
  scoreCard: { borderRadius: 16, padding: SPACING.lg, marginBottom: SPACING.md },
  scoreCardTitle: {
    ...TYPOGRAPHY.bodySmall, color: '#FFFFFFB0',
    fontWeight: '600', marginBottom: SPACING.md,
  },
  scoreRow:    { flexDirection: 'row', alignItems: 'center', gap: SPACING.lg, marginBottom: SPACING.md },
  scoreDetails: { flex: 1, gap: SPACING.sm },
  riskBadge:   { alignSelf: 'flex-start', paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: 20 },
  riskLabel:   { ...TYPOGRAPHY.bodySmall, fontWeight: '700' },
  metricMini:  { gap: 2 },
  metricMiniLabel: { ...TYPOGRAPHY.caption, color: '#FFFFFFB0' },
  metricMiniValue: { ...TYPOGRAPHY.h3, color: '#FFFFFF', fontWeight: '700' },

  breakdownCard:  { borderRadius: 10, padding: SPACING.md, gap: SPACING.xs },
  breakdownTitle: {
    ...TYPOGRAPHY.caption, color: '#FFFFFFB0',
    fontWeight: '700', marginBottom: SPACING.xs, letterSpacing: 0.5,
  },
  breakdownRow:   { flexDirection: 'row', justifyContent: 'space-between' },
  breakdownLabel: { ...TYPOGRAPHY.bodySmall, color: '#FFFFFFC0' },
  breakdownValue: { ...TYPOGRAPHY.bodySmall, color: '#FFFFFF', fontWeight: '700' },

  // Review sections
  reviewCard: { borderRadius: 14, borderWidth: 1.5, padding: SPACING.md, marginBottom: SPACING.md },
  reviewCardHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: SPACING.sm,
    paddingBottom: SPACING.sm, borderBottomWidth: 1,
  },
  reviewCardLeft:  { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  reviewCardTitle: { ...TYPOGRAPHY.body, fontWeight: '700' },
  reviewRow:   { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.xs },
  reviewLabel: { ...TYPOGRAPHY.bodySmall },
  reviewValue: { ...TYPOGRAPHY.bodySmall, fontWeight: '600', textTransform: 'capitalize' },

  strategyRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: SPACING.xs },
  strategyText: { ...TYPOGRAPHY.bodySmall },

  // Recommendations
  recCard:   { borderRadius: 14, borderWidth: 1.5, padding: SPACING.md, marginBottom: SPACING.md },
  recHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md },
  recTitle:  { ...TYPOGRAPHY.body, fontWeight: '700' },

  recItem: {
    borderRadius: 10, borderWidth: 1.5,
    padding: SPACING.md, marginBottom: SPACING.sm, gap: SPACING.sm,
  },
  recItemTop: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  recCatIcon: { width: 28, height: 28, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  recItemTitle: { ...TYPOGRAPHY.bodySmall, fontWeight: '700', flex: 1 },
  priorityBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: 20 },
  priorityText:  { ...TYPOGRAPHY.caption, fontWeight: '700' },
  recItemReason: { ...TYPOGRAPHY.caption, lineHeight: 18 },

  impactRow:   { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: 2 },
  impactLabel: { ...TYPOGRAPHY.caption, width: 36 },
  impactTrack: { flex: 1, height: 4, borderRadius: 2, overflow: 'hidden' },
  impactFill:  { height: '100%', borderRadius: 2 },
  impactText:  { ...TYPOGRAPHY.caption, fontWeight: '700', width: 40 },

  // PDF button
  pdfBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.sm, borderWidth: 1.5, borderRadius: 12,
    paddingVertical: SPACING.md, marginBottom: SPACING.md,
  },
  pdfBtnText: { ...TYPOGRAPHY.body, fontWeight: '700' },

  // Error banner
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    padding: SPACING.sm, borderRadius: 10, borderWidth: 1, marginBottom: SPACING.sm,
  },
  errorText: { ...TYPOGRAPHY.bodySmall, flex: 1 },

  // Sticky footer
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