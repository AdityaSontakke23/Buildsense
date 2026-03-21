import React, { useState } from 'react';
import {
  View, Text, TextInput, ScrollView,
  StyleSheet, Pressable
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { updateForm } from '@/src/store/redux/formSlice';
import { useTheme } from '@/src/hooks/useTheme';
import StepProgressBar from '@/src/components/features/StepProgressBar';
import { SPACING, TYPOGRAPHY, ORIENTATION_OPTIONS } from '@/src/utils/constants';
import { validateProjectName, validateArea } from '@/src/utils/validators';

export default function Step2Screen() {
  const { colors } = useTheme();
  const dispatch = useDispatch();
  const form = useSelector((state) => state.newProjectForm);

  const [name, setName] = useState(form.name);
  const [area, setArea] = useState(form.area);
  const [floors, setFloors] = useState(parseInt(form.floors) || 1);
  const [orientation, setOrientation] = useState(form.orientation);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!validateProjectName(name)) e.name = 'Enter a valid project name (max 50 chars)';
    if (!validateArea(area)) e.area = 'Enter a valid area greater than 0';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (!validate()) return;
    dispatch(updateForm({ name: name.trim(), area, floors: String(floors), orientation }));
    router.push('/new-project/step3');
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
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

        <StepProgressBar currentStep={2} totalSteps={5} />

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Building Details</Text>
        <Text style={[styles.sectionSub, { color: colors.textLight }]}>
          Enter the key parameters of your building design.
        </Text>

        {/* Project Name */}
        <Text style={[styles.fieldLabel, { color: colors.text }]}>Project Name</Text>
        <View style={[styles.inputRow, { borderColor: errors.name ? colors.error : colors.border, backgroundColor: colors.surface }]}>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Northside Office Complex"
            placeholderTextColor={colors.textLight}
            style={[styles.textInput, { color: colors.text }]}
          />
        </View>
        {errors.name && <Text style={[styles.errorText, { color: colors.error }]}>{errors.name}</Text>}

        {/* Total Area */}
        <Text style={[styles.fieldLabel, { color: colors.text }]}>Total Area</Text>
        <View style={[styles.inputRowUnits, { borderColor: errors.area ? colors.error : colors.border, backgroundColor: colors.surface }]}>
          <TextInput
            value={area}
            onChangeText={setArea}
            placeholder="0"
            placeholderTextColor={colors.textLight}
            keyboardType="numeric"
            style={[styles.textInput, { color: colors.text }]}
          />
          <View style={[styles.unitBadge, { backgroundColor: colors.primary + '15' }]}>
            <Text style={[styles.unitText, { color: colors.primary }]}>m²</Text>
          </View>
        </View>
        {errors.area && <Text style={[styles.errorText, { color: colors.error }]}>{errors.area}</Text>}

        {/* Floors stepper */}
        <Text style={[styles.fieldLabel, { color: colors.text }]}>Floors</Text>
        <View style={[styles.stepperRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Pressable
            onPress={() => setFloors((f) => Math.max(1, f - 1))}
            style={[styles.stepperBtn, { backgroundColor: colors.background }]}
          >
            <Ionicons name="remove" size={20} color={colors.primary} />
          </Pressable>
          <Text style={[styles.stepperValue, { color: colors.text }]}>{floors}</Text>
          <Pressable
            onPress={() => setFloors((f) => Math.min(50, f + 1))}
            style={[styles.stepperBtn, { backgroundColor: colors.background }]}
          >
            <Ionicons name="add" size={20} color={colors.primary} />
          </Pressable>
        </View>

        {/* Orientation compass */}
        <Text style={[styles.fieldLabel, { color: colors.text }]}>
          Building Orientation{' '}
          <Text style={{ color: colors.primary }}>[{orientation}]</Text>
        </Text>
        <Text style={[styles.helperText, { color: colors.textLight }]}>
          Used to estimate solar exposure risk
        </Text>
        <View style={styles.compassGrid}>
          {ORIENTATION_OPTIONS.map((opt) => {
            const isSelected = orientation === opt.value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => setOrientation(opt.value)}
                style={[
                  styles.compassBtn,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.surface,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text style={[
                  styles.compassLabel,
                  { color: isSelected ? '#FFFFFF' : colors.text },
                ]}>
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.lg,
  },
  headerTitle: { ...TYPOGRAPHY.h3, fontWeight: "700" },
  cancelText: { ...TYPOGRAPHY.bodySmall, fontWeight: "600" },
  sectionTitle: {
    ...TYPOGRAPHY.h2,
    fontWeight: "800",
    marginBottom: SPACING.xs,
  },
  sectionSub: {
    ...TYPOGRAPHY.bodySmall,
    marginBottom: SPACING.lg,
    lineHeight: 20,
  },
  fieldLabel: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: "600",
    marginBottom: SPACING.xs,
    marginTop: SPACING.md,
  },
  helperText: { ...TYPOGRAPHY.caption, marginBottom: SPACING.sm },
  inputRow: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.xs,
  },
  inputRowUnits: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.xs,
  },
  textInput: { flex: 1, ...TYPOGRAPHY.body, paddingVertical: SPACING.sm + 2 },
  unitBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: SPACING.sm,
  },
  unitText: { ...TYPOGRAPHY.bodySmall, fontWeight: "700" },
  errorText: { ...TYPOGRAPHY.caption, marginBottom: SPACING.xs },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: SPACING.xs,
  },
  stepperBtn: {
    padding: SPACING.md,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperValue: {
    flex: 1,
    ...TYPOGRAPHY.h3,
    fontWeight: "700",
    textAlign: "center",
  },
  compassGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  compassBtn: {
    width: "22%",
    height: 48, // ← fixed height instead of aspectRatio
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  compassLabel: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: "700",
  },
  footer: {
    flexDirection: "row",
    gap: SPACING.sm,
    padding: SPACING.lg,
    borderTopWidth: 1,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: SPACING.sm + 4,
    paddingHorizontal: SPACING.lg,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  backBtnText: { ...TYPOGRAPHY.body, fontWeight: "600" },
  nextBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    paddingVertical: SPACING.sm + 4,
    borderRadius: 12,
  },
  nextBtnText: { ...TYPOGRAPHY.body, color: "#FFFFFF", fontWeight: "700" },
});