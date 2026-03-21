import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, ScrollView,
  StyleSheet, Pressable
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/hooks/useTheme';
import { useWeather } from '@/src/hooks/useWeather';
import WeatherWidget from '@/src/components/features/WeatherWidget';
import Loader from '@/src/components/common/Loader';
import { SPACING, TYPOGRAPHY } from '@/src/utils/constants';

// Derived climate indices from weather data
const computeIndices = (weather) => {
  const tNorm = Math.min(Math.max((weather.temp - 18) / 24, 0), 1);
  const hNorm = Math.min(Math.max((weather.humidity - 30) / 60, 0), 1);
  const wNorm = Math.min(Math.max(weather.windSpeed / 8, 0), 1);

  const coolingStress  = Math.round((0.6 * tNorm + 0.4 * hNorm) * 100);
  const heatingDemand  = Math.round((1 - tNorm) * 40);
  const ventPotential  = Math.round((0.7 * wNorm + 0.3 * (1 - hNorm)) * 100);

  return { coolingStress, heatingDemand, ventPotential };
};

const getIndexLabel = (value, type) => {
  if (type === 'cooling') return value > 65 ? 'High' : value > 35 ? 'Moderate' : 'Low';
  if (type === 'heating') return value > 40 ? 'High' : value > 15 ? 'Moderate' : 'Low';
  return value > 60 ? 'Good' : value > 30 ? 'Fair' : 'Poor';
};

const getIndexColor = (value, type, colors) => {
  if (type === 'cooling') return value > 65 ? colors.error : value > 35 ? colors.warning : colors.success;
  if (type === 'heating') return value > 40 ? colors.error : value > 15 ? colors.warning : colors.success;
  return value > 60 ? colors.success : value > 30 ? colors.warning : colors.error;
};

const generateInsights = (weather, indices) => {
  const tips = [];
  if (indices.coolingStress > 65)
    tips.push(`High solar gain expected. Shade south and west-facing windows during peak hours.`);
  else if (indices.coolingStress < 35)
    tips.push(`Comfortable cooling conditions. Natural ventilation will suffice today.`);

  if (indices.ventPotential > 60)
    tips.push(`Excellent ventilation potential. Open windows for natural cross ventilation.`);
  else if (indices.ventPotential < 30)
    tips.push(`Low wind today. Avoid relying on wind-driven cooling; consider shading instead.`);

  if (weather.humidity > 70)
    tips.push(`High humidity reduces thermal comfort. Prioritise airflow over insulation today.`);
  else if (weather.humidity < 40)
    tips.push(`Low humidity levels — comfortable for most occupants without active cooling.`);

  if (tips.length === 0)
    tips.push(`Conditions are moderate today. Standard passive strategies will perform well.`);

  return tips.slice(0, 3);
};

