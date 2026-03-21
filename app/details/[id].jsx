import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';

export default function ProjectDetailsScreen() {
  const { id } = useLocalSearchParams();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 20, fontWeight: '700', color: '#1E3A8A' }}>
          Project Details — {id}
        </Text>
      </View>
    </SafeAreaView>
  );
}