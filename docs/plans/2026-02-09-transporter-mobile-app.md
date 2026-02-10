# Transporter Mobile App - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a React Native / Expo mobile app for transporters to authenticate, view dashboards/KPIs, track trucks in real-time, manage shipments, and access visibility reports — all filtered by the transporter's SAP ID.

**Architecture:** Expo Router (file-based routing) with bottom tab + stack navigation. Redux Toolkit for global state management with RTK Query for API caching/fetching. React Context for auth state. Real-time truck tracking via react-native-maps with push notifications via expo-notifications.

**Tech Stack:**
- Runtime: React Native via Expo SDK 52 (managed workflow), TypeScript
- Navigation: Expo Router (file-based, bottom tabs + stacks)
- State: Redux Toolkit + RTK Query (API layer with caching, polling, invalidation)
- Auth: JWT stored in expo-secure-store, refresh token rotation
- Maps: react-native-maps (truck tracking)
- Notifications: expo-notifications
- Charts: react-native-chart-kit or victory-native
- UI: Custom component library (utilitarian modern design — no heavy UI framework)
- Forms: react-hook-form + zod validation

**Phasing:**
- **Phase 1 (this plan):** Auth, Dashboard, Truck Visibility, KPI metrics, Shipments (all/escalated/rerouting/diversions), Fleet Management
- **Phase 2 (future):** Backhaul, Incentives, Complaints/Feedback, Insurance/Bonds

---

## API Reference (Staging)

**Base URL:** `https://staging-812204315267.us-central1.run.app`

**Auth:**
- `POST /auth/transporter/login` — Body: `{ email, password }` → JWT token
- `POST /auth/refresh-token` — Body: refresh token string → new JWT
- `POST /auth/transporter/forgot-password` — Body: `{ email, transportNumber }`

**Dashboard:**
- `GET /api/transporter-dashboard/comprehensive?transporterNumber=X&startDate=Y&endDate=Z`
- `GET /api/transporter-dashboard/operational?transporterNumber=X&startDate=Y&endDate=Z`
- `GET /api/transporter-dashboard/agent?transporterNumber=X`
- `GET /api/transporter-dashboard/insurance-compliance?transporterNumber=X`

**KPI Rankings:**
- `GET /api/v1/kpi/rankings/{transporterNumber}?startDate=X&endDate=Y&region=Z&kpiTypes=...`
- `GET /api/v1/kpi/rankings/{transporterNumber}/history?kpiType=X&startDate=Y&endDate=Z`
- `GET /api/v1/kpi/rankings/summary?transporterNumber=X`
- `GET /api/v1/kpi/rankings/leaderboard?kpiType=X&startDate=Y&endDate=Z`
- `POST /api/v1/kpi/rankings/compare` — Body: `RankingComparisonRequest`

**Visibility Reports (V2 — all POST with VisibilityFilterDto body):**
- `POST /reports/v2/truck-visibility/full`
- `POST /reports/v2/truck-visibility/transporter`
- `POST /reports/v2/truck-visibility/by-transporter-dimension`
- `POST /reports/v2/truck-visibility/mdd`
- `POST /reports/v2/truck-visibility/full-km`
- `POST /reports/v2/customer-visibility`
- `POST /reports/v2/depot-visibility`
- `POST /reports/v2/location-visibility`
- `POST /reports/v2/no-go-zone-visibility`
- `POST /reports/v2/operational-kpi-visibility`
- `POST /reports/v2/mobilization`

**VisibilityFilterDto schema:**
```typescript
{
  region?: string[];
  truckStatus?: string[];
  isMdd?: boolean;
  isBulk?: boolean;
  truckType?: string[];
  shipToStates?: string[];
  transactionType?: string[];
  transporterSapId?: string[];  // <-- This is how we filter by transporter
  locationCategory?: string[];
  isAboveSevenDays?: boolean;
  daysSinceLastDispatch?: string;
  geofenceId?: number;
  shipmentCategory?: 'REROUTED' | 'DIVERTED';
  staffProfileId?: number;
  delegationType?: 'PRIMARY' | 'SECONDARY' | 'COMBINED';
  productName?: string;
}
```

**Shipments:**
- `GET /shipment/all?startDate=X&endDate=Y&region=Z&status=S&transporterSapId=T&page=P&limit=L`
- `GET /shipment/all/today?region=Z&status=S`

**Escalated Tasks:**
- `POST /task/escalated/filter` — Body: `EscalatedTaskFilterDto` (has `transporterSapIds[]`)

**Diversions:**
- `POST /diversions/filter` — Body: `OrderDiversionFilterDto` (has `transporters[]`)
- `GET /diversions/status/{status}?region=X`

**Reroutings:**
- `POST /reroutings/filter` — Body: `OrderReroutingFilterDto` (has `transporters[]`)
- `GET /reroutings/status/{status}`

**Fleet / Trucks:**
- `POST /trucks/getAllAssets` — Body: `AssetFilterDto` (has `transporterNumber`)
- `POST /trucks/location` — Body: `{ longitude, latitude }` + params: `isAfr`, `radius`
- `POST /trucks/update/transporter` — Body: `TransporterAssetUpdateDto[]`

**Constants/Enums:**
- `GET /constants/truck-statuses`
- `GET /constants/shipment-statuses`
- `GET /constants/shipment-categories`
- `GET /constants/escalation-types`
- `GET /constants/backhaul-statuses`

---

## Design System

**Philosophy:** Utilitarian modern design. Clean, data-dense, no decorative flourish. Inspired by logistics/fleet management dashboards.

**Color Palette:**
- Primary: `#1A73E8` (action blue)
- Success: `#0D9F6E`
- Warning: `#F59E0B`
- Danger: `#EF4444`
- Background: `#F8FAFC`
- Surface: `#FFFFFF`
- Text Primary: `#0F172A`
- Text Secondary: `#64748B`
- Border: `#E2E8F0`

**Typography:** System fonts (San Francisco on iOS, Roboto on Android). Sizes: 12/14/16/20/24/32.

**Spacing:** 4px grid (4, 8, 12, 16, 20, 24, 32, 48).

**Components (custom):** Card, Badge, MetricCard, StatusBadge, FilterChip, DataTable, SearchBar, EmptyState, SkeletonLoader.

---

## Task 1: Project Scaffolding & Configuration

**Files:**
- Create: entire project via `npx create-expo-app`
- Create: `tsconfig.json` (auto-generated, verify strict mode)
- Create: `app.json` (Expo config)
- Create: `.env` + `.env.example`
- Create: `src/constants/config.ts`

**Step 1: Initialize Expo project with TypeScript**

Run:
```bash
cd /Users/tobi/Desktop/projects/transporterapp
npx create-expo-app@latest . --template blank-typescript
```
Expected: Expo project created with TypeScript template.

**Step 2: Install core dependencies**

Run:
```bash
npx expo install expo-router expo-linking expo-constants expo-status-bar react-native-screens react-native-safe-area-context react-native-gesture-handler react-native-reanimated
```

Run:
```bash
npm install @reduxjs/toolkit react-redux expo-secure-store react-hook-form @hookform/resolvers zod
```

Run:
```bash
npm install react-native-maps expo-notifications expo-location react-native-chart-kit react-native-svg expo-image
```

Run:
```bash
npm install --save-dev @types/react @types/react-native
```

**Step 3: Configure Expo Router**

Update `app.json`:
```json
{
  "expo": {
    "name": "Transporter App",
    "slug": "transporter-app",
    "scheme": "transporterapp",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#1A73E8"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.transporter.app",
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "We need your location to show nearby trucks and facilities.",
        "NSLocationAlwaysAndWhenInUseUsageDescription": "We need your location for real-time truck tracking."
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#1A73E8"
      },
      "package": "com.transporter.app",
      "permissions": ["ACCESS_FINE_LOCATION", "ACCESS_COARSE_LOCATION"]
    },
    "plugins": [
      "expo-router",
      "expo-secure-store",
      "expo-notifications",
      "expo-location",
      [
        "expo-image",
        { "photosPermission": false }
      ]
    ]
  }
}
```

**Step 4: Create environment config**

Create `.env`:
```
EXPO_PUBLIC_API_BASE_URL=https://staging-812204315267.us-central1.run.app
```

Create `.env.example`:
```
EXPO_PUBLIC_API_BASE_URL=https://staging-812204315267.us-central1.run.app
```

