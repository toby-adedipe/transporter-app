import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { ShipmentSegmentPicker, ShipmentSegment } from '@/features/shipments/ShipmentSegmentPicker';
import { ShipmentList } from '@/features/shipments/ShipmentList';
import { DiversionsList } from '@/features/shipments/DiversionsList';
import { ReroutingsList } from '@/features/shipments/ReroutingsList';
import { FeedbackList } from '@/features/shipmentFeedback/FeedbackList';
import { borderRadius, colors, fontSize, fontWeight, spacing } from '@/constants/theme';

export default function ShipmentsIndexScreen() {
  const router = useRouter();
  const [segment, setSegment] = useState<ShipmentSegment>('all');

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Shipments"
        subtitle="Track and manage deliveries"
        rightAction={
          <TouchableOpacity
            style={styles.headerAction}
            onPress={() => router.push('/(tabs)/shipments/feedback')}
            accessibilityRole="button"
            accessibilityLabel="Open driver feedback page"
          >
            <Ionicons name="chatbubble-outline" size={16} color={colors.primary} />
            <Text style={styles.headerActionText}>Feedback</Text>
          </TouchableOpacity>
        }
      />
      <ShipmentSegmentPicker selected={segment} onSelect={setSegment} />
      {segment === 'all' && <ShipmentList />}
      {segment === 'diversions' && <DiversionsList />}
      {segment === 'reroutings' && <ReroutingsList />}
      {segment === 'feedback' && <FeedbackList />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryLight,
  },
  headerActionText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
});
