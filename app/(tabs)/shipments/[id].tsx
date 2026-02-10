import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '@/components/ui';
import { colors, spacing, fontSize, fontWeight } from '@/constants/theme';

export default function ShipmentDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Shipment Details</Text>
        <View style={{ width: 32 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Card variant="elevated" padding="base">
          <Text style={styles.logonLabel}>Logon / Order Number</Text>
          <Text style={styles.logonValue}>{id}</Text>
        </Card>
        <Card variant="default" padding="base">
          <Text style={styles.sectionTitle}>Status Timeline</Text>
          <Text style={styles.placeholder}>
            Detailed shipment information will be displayed here once the shipment detail API endpoint is integrated.
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
  logonLabel: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.xs },
  logonValue: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold, color: colors.textPrimary },
  sectionTitle: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colors.textPrimary, marginBottom: spacing.sm },
  placeholder: { fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: 20 },
});
