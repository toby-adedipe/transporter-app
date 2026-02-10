import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { colors, spacing, fontSize } from '@/constants/theme';

export default function ReportsScreen() {
  return (
    <View style={styles.container}>
      <ScreenHeader title="Reports" subtitle="Visibility & analytics" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.placeholder}>Reports loading...</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, padding: spacing.base, alignItems: 'center', justifyContent: 'center' },
  placeholder: { fontSize: fontSize.base, color: colors.textSecondary },
});
