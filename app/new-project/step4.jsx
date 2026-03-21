import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TextInput, Pressable, Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { toggleStrategy, updateForm } from '@/src/store/redux/formSlice';
import { useTheme } from '@/src/hooks/useTheme';
import StepProgressBar from '@/src/components/features/StepProgressBar';
import StrategyToggle from '@/src/components/features/StrategyToggle';
import { SPACING, TYPOGRAPHY, PASSIVE_STRATEGIES } from '@/src/utils/constants';

const STRATEGY_ICONS = {
  shading: 'sunny-outline',
  courtyard: 'home-outline',
  ventilation: 'partly-sunny-outline',
  insulation: 'layers-outline',
};

const STRATEGY_BENEFITS = {
  shading: 'Reduces solar gain',
  courtyard: 'Enhances cross-ventilation',
  ventilation: 'Improves airflow',
  insulation: 'Maintains internal temp',
};

export default function Step4Screen() {
  const { colors } = useTheme();
  const dispatch = useDispatch();
  const form = useSelector((state) => state.newProjectForm);
  const [notes, setNotes] = useState('');

  const handleToggle = (id) => {
    dispatch(toggleStrategy(id));
  };

  const handleNext = () => {
    dispatch(updateForm({ notes }));
    router.push('/new-project/review');
  };

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

        <StepProgressBar currentStep={4} totalSteps={5} />

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Passive Strategies</Text>
        <Text style={[styles.sectionSub, { color: colors.textLight }]}>
          Enable passive design elements relevant to your project site.
        </Text>

        {/* Strategy toggles with benefit chips */}
        {PASSIVE_STRATEGIES.map((strategy) => {
          const isEnabled = form.passiveStrategies.includes(strategy.id);
          return (
            <View
              key={strategy.id}
              style={[
                styles.strategyWrapper,
                {
                  backgroundColor: colors.surface,
                  borderColor: isEnabled ? colors.primary : colors.border,
                },
              ]}
            >
              <View style={styles.strategyTop}>
                <View
                  style={[
                    styles.strategyIconBox,
                    {
                      backgroundColor: isEnabled
                        ? colors.primary + "15"
                        : colors.background,
                    },
                  ]}
                >
                  <Ionicons
                    name={STRATEGY_ICONS[strategy.id] ?? "leaf-outline"}
                    size={20}
                    color={isEnabled ? colors.primary : colors.textLight}
                  />
                </View>
                <View style={styles.strategyInfo}>
                  <Text style={[styles.strategyLabel, { color: colors.text }]}>
                    {strategy.label}
                  </Text>
                  <Text
                    style={[styles.strategyDesc, { color: colors.textLight }]}
                  >
                    {strategy.description}
                  </Text>
                </View>
              </View>

              <View style={styles.strategyBottom}>
                <View
                  style={[
                    styles.benefitChip,
                    { backgroundColor: colors.secondary + "15" },
                  ]}
                >
                  <Ionicons
                    name="flash-outline"
                    size={11}
                    color={colors.secondary}
                  />
                  <Text
                    style={[styles.benefitText, { color: colors.secondary }]}
                  >
                    {STRATEGY_BENEFITS[strategy.id]}
                  </Text>
                </View>
                <View style={styles.statusRow}>
                  <Text
                    style={[
                      styles.statusText,
                      { color: isEnabled ? colors.success : colors.textLight },
                    ]}
                  >
                    {isEnabled ? "Enabled" : "Disabled"}
                  </Text>
                  {/* Replace <StrategyToggle> with a plain Switch */}
                  <Switch
                    value={isEnabled}
                    onValueChange={() => handleToggle(strategy.id)}
                    trackColor={{
                      false: colors.border,
                      true: colors.secondary + "80",
                    }}
                    thumbColor={isEnabled ? colors.secondary : colors.textLight}
                  />
                </View>
              </View>
            </View>
          );
        })}

        {/* Notes */}
        <Text style={[styles.fieldLabel, { color: colors.text }]}>
          Additional Notes <Text style={[styles.optional, { color: colors.textLight }]}>(Optional)</Text>
        </Text>
        <View style={[styles.notesInput, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Add any specific requirements for the architect..."
            placeholderTextColor={colors.textLight}
            style={[styles.notesText, { color: colors.text }]}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
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
          <Text style={styles.nextBtnText}>Review →</Text>
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

  strategyWrapper: {
    borderRadius: 14, borderWidth: 1.5,
    padding: SPACING.md, marginBottom: SPACING.sm, gap: SPACING.sm,
  },
  strategyTop: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md },
  strategyIconBox: {
    width: 40, height: 40, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  strategyInfo: { flex: 1 },
  strategyLabel: { ...TYPOGRAPHY.body, fontWeight: '700', marginBottom: 2 },
  strategyDesc: { ...TYPOGRAPHY.caption, lineHeight: 18 },
  strategyBottom: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
  },
  benefitChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: SPACING.sm, paddingVertical: 3, borderRadius: 20,
  },
  benefitText: { ...TYPOGRAPHY.caption, fontWeight: '600' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  statusText: { ...TYPOGRAPHY.caption, fontWeight: '600' },

  fieldLabel: { ...TYPOGRAPHY.bodySmall, fontWeight: '600', marginBottom: SPACING.xs, marginTop: SPACING.md },
  optional: { fontWeight: '400' },
  notesInput: {
    borderWidth: 1.5, borderRadius: 12,
    padding: SPACING.md, minHeight: 80,
  },
  notesText: { ...TYPOGRAPHY.body },

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
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: SPACING.sm + 4, borderRadius: 12,
  },
  nextBtnText: { ...TYPOGRAPHY.body, color: '#FFFFFF', fontWeight: '700' },
});