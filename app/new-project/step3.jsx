import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  Pressable, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useDispatch, useSelector } from 'react-redux';
import { updateForm } from '@/src/store/redux/formSlice';
import { useTheme } from '@/src/hooks/useTheme';
import StepProgressBar from '@/src/components/features/StepProgressBar';
import { SPACING, TYPOGRAPHY, WALL_TYPES, ROOF_TYPES } from '@/src/utils/constants';

export default function Step3Screen() {
  const { colors } = useTheme();
  const dispatch = useDispatch();
  const form = useSelector((state) => state.newProjectForm);

  const [wallType, setWallType] = useState(form.wallType);
  const [roofType, setRoofType] = useState(form.roofType);
  const [wwr, setWwr] = useState(form.wwr);

  const handleNext = () => {
    dispatch(updateForm({ wallType, roofType, wwr }));
    router.push('/new-project/step4');
  };

  const SelectorCard = ({ options, selected, onSelect, label }) => (
    <View style={styles.selectorGroup}>
      <Text style={[styles.fieldLabel, { color: colors.text }]}>{label}</Text>
      <View style={styles.selectorGrid}>
        {options.map((opt) => {
          const isSelected = selected === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => onSelect(opt.value)}
              style={[
                styles.selectorCard,
                {
                  backgroundColor: isSelected ? colors.primary + '15' : colors.surface,
                  borderColor: isSelected ? colors.primary : colors.border,
                },
              ]}
            >
              <Ionicons
                name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                size={16}
                color={isSelected ? colors.primary : colors.textLight}
              />
              <Text style={[
                styles.selectorLabel,
                { color: isSelected ? colors.primary : colors.text },
              ]}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );

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
          <Text style={[styles.headerTitle, { color: colors.text }]}>New Project</Text>
          <Pressable onPress={() => router.replace('/(tabs)/home')} hitSlop={8}>
            <Text style={[styles.cancelText, { color: colors.error }]}>Cancel</Text>
          </Pressable>
        </View>

        <StepProgressBar currentStep={3} totalSteps={5} />

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Envelope Configuration</Text>
        <Text style={[styles.sectionSub, { color: colors.textLight }]}>
          Define your building's thermal envelope materials and glazing ratio.
        </Text>

        {/* Wall type */}
        <SelectorCard
          label="Wall Type"
          options={WALL_TYPES}
          selected={wallType}
          onSelect={setWallType}
        />

        {/* Roof type */}
        <SelectorCard
          label="Roof Type"
          options={ROOF_TYPES}
          selected={roofType}
          onSelect={setRoofType}
        />

        {/* WWR Slider */}
        <Text style={[styles.fieldLabel, { color: colors.text }]}>
          Window-to-Wall Ratio (WWR)
        </Text>
        <Text style={[styles.helperText, { color: colors.textLight }]}>
          Higher WWR increases solar gain and overheating risk.
        </Text>

        <View style={[styles.wwrCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Facade illustration */}
          <View style={styles.facadeRow}>
            <View style={[styles.facade, { borderColor: colors.border }]}>
              <View style={[
                styles.facadeWindow,
                {
                  width: `${wwr}%`,
                  backgroundColor: colors.primary + '40',
                  borderColor: colors.primary,
                },
              ]} />
            </View>
            <View style={[styles.wwrBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.wwrBadgeText}>{wwr}%</Text>
            </View>
          </View>

          <Slider
            minimumValue={10}
            maximumValue={90}
            step={5}
            value={wwr}
            onValueChange={setWwr}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.border}
            thumbTintColor={colors.primary}
            style={styles.slider}
          />
          <View style={styles.sliderLabels}>
            <Text style={[styles.sliderLabel, { color: colors.textLight }]}>10%</Text>
            <Text style={[styles.sliderLabel, { color: colors.textLight }]}>90%</Text>
          </View>

          {wwr > 50 && (
            <View style={[styles.warningBanner, { backgroundColor: colors.warning + '15', borderColor: colors.warning + '40' }]}>
              <Ionicons name="warning-outline" size={15} color={colors.warning} />
              <Text style={[styles.warningText, { color: colors.warning }]}>
                High WWR may increase overheating risk significantly.
              </Text>
            </View>
          )}
        </View>

      </ScrollView>

      {/* Footer nav */}
      <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.backBtn, { borderColor: colors.border }]}
        >
          <Ionicons name="arrow-back" size={18} color={colors.text} />
          <Text style={[styles.backBtnText, { color: colors.text }]}>Back</Text>
        </Pressable>
        <Pressable
          onPress={handleNext}
          style={({ pressed }) => [
            styles.nextBtn,
            { backgroundColor: colors.primary, opacity: pressed ? 0.88 : 1 },
          ]}
        >
          <Text style={styles.nextBtnText}>Next Step</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
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
  sectionTitle: { ...TYPOGRAPHY.h2, fontWeight: '800', marginBottom: SPACING.xs },
  sectionSub: { ...TYPOGRAPHY.bodySmall, marginBottom: SPACING.lg, lineHeight: 20 },
  fieldLabel: { ...TYPOGRAPHY.bodySmall, fontWeight: '600', marginBottom: SPACING.xs, marginTop: SPACING.md },
  helperText: { ...TYPOGRAPHY.caption, marginBottom: SPACING.sm },
  selectorGroup: { marginBottom: SPACING.xs },
  selectorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  selectorCard: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm + 2,
    borderRadius: 10, borderWidth: 1.5, minWidth: '46%',
  },
  selectorLabel: { ...TYPOGRAPHY.bodySmall, fontWeight: '600' },
  wwrCard: {
    borderRadius: 14, borderWidth: 1.5,
    padding: SPACING.md, marginTop: SPACING.xs,
  },
  facadeRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: SPACING.md, marginBottom: SPACING.md,
  },
  facade: {
    flex: 1, height: 48, borderRadius: 8, borderWidth: 1.5,
    overflow: 'hidden', justifyContent: 'center',
  },
  facadeWindow: {
    height: '70%', borderRadius: 4, borderWidth: 1.5,
    alignSelf: 'center',
  },
  wwrBadge: {
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderRadius: 10,
  },
  wwrBadgeText: { ...TYPOGRAPHY.h3, color: '#FFFFFF', fontWeight: '800' },
  slider: { width: '100%', height: 40 },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  sliderLabel: { ...TYPOGRAPHY.caption },
  warningBanner: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    padding: SPACING.sm, borderRadius: 8, borderWidth: 1, marginTop: SPACING.sm,
  },
  warningText: { ...TYPOGRAPHY.caption, flex: 1 },
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
  nextBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: SPACING.sm,
    paddingVertical: SPACING.sm + 4, borderRadius: 12,
  },
  nextBtnText: { ...TYPOGRAPHY.body, color: '#FFFFFF', fontWeight: '700' },
});