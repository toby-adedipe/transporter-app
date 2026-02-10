export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  'https://staging-812204315267.us-central1.run.app';

export const APP_CONFIG = {
  defaultPageSize: 20,
  tokenRefreshThresholdMs: 5 * 60 * 1000,
  mapDefaultRegion: {
    latitude: 6.5244,
    longitude: 3.3792,
    latitudeDelta: 5,
    longitudeDelta: 5,
  },
  pollingIntervalMs: 30_000,
} as const;
