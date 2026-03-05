import React, { useCallback } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { Button, Card } from '@/components/ui';
import { KpiOverview } from '@/features/kpi/KpiOverview';
import { KpiHistoryChart } from '@/features/kpi/KpiHistoryChart';
import { colors, spacing } from '@/constants/theme';

export default function KpiScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  return (
    <View style={styles.container}>
      <ScreenHeader title="KPI Metrics" subtitle="Performance overview and trends" />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <Card variant="default" padding="base">
          <Button
            title="Open Revenue Simulator"
            onPress={() => router.push('/(tabs)/kpi/revenue-simulator')}
            fullWidth
          />
        </Card>
        <KpiOverview />
        <KpiHistoryChart />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.base, gap: spacing.xl, paddingBottom: spacing['3xl'] },
});
