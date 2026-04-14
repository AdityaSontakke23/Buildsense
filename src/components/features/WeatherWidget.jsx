import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '@/src/components/common/Card';
import { useTheme } from '@/src/hooks/useTheme';
import { SPACING, TYPOGRAPHY } from '@/src/utils/constants';


// ─── Animated icon components ─────────────────────────────────────────────────

// Thermometer — pulses scale gently using Ionicons icon
function TempIcon({ color }) {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const run = () =>
      Animated.sequence([
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

// Water drop — bobs up and down using Ionicons icon
function HumidityIcon({ color }) {
  const bob = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: -4, duration: 800, useNativeDriver: true }),
        Animated.timing(bob, { toValue:  0, duration: 800, useNativeDriver: true }),
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

// Wind — horizontal lines that sweep right
function WindIcon({ color }) {
  const slide  = useRef(new Animated.Value(0)).current;
  const slide2 = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const run = (anim, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 6,  duration: 420, useNativeDriver: true }),
          Animated.timing(anim, { toValue: -3, duration: 260, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0,  duration: 320, useNativeDriver: true }),
          Animated.delay(1200),
        ])
      ).start();
    run(slide, 0);
    run(slide2, 200);
  }, []);

  return (
    <View style={{ gap: 4, width: 24 }}>
      {[slide, slide2].map((anim, i) => (
        <Animated.View
          key={i}
          style={{
            transform: [{ translateX: anim }],
            height: 2.5, backgroundColor: color, borderRadius: 2,
            width: i === 0 ? 22 : 16,
          }}
        />
      ))}
      <View style={{ height: 2.5, backgroundColor: color, borderRadius: 2, width: 20 }} />
    </View>
  );
}

// Cloud — slow left-right drift + gentle vertical float
function CloudIcon({ color }) {
  const drift = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(drift, { toValue:  4, duration: 1800, useNativeDriver: true }),
        Animated.timing(drift, { toValue: -4, duration: 1800, useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: -2, duration: 1400, useNativeDriver: true }),
        Animated.timing(float, { toValue:  2, duration: 1400, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={{ transform: [{ translateX: drift }, { translateY: float }], alignItems: 'center' }}>
      <View style={{ flexDirection: 'row', marginBottom: -4 }}>
        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color, marginRight: -2 }} />
        <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: color, marginTop: -4 }} />
        <View style={{ width: 8,  height: 8,  borderRadius: 4, backgroundColor: color, marginLeft: -2, marginTop: -1 }} />
      </View>
      <View style={{ width: 26, height: 10, backgroundColor: color, borderRadius: 5, marginTop: -2 }} />
    </Animated.View>
  );
}


// ─── Main widget ──────────────────────────────────────────────────────────────

const WeatherWidget = ({ weather, compact = false }) => {
  const { colors } = useTheme();

  if (!weather) return null;

  if (compact) {
    return (
      <View style={[styles.pill, { backgroundColor: colors.primary + '15', borderColor: colors.border }]}>
        <View style={{ width: 14, height: 14 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, position: 'absolute', top: 0, left: 3 }} />
          <View style={{ width: 14, height: 6, backgroundColor: colors.primary, borderRadius: 3, position: 'absolute', bottom: 0 }} />
        </View>
        <Text style={[styles.pillText, { color: colors.primary }]}>
          {' '}{Math.round(weather.temp)}°C · {weather.condition}
        </Text>
      </View>
    );
  }

  const items = [
    {
      label: 'Temp',
      value: `${Math.round(weather.temp)}°C`,
      Icon: <TempIcon color={colors.secondary} />,
    },
    {
      label: 'Humidity',
      value: `${weather.humidity}%`,
      Icon: <HumidityIcon color={colors.primary} />,
    },
    {
      label: 'Wind',
      value: `${weather.windSpeed} m/s`,
      Icon: <WindIcon color={colors.secondary} />,
    },
    {
      label: 'Clouds',
      value: `${weather.cloudCover ?? weather.clouds ?? '—'}%`,
      Icon: <CloudIcon color={colors.textLight} />,
    },
  ];

  return (
    <Card style={styles.card}>
      <Text style={[styles.condition, { color: colors.text }]}>
        {weather.condition}
      </Text>
      <View style={styles.grid}>
        {items.map((item) => (
          <View key={item.label} style={styles.item}>
            <View style={styles.iconWrap}>{item.Icon}</View>
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
  condition: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    marginBottom: SPACING.sm,
    textTransform: 'capitalize',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  item: { width: '46%', alignItems: 'center', padding: SPACING.sm },
  iconWrap: { height: 36, justifyContent: 'center', alignItems: 'center', marginBottom: 2 },
  value: { ...TYPOGRAPHY.h3, fontWeight: '700', marginTop: 4 },
  itemLabel: { ...TYPOGRAPHY.caption, marginTop: 2 },
});

export default React.memo(WeatherWidget);