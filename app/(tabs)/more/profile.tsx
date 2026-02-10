import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '@/components/ui';
import { useAppSelector } from '@/hooks/useAppSelector';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAppSelector((s) => s.auth.user);

  const fields = [
    { label: 'Name', value: user?.name ?? user?.transporterName ?? '-' },
    { label: 'Email', value: user?.email ?? '-' },
    { label: 'Transporter Number', value: user?.transporterNumber ?? '-' },
    { label: 'SAP ID', value: user?.sapId ?? '-' },
    { label: 'Role', value: user?.role ?? '-' },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Profile</Text>
        <View style={{ width: 32 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(user?.name ?? 'T')[0].toUpperCase()}</Text>
          </View>
        </View>
        <Card variant="default" padding="base">
          {fields.map((field, index) => (
            <View key={index} style={[styles.fieldRow, index < fields.length - 1 && styles.fieldBorder]}>
              <Text style={styles.fieldLabel}>{field.label}</Text>
              <Text style={styles.fieldValue}>{field.value}</Text>
            </View>
          ))}
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
  content: { padding: spacing.base, gap: spacing.lg },
  avatarContainer: { alignItems: 'center' },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: fontWeight.bold },
  fieldRow: { paddingVertical: spacing.md },
  fieldBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  fieldLabel: { fontSize: fontSize.xs, color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.xs },
  fieldValue: { fontSize: fontSize.base, color: colors.textPrimary, fontWeight: fontWeight.medium },
});