Create `src/constants/config.ts`:
```typescript
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  'https://staging-812204315267.us-central1.run.app';

export const APP_CONFIG = {
  defaultPageSize: 20,
  tokenRefreshThresholdMs: 5 * 60 * 1000, // 5 minutes before expiry
  mapDefaultRegion: {
    latitude: 6.5244,
    longitude: 3.3792,
    latitudeDelta: 5,
    longitudeDelta: 5,
  },
  pollingIntervalMs: 30_000,
} as const;
```

**Step 5: Set up folder structure**

Create directories:
```bash
mkdir -p src/{components/{ui,charts,maps,layout},features/{auth,dashboard,visibility,kpi,shipments,fleet},hooks,store,types,utils,constants,services}
mkdir -p app/(tabs) app/(auth)
```

**Step 6: Initialize git and commit**

```bash
git init
echo "node_modules/\n.expo/\ndist/\n.env\n*.jks\n*.p8\n*.p12\n*.key\n*.mobileprovision\n*.orig.*\nweb-build/\n.DS_Store" > .gitignore
git add -A && git commit -m "chore: scaffold expo project with typescript and core deps"
```

---

## Task 2: Design System & Core UI Components

**Files:**
- Create: `src/constants/theme.ts`
- Create: `src/components/ui/Card.tsx`
- Create: `src/components/ui/Badge.tsx`
- Create: `src/components/ui/MetricCard.tsx`
- Create: `src/components/ui/StatusBadge.tsx`
- Create: `src/components/ui/FilterChip.tsx`
- Create: `src/components/ui/Button.tsx`
- Create: `src/components/ui/Input.tsx`
- Create: `src/components/ui/SkeletonLoader.tsx`
- Create: `src/components/ui/EmptyState.tsx`
- Create: `src/components/ui/SearchBar.tsx`
- Create: `src/components/ui/index.ts` (barrel export)

**Step 1: Create theme constants**

Create `src/constants/theme.ts`:
```typescript
export const colors = {
  primary: '#1A73E8',
  primaryLight: '#E8F0FE',
  primaryDark: '#1557B0',
  success: '#0D9F6E',
  successLight: '#DEF7EC',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceSecondary: '#F1F5F9',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
  border: '#E2E8F0',
  borderFocus: '#1A73E8',
  shadow: 'rgba(15, 23, 42, 0.08)',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
} as const;

export const borderRadius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  full: 999,
} as const;

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};
```

**Step 2: Create base UI components**

Create each component in `src/components/ui/`. Key examples:

`src/components/ui/Card.tsx`:
```typescript
import { View, StyleSheet, ViewProps } from 'react-native';
import { colors, spacing, borderRadius } from '@/constants/theme';

interface CardProps extends ViewProps {
  variant?: 'default' | 'outlined' | 'elevated';
  padding?: keyof typeof spacing;
}

export function Card({ variant = 'default', padding = 'base', style, children, ...props }: CardProps) {
  return (
    <View style={[styles.base, styles[variant], { padding: spacing[padding] }, style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
  },
  default: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  outlined: {
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: 'transparent',
  },
  elevated: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
});
```

`src/components/ui/MetricCard.tsx`:
```typescript
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: { value: number; isPositive: boolean };
  color?: string;
}

export function MetricCard({ title, value, subtitle, trend, color = colors.primary }: MetricCardProps) {
  return (
    <View style={styles.container}>
      <View style={[styles.accent, { backgroundColor: color }]} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.value}>{value}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {trend && (
        <View style={styles.trendRow}>
          <Text style={[styles.trendText, { color: trend.isPositive ? colors.success : colors.danger }]}>
            {trend.isPositive ? '+' : ''}{trend.value}%
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
    flex: 1,
    minWidth: 140,
  },
  accent: {
    width: 32,
    height: 4,
    borderRadius: 2,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  value: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  trendText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
});
```

`src/components/ui/StatusBadge.tsx`:
```typescript
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';

type StatusType = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const statusColors: Record<StatusType, { bg: string; text: string }> = {
  success: { bg: colors.successLight, text: colors.success },
  warning: { bg: colors.warningLight, text: '#92400E' },
  danger: { bg: colors.dangerLight, text: colors.danger },
  info: { bg: colors.primaryLight, text: colors.primary },
  neutral: { bg: colors.surfaceSecondary, text: colors.textSecondary },
};

interface StatusBadgeProps {
  label: string;
  status: StatusType;
}

export function StatusBadge({ label, status }: StatusBadgeProps) {
  const colorSet = statusColors[status];
  return (
    <View style={[styles.badge, { backgroundColor: colorSet.bg }]}>
      <View style={[styles.dot, { backgroundColor: colorSet.text }]} />
      <Text style={[styles.label, { color: colorSet.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: spacing.xs,
  },
  label: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
});
```

`src/components/ui/Button.tsx`:
```typescript
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
}

export function Button({
  title, onPress, variant = 'primary', size = 'md',
  loading = false, disabled = false, fullWidth = false,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <TouchableOpacity
      style={[
        styles.base,
        styles[`${variant}Bg` as keyof typeof styles] as ViewStyle,
        styles[`${size}Size` as keyof typeof styles] as ViewStyle,
        fullWidth && { width: '100%' },
        isDisabled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#fff' : colors.primary} size="small" />
      ) : (
        <Text style={[styles.text, styles[`${variant}Text` as keyof typeof styles] as TextStyle, styles[`${size}Text` as keyof typeof styles] as TextStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  primaryBg: { backgroundColor: colors.primary },
  secondaryBg: { backgroundColor: colors.primaryLight },
  outlineBg: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.border },
  ghostBg: { backgroundColor: 'transparent' },
  smSize: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, minHeight: 32 },
  mdSize: { paddingHorizontal: spacing.base, paddingVertical: spacing.md, minHeight: 44 },
  lgSize: { paddingHorizontal: spacing.xl, paddingVertical: spacing.base, minHeight: 52 },
  disabled: { opacity: 0.5 },
  text: { fontWeight: fontWeight.semibold },
  primaryText: { color: '#FFFFFF', fontSize: fontSize.base },
  secondaryText: { color: colors.primary, fontSize: fontSize.base },
  outlineText: { color: colors.textPrimary, fontSize: fontSize.base },
  ghostText: { color: colors.primary, fontSize: fontSize.base },
  smText: { fontSize: fontSize.sm },
  mdText: { fontSize: fontSize.base },
  lgText: { fontSize: fontSize.lg },
});
```

`src/components/ui/Input.tsx`:
```typescript
import { View, TextInput, Text, StyleSheet, TextInputProps } from 'react-native';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import { useState } from 'react';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, style, ...props }: InputProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          focused && styles.inputFocused,
          error ? styles.inputError : undefined,
          style,
        ]}
        placeholderTextColor={colors.textTertiary}
        onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
        {...props}
      />
      {error && <Text style={styles.error}>{error}</Text>}
      {hint && !error && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.base },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    fontSize: fontSize.base,
    color: colors.textPrimary,
  },
  inputFocused: { borderColor: colors.borderFocus },
  inputError: { borderColor: colors.danger },
  error: { fontSize: fontSize.xs, color: colors.danger, marginTop: spacing.xs },
  hint: { fontSize: fontSize.xs, color: colors.textTertiary, marginTop: spacing.xs },
});
```

Build remaining components (SkeletonLoader, EmptyState, SearchBar, FilterChip, Badge) following similar patterns.

Create `src/components/ui/index.ts`:
```typescript
export { Card } from './Card';
export { Badge } from './Badge';
export { MetricCard } from './MetricCard';
export { StatusBadge } from './StatusBadge';
export { FilterChip } from './FilterChip';
export { Button } from './Button';
export { Input } from './Input';
export { SkeletonLoader } from './SkeletonLoader';
export { EmptyState } from './EmptyState';
export { SearchBar } from './SearchBar';
```

**Step 3: Verify components compile**

Run: `npx expo export --platform web --dump-sourcemap 2>&1 | head -5` or `npx tsc --noEmit`

**Step 4: Commit**

```bash
git add -A && git commit -m "feat: add design system theme and core UI components"
```

---

## Task 3: Redux Store, RTK Query API Layer & Types

