import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, ScrollView,
  StyleSheet, Pressable, Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/hooks/useTheme';
import { useWeather } from '@/src/hooks/useWeather';
import WeatherWidget from '@/src/components/features/WeatherWidget';
import Loader from '@/src/components/common/Loader';
import { SPACING, TYPOGRAPHY } from '@/src/utils/constants';


// ─── Pure helpers (unchanged) ───────────────────────────────────────────────

const computeIndices = (weather) => {
  const tNorm = Math.min(Math.max((weather.temp - 18) / 24, 0), 1);
  const hNorm = Math.min(Math.max((weather.humidity - 30) / 60, 0), 1);
  const wNorm = Math.min(Math.max(weather.windSpeed / 8, 0), 1);
  return {
    coolingStress: Math.round((0.6 * tNorm + 0.4 * hNorm) * 100),
    heatingDemand: Math.round((1 - tNorm) * 40),
    ventPotential: Math.round((0.7 * wNorm + 0.3 * (1 - hNorm)) * 100),
  };
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

const getBarGradient = (type, value) => {
  if (type === 'cooling') return value > 65
    ? ['#F97316', '#EF4444']
    : value > 35 ? ['#FBBF24', '#F97316'] : ['#34D399', '#10B981'];
  if (type === 'heating') return value > 40
    ? ['#60A5FA', '#3B82F6']
    : value > 15 ? ['#818CF8', '#6366F1'] : ['#34D399', '#06B6D4'];
  return value > 60
    ? ['#34D399', '#06B6D4']
    : value > 30 ? ['#FBBF24', '#F59E0B'] : ['#F87171', '#EF4444'];
};

const generateInsights = (weather, indices) => {
  const tips = [];
  if (indices.coolingStress > 65)
    tips.push('High solar gain expected. Shade south and west-facing windows during peak hours.');
  else if (indices.coolingStress < 35)
    tips.push('Comfortable cooling conditions. Natural ventilation will suffice today.');
  if (indices.ventPotential > 60)
    tips.push('Excellent ventilation potential. Open windows for natural cross ventilation.');
  else if (indices.ventPotential < 30)
    tips.push('Low wind today. Avoid relying on wind-driven cooling; consider shading instead.');
  if (weather.humidity > 70)
    tips.push('High humidity reduces thermal comfort. Prioritise airflow over insulation today.');
  else if (weather.humidity < 40)
    tips.push('Low humidity levels — comfortable for most occupants without active cooling.');
  if (tips.length === 0)
    tips.push('Conditions are moderate today. Standard passive strategies will perform well.');
  return tips.slice(0, 3);
};


// ─── PressScale (same as home) ───────────────────────────────────────────────

function PressScale({ onPress, style, children, scaleTo = 0.94 }) {
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


// ─── Animated index bar ───────────────────────────────────────────────────────

function IndexBar({ label, value, type, colors, delay = 0 }) {
  const barAnim  = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Card slides up
    Animated.timing(cardAnim, {
      toValue: 1, duration: 380, delay,
      useNativeDriver: true,
    }).start();
    // Bar fills
    Animated.timing(barAnim, {
      toValue: value, duration: 900, delay: delay + 120,
      useNativeDriver: false,         // width % — must be false
    }).start();
  }, [value]);

  const barColor      = getIndexColor(value, type, colors);
  const statusLabel   = getIndexLabel(value, type);
  const gradientColors = getBarGradient(type, value);
  const barWidth      = barAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });

  return (
    <Animated.View style={[
      styles.indexCard,
      { backgroundColor: colors.surface, borderColor: colors.border },
      {
        opacity: cardAnim,
        transform: [{ translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
      },
    ]}>
      <View style={styles.indexTop}>
        <Text style={[styles.indexLabel, { color: colors.text }]}>{label}</Text>
        <View style={[styles.indexBadge, { backgroundColor: barColor + '20' }]}>
          <Text style={[styles.indexBadgeText, { color: barColor }]}>{statusLabel}</Text>
        </View>
      </View>
      <View style={[styles.barTrack, { backgroundColor: colors.border }]}>
        <Animated.View style={{ width: barWidth, height: '100%', borderRadius: 4, overflow: 'hidden' }}>
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>
      <Text style={[styles.indexValue, { color: colors.textLight }]}>{value}%</Text>
    </Animated.View>
  );
}


// ─── Weather icon animations ─────────────────────────────────────────────────

// Thermometer — pulses scale gently
function TempIcon({ color }) {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const run = () => Animated.sequence([
      Animated.spring(pulse, { toValue: 1.22, useNativeDriver: true, speed: 30, bounciness: 10 }),
      Animated.spring(pulse, { toValue: 1,    useNativeDriver: true, speed: 20, bounciness: 6  }),
      Animated.delay(2400),
    ]).start(() => run());
    run();
  }, []);
  return (
    <Animated.View style={{ transform: [{ scale: pulse }] }}>
      <Ionicons name="thermometer-outline" size={20} color={color} />
    </Animated.View>
  );
}

