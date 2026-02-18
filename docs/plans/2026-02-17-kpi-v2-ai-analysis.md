# KPI v2 + AI Analysis Plan

## Context
The existing KPI breakdown screen (`kpi-breakdown.tsx`) uses hooks (`useGetTransporterKpiSummaryQuery`, `useGetTransporterKpiTrendCustomQuery`) that don't exist in `kpiApi.ts` — so the breakdown is currently broken. This plan wires in the new `POST /kpi/v2/metrics/aggregated` endpoint and adds an AI-powered analysis feature that sends the aggregated KPI data to a custom backend AI endpoint and displays insights to the user.

## Confirmed Data Structure

**`POST /kpi/v2/metrics/aggregated`** returns 35 KPI metrics:
```json
{
  "result": {
    "kpiMetrics": {
      "otd": { "actual": 90.24, "expected": 0.0, "variance": 0.0, "unitOfMeasurement": "%", "kpiDescription": "On-Time Delivery...", "formula": "...", "rankings": {"1":"N/A","7":"N/A","30":"N/A"} },
      "violationRate": { "actual": 0.76, "unitOfMeasurement": "Per 1000 KM", ... },
      "skmd": { "actual": 90.73, "unitOfMeasurement": "%", ... }
      // + 32 more metrics: backhaulVolume, totalSafetyScore, availability, totalFreightCost,
      // otdCount, freightCostPerTon, averagePayload, highRiskDrivers, totalTrips,
      // timeOutCount, averageDistance, totalTimeOut, totalTrucks, hrd, totalPayload,
      // totalDistance, rta, redDrivers, volumeMoved, timeInCount, tripsPerTruck,
      // fatalIncidents, totalDrivers, ti, totalTimeIn, totalCico,
      // averageDistancePerTrip, to, averageScoreCard, backhaulCount,
      // payloadCount, greenDriversKm
    }
  }
}
```

Request body (`KpiFilterDto`): `{ startDate, endDate, transporterNumbers?, regions?, completedTripsOnly?, minVolume?, maxVolume? }`

---

## Implementation Steps

### 1. Add Types — `src/types/api.ts`
Add after existing KPI types:

```typescript
export interface KpiMetricDetail {
  actual: number | null;
  expected: number;
  variance: number;
  unitOfMeasurement: string;
  kpiDescription: string;
  formula: string;
  rankings: { '1': string; '7': string; '30': string };
}

export interface KpiV2AggregatedResult {
  kpiMetrics: Record<string, KpiMetricDetail>;
}

export interface KpiFilterDto {
  startDate: string;
  endDate: string;
  transporterNumbers?: string[];
  regions?: string[];
  customerCodes?: string[];
  productCodes?: string[];
  completedTripsOnly?: boolean;
  minVolume?: number;
  maxVolume?: number;
}

export interface KpiAnalysisMetric {
  name: string;
  description: string;
  actual: number;
  expected: number;
  variance: number;
  unit: string;
}

export interface KpiAnalysisRequest {
  transporterNumber: string;
  startDate: string;
  endDate: string;
  metrics: KpiAnalysisMetric[];
}

// Flexible — shape TBD based on AI endpoint response
export interface KpiAnalysisResult {
  analysis?: string;
  insights?: string[];
  recommendations?: string[];
  [key: string]: unknown;
}
```

---

### 2. Add Config — `src/constants/config.ts`
Add AI endpoint config (env-driven):
```typescript
export const AI_INSIGHTS_URL = process.env.EXPO_PUBLIC_AI_INSIGHTS_URL ?? '';
export const AI_INSIGHTS_API_KEY = process.env.EXPO_PUBLIC_AI_INSIGHTS_API_KEY ?? '';
```

Also add to `.env`:
```
EXPO_PUBLIC_AI_INSIGHTS_URL=<ai_endpoint_url>
EXPO_PUBLIC_AI_INSIGHTS_API_KEY=<api_key>
```

---

### 3. Wire Endpoints — `src/store/api/kpiApi.ts`
Add two endpoints inside `injectEndpoints`:

**a) `getKpiV2Aggregated`** — POST wrapped as a cached query (RTK Query deduplicates by args):
```typescript
getKpiV2Aggregated: builder.query<AppResponse<KpiV2AggregatedResult>, KpiFilterDto>({
  queryFn: async (args, _api, _extra, baseQuery) => {
    const result = await baseQuery({
      url: '/kpi/v2/metrics/aggregated',
      method: 'POST',
      body: args,
    });
    return result.error
      ? { error: result.error as FetchBaseQueryError }
      : { data: result.data as AppResponse<KpiV2AggregatedResult> };
  },
  providesTags: ['KPI'],
}),
```