**Files:**
- Create: `src/types/api.ts` (all API response/request types)
- Create: `src/types/models.ts` (domain models)
- Create: `src/store/index.ts` (store configuration)
- Create: `src/store/api/baseApi.ts` (RTK Query base with auth headers)
- Create: `src/store/api/authApi.ts`
- Create: `src/store/api/dashboardApi.ts`
- Create: `src/store/api/visibilityApi.ts`
- Create: `src/store/api/kpiApi.ts`
- Create: `src/store/api/shipmentsApi.ts`
- Create: `src/store/api/fleetApi.ts`
- Create: `src/store/api/constantsApi.ts`
- Create: `src/store/slices/authSlice.ts`
- Create: `src/store/slices/filtersSlice.ts`

**Step 1: Define TypeScript types**

Create `src/types/api.ts`:
```typescript
// Standard API response wrapper
export interface AppResponse<T> {
  status: number;
  message: string;
  data: T;
  error?: string;
  timestamp?: string;
}

// Auth
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: TransporterUser;
}

export interface TransporterUser {
  id: number;
  email: string;
  name: string;
  transporterNumber: string;
  transporterName: string;
  role: string;
  sapId: string;
}

export interface TransporterForgetPasswordRequest {
  email: string;
  transportNumber: string;
}

// Visibility
export interface VisibilityFilterDto {
  region?: string[];
  truckStatus?: string[];
  isMdd?: boolean;
  isBulk?: boolean;
  truckType?: string[];
  shipToStates?: string[];
  transactionType?: string[];
  transporterSapId?: string[];
  locationCategory?: string[];
  isAboveSevenDays?: boolean;
  daysSinceLastDispatch?: string;
  daysSinceLastDispatchAfter?: string;
  geofenceId?: number;
  shipmentCategory?: 'REROUTED' | 'DIVERTED';
  staffProfileId?: number;
  delegationType?: 'PRIMARY' | 'SECONDARY' | 'COMBINED';
  productName?: string;
}

// Escalated Tasks
export interface EscalatedTaskFilterDto {
  createdDateStart: string;
  createdDateEnd: string;
  resolvedDateStart?: string;
  resolvedDateEnd?: string;
  isResolved?: boolean;
  isPriority?: boolean;
  assignedDateStart?: string;
  assignedDateEnd?: string;
  escalationTypes?: string[];
  assignedToStaffIds?: number[];
  logons?: string[];
  truckPlates?: string[];
  transporterSapIds?: string[];
  regions?: string[];
}

// Diversions
export interface OrderDiversionFilterDto {
  createdDateStart?: string;
  createdDateEnd?: string;
  assignedTo?: number[];
  status?: string[];
  region?: string[];
  requestedBy?: number[];
  transporters?: string[];
  isKeyAccount?: boolean;
  ids?: number[];
}

// Reroutings
export interface OrderReroutingFilterDto {
  createdDateStart?: string;
  createdDateEnd?: string;
  assignedTo?: number[];
  status?: string[];
  urgencyLevel?: string[];
  requestedBy?: number[];
  ids?: number[];
  transporters?: string[];
  destinationDepotIds?: number[];
  destinationType?: 'CUSTOMER' | 'DEPOT';
  region?: string;
}

// Fleet / Assets
export interface AssetFilterDto {
  transporterNumber?: string;
  unmappedAssets?: boolean;
  registrationNumbers?: string[];
  transporterNumbers?: string[];
  truckStatuses?: string[];
  truckTypes?: string[];
  backhaulStatuses?: string[];
  geofenceId?: number;
  regions?: string[];
}

// KPI
export interface RankingComparisonRequest {
  transporterNumbers: string[];
  startDate: string;
  endDate: string;
  region?: 'NORTH' | 'WEST' | 'EAST' | 'ALL' | 'LAGOS';
  kpiTypes?: string[];
}

// Complaints
export interface ComplaintRequestDto {
  referenceId: string;
  complaintType: 'PER_SHIPMENT' | 'PER_ESCALATION' | 'GENERAL';
  title: string;
  description: string;
  priorityLevel?: number;
  category?: string;
  truckPlate?: string;
  driverName?: string;
  transporterName?: string;
}

// Backhaul Assignments
export interface BackHaulAssignmentFilterDto {
  createdDateStart?: string;
  createdDateEnd?: string;
  tripType?: 'BACKHAUL' | 'DEDICATED';
  assignmentStatus?: string[];
  transporterNumbers?: string[];
  truckPlates?: string[];
  searchTerm?: string;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
  page?: number;
  size?: number;
}

// Enums
export type Region = 'NORTH' | 'WEST' | 'EAST' | 'ALL' | 'LAGOS';
export type TruckType = 'READY_MIX' | 'COAL' | 'AFR' | 'SILO275' | 'SINO275' | 'LAFARGE_OWNED' | 'SPECIAL_DEPLOYMENT';
export type TransactionType = 'PLANT_TO_CUSTOMER' | 'PLANT_TO_DEPOT' | 'DEPOT_TO_CUSTOMER' | 'PLANT_TO_CUSTOMER_AND_PLANT_TO_DEPOT' | 'PLANT_TO_CUSTOMER_AND_DEPOT_TO_CUSTOMER' | 'ALL' | 'PLANT_TO_DEPOT_AND_DEPOT_TO_CUSTOMER';
export type KpiType = 'LOADED_IN_PLANT_TIME' | 'LOADED_NOT_MOVING_TIME' | 'LOADED_IN_TRANSIT_STATIONARY_TIME' | 'TRUCKS_YET_TO_LOAD_7_DAYS_PLUS' | 'TRUCKS_NOT_TRACKING' | 'LOADED_IN_TRANSPORTER_YARD_TIME' | 'OFFLOADED_INBOUND_STATIONARY_TIME' | 'OFFLOADED_AT_TRANSPORTER_YARD_TIME' | 'AT_CUSTOMER_ABOVE_X_DAYS';
```

**Step 2: Create RTK Query base API with auth interceptor**

Create `src/store/api/baseApi.ts`:
```typescript
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '@/constants/config';
import type { RootState } from '@/store';

const baseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: async (headers, { getState }) => {
    const token = (getState() as RootState).auth.token;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    headers.set('Content-Type', 'application/json');
    return headers;
  },
});

// Wrapper that handles 401 by attempting token refresh
const baseQueryWithReauth: typeof baseQuery = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    const refreshToken = await SecureStore.getItemAsync('refreshToken');
    if (refreshToken) {
      const refreshResult = await baseQuery(
        { url: '/auth/refresh-token', method: 'POST', body: refreshToken },
        api,
        extraOptions,
      );
      if (refreshResult.data) {
        const data = refreshResult.data as { token: string; refreshToken: string };
        await SecureStore.setItemAsync('token', data.token);
        await SecureStore.setItemAsync('refreshToken', data.refreshToken);
        api.dispatch({ type: 'auth/tokenRefreshed', payload: data.token });
        result = await baseQuery(args, api, extraOptions);
      } else {
        api.dispatch({ type: 'auth/logout' });
      }
    } else {
      api.dispatch({ type: 'auth/logout' });
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'Dashboard', 'Visibility', 'KPI', 'Shipments',
    'EscalatedTasks', 'Fleet', 'Diversions', 'Reroutings', 'Constants',
  ],
  endpoints: () => ({}),
});
```

**Step 3: Create auth slice**

Create `src/store/slices/authSlice.ts`:
```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { TransporterUser } from '@/types/api';

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: TransporterUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const initialState: AuthState = {
  token: null,
  refreshToken: null,
  user: null,
  isAuthenticated: false,
  isLoading: true, // true while checking SecureStore on app boot
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ token: string; refreshToken: string; user: TransporterUser }>) => {
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.isLoading = false;
    },
    tokenRefreshed: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
    },
    logout: (state) => {
      state.token = null;
      state.refreshToken = null;
      state.user = null;
      state.isAuthenticated = false;
      state.isLoading = false;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const { setCredentials, tokenRefreshed, logout, setLoading } = authSlice.actions;
```

**Step 4: Create feature API slices**

