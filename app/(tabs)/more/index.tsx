import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { Card } from '@/components/ui';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppSelector';
import { logout } from '@/store/slices/authSlice';
import { secureStorage } from '@/utils/secureStorage';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';

interface MenuItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  color?: string;
  showChevron?: boolean;
}

export default function MoreIndexScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await secureStorage.clearAll();
          dispatch(logout());
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const menuItems: MenuItem[] = [
    { icon: 'person-outline', label: 'Profile', onPress: () => router.push('/(tabs)/more/profile' as any), showChevron: true },
    { icon: 'settings-outline', label: 'Settings', onPress: () => router.push('/(tabs)/more/settings' as any), showChevron: true },
    { icon: 'stats-chart-outline', label: 'KPI Metrics', onPress: () => router.push('/(tabs)/kpi'), showChevron: true },
    { icon: 'information-circle-outline', label: 'About', onPress: () => Alert.alert('Transporter App', 'Version 1.0.0\nPhase 1 - MVP'), showChevron: false },
    { icon: 'log-out-outline', label: 'Sign Out', onPress: handleLogout, color: colors.danger, showChevron: false },
  ];

  return (
    <View style={styles.container}>
      <ScreenHeader title="More" subtitle="Settings & profile" />
      <ScrollView contentContainerStyle={styles.content}>
        {user && (
          <Card variant="elevated" padding="base" style={styles.profileCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{(user.profile?.firstName ?? 'T')[0].toUpperCase()}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {user.profile ? `${user.profile.firstName} ${user.profile.lastName}` : 'Transporter'}
              </Text>
              <Text style={styles.profileEmail}>{user.username}</Text>
              <Text style={styles.profileId}>ID: {user.profile?.transporterNumber ?? user.profileId}</Text>
            </View>
          </Card>
        )}

        {menuItems.map((item, index) => (
          <TouchableOpacity key={index} activeOpacity={0.7} onPress={item.onPress}>
            <Card variant="default" padding="base">
              <View style={styles.menuRow}>
                <View style={[styles.iconWrapper, item.color ? { backgroundColor: `${item.color}15` } : undefined]}>
                  <Ionicons name={item.icon} size={20} color={item.color ?? colors.primary} />
                </View>
                <Text style={[styles.menuLabel, item.color ? { color: item.color } : undefined]}>{item.label}</Text>
                {item.showChevron && <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />}
              </View>
            </Card>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.base, gap: spacing.md },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: fontSize.xl, fontWeight: fontWeight.bold },
  profileInfo: { flex: 1 },
  profileName: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colors.textPrimary },
  profileEmail: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  profileId: { fontSize: fontSize.xs, color: colors.textTertiary, marginTop: 2 },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconWrapper: {
    width: 36, height: 36, borderRadius: borderRadius.md,
    backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  menuLabel: { flex: 1, fontSize: fontSize.base, fontWeight: fontWeight.medium, color: colors.textPrimary },
});
