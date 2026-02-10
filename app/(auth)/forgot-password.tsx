import { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { useForgotPasswordMutation } from '@/store/api/authApi';
import { Button, Input } from '@/components/ui';
import { colors, spacing, fontSize, fontWeight } from '@/constants/theme';

const forgotPasswordSchema = z.object({
  email: z.string().email('Enter a valid email'),
  transportNumber: z.string().min(1, 'Transporter number is required'),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [forgotPassword, { isLoading, error }] = useForgotPasswordMutation();
  const [successMessage, setSuccessMessage] = useState('');

  const { control, handleSubmit, formState: { errors } } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '', transportNumber: '' },
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    try {
      setSuccessMessage('');
      await forgotPassword(data).unwrap();
      setSuccessMessage('Password reset link has been sent to your email.');
    } catch {
      // error handled by RTK Query error state
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>Enter your email and transporter number</Text>
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
            name="transportNumber"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Transporter Number"
                placeholder="Enter your transporter number"
                autoCapitalize="none"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.transportNumber?.message}
              />
            )}
          />

          {error && (
            <Text style={styles.apiError}>
              {'data' in error ? (error.data as any)?.message ?? 'Request failed' : 'Network error. Please try again.'}
            </Text>
          )}

          {successMessage !== '' && (
            <Text style={styles.successMessage}>{successMessage}</Text>
          )}

          <View style={styles.buttonGap}>
            <Button title="Send Reset Link" onPress={handleSubmit(onSubmit)} loading={isLoading} fullWidth />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, paddingHorizontal: spacing.xl, paddingTop: spacing['3xl'] },
  backButton: {
    width: 40, height: 40,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  header: { marginBottom: spacing['3xl'] },
  title: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold, color: colors.textPrimary },
  subtitle: { fontSize: fontSize.base, color: colors.textSecondary, marginTop: spacing.xs },
  form: { gap: spacing.base },
  apiError: {
    color: colors.danger, fontSize: fontSize.sm,
    textAlign: 'center', padding: spacing.sm,
    backgroundColor: colors.dangerLight, borderRadius: 8, overflow: 'hidden',
  },
  successMessage: {
    color: colors.success, fontSize: fontSize.sm,
    textAlign: 'center', padding: spacing.sm,
    backgroundColor: colors.successLight, borderRadius: 8, overflow: 'hidden',
  },
  buttonGap: { gap: spacing.sm, marginTop: spacing.sm },
});