Create `src/store/api/authApi.ts`:
```typescript
import { baseApi } from './baseApi';
import type { LoginRequest, AppResponse, LoginResponse, TransporterForgetPasswordRequest } from '@/types/api';

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<AppResponse<LoginResponse>, LoginRequest>({
      query: (body) => ({
        url: '/auth/transporter/login',
        method: 'POST',
        body,
        headers: { 'app-name': 'transporter-app' },
      }),
    }),
    forgotPassword: builder.mutation<AppResponse<void>, TransporterForgetPasswordRequest>({
      query: (body) => ({
        url: '/auth/transporter/forgot-password',
        method: 'POST',
        body,
      }),
    }),
    refreshToken: builder.mutation<AppResponse<LoginResponse>, string>({
      query: (refreshToken) => ({
        url: '/auth/refresh-token',
        method: 'POST',
        body: refreshToken,
      }),
    }),
  }),
});

export const { useLoginMutation, useForgotPasswordMutation } = authApi;
```

Create `src/store/api/dashboardApi.ts`:
```typescript
import { baseApi } from './baseApi';
import type { AppResponse } from '@/types/api';

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getComprehensiveDashboard: builder.query<AppResponse<any>, { transporterNumber: string; startDate: string; endDate: string }>({
      query: ({ transporterNumber, startDate, endDate }) => ({
        url: '/api/transporter-dashboard/comprehensive',
        params: { transporterNumber, startDate, endDate },
      }),
      providesTags: ['Dashboard'],
    }),
    getOperationalDashboard: builder.query<AppResponse<any>, { transporterNumber: string; startDate: string; endDate: string }>({
      query: ({ transporterNumber, startDate, endDate }) => ({
        url: '/api/transporter-dashboard/operational',
        params: { transporterNumber, startDate, endDate },
      }),
      providesTags: ['Dashboard'],
    }),
    getAgentMetrics: builder.query<AppResponse<any>, { transporterNumber: string }>({
      query: ({ transporterNumber }) => ({
        url: '/api/transporter-dashboard/agent',
        params: { transporterNumber },
      }),
      providesTags: ['Dashboard'],
    }),
    getInsuranceCompliance: builder.query<AppResponse<any>, { transporterNumber: string }>({
      query: ({ transporterNumber }) => ({
        url: '/api/transporter-dashboard/insurance-compliance',
        params: { transporterNumber },
      }),
      providesTags: ['Dashboard'],
    }),
  }),
});

export const {
  useGetComprehensiveDashboardQuery,
  useGetOperationalDashboardQuery,
  useGetAgentMetricsQuery,
  useGetInsuranceComplianceQuery,
} = dashboardApi;
```

Create `src/store/api/visibilityApi.ts`:
```typescript
import { baseApi } from './baseApi';
import type { AppResponse, VisibilityFilterDto } from '@/types/api';

export const visibilityApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTruckVisibility: builder.query<AppResponse<any>, VisibilityFilterDto>({
      query: (body) => ({ url: '/reports/v2/truck-visibility/full', method: 'POST', body }),
      providesTags: ['Visibility'],
    }),
    getTruckVisibilityByTransporter: builder.query<AppResponse<any>, VisibilityFilterDto>({
      query: (body) => ({ url: '/reports/v2/truck-visibility/transporter', method: 'POST', body }),
      providesTags: ['Visibility'],
    }),
    getTruckVisibilityByKm: builder.query<AppResponse<any>, VisibilityFilterDto>({
      query: (body) => ({ url: '/reports/v2/truck-visibility/full-km', method: 'POST', body }),
      providesTags: ['Visibility'],
    }),
    getCustomerVisibility: builder.query<AppResponse<any>, VisibilityFilterDto & { useNewRunRate?: boolean }>({
      query: ({ useNewRunRate, ...body }) => ({
        url: '/reports/v2/customer-visibility',
        method: 'POST',
        body,
        params: useNewRunRate != null ? { useNewRunRate } : undefined,
      }),
      providesTags: ['Visibility'],
    }),
    getDepotVisibility: builder.query<AppResponse<any>, VisibilityFilterDto>({
      query: (body) => ({ url: '/reports/v2/depot-visibility', method: 'POST', body }),
      providesTags: ['Visibility'],
    }),
    getLocationVisibility: builder.query<AppResponse<any>, VisibilityFilterDto>({
      query: (body) => ({ url: '/reports/v2/location-visibility', method: 'POST', body }),
      providesTags: ['Visibility'],
    }),
    getNoGoZoneVisibility: builder.query<AppResponse<any>, VisibilityFilterDto>({
      query: (body) => ({ url: '/reports/v2/no-go-zone-visibility', method: 'POST', body }),
      providesTags: ['Visibility'],
    }),
    getOperationalKpiVisibility: builder.query<AppResponse<any>, VisibilityFilterDto & { startDate?: string; endDate?: string }>({
      query: ({ startDate, endDate, ...body }) => ({
        url: '/reports/v2/operational-kpi-visibility',
        method: 'POST',
        body,
        params: { startDate, endDate },
      }),
      providesTags: ['Visibility'],
    }),
    getMobilization: builder.query<AppResponse<any>, VisibilityFilterDto>({
      query: (body) => ({ url: '/reports/v2/mobilization', method: 'POST', body }),
      providesTags: ['Visibility'],
    }),
  }),
});

export const {
  useGetTruckVisibilityQuery,
  useGetTruckVisibilityByTransporterQuery,
  useGetTruckVisibilityByKmQuery,
  useGetCustomerVisibilityQuery,
  useGetDepotVisibilityQuery,
  useGetLocationVisibilityQuery,
  useGetNoGoZoneVisibilityQuery,
  useGetOperationalKpiVisibilityQuery,
  useGetMobilizationQuery,
} = visibilityApi;
```

Create `src/store/api/kpiApi.ts`:
```typescript
import { baseApi } from './baseApi';
import type { AppResponse, RankingComparisonRequest } from '@/types/api';

export const kpiApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getKpiRankings: builder.query<AppResponse<any>, { transporterNumber: string; startDate: string; endDate: string; region?: string; kpiTypes?: string[] }>({
      query: ({ transporterNumber, ...params }) => ({
        url: `/api/v1/kpi/rankings/${transporterNumber}`,
        params,
      }),
      providesTags: ['KPI'],
    }),
    getKpiHistory: builder.query<AppResponse<any>, { transporterNumber: string; kpiType: string; startDate: string; endDate: string; region?: string; windowDays?: number }>({
      query: ({ transporterNumber, ...params }) => ({
        url: `/api/v1/kpi/rankings/${transporterNumber}/history`,
        params,
      }),
      providesTags: ['KPI'],
    }),
    getKpiSummary: builder.query<AppResponse<any>, { transporterNumber: string; region?: string; windowDays?: number }>({
      query: (params) => ({
        url: '/api/v1/kpi/rankings/summary',
        params,
      }),
      providesTags: ['KPI'],
    }),
    getKpiLeaderboard: builder.query<AppResponse<any>, { kpiType: string; startDate: string; endDate: string; region?: string; top?: number }>({
      query: (params) => ({
        url: '/api/v1/kpi/rankings/leaderboard',
        params,
      }),
      providesTags: ['KPI'],
    }),
    compareKpiRankings: builder.mutation<AppResponse<any>, RankingComparisonRequest>({
      query: (body) => ({
        url: '/api/v1/kpi/rankings/compare',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const {
  useGetKpiRankingsQuery,
  useGetKpiHistoryQuery,
  useGetKpiSummaryQuery,
  useGetKpiLeaderboardQuery,
  useCompareKpiRankingsMutation,
} = kpiApi;
```

Create `src/store/api/shipmentsApi.ts`:
```typescript
import { baseApi } from './baseApi';
import type { AppResponse, EscalatedTaskFilterDto, OrderDiversionFilterDto, OrderReroutingFilterDto } from '@/types/api';

export const shipmentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllShipments: builder.query<AppResponse<any>, { startDate: string; endDate: string; region?: string; status?: string; transporterSapId: string; page?: number; limit?: number }>({
      query: (params) => ({
        url: '/shipment/all',
        params,
      }),
      providesTags: ['Shipments'],
    }),
    getTodayShipments: builder.query<AppResponse<any>, { region?: string; status?: string; limit?: number; page?: number }>({
      query: (params) => ({
        url: '/shipment/all/today',
        params,
      }),
      providesTags: ['Shipments'],
    }),
    getEscalatedTasks: builder.query<AppResponse<any>, EscalatedTaskFilterDto>({
      query: (body) => ({
        url: '/task/escalated/filter',
        method: 'POST',
        body,
      }),
      providesTags: ['EscalatedTasks'],
    }),
    getDiversions: builder.query<AppResponse<any>, OrderDiversionFilterDto>({
      query: (body) => ({
        url: '/diversions/filter',
        method: 'POST',
        body,
      }),
      providesTags: ['Diversions'],
    }),
    getReroutings: builder.query<AppResponse<any>, OrderReroutingFilterDto>({
      query: (body) => ({
        url: '/reroutings/filter',
        method: 'POST',
        body,
      }),
      providesTags: ['Reroutings'],
    }),
  }),
});

export const {
  useGetAllShipmentsQuery,
  useGetTodayShipmentsQuery,
  useGetEscalatedTasksQuery,
  useGetDiversionsQuery,
  useGetReroutingsQuery,
} = shipmentsApi;
```

Create `src/store/api/fleetApi.ts`:
```typescript
import { baseApi } from './baseApi';
import type { AppResponse, AssetFilterDto } from '@/types/api';

export const fleetApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllAssets: builder.query<AppResponse<any>, AssetFilterDto>({
      query: (body) => ({
        url: '/trucks/getAllAssets',
        method: 'POST',
        body,
      }),
      providesTags: ['Fleet'],
    }),
    getTruckLocation: builder.query<AppResponse<any>, { longitude: number; latitude: number; isAfr?: boolean; radius?: string }>({
      query: ({ isAfr, radius, ...body }) => ({
        url: '/trucks/location',
        method: 'POST',
        body,
        params: { isAfr, radius },
      }),
      providesTags: ['Fleet'],
    }),
  }),
});

export const { useGetAllAssetsQuery, useGetTruckLocationQuery } = fleetApi;
```

Create `src/store/api/constantsApi.ts`:
```typescript
import { baseApi } from './baseApi';
import type { AppResponse } from '@/types/api';

export const constantsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTruckStatuses: builder.query<AppResponse<string[]>, void>({
      query: () => '/constants/truck-statuses',
      providesTags: ['Constants'],
    }),
    getShipmentStatuses: builder.query<AppResponse<string[]>, void>({
      query: () => '/constants/shipment-statuses',
      providesTags: ['Constants'],
    }),
    getShipmentCategories: builder.query<AppResponse<string[]>, void>({
      query: () => '/constants/shipment-categories',
      providesTags: ['Constants'],
    }),
    getEscalationTypes: builder.query<AppResponse<string[]>, void>({
      query: () => '/constants/escalation-types',
      providesTags: ['Constants'],
    }),
  }),
});

export const {
  useGetTruckStatusesQuery,
  useGetShipmentStatusesQuery,
  useGetShipmentCategoriesQuery,
  useGetEscalationTypesQuery,
} = constantsApi;
```

**Step 5: Create filters slice**

Create `src/store/slices/filtersSlice.ts`:
```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Region } from '@/types/api';

interface DateRange {
  startDate: string;
  endDate: string;
}

interface FiltersState {
  dateRange: DateRange;
  selectedRegion: Region | null;
  truckStatusFilter: string[];
  truckTypeFilter: string[];
}

const today = new Date();
const thirtyDaysAgo = new Date(today);
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

const initialState: FiltersState = {
  dateRange: {
    startDate: thirtyDaysAgo.toISOString().split('T')[0],
    endDate: today.toISOString().split('T')[0],
  },
  selectedRegion: null,
  truckStatusFilter: [],
  truckTypeFilter: [],
};

export const filtersSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    setDateRange: (state, action: PayloadAction<DateRange>) => {
      state.dateRange = action.payload;
    },
    setRegion: (state, action: PayloadAction<Region | null>) => {
      state.selectedRegion = action.payload;
    },
    setTruckStatusFilter: (state, action: PayloadAction<string[]>) => {
      state.truckStatusFilter = action.payload;
    },
    setTruckTypeFilter: (state, action: PayloadAction<string[]>) => {
      state.truckTypeFilter = action.payload;
    },
    resetFilters: () => initialState,
  },
});

export const { setDateRange, setRegion, setTruckStatusFilter, setTruckTypeFilter, resetFilters } = filtersSlice.actions;
```

**Step 6: Configure the store**

Create `src/store/index.ts`:
```typescript
import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { baseApi } from './api/baseApi';
import { authSlice } from './slices/authSlice';
import { filtersSlice } from './slices/filtersSlice';

export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    auth: authSlice.reducer,
    filters: filtersSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }).concat(baseApi.middleware),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

Create `src/hooks/useAppSelector.ts`:
```typescript
import { useSelector, useDispatch, TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from '@/store';

export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
export const useAppDispatch = () => useDispatch<AppDispatch>();
```

**Step 7: Verify types compile**

Run: `npx tsc --noEmit`

**Step 8: Commit**

```bash
git add -A && git commit -m "feat: add Redux store, RTK Query API layer, and TypeScript types"
```

---

## Task 4: Authentication Flow (Login, Forgot Password, Session Persistence)

**Files:**
- Create: `src/features/auth/AuthProvider.tsx`
- Create: `app/(auth)/_layout.tsx`
- Create: `app/(auth)/login.tsx`
- Create: `app/(auth)/forgot-password.tsx`
- Create: `app/(tabs)/_layout.tsx`
- Create: `app/_layout.tsx` (root layout with Redux provider + auth gate)
- Create: `app/index.tsx` (redirect based on auth state)
- Create: `src/utils/secureStorage.ts`

**Step 1: Create secure storage utility**

Create `src/utils/secureStorage.ts`:
```typescript
import * as SecureStore from 'expo-secure-store';

export const secureStorage = {
  async getToken(): Promise<string | null> {
    return SecureStore.getItemAsync('token');
  },
  async getRefreshToken(): Promise<string | null> {
    return SecureStore.getItemAsync('refreshToken');
  },
  async setTokens(token: string, refreshToken: string): Promise<void> {
    await SecureStore.setItemAsync('token', token);
    await SecureStore.setItemAsync('refreshToken', refreshToken);
  },
  async clearTokens(): Promise<void> {
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('refreshToken');
  },
  async setUser(user: object): Promise<void> {
    await SecureStore.setItemAsync('user', JSON.stringify(user));
  },
  async getUser<T>(): Promise<T | null> {
    const raw = await SecureStore.getItemAsync('user');
    return raw ? JSON.parse(raw) : null;
  },
  async clearAll(): Promise<void> {
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('refreshToken');
    await SecureStore.deleteItemAsync('user');
  },
};
```

**Step 2: Create AuthProvider**

Create `src/features/auth/AuthProvider.tsx`:
```typescript
import { useEffect } from 'react';
import { useAppDispatch } from '@/hooks/useAppSelector';
import { setCredentials, setLoading, logout } from '@/store/slices/authSlice';
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
        dispatch(logout());
      }
    })();
  }, [dispatch]);

  return <>{children}</>;
}
```

**Step 3: Create root layout with providers**

Create `app/_layout.tsx`:
```typescript
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { AuthProvider } from '@/features/auth/AuthProvider';

export default function RootLayout() {
  return (
    <Provider store={store}>
      <AuthProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </AuthProvider>
    </Provider>
  );
}
```

Create `app/index.tsx`:
```typescript
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
```

**Step 4: Create auth screens**

Create `app/(auth)/_layout.tsx`:
```typescript
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}
```

Create `app/(auth)/login.tsx`:
```typescript
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

  const onSubmit = async (data: LoginForm) => {
    try {
      const result = await login(data).unwrap();
      const { token, refreshToken, user } = result.data;
      await secureStorage.setTokens(token, refreshToken);
      await secureStorage.setUser(user);
      dispatch(setCredentials({ token, refreshToken, user }));
      router.replace('/(tabs)/dashboard');
    } catch {
      // error is handled by RTK Query error state
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
              {'data' in error ? (error.data as any)?.message ?? 'Login failed' : 'Network error'}
            </Text>
          )}

          <Button title="Sign In" onPress={handleSubmit(onSubmit)} loading={isLoading} fullWidth />

          <Button
            title="Forgot Password?"
            variant="ghost"
            onPress={() => router.push('/(auth)/forgot-password')}
            fullWidth
          />
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
  form: { gap: spacing.xs },
  apiError: {
    color: colors.danger, fontSize: fontSize.sm,
    textAlign: 'center', marginBottom: spacing.sm, padding: spacing.sm,
    backgroundColor: colors.dangerLight, borderRadius: 8,
  },
});
```

Create `app/(auth)/forgot-password.tsx` following the same pattern with email + transporter number fields.

**Step 5: Verify auth flow compiles**

Run: `npx tsc --noEmit`

**Step 6: Commit**

```bash
git add -A && git commit -m "feat: implement auth flow with login, forgot password, and session persistence"
```

---

## Task 5: Bottom Tab Navigation & Layout Shell

**Files:**
- Create: `app/(tabs)/_layout.tsx`
- Create: `app/(tabs)/dashboard.tsx` (placeholder)
- Create: `app/(tabs)/shipments.tsx` (placeholder)
- Create: `app/(tabs)/fleet.tsx` (placeholder)
- Create: `app/(tabs)/reports.tsx` (placeholder)
- Create: `app/(tabs)/more.tsx` (placeholder)
- Create: `src/components/layout/TabIcon.tsx`
- Create: `src/components/layout/ScreenHeader.tsx`

**Step 1: Create tab icon component**

Create `src/components/layout/TabIcon.tsx`:
```typescript
import { View, Text, StyleSheet } from 'react-native';
import { colors, fontSize, fontWeight, spacing } from '@/constants/theme';

