import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface DateRange {
  startDate: string;
  endDate: string;
}

interface FiltersState {
  dateRange: DateRange;
  selectedRegion: string;
  truckStatusFilter: string[];
  truckTypeFilter: string[];
}

function getLast30Days(): DateRange {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  };
}

const initialState: FiltersState = {
  dateRange: getLast30Days(),
  selectedRegion: 'ALL',
  truckStatusFilter: [],
  truckTypeFilter: [],
};

const filtersSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    setDateRange(state, action: PayloadAction<DateRange>) {
      state.dateRange = action.payload;
    },
    setRegion(state, action: PayloadAction<string>) {
      state.selectedRegion = action.payload;
    },
    setTruckStatusFilter(state, action: PayloadAction<string[]>) {
      state.truckStatusFilter = action.payload;
    },
    setTruckTypeFilter(state, action: PayloadAction<string[]>) {
      state.truckTypeFilter = action.payload;
    },
    resetFilters(state) {
      const defaults = getLast30Days();
      state.dateRange = defaults;
      state.selectedRegion = 'ALL';
      state.truckStatusFilter = [];
      state.truckTypeFilter = [];
    },
  },
});

export const { setDateRange, setRegion, setTruckStatusFilter, setTruckTypeFilter, resetFilters } =
  filtersSlice.actions;
export default filtersSlice.reducer;