const IndexBar = ({ label, value, type, colors }) => {
  const barColor = getIndexColor(value, type, colors);
  const statusLabel = getIndexLabel(value, type);

  return (
    <View style={[styles.indexCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.indexTop}>
        <Text style={[styles.indexLabel, { color: colors.text }]}>{label}</Text>
        <View style={[styles.indexBadge, { backgroundColor: barColor + '20' }]}>
          <Text style={[styles.indexBadgeText, { color: barColor }]}>{statusLabel}</Text>
        </View>
      </View>
      <View style={[styles.barTrack, { backgroundColor: colors.border }]}>
        <View style={[styles.barFill, { width: `${value}%`, backgroundColor: barColor }]} />
      </View>
      <Text style={[styles.indexValue, { color: colors.textLight }]}>{value}%</Text>
    </View>
  );
};

export default function ExploreScreen() {
  const { colors } = useTheme();
  const { weather, isLoading, error, fetchWeather } = useWeather();
  const [cityInput, setCityInput] = useState('');

  const handleFetch = useCallback(async () => {
    const city = cityInput.trim();
    if (!city) return;
    await fetchWeather(city);
  }, [cityInput, fetchWeather]);

  const indices = weather ? computeIndices(weather) : null;
  const insights = weather && indices ? generateInsights(weather, indices) : [];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.text }]}>Climate Explorer</Text>
          {weather && (
            <Pressable onPress={handleFetch} hitSlop={8}>
              <Ionicons name="refresh-outline" size={22} color={colors.primary} />
            </Pressable>
          )}
        </View>
        <Text style={[styles.subtitle, { color: colors.textLight }]}>
          Explore real-time climate conditions for any Indian city
        </Text>

        {/* Search */}
        <View style={styles.searchWrap}>
          <View style={[styles.searchRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="search-outline" size={18} color={colors.textLight} />
            <TextInput
              value={cityInput}
              onChangeText={setCityInput}
              placeholder="Enter city name (e.g. Mumbai)"
              placeholderTextColor={colors.textLight}
              style={[styles.searchInput, { color: colors.text }]}
              returnKeyType="search"
              onSubmitEditing={handleFetch}
            />
          </View>
          <Pressable
            onPress={handleFetch}
            style={({ pressed }) => [
              styles.fetchBtn,
              { backgroundColor: colors.primary, opacity: pressed ? 0.88 : 1 },
            ]}
          >
            {isLoading
              ? <Loader size="small" color="#FFFFFF" />
              : <Ionicons name="cloud-download-outline" size={20} color="#FFFFFF" />
            }
          </Pressable>
        </View>

        {/* Error */}
        {error && (
          <View style={[styles.errorBanner, { backgroundColor: colors.error + '15', borderColor: colors.error + '30' }]}>
            <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          </View>
        )}

        {/* Results */}
        {weather && (
          <>
            {/* City + big temp */}
            <View style={[styles.weatherHeader, { backgroundColor: colors.primary }]}>
              <View>
                <Text style={styles.cityName}>{weather.city}</Text>
                <Text style={styles.conditionText}>{weather.description}</Text>
              </View>
              <Text style={styles.bigTemp}>{weather.temp}°C</Text>
            </View>

            {/* Full weather widget */}
            <WeatherWidget weather={weather} compact={false} />

            {/* Climate Index cards */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Climate Indices</Text>

            <IndexBar
              label="Cooling Stress Index"
              value={indices.coolingStress}
              type="cooling"
              colors={colors}
            />
            <IndexBar
              label="Heating Demand Factor"
              value={indices.heatingDemand}
              type="heating"
              colors={colors}
            />
            <IndexBar
              label="Ventilation Potential Index"
              value={indices.ventPotential}
              type="vent"
              colors={colors}
            />

            {/* Insights */}
            <View style={[styles.insightBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.insightHeader}>
                <Ionicons name="bulb-outline" size={18} color={colors.warning} />
                <Text style={[styles.insightTitle, { color: colors.text }]}>What it means today</Text>
              </View>
              {insights.map((tip, i) => (
                <View key={i} style={styles.tipRow}>
                  <View style={[styles.tipDot, { backgroundColor: colors.secondary }]} />
                  <Text style={[styles.tipText, { color: colors.text }]}>{tip}</Text>
                </View>
              ))}
            </View>

            {/* Disclaimer */}
            <Text style={[styles.disclaimer, { color: colors.textLight }]}>
              Live data used for calibration, not prediction.
            </Text>
          </>
        )}

        {/* Empty state */}
        {!weather && !isLoading && (
          <View style={styles.emptyWrap}>
            <Ionicons name="partly-sunny-outline" size={60} color={colors.border} />
            <Text style={[styles.emptyText, { color: colors.textLight }]}>
              Enter a city name above to explore its climate conditions
            </Text>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: SPACING.lg, paddingBottom: SPACING.xl + 16 },

  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: SPACING.xs,
  },
  title: { ...TYPOGRAPHY.h2, fontWeight: '800' },
  subtitle: { ...TYPOGRAPHY.bodySmall, marginBottom: SPACING.lg },

  searchWrap: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  searchRow: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    borderRadius: 12, borderWidth: 1.5,
    paddingHorizontal: SPACING.md, gap: SPACING.sm,
  },
  searchInput: { flex: 1, ...TYPOGRAPHY.body, paddingVertical: SPACING.sm },
  fetchBtn: {
    width: 48, height: 48, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },

  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    padding: SPACING.sm, borderRadius: 10, borderWidth: 1,
    marginBottom: SPACING.sm,
  },
  errorText: { ...TYPOGRAPHY.bodySmall, flex: 1 },

  weatherHeader: {
    borderRadius: 16, padding: SPACING.lg,
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: SPACING.sm,
  },
  cityName: { ...TYPOGRAPHY.h2, color: '#FFFFFF', fontWeight: '800' },
  conditionText: { ...TYPOGRAPHY.bodySmall, color: '#FFFFFFB0', textTransform: 'capitalize', marginTop: 2 },
  bigTemp: { fontSize: 48, fontWeight: '800', color: '#FFFFFF' },

  sectionTitle: { ...TYPOGRAPHY.h3, marginBottom: SPACING.sm, marginTop: SPACING.sm },

  indexCard: {
    borderRadius: 12, padding: SPACING.md,
    borderWidth: 1.5, marginBottom: SPACING.sm,
  },
  indexTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: SPACING.sm,
  },
  indexLabel: { ...TYPOGRAPHY.body, fontWeight: '600' },
  indexBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 3, borderRadius: 20 },
  indexBadgeText: { ...TYPOGRAPHY.caption, fontWeight: '700' },
  barTrack: { height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: SPACING.xs },
  barFill: { height: '100%', borderRadius: 4 },
  indexValue: { ...TYPOGRAPHY.caption, textAlign: 'right' },

  insightBox: {
    borderRadius: 12, padding: SPACING.md,
    borderWidth: 1.5, marginTop: SPACING.sm, gap: SPACING.sm,
  },
  insightHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  insightTitle: { ...TYPOGRAPHY.body, fontWeight: '700' },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm },
  tipDot: { width: 6, height: 6, borderRadius: 3, marginTop: 6 },
  tipText: { ...TYPOGRAPHY.bodySmall, flex: 1, lineHeight: 20 },

  disclaimer: {
    ...TYPOGRAPHY.caption, textAlign: 'center',
    marginTop: SPACING.md, fontStyle: 'italic',
  },

  emptyWrap: {
    alignItems: 'center', paddingTop: SPACING.xl * 2,
    gap: SPACING.md, paddingHorizontal: SPACING.xl,
  },
  emptyText: { ...TYPOGRAPHY.body, textAlign: 'center', lineHeight: 24 },
});