interface TabIconProps {
  name: string;
  label: string;
  focused: boolean;
  badge?: number;
}

// Using text-based icons (we'll use simple unicode or initials since we avoid icon libraries)
// Alternative: install @expo/vector-icons which comes with Expo
const iconMap: Record<string, string> = {
  dashboard: '\u25A0', // square
  shipments: '\u25B6', // triangle
  fleet: '\u2B24',     // circle
  reports: '\u25C6',   // diamond
  more: '\u2261',      // hamburger
};

export function TabIcon({ name, label, focused, badge }: TabIconProps) {
  return (
    <View style={styles.container}>
      <Text style={[styles.icon, focused && styles.iconFocused]}>
        {iconMap[name] ?? '\u25CB'}
      </Text>
      {badge != null && badge > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', position: 'relative' },
  icon: { fontSize: 20, color: colors.textTertiary },
  iconFocused: { color: colors.primary },
  badge: {
    position: 'absolute', top: -4, right: -10,
    backgroundColor: colors.danger, borderRadius: 8,
    minWidth: 16, height: 16,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: fontWeight.bold },
});
```

**Step 2: Create tabs layout**

Create `app/(tabs)/_layout.tsx`:
```typescript
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontWeight } from '@/constants/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 88,
          paddingBottom: 24,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontWeight: fontWeight.medium,
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="shipments"
        options={{
          title: 'Shipments',
          tabBarIcon: ({ color, size }) => <Ionicons name="cube-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="fleet"
        options={{
          title: 'Fleet',
          tabBarIcon: ({ color, size }) => <Ionicons name="car-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Reports',
          tabBarIcon: ({ color, size }) => <Ionicons name="bar-chart-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ color, size }) => <Ionicons name="ellipsis-horizontal" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
```

**Step 3: Create ScreenHeader component**

Create `src/components/layout/ScreenHeader.tsx`:
```typescript
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, fontSize, fontWeight } from '@/constants/theme';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  rightAction?: React.ReactNode;
}

export function ScreenHeader({ title, subtitle, rightAction }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {rightAction}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  textContainer: { flex: 1 },
  title: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.textPrimary },
  subtitle: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
});
```

**Step 4: Create placeholder tab screens**

Create each tab screen with basic placeholder content. Example `app/(tabs)/dashboard.tsx`:
```typescript
import { View, Text, StyleSheet } from 'react-native';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { colors } from '@/constants/theme';

export default function DashboardScreen() {
  return (
    <View style={styles.container}>
      <ScreenHeader title="Dashboard" subtitle="Overview of your operations" />
      <View style={styles.content}>
        <Text>Dashboard content coming next...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, padding: 16 },
});
```

Repeat for shipments.tsx, fleet.tsx, reports.tsx, more.tsx with appropriate titles.

**Step 5: Test the navigation**

Run: `npx expo start`
Expected: App loads, shows login screen. After mock login would navigate to tab bar with 5 tabs.

**Step 6: Commit**

```bash
git add -A && git commit -m "feat: add bottom tab navigation with layout shell and placeholder screens"
```

---

## Task 6: Dashboard Screen (Comprehensive Metrics)

**Files:**
- Modify: `app/(tabs)/dashboard.tsx`
- Create: `src/features/dashboard/DashboardMetricsGrid.tsx`
- Create: `src/features/dashboard/OperationalSummary.tsx`
- Create: `src/features/dashboard/QuickActions.tsx`
- Create: `src/hooks/useTransporterNumber.ts`
- Create: `src/components/charts/KpiGauge.tsx`

**Step 1: Create transporter number hook**

Create `src/hooks/useTransporterNumber.ts`:
```typescript
import { useAppSelector } from './useAppSelector';

export function useTransporterNumber(): string {
  const user = useAppSelector((s) => s.auth.user);
  return user?.transporterNumber ?? '';
}
```

**Step 2: Build DashboardMetricsGrid**

Create `src/features/dashboard/DashboardMetricsGrid.tsx`:
```typescript
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { MetricCard } from '@/components/ui';
import { useGetComprehensiveDashboardQuery } from '@/store/api/dashboardApi';
import { useTransporterNumber } from '@/hooks/useTransporterNumber';
import { useAppSelector } from '@/hooks/useAppSelector';
import { colors, spacing } from '@/constants/theme';

export function DashboardMetricsGrid() {
  const transporterNumber = useTransporterNumber();
  const { startDate, endDate } = useAppSelector((s) => s.filters.dateRange);

  const { data, isLoading, refetch, isFetching } = useGetComprehensiveDashboardQuery(
    { transporterNumber, startDate, endDate },
    { skip: !transporterNumber, pollingInterval: 30_000 },
  );

  const metrics = data?.data;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={colors.primary} />}
    >
      <View style={styles.grid}>
        <MetricCard title="Total Trucks" value={metrics?.totalTrucks ?? '-'} color={colors.primary} />
        <MetricCard title="Active Trips" value={metrics?.activeTrips ?? '-'} color={colors.success} />
        <MetricCard title="Trucks Loaded" value={metrics?.trucksLoaded ?? '-'} color={colors.warning} />
        <MetricCard title="At Customer" value={metrics?.atCustomer ?? '-'} color="#8B5CF6" />
        <MetricCard title="Not Tracking" value={metrics?.notTracking ?? '-'} color={colors.danger} />
        <MetricCard title="In Transit" value={metrics?.inTransit ?? '-'} color={colors.primary} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.base,
    gap: spacing.md,
  },
});
```

**Step 3: Build OperationalSummary**

Create `src/features/dashboard/OperationalSummary.tsx` showing operational KPIs from `/api/transporter-dashboard/operational`, rendering a summary card per KPI type with color-coded status (green/amber/red).

**Step 4: Build QuickActions**

Create `src/features/dashboard/QuickActions.tsx` with navigation shortcuts to key screens (Escalated Tasks, Fleet Map, Today's Shipments).

**Step 5: Assemble the dashboard screen**

Modify `app/(tabs)/dashboard.tsx` to compose: ScreenHeader → DashboardMetricsGrid → OperationalSummary → QuickActions in a scrollable view.

**Step 6: Verify data loads**

Run app, login, verify dashboard renders with real API data or skeleton loaders.

**Step 7: Commit**

```bash
git add -A && git commit -m "feat: implement dashboard screen with comprehensive metrics grid and operational summary"
```

---

## Task 7: Visibility Reports Screens

**Files:**
- Modify: `app/(tabs)/reports.tsx` → make it a report list/picker
- Create: `app/(tabs)/reports/index.tsx` (report type selector)
- Create: `app/(tabs)/reports/truck-visibility.tsx`
- Create: `app/(tabs)/reports/customer-visibility.tsx`
- Create: `app/(tabs)/reports/depot-visibility.tsx`
- Create: `app/(tabs)/reports/location-visibility.tsx`
- Create: `app/(tabs)/reports/no-go-zone.tsx`
- Create: `src/features/visibility/VisibilityFilters.tsx`
- Create: `src/features/visibility/VisibilityDataTable.tsx`
- Create: `src/features/visibility/useVisibilityFilter.ts`

**Step 1: Create visibility filter hook**

Create `src/features/visibility/useVisibilityFilter.ts`:
```typescript
import { useMemo } from 'react';
import { useAppSelector } from '@/hooks/useAppSelector';
import { useTransporterNumber } from '@/hooks/useTransporterNumber';
import type { VisibilityFilterDto } from '@/types/api';

