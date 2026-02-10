import { useAppSelector } from './useAppSelector';

export function useTransporterNumber(): string {
  const user = useAppSelector((s) => s.auth.user);
  return user?.transporterNumber ?? '';
}
