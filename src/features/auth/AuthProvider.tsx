import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAppSelector, useAppDispatch } from '@/hooks/useAppSelector';
import { setCredentials, setLoading } from '@/store/slices/authSlice';
import { secureStorage } from '@/utils/secureStorage';
import type { TransporterUser } from '@/types/api';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading } = useAppSelector((s) => s.auth);
  const segments = useSegments();
  const router = useRouter();

  // Bootstrap auth from secure storage
  useEffect(() => {
    (async () => {
      try {
        const [token, refreshToken, user] = await Promise.all([
          secureStorage.getToken(),
          secureStorage.getRefreshToken(),
          secureStorage.getUser<TransporterUser>(),
        ]);
        if (token && refreshToken && user) {
          dispatch(setCredentials({ token, refreshToken, user }));
        } else {
          dispatch(setLoading(false));
        }
      } catch {
        dispatch(setLoading(false));
      }
    })();
  }, [dispatch]);

  // Redirect based on auth state
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, isLoading, segments]);

  return <>{children}</>;
}