export function useVisibilityFilter(overrides?: Partial<VisibilityFilterDto>): VisibilityFilterDto {
  const transporterNumber = useTransporterNumber();
  const { selectedRegion, truckStatusFilter, truckTypeFilter } = useAppSelector((s) => s.filters);

  return useMemo(() => ({
    transporterSapId: [transporterNumber],
    region: selectedRegion ? [selectedRegion] : undefined,
    truckStatus: truckStatusFilter.length > 0 ? truckStatusFilter : undefined,
    truckType: truckTypeFilter.length > 0 ? truckTypeFilter : undefined,
    ...overrides,
  }), [transporterNumber, selectedRegion, truckStatusFilter, truckTypeFilter, overrides]);
}
```

**Step 2: Create VisibilityFilters component**

Create `src/features/visibility/VisibilityFilters.tsx` with FilterChip rows for region, truck status, truck type, MDD/Bulk toggles. Dispatches to filtersSlice.

**Step 3: Create report type selector**

Convert `app/(tabs)/reports.tsx` to a Stack layout, create `app/(tabs)/reports/index.tsx` listing all visibility report types as tappable cards, each navigating to its respective screen.

**Step 4: Create truck visibility screen**

Create `app/(tabs)/reports/truck-visibility.tsx`:
```typescript
import { View, FlatList, StyleSheet, Text } from 'react-native';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { VisibilityFilters } from '@/features/visibility/VisibilityFilters';
import { Card, StatusBadge } from '@/components/ui';
import { useGetTruckVisibilityQuery } from '@/store/api/visibilityApi';
import { useVisibilityFilter } from '@/features/visibility/useVisibilityFilter';
import { colors, spacing, fontSize, fontWeight } from '@/constants/theme';

export default function TruckVisibilityScreen() {
  const filter = useVisibilityFilter();
  const { data, isLoading, refetch } = useGetTruckVisibilityQuery(filter, { skip: !filter.transporterSapId?.[0] });

  const items = data?.data ?? [];

  return (
    <View style={styles.container}>
      <ScreenHeader title="Truck Visibility" subtitle="Fleet visibility by time range" />
      <VisibilityFilters />
      <FlatList
        data={items}
        keyExtractor={(item, index) => item.truckPlate ?? String(index)}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.plate}>{item.truckPlate}</Text>
              <StatusBadge label={item.status ?? 'Unknown'} status={mapTruckStatus(item.status)} />
            </View>
            <Text style={styles.detail}>Location: {item.location ?? 'N/A'}</Text>
            <Text style={styles.detail}>Duration: {item.duration ?? 'N/A'}</Text>
          </Card>
        )}
        contentContainerStyle={styles.list}
        refreshing={isLoading}
        onRefresh={refetch}
      />
    </View>
  );
}

function mapTruckStatus(status?: string): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
  if (!status) return 'neutral';
  const s = status.toUpperCase();
  if (s.includes('TRANSIT') || s.includes('LOADED')) return 'info';
  if (s.includes('CUSTOMER') || s.includes('OFFLOAD')) return 'success';
  if (s.includes('NOT_TRACKING') || s.includes('IDLE')) return 'danger';
  return 'warning';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.base, gap: spacing.md },
  card: { padding: spacing.base },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  plate: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colors.textPrimary },
  detail: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
});
```

**Step 5: Create remaining visibility screens**

Create customer-visibility.tsx, depot-visibility.tsx, location-visibility.tsx, no-go-zone.tsx following the same pattern, each using the appropriate RTK Query hook.

**Step 6: Verify reports navigation and data loading**

Run app, navigate to Reports tab, select each report type, verify filters work and data loads.

**Step 7: Commit**

```bash
git add -A && git commit -m "feat: implement visibility report screens with filters for truck, customer, depot, location, and no-go zone"
```

---

## Task 8: KPI Metrics & Rankings Screen

**Files:**
- Create: `app/(tabs)/dashboard/kpi.tsx` (or accessible from dashboard)
- Create: `src/features/kpi/KpiOverview.tsx`
- Create: `src/features/kpi/KpiHistoryChart.tsx`
- Create: `src/features/kpi/KpiLeaderboard.tsx`
- Create: `src/components/charts/LineChart.tsx`

**Step 1: Create KPI overview component**

Create `src/features/kpi/KpiOverview.tsx` that uses `useGetKpiRankingsQuery` and `useGetKpiSummaryQuery` to display:
- Overall ranking position
- Per-KPI type scores as color-coded metric cards
- Trend indicators

**Step 2: Create KPI history chart**

Create `src/features/kpi/KpiHistoryChart.tsx` using react-native-chart-kit's LineChart, fed by `useGetKpiHistoryQuery`. Allow selecting different KPI types via segmented control.

**Step 3: Create leaderboard component**

Create `src/features/kpi/KpiLeaderboard.tsx` using `useGetKpiLeaderboardQuery`. Show top transporters ranked for selected KPI type with the current transporter highlighted.

**Step 4: Create KPI screen**

Create the KPI screen composing: ScreenHeader → KpiOverview → KpiHistoryChart → KpiLeaderboard in a scrollable view. Integrate date range picker from filtersSlice.

**Step 5: Verify KPI data renders**

Run app, navigate to KPI section, verify charts render and leaderboard shows data.

**Step 6: Commit**

```bash
git add -A && git commit -m "feat: implement KPI metrics screen with rankings, history charts, and leaderboard"
```

---

## Task 9: Shipments Screen (All, Escalated, Reroutings, Diversions)

**Files:**
- Restructure: `app/(tabs)/shipments.tsx` → Stack layout
- Create: `app/(tabs)/shipments/index.tsx` (all shipments with segment picker)
- Create: `app/(tabs)/shipments/[id].tsx` (shipment detail)
- Create: `src/features/shipments/ShipmentList.tsx`
- Create: `src/features/shipments/ShipmentCard.tsx`
- Create: `src/features/shipments/EscalatedTasksList.tsx`
- Create: `src/features/shipments/DiversionsList.tsx`
- Create: `src/features/shipments/ReroutingsList.tsx`
- Create: `src/features/shipments/ShipmentSegmentPicker.tsx`

**Step 1: Create shipment card component**

Create `src/features/shipments/ShipmentCard.tsx` showing: logon number, truck plate, status badge, origin → destination, dispatch date. Tappable to navigate to detail.

**Step 2: Create segment picker**

Create `src/features/shipments/ShipmentSegmentPicker.tsx`:
```typescript
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';

type Segment = 'all' | 'escalated' | 'reroutings' | 'diversions';

interface Props {
  selected: Segment;
  onSelect: (segment: Segment) => void;
  counts?: Record<Segment, number>;
}

const segments: { key: Segment; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'escalated', label: 'Escalated' },
  { key: 'reroutings', label: 'Rerouted' },
  { key: 'diversions', label: 'Diverted' },
];