// Water drop — bobs up and down
function HumidityIcon({ color }) {
  const bob = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: -4, duration: 800,  useNativeDriver: true }),
        Animated.timing(bob, { toValue:  0, duration: 800,  useNativeDriver: true }),
        Animated.delay(600),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={{ transform: [{ translateY: bob }] }}>
      <Ionicons name="water-outline" size={20} color={color} />
    </Animated.View>
  );
}

// Wind — slides right repeatedly
function WindIcon({ color }) {
  const slide = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(slide, { toValue: 5,  duration: 500, useNativeDriver: true }),
        Animated.timing(slide, { toValue: -3, duration: 300, useNativeDriver: true }),
        Animated.timing(slide, { toValue: 0,  duration: 400, useNativeDriver: true }),
        Animated.delay(1400),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={{ transform: [{ translateX: slide }] }}>
      <Ionicons name="speedometer-outline" size={20} color={color} />
    </Animated.View>
  );
}

// Cloud — drifts left–right slowly
function CloudIcon({ color }) {
  const drift = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(drift, { toValue:  4, duration: 1800, useNativeDriver: true }),
        Animated.timing(drift, { toValue: -4, duration: 1800, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={{ transform: [{ translateX: drift }] }}>
      <Ionicons name="cloudy-outline" size={20} color={color} />
    </Animated.View>
  );
}


// ─── Main screen ─────────────────────────────────────────────────────────────

export default function ExploreScreen() {
  const { colors }  = useTheme();
  const { weather, isLoading, error, fetchWeather } = useWeather();
  const [cityInput, setCityInput] = useState('');

  // ── Mount stagger anims ──
  const headerAnim    = useRef(new Animated.Value(0)).current;
  const underlineAnim = useRef(new Animated.Value(0)).current;
  const searchAnim    = useRef(new Animated.Value(0)).current;

  // ── Weather results block ──
  const resultsAnim = useRef(new Animated.Value(0)).current;

  // ── Error banner ──
  const errorAnim = useRef(new Animated.Value(0)).current;

  // ── Insight tips stagger ──
  const tipAnims = useRef(
    Array.from({ length: 3 }, () => new Animated.Value(0))
  ).current;

  // ── Empty state float ──
  const floatAnim = useRef(new Animated.Value(0)).current;

  // ── Refresh icon spin ──
  const refreshSpin = useRef(new Animated.Value(0)).current;
  const refreshDeg  = refreshSpin.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '360deg'] });

  // ── Header underline width ──
  const underlineWidth = underlineAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  useEffect(() => {
    // Section mount stagger
    Animated.stagger(90, [headerAnim, searchAnim].map(a =>
      Animated.timing(a, { toValue: 1, duration: 400, useNativeDriver: true })
    )).start();

    // Underline draw-in (useNativeDriver: false — width)
    Animated.timing(underlineAnim, {
      toValue: 1, duration: 600, delay: 120,
      useNativeDriver: false,
    }).start();

    // Empty state float loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -10, duration: 1600, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue:   0, duration: 1600, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Show results block when weather arrives
  useEffect(() => {
    if (weather) {
      resultsAnim.setValue(0);
      Animated.timing(resultsAnim, {
        toValue: 1, duration: 500,
        useNativeDriver: true,
      }).start();

      // Insight tips stagger
      tipAnims.forEach(a => a.setValue(0));
      Animated.stagger(80, tipAnims.map(a =>
        Animated.spring(a, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 5 })
      )).start();
    }
  }, [weather]);

  // Error banner slide-down
  useEffect(() => {
    if (error) {
      errorAnim.setValue(0);
      Animated.spring(errorAnim, {
        toValue: 1, useNativeDriver: true, speed: 20, bounciness: 6,
      }).start();
    }
  }, [error]);

  const handleFetch = useCallback(async () => {
    const city = cityInput.trim();
    if (!city) return;
    // Spin refresh icon once
    refreshSpin.setValue(0);
    Animated.timing(refreshSpin, {
      toValue: 360, duration: 600, useNativeDriver: true,
    }).start();
    await fetchWeather(city);
  }, [cityInput, fetchWeather]);

  const indices  = weather ? computeIndices(weather) : null;
  const insights = weather && indices ? generateInsights(weather, indices) : [];

  const makeSlide = (anim, offsetY = 18) => ({
    opacity: anim,
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [offsetY, 0] }) }],
  });

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── Header ── */}
        <Animated.View style={[styles.headerRow, makeSlide(headerAnim)]}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>Climate Explorer</Text>
            <Text style={[styles.subtitle, { color: colors.textLight }]}>
              Real-time conditions for any Indian city
            </Text>
          </View>
          {weather && (
            <Pressable
              onPress={handleFetch}
              hitSlop={8}
              style={[styles.refreshBtn, {
                backgroundColor: colors.primary + '15',
                borderColor: colors.primary + '30',
              }]}
            >
              <Animated.View style={{ transform: [{ rotate: refreshDeg }] }}>
                <Ionicons name="refresh-outline" size={20} color={colors.primary} />
              </Animated.View>
            </Pressable>
          )}
        </Animated.View>

        {/* ── Accent underline — draw-in ── */}
        <Animated.View style={{ width: underlineWidth, marginBottom: SPACING.lg }}>
          <LinearGradient
            colors={['#9760d2', '#7ee887', '#d0f183']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.headerUnderline}
          />
        </Animated.View>

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
<LinearGradient
colors={['#6366F1', '#06B6D4']}
start={{ x: 0, y: 0 }}
end={{ x: 1, y: 1 }}
style={styles.fetchBtnGradient}
>
<Pressable
onPress={handleFetch}
style={({ pressed }) => [styles.fetchBtn, { opacity: pressed ? 0.88 : 1 }]}
>
{isLoading
? <Loader size="small" color="#FFFFFF" />
: <Ionicons name="cloud-download-outline" size={20} color="#FFFFFF" />
}
</Pressable>
</LinearGradient>
</View>

        {/* ── Error banner — slides down ── */}
        {error && (
          <Animated.View style={[
            styles.errorBanner,
            { backgroundColor: colors.error + '15', borderColor: colors.error + '30' },
            {
              opacity: errorAnim,
              transform: [{ translateY: errorAnim.interpolate({ inputRange: [0, 1], outputRange: [-12, 0] }) }],
            },
          ]}>
            <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          </Animated.View>
        )}

        {/* ── Weather results — fade + slide up on arrival ── */}
        {weather && (
          <Animated.View style={makeSlide(resultsAnim, 24)}>

            {/* City weather header */}
            <LinearGradient
              colors={['#0EA5E9', '#6366F1', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.weatherHeader}
            >
              <View style={styles.weatherDecCircle} />
              <View>
                <Text style={styles.cityName}>{weather.city}</Text>
                <Text style={styles.conditionText}>{weather.description}</Text>
              </View>
              <Text style={styles.bigTemp}>{weather.temp}°C</Text>
            </LinearGradient>

            {/* Weather widget — icons are animated via WeatherWidget or inline below */}
            <WeatherWidget weather={weather} compact={false} />

            {/* ── Animated weather icon row ──
            <View style={[styles.iconRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.iconItem}>
                <TempIcon color={colors.error} />
                <Text style={[styles.iconVal, { color: colors.text }]}>{weather.temp}°</Text>
                <Text style={[styles.iconLbl, { color: colors.textLight }]}>Temp</Text>
              </View>
              <View style={[styles.iconDivider, { backgroundColor: colors.border }]} />
              <View style={styles.iconItem}>
                <HumidityIcon color={colors.primary} />
                <Text style={[styles.iconVal, { color: colors.text }]}>{weather.humidity}%</Text>
                <Text style={[styles.iconLbl, { color: colors.textLight }]}>Humidity</Text>
              </View>
              <View style={[styles.iconDivider, { backgroundColor: colors.border }]} />
              <View style={styles.iconItem}>
                <WindIcon color={colors.secondary} />
                <Text style={[styles.iconVal, { color: colors.text }]}>{weather.windSpeed}</Text>
                <Text style={[styles.iconLbl, { color: colors.textLight }]}>Wind m/s</Text>
              </View>
              <View style={[styles.iconDivider, { backgroundColor: colors.border }]} />
              <View style={styles.iconItem}>
                <CloudIcon color={colors.textLight} />
                <Text style={[styles.iconVal, { color: colors.text }]}>{weather.clouds ?? '—'}%</Text>
                <Text style={[styles.iconLbl, { color: colors.textLight }]}>Clouds</Text>
              </View>
            </View> */}

            {/* Climate indices */}
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionAccent, { backgroundColor: colors.primary }]} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Climate Indices</Text>
            </View>

            <IndexBar label="Cooling Stress Index"        value={indices.coolingStress} type="cooling" colors={colors} delay={0}   />
            <IndexBar label="Heating Demand Factor"       value={indices.heatingDemand} type="heating" colors={colors} delay={80}  />
            <IndexBar label="Ventilation Potential Index" value={indices.ventPotential}  type="vent"    colors={colors} delay={160} />

            {/* Insights */}
            <View style={[styles.insightBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <LinearGradient
                colors={['#FBBF24', '#F97316']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.insightStrip}
              />
              <View style={styles.insightContent}>
                <View style={styles.insightHeader}>
                  <Ionicons name="bulb-outline" size={18} color={colors.warning} />
                  <Text style={[styles.insightTitle, { color: colors.text }]}>What it means today</Text>
                </View>
                {insights.map((tip, i) => (
                  <Animated.View
                    key={i}
                    style={[
                      styles.tipRow,
                      {
                        opacity: tipAnims[i] ?? 1,
                        transform: [{
                          translateX: (tipAnims[i] ?? new Animated.Value(1)).interpolate({
                            inputRange: [0, 1], outputRange: [20, 0],
                          }),
                        }],
                      },
                    ]}
                  >
                    <View style={[styles.tipDot, { backgroundColor: colors.secondary }]} />
                    <Text style={[styles.tipText, { color: colors.text }]}>{tip}</Text>
                  </Animated.View>
                ))}
              </View>
            </View>

            <Text style={[styles.disclaimer, { color: colors.textLight }]}>
              Live data used for calibration, not prediction.
            </Text>
          </Animated.View>
        )}

        {/* ── Empty state — floating icon ── */}
        {!weather && !isLoading && (
          <View style={styles.emptyWrap}>
            <Animated.View style={{ transform: [{ translateY: floatAnim }] }}>
              <LinearGradient
                colors={['#9760d220', '#7ee88720']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.emptyIconCircle}
              >
                <Ionicons name="partly-sunny-outline" size={44} color={colors.textLight} />
              </LinearGradient>
            </Animated.View>
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
    alignItems: 'flex-start', marginBottom: SPACING.sm,
  },
  title: { ...TYPOGRAPHY.h2, fontWeight: '800' },
  subtitle: { ...TYPOGRAPHY.bodySmall, marginTop: 2 },
  refreshBtn: {
    width: 40, height: 40, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  headerUnderline: { height: 2, borderRadius: 1 },

  searchWrap: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  searchRow: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    borderRadius: 12, borderWidth: 1.5,
    paddingHorizontal: SPACING.md, gap: SPACING.sm,
  },
  searchInput: { flex: 1, ...TYPOGRAPHY.body, paddingVertical: SPACING.sm },
  fetchBtnGradient: { width: 48, height: 48, borderRadius: 12 },
  fetchBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', width: 48, height: 48 },

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
    overflow: 'hidden',
  },
  weatherDecCircle: {
    position: 'absolute', width: 160, height: 160,
    borderRadius: 80, backgroundColor: '#FFFFFF08',
    top: -60, right: -40,
  },
  cityName: { ...TYPOGRAPHY.h2, color: '#FFFFFF', fontWeight: '800' },
  conditionText: { ...TYPOGRAPHY.bodySmall, color: '#FFFFFFB0', textTransform: 'capitalize', marginTop: 2 },
  bigTemp: { fontSize: 48, fontWeight: '800', color: '#FFFFFF' },

  // ── Animated icon row ──
  iconRow: {
    flexDirection: 'row', borderRadius: 14,
    borderWidth: 1.5, padding: SPACING.md,
    marginBottom: SPACING.md, alignItems: 'center',
  },
  iconItem: { flex: 1, alignItems: 'center', gap: 4 },
  iconVal: { ...TYPOGRAPHY.bodySmall, fontWeight: '700' },
  iconLbl: { ...TYPOGRAPHY.caption },
  iconDivider: { width: 1, height: 36, marginHorizontal: SPACING.xs },

  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    gap: SPACING.xs, marginBottom: SPACING.sm, marginTop: SPACING.sm,
  },
  sectionAccent: { width: 3, height: 16, borderRadius: 2 },
  sectionTitle: { ...TYPOGRAPHY.h3 },

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
    borderRadius: 12, borderWidth: 1.5,
    marginTop: SPACING.sm, flexDirection: 'row',
    overflow: 'hidden',
  },
  insightStrip: { width: 4 },
  insightContent: { flex: 1, padding: SPACING.md, gap: SPACING.sm },
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
  emptyIconCircle: {
    width: 110, height: 110, borderRadius: 55,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyText: { ...TYPOGRAPHY.body, textAlign: 'center', lineHeight: 24 },
});