import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '@/components/ui';
import { colors, spacing, fontSize, fontWeight } from '@/constants/theme';

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 32 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionLabel}>Notifications</Text>
        <Card variant="default" padding="base">
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Push Notifications</Text>
              <Text style={styles.settingDesc}>Receive alerts for escalations and updates</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={notificationsEnabled ? colors.primary : colors.textTertiary}
            />
          </View>
        </Card>

        <Text style={styles.sectionLabel}>Data</Text>
        <Card variant="default" padding="base">
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Auto Refresh</Text>
              <Text style={styles.settingDesc}>Automatically refresh data every 30 seconds</Text>
            </View>
            <Switch
              value={autoRefresh}
              onValueChange={setAutoRefresh}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={autoRefresh ? colors.primary : colors.textTertiary}
            />
          </View>
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
  content: { padding: spacing.base, gap: spacing.md },
  sectionLabel: { fontSize: fontSize.xs, color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: spacing.sm },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  settingInfo: { flex: 1, marginRight: spacing.base },
  settingLabel: { fontSize: fontSize.base, fontWeight: fontWeight.medium, color: colors.textPrimary },
  settingDesc: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
});