export function ShipmentSegmentPicker({ selected, onSelect, counts }: Props) {
  return (
    <View style={styles.container}>
      {segments.map(({ key, label }) => (
        <TouchableOpacity
          key={key}
          style={[styles.segment, selected === key && styles.segmentActive]}
          onPress={() => onSelect(key)}
        >
          <Text style={[styles.label, selected === key && styles.labelActive]}>
            {label}
            {counts?.[key] != null ? ` (${counts[key]})` : ''}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.md,
    padding: 3,
    marginHorizontal: spacing.base,
    marginVertical: spacing.sm,
  },
  segment: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: colors.surface,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 2,
  },
  label: { fontSize: fontSize.xs, fontWeight: fontWeight.medium, color: colors.textSecondary },
  labelActive: { color: colors.primary, fontWeight: fontWeight.semibold },
});
```

**Step 3: Create shipment list components**

Create `src/features/shipments/ShipmentList.tsx` using `useGetAllShipmentsQuery` with pagination (infinite scroll via `page` param). Filters by transporter SAP ID.

Create `src/features/shipments/EscalatedTasksList.tsx` using `useGetEscalatedTasksQuery` with `transporterSapIds` filter.

Create `src/features/shipments/DiversionsList.tsx` using `useGetDiversionsQuery` with `transporters` filter.

Create `src/features/shipments/ReroutingsList.tsx` using `useGetReroutingsQuery` with `transporters` filter.

**Step 4: Assemble shipments index screen**

Create `app/(tabs)/shipments/index.tsx` that renders ShipmentSegmentPicker and conditionally renders the appropriate list based on selected segment.

**Step 5: Create shipment detail screen**

Create `app/(tabs)/shipments/[id].tsx` showing full shipment details, timeline of status changes, and map showing route.

**Step 6: Verify shipment flows**

Run app, verify all 4 segments load, pagination works, detail navigation works.

**Step 7: Commit**

```bash
git add -A && git commit -m "feat: implement shipments screen with all, escalated, reroutings, and diversions segments"
```

---

## Task 10: Fleet Management Screen with Map

**Files:**
- Restructure: `app/(tabs)/fleet.tsx` → Stack layout
- Create: `app/(tabs)/fleet/index.tsx` (fleet list + map toggle)
- Create: `app/(tabs)/fleet/[truckPlate].tsx` (truck detail)
- Create: `src/features/fleet/FleetMap.tsx`
- Create: `src/features/fleet/FleetList.tsx`
- Create: `src/features/fleet/TruckCard.tsx`

**Step 1: Create TruckCard component**

Create `src/features/fleet/TruckCard.tsx` showing: truck plate, truck type badge, status badge, current location, transporter number. Tappable for detail.

**Step 2: Create FleetList component**

Create `src/features/fleet/FleetList.tsx` using `useGetAllAssetsQuery` with `AssetFilterDto.transporterNumber`. Renders list of TruckCards. Includes search bar to filter by plate locally.

**Step 3: Create FleetMap component**

Create `src/features/fleet/FleetMap.tsx`:
```typescript
import { View, StyleSheet } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useGetAllAssetsQuery } from '@/store/api/fleetApi';
import { useTransporterNumber } from '@/hooks/useTransporterNumber';
import { APP_CONFIG } from '@/constants/config';
import { colors } from '@/constants/theme';

export function FleetMap() {
  const transporterNumber = useTransporterNumber();
  const { data } = useGetAllAssetsQuery(
    { transporterNumber },
    { skip: !transporterNumber, pollingInterval: APP_CONFIG.pollingIntervalMs },
  );

  const trucks = data?.data ?? [];

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={APP_CONFIG.mapDefaultRegion}
        showsUserLocation
      >
        {trucks
          .filter((t: any) => t.latitude && t.longitude)
          .map((truck: any) => (
            <Marker
              key={truck.truckPlate}
              coordinate={{ latitude: truck.latitude, longitude: truck.longitude }}
              title={truck.truckPlate}
              description={truck.status}
              pinColor={truck.status === 'NOT_TRACKING' ? colors.danger : colors.primary}
            />
          ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
});
```

**Step 4: Create fleet index screen with list/map toggle**

Create `app/(tabs)/fleet/index.tsx` with a toggle button to switch between list and map views.

**Step 5: Create truck detail screen**

Create `app/(tabs)/fleet/[truckPlate].tsx` showing truck details, recent trips, current status, and a small map with the truck's location.

**Step 6: Verify fleet features**

Run app, verify fleet list loads, map shows markers, toggle works, truck detail navigation works.

**Step 7: Commit**

```bash
git add -A && git commit -m "feat: implement fleet management screen with list view, map view, and truck details"
```

---

## Task 11: Push Notifications Setup

**Files:**
- Create: `src/services/notifications.ts`
- Create: `src/hooks/useNotifications.ts`
- Modify: `app/_layout.tsx` (register notifications on boot)

**Step 1: Create notification service**

Create `src/services/notifications.ts`:
```typescript
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn('Push notifications require a physical device');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const token = await Notifications.getExpoPushTokenAsync();
  return token.data;
}
```

**Step 2: Create notification hook**

Create `src/hooks/useNotifications.ts` that registers on mount, listens for incoming notifications, and navigates to relevant screen (e.g., shipment detail on escalation notification).

**Step 3: Integrate into root layout**

Add notification registration to `app/_layout.tsx` after auth is resolved.

**Step 4: Commit**

```bash
git add -A && git commit -m "feat: set up push notifications with expo-notifications"
```

---

## Task 12: "More" Tab (Profile, Settings, Logout)

**Files:**
- Create: `app/(tabs)/more/index.tsx`
- Create: `app/(tabs)/more/profile.tsx`
- Create: `app/(tabs)/more/settings.tsx`
- Create: `src/features/profile/ProfileCard.tsx`

**Step 1: Create More menu screen**

Create `app/(tabs)/more/index.tsx` with menu items:
- Profile (transporter info)
- Settings (notification preferences)
- About
- Sign Out (dispatches logout, clears SecureStore, redirects to login)

**Step 2: Create Profile screen**

Create `app/(tabs)/more/profile.tsx` showing transporter details from auth state: name, email, transporter number, SAP ID.

**Step 3: Create Settings screen**

Create `app/(tabs)/more/settings.tsx` with toggle for notification preferences, data refresh interval.

**Step 4: Commit**

```bash
git add -A && git commit -m "feat: implement more tab with profile, settings, and logout"
```

---

## Task 13: Polish, Error Handling & Loading States

**Files:**
- Create: `src/components/ui/ErrorBoundary.tsx`
- Create: `src/components/ui/NetworkAlert.tsx`
- Modify: All screen files to add proper loading/error/empty states
- Create: `src/hooks/useNetworkStatus.ts`

**Step 1: Create error boundary**

Create `src/components/ui/ErrorBoundary.tsx` wrapping children with try/catch and a fallback UI.

**Step 2: Create network alert**

Create `src/components/ui/NetworkAlert.tsx` that shows a banner when offline (using NetInfo).

**Step 3: Add SkeletonLoader to all screens**

Go through each screen and replace bare loading spinners with skeleton loaders matching the card layouts.

**Step 4: Add EmptyState to all list screens**

Add meaningful empty state messages and illustrations to all FlatList components.

**Step 5: Verify error states**

Test with airplane mode, expired tokens, server errors. Verify graceful handling.

**Step 6: Commit**

```bash
git add -A && git commit -m "feat: add error boundaries, network alerts, skeleton loaders, and empty states"
```

---

## Task 14: Final Integration Testing & Build Verification

**Step 1: Run TypeScript type check**

Run: `npx tsc --noEmit`
Expected: No errors.

**Step 2: Run Expo build check**

Run: `npx expo-doctor`
Expected: No critical issues.

**Step 3: Test on iOS Simulator**

Run: `npx expo run:ios`
Expected: App launches, login works, all tabs load, navigation works.

**Step 4: Test on Android Emulator**

Run: `npx expo run:android`
Expected: Same as iOS.

**Step 5: Final commit**

```bash
git add -A && git commit -m "chore: final integration testing and build verification for Phase 1"
```

---

## Phase 2 (Future - Not in this plan)

These features will be planned separately after Phase 1 is stable:

1. **Backhaul Info** — `POST /assignment/filter`, `POST /orders/filter/backhaul`, `GET /assignment/all/transporter`
2. **Incentives** — `GET /incentive/report/transporter`, `GET /incentive/logs/transporter`, `GET /incentive/milestones/outstanding`
3. **Complaints/Feedback** — `POST /complaints`, `GET /complaints/user/my-complaints`, `POST /complaints/statistics`
4. **Insurance/Bonds** — `GET /insurance-bonds/transporter`, `GET /insurance-bonds/expiring`, `GET /insurance-bonds/expired`

---

## Summary

| Task | Description | Key Deliverable |
|------|-------------|-----------------|
| 1 | Project scaffolding | Expo + TypeScript + deps + folder structure |
| 2 | Design system | Theme + 10 core UI components |
| 3 | Redux + RTK Query | Store, auth slice, 7 API slice files, types |
| 4 | Auth flow | Login, forgot password, session persistence |
| 5 | Tab navigation | 5-tab bottom bar with layouts |
| 6 | Dashboard | Comprehensive metrics, operational summary |
| 7 | Visibility reports | 5+ report types with filters |
| 8 | KPI metrics | Rankings, history charts, leaderboard |
| 9 | Shipments | All/escalated/rerouting/diversions with detail |
| 10 | Fleet management | List view, map view, truck details |
| 11 | Notifications | Push notification registration + handling |
| 12 | More tab | Profile, settings, logout |
| 13 | Polish | Error handling, loading states, empty states |
| 14 | Integration test | Type check, build verification, platform test |
