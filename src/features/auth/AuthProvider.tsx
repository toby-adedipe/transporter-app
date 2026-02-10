import { useEffect } from 'react';
import { useAppDispatch } from '@/hooks/useAppSelector';
import { setCredentials, setLoading } from '@/store/slices/authSlice';
import { secureStorage } from '@/utils/secureStorage';
import type { TransporterUser } from '@/types/api';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();

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

  return <>{children}</>;
}
