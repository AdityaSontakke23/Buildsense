import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '@/src/components/common/Card';
import { useTheme } from '@/src/hooks/useTheme';
import { SPACING, TYPOGRAPHY } from '@/src/utils/constants';

const WeatherWidget = ({ weather, compact = false }) => {
  const { colors } = useTheme();

  if (!weather) return null;

  if (compact) {
    return (
      <View style={[styles.pill, { backgroundColor: colors.primary + '15', borderColor: colors.border }]}>
        <Ionicons name="partly-sunny-outline" size={14} color={colors.primary} />
        <Text style={[styles.pillText, { color: colors.primary }]}>
          {' '}{Math.round(weather.temp)}°C · {weather.condition}
        </Text>
      </View>
    );
  }

  const items = [
    { icon: 'thermometer-outline', label: 'Temp', value: `${Math.round(weather.temp)}°C` },
    { icon: 'water-outline', label: 'Humidity', value: `${weather.humidity}%` },
    { icon: 'flag-outline', label: 'Wind', value: `${weather.windSpeed} m/s` },
    { icon: 'cloud-outline', label: 'Clouds', value: `${weather.cloudCover}%` },
  ];

  return (
    <Card style={styles.card}>
      <Text style={[styles.condition, { color: colors.text }]}>
        {weather.condition}
      </Text>
      <View style={styles.grid}>
        {items.map((item) => (
          <View key={item.label} style={styles.item}>
            <Ionicons name={item.icon} size={20} color={colors.secondary} />
            <Text style={[styles.value, { color: colors.text }]}>{item.value}</Text>
            <Text style={[styles.itemLabel, { color: colors.textLight }]}>{item.label}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillText: { ...TYPOGRAPHY.caption, fontWeight: '600' },
  card: { marginVertical: SPACING.sm },
  condition: { ...TYPOGRAPHY.body, fontWeight: '600', marginBottom: SPACING.sm, textTransform: 'capitalize' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  item: { width: '46%', alignItems: 'center', padding: SPACING.sm,  },
  value: { ...TYPOGRAPHY.h3, fontWeight: '700', marginTop: 4 },
  itemLabel: { ...TYPOGRAPHY.caption, marginTop: 2 },
});

export default React.memo(WeatherWidget);