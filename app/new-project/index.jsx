import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, ScrollView,
  StyleSheet, Pressable, ActivityIndicator, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import * as Location from 'expo-location';
import { updateForm } from '@/src/store/redux/formSlice';
import { useTheme } from '@/src/hooks/useTheme';
import { useWeather } from '@/src/hooks/useWeather';
import StepProgressBar from '@/src/components/features/StepProgressBar';
import WeatherWidget from '@/src/components/features/WeatherWidget';
import { SPACING, TYPOGRAPHY } from '@/src/utils/constants';
import { formatDate } from '@/src/utils/helpers';

export default function Step1Screen() {
  const { colors } = useTheme();
  const dispatch = useDispatch();
  const form = useSelector((state) => state.newProjectForm);
  const { fetchWeather, fetchWeatherByCoords, isLoading, error } = useWeather();

  const [cityInput, setCityInput] = useState(form.city ?? '');
  const [localWeather, setLocalWeather] = useState(form.weather ?? null);
  const [locLoading, setLocLoading] = useState(false);

  const handleFetch = useCallback(async () => {
    const city = cityInput.trim();
    if (!city) return;
    const { data } = await fetchWeather(city);
    if (data) {
      setLocalWeather(data);
      dispatch(updateForm({ city: data.city ?? city, lat: data.lat, lon: data.lon, weather: data }));
    }
  }, [cityInput]);

  const handleUseLocation = useCallback(async () => {
    setLocLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Location permission is required to use this feature.",
        );
        setLocLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced, // ← less strict, works better on emulator
      });
      const { latitude, longitude } = loc.coords;

      const geo = await Location.reverseGeocodeAsync({ latitude, longitude });
      const cityName = geo?.[0]?.city ?? geo?.[0]?.region ?? "Current Location";

      const { data } = await fetchWeatherByCoords(
        latitude,
        longitude,
        cityName,
      );
      if (data) {
        setCityInput(cityName);
        setLocalWeather(data);
        dispatch(
          updateForm({
            city: cityName,
            lat: latitude,
            lon: longitude,
            weather: data,
          }),
        );
      }
    } catch (e) {
      Alert.alert(
        "Location Unavailable",
        "Could not fetch your location. Please enable location services or enter the city manually.",
      );
    } finally {
      setLocLoading(false);
    }
  }, []);

  const canProceed = !!localWeather;

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

        {/* Progress */}
        <StepProgressBar currentStep={1} totalSteps={5} />

        {/* Section title */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Project Location</Text>
        <Text style={[styles.sectionSub, { color: colors.textLight }]}>
          Select the city to fetch climate data for thermal analysis.
        </Text>

        {/* City input */}
        <Text style={[styles.fieldLabel, { color: colors.text }]}>Select City</Text>
        <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <Ionicons name="search-outline" size={18} color={colors.textLight} />
          <TextInput
            value={cityInput}
            onChangeText={setCityInput}
            placeholder="Search for a city..."
            placeholderTextColor={colors.textLight}
            style={[styles.textInput, { color: colors.text }]}
            returnKeyType="search"
            onSubmitEditing={handleFetch}
          />
          {cityInput.length > 0 && (
            <Pressable onPress={() => { setCityInput(''); setLocalWeather(null); }} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.textLight} />
            </Pressable>
          )}
        </View>

        {/* Action buttons */}
        <View style={styles.btnRow}>
          <Pressable
            onPress={handleFetch}
            disabled={isLoading || !cityInput.trim()}
            style={({ pressed }) => [
              styles.fetchBtn,
              { backgroundColor: colors.primary, opacity: (isLoading || !cityInput.trim()) ? 0.5 : pressed ? 0.88 : 1 },
            ]}
          >
            {isLoading
              ? <ActivityIndicator color="#FFFFFF" size="small" />
              : <><Ionicons name="cloud-download-outline" size={16} color="#FFFFFF" />
                <Text style={styles.fetchBtnText}>Fetch Live Weather</Text></>
            }
          </Pressable>

          <Pressable
            onPress={handleUseLocation}
            disabled={locLoading}
            style={({ pressed }) => [
              styles.locBtn,
              { borderColor: colors.primary, opacity: locLoading ? 0.5 : pressed ? 0.88 : 1 },
            ]}
          >
            {locLoading
              ? <ActivityIndicator color={colors.primary} size="small" />
              : <Ionicons name="locate-outline" size={18} color={colors.primary} />
            }
          </Pressable>
        </View>

        {/* Error */}
        {error && (
          <View style={[styles.errorBanner, { backgroundColor: colors.error + '15', borderColor: colors.error + '30' }]}>
            <Ionicons name="alert-circle-outline" size={15} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          </View>
        )}

        {/* Weather result */}
        {localWeather && (
          <View style={[styles.weatherCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.weatherCardTop}>
              <View style={[styles.lockedBadge, { backgroundColor: colors.success + '20' }]}>
                <Ionicons name="lock-closed" size={12} color={colors.success} />
                <Text style={[styles.lockedText, { color: colors.success }]}>Location locked</Text>
              </View>
              <Text style={[styles.updatedText, { color: colors.textLight }]}>
                Updated {localWeather.fetchedAt ? formatDate(localWeather.fetchedAt) : 'just now'}
              </Text>
            </View>

            <View style={styles.bigTempRow}>
              <Text style={[styles.bigTemp, { color: colors.primary }]}>{localWeather.temp}°C</Text>
              <Text style={[styles.conditionText, { color: colors.textLight }]}>
                {localWeather.description}
              </Text>
            </View>

            <View style={styles.weatherGrid}>
              {[
                { icon: 'water-outline', label: 'HUMIDITY', value: `${localWeather.humidity}%` },
                { icon: 'flag-outline', label: 'WIND', value: `${localWeather.windSpeed} m/s` },
                { icon: 'sunny-outline', label: 'UV INDEX', value: localWeather.uvIndex > 7 ? 'High' : localWeather.uvIndex > 3 ? 'Moderate' : 'Low' },
                { icon: 'cloud-outline', label: 'CLOUD COVER', value: `${localWeather.cloudCover}%` },
              ].map((item) => (
                <View key={item.label} style={styles.weatherItem}>
                  <Ionicons name={item.icon} size={16} color={colors.secondary} />
                  <Text style={[styles.weatherLabel, { color: colors.textLight }]}>{item.label}</Text>
                  <Text style={[styles.weatherValue, { color: colors.text }]}>{item.value}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Manual fallback */}
        <Pressable style={styles.manualLink}>
          <Text style={[styles.manualText, { color: colors.textLight }]}>
            Use manual weather input instead
          </Text>
        </Pressable>

      </ScrollView>

      {/* Next button */}
      <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
        <Pressable
          onPress={() => router.push('/new-project/step2')}
          disabled={!canProceed}
          style={({ pressed }) => [
            styles.nextBtn,
            { backgroundColor: colors.primary, opacity: !canProceed ? 0.4 : pressed ? 0.88 : 1 },
          ]}
        >
          <Text style={styles.nextBtnText}>Next</Text>
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

  fieldLabel: { ...TYPOGRAPHY.bodySmall, fontWeight: '600', marginBottom: SPACING.xs },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderRadius: 12,
    paddingHorizontal: SPACING.md, gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  textInput: { flex: 1, ...TYPOGRAPHY.body, paddingVertical: SPACING.sm + 2 },

  btnRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  fetchBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: SPACING.sm,
    paddingVertical: SPACING.sm + 4, borderRadius: 12,
  },
  fetchBtnText: { ...TYPOGRAPHY.body, color: '#FFFFFF', fontWeight: '700' },
  locBtn: {
    width: 48, height: 48, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1.5,
  },

  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    padding: SPACING.sm, borderRadius: 10, borderWidth: 1,
    marginBottom: SPACING.sm,
  },
  errorText: { ...TYPOGRAPHY.bodySmall, flex: 1 },

  weatherCard: {
    borderRadius: 14, borderWidth: 1.5,
    padding: SPACING.md, marginBottom: SPACING.sm,
  },
  weatherCardTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: SPACING.sm,
  },
  lockedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: SPACING.sm, paddingVertical: 3, borderRadius: 20,
  },
  lockedText: { ...TYPOGRAPHY.caption, fontWeight: '700' },
  updatedText: { ...TYPOGRAPHY.caption },

  bigTempRow: { flexDirection: 'row', alignItems: 'baseline', gap: SPACING.sm, marginBottom: SPACING.md },
  bigTemp: { fontSize: 42, fontWeight: '800' },
  conditionText: { ...TYPOGRAPHY.body, textTransform: 'capitalize' },

  weatherGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  weatherItem: { width: '46%', gap: 2 },
  weatherLabel: { ...TYPOGRAPHY.caption, fontWeight: '600', letterSpacing: 0.5 },
  weatherValue: { ...TYPOGRAPHY.body, fontWeight: '700' },

  manualLink: { alignItems: 'center', paddingVertical: SPACING.md },
  manualText: { ...TYPOGRAPHY.bodySmall, textDecorationLine: 'underline' },

  footer: {
    padding: SPACING.lg, paddingBottom: SPACING.lg,
    borderTopWidth: 1,
  },
  nextBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: SPACING.sm + 4, borderRadius: 12, gap: SPACING.sm,
  },
  nextBtnText: { ...TYPOGRAPHY.body, color: '#FFFFFF', fontWeight: '700' },
});