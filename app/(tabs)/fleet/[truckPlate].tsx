import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '@/components/ui';
import { colors, spacing, fontSize, fontWeight } from '@/constants/theme';

export default function TruckDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { truckPlate } = useLocalSearchParams<{ truckPlate: string }>();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Truck Details</Text>
        <View style={{ width: 32 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Card variant="elevated" padding="base">
          <Text style={styles.plateLabel}>Registration Number</Text>
          <Text style={styles.plateValue}>{truckPlate}</Text>
        </Card>
        <Card variant="default" padding="base">
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <Text style={styles.placeholder}>
            Detailed truck information, recent trips, and real-time status will be displayed here once integrated with the fleet detail API.
          </Text>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.base, paddingVertical: spacing.md, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.textPrimary },
  content: { padding: spacing.base, gap: spacing.base },
  plateLabel: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.xs },
  plateValue: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold, color: colors.textPrimary },
  sectionTitle: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colors.textPrimary, marginBottom: spacing.sm },
  placeholder: { fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: 20 },
});
