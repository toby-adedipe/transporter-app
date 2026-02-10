import { Redirect } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAppSelector } from '@/hooks/useAppSelector';
import { colors } from '@/constants/theme';

export default function Index() {
  const { isAuthenticated, isLoading } = useAppSelector((s) => s.auth);

  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return <Redirect href={isAuthenticated ? '/(tabs)/dashboard' : '/(auth)/login'} />;
}

const styles = StyleSheet.create({
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
});