**b) `analyzeKpiMetrics`** — mutation, calls the AI endpoint with its own API key (not the app JWT):
```typescript
analyzeKpiMetrics: builder.mutation<AppResponse<KpiAnalysisResult>, KpiAnalysisRequest>({
  queryFn: async (args) => {
    try {
      const res = await fetch(AI_INSIGHTS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': AI_INSIGHTS_API_KEY,
        },
        body: JSON.stringify(args),
      });
      const data = await res.json();
      return { data };
    } catch (e) {
      return { error: { status: 'FETCH_ERROR', error: String(e) } as FetchBaseQueryError };
    }
  },
}),
```

Export: `useGetKpiV2AggregatedQuery`, `useAnalyzeKpiMetricsMutation`

---

### 4. Fix `KpiBreakdownSummary.tsx` — `src/features/kpi/KpiBreakdownSummary.tsx`
- Replace broken `useGetTransporterKpiSummaryQuery` with `useGetKpiV2AggregatedQuery`
- New query args: `{ startDate, endDate, transporterNumbers: [transporterNumber] }`
- Map `result.kpiMetrics` (Record<string, KpiMetricDetail>) to display rows
- The existing rendering logic (`getMetricValue`, `getExpectedValue`, `getVarianceValue`) already handles the `actual`/`expected`/`variance` shape — minimal changes needed

---

### 5. Create `KpiAiInsights.tsx` — `src/features/kpi/KpiAiInsights.tsx`
New component, added below `KpiBreakdownTrend` on the breakdown screen.

**Computational optimization strategy:**
| Optimization | How |
|---|---|
| No double-fetch | `useGetKpiV2AggregatedQuery` with same args as `KpiBreakdownSummary` → RTK Query serves cached result |
| Lean AI payload | `useMemo`: filter nulls (35→~20 metrics), sort by deviation, strip `formula`/`rankings` |
| On-demand only | AI call is user-triggered mutation — never auto-fired on load |
| Single AI call | All 20 metrics in one request — no per-metric calls |
| No Redux overhead | AI response lives in mutation state (local component) |

**Preprocessing logic (inside `useMemo`):**
```typescript
const analysisPayload = useMemo((): KpiAnalysisMetric[] => {
  const metrics = aggregatedData?.result?.kpiMetrics ?? {};
  return Object.entries(metrics)
    .filter(([, v]) => v.actual !== null)            // drop nulls
    .map(([name, v]) => ({
      name,
      description: v.kpiDescription,
      actual: v.actual!,
      expected: v.expected,
      variance: v.actual! - v.expected,
      unit: v.unitOfMeasurement,
    }))
    .sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance)); // biggest gaps first
}, [aggregatedData]);
```

**UI flow:**
```
[Analyze Performance with AI]  ← button, disabled while loading
      ↓
"Analyzing your KPI data..."  ← ActivityIndicator
      ↓
Card:
  - Analysis paragraph (analysis field)
  - Insights list (insights[] with bullet points)
  - Recommendations list (recommendations[] with bullet points)
```

---

### 6. Update `kpi-breakdown.tsx` — `app/(tabs)/reports/kpi-breakdown.tsx`
Add `<KpiAiInsights />` at the bottom of the `ScrollView`, after `<KpiBreakdownTrend />`.

---

## Files Summary

| File | Action |
|---|---|
| `src/types/api.ts` | Add 6 new interfaces |
| `src/constants/config.ts` | Add AI config constants |
| `.env` | Add `EXPO_PUBLIC_AI_INSIGHTS_URL` + `EXPO_PUBLIC_AI_INSIGHTS_API_KEY` |
| `src/store/api/kpiApi.ts` | Add 2 endpoints, export 2 hooks |
| `src/features/kpi/KpiBreakdownSummary.tsx` | Fix broken hook → `useGetKpiV2AggregatedQuery` |
| `src/features/kpi/KpiAiInsights.tsx` | **New file** — AI analysis component |
| `app/(tabs)/reports/kpi-breakdown.tsx` | Add `<KpiAiInsights />` |

## Blockers Before Implementation
1. **AI endpoint URL + key** — need `EXPO_PUBLIC_AI_INSIGHTS_URL` and `EXPO_PUBLIC_AI_INSIGHTS_API_KEY` values
2. **AI response shape** — `KpiAnalysisResult` is flexible until we see a real response; rendering will defensively handle whatever comes back
