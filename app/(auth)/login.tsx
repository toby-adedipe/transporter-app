import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLoginMutation } from '@/store/api/authApi';
import { useAppDispatch } from '@/hooks/useAppSelector';
import { setCredentials } from '@/store/slices/authSlice';
import { secureStorage } from '@/utils/secureStorage';
import { Button, Input } from '@/components/ui';
import { colors, spacing, fontSize, fontWeight } from '@/constants/theme';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [login, { isLoading, error }] = useLoginMutation();

  const { control, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (formData: LoginForm) => {
    try {
      const response = await login(formData).unwrap();
      const { token, refreshToken, user } = response.result;
      await secureStorage.setTokens(token, refreshToken);
      await secureStorage.setUser(user);
      dispatch(setCredentials({ token, refreshToken, user }));
      router.replace('/(tabs)/dashboard');
    } catch (err) {
      console.warn('[Login] Failed:', err);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>T</Text>
          </View>
          <Text style={styles.title}>Transporter</Text>
          <Text style={styles.subtitle}>Sign in to manage your fleet</Text>
        </View>

        <View style={styles.form}>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Email"
                placeholder="you@company.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.email?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Password"
                placeholder="Enter your password"
                secureTextEntry
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.password?.message}
              />
            )}
          />

          {error && (
            <Text style={styles.apiError}>
              {'data' in error
                ? (error.data as any)?.message ?? 'Login failed'
                : 'error' in error
                  ? error.error
                  : 'Network error. Please try again.'}
            </Text>
          )}

          <View style={styles.buttonGap}>
            <Button title="Sign In" onPress={handleSubmit(onSubmit)} loading={isLoading} fullWidth />
            <Button title="Forgot Password?" variant="ghost" onPress={() => router.push('/(auth)/forgot-password')} fullWidth />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: spacing.xl },
  header: { alignItems: 'center', marginBottom: spacing['3xl'] },
  logoBadge: {
    width: 64, height: 64, borderRadius: 16,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.base,
  },
  logoText: { color: '#fff', fontSize: 28, fontWeight: fontWeight.bold },
  title: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold, color: colors.textPrimary },
  subtitle: { fontSize: fontSize.base, color: colors.textSecondary, marginTop: spacing.xs },
  form: { gap: spacing.base },
  apiError: {
    color: colors.danger, fontSize: fontSize.sm,
    textAlign: 'center', padding: spacing.sm,
    backgroundColor: colors.dangerLight, borderRadius: 8, overflow: 'hidden',
  },
  buttonGap: { gap: spacing.sm, marginTop: spacing.sm },
});
