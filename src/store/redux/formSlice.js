import { createSlice } from '@reduxjs/toolkit';

const INITIAL_FORM = {
  // Step 1
  city: '',
  lat: null,
  lon: null,
  weather: null,
  // Step 2
  name: '',
  area: '',
  floors: '1',
  orientation: 'N',
  // Step 3
  wallType: 'brick',
  roofType: 'rcc',
  wwr: 30,
  // Step 4
  passiveStrategies: [],
};

const formSlice = createSlice({
  name: 'newProjectForm',
  initialState: INITIAL_FORM,
  reducers: {
    updateForm: (state, action) => {
      return { ...state, ...action.payload };
    },
    toggleStrategy: (state, action) => {
      const id = action.payload;
      const exists = state.passiveStrategies.includes(id);
      state.passiveStrategies = exists
        ? state.passiveStrategies.filter((s) => s !== id)
        : [...state.passiveStrategies, id];
    },
    resetForm: () => INITIAL_FORM,
  },
});

export const { updateForm, toggleStrategy, resetForm } = formSlice.actions;
export default formSlice.reducer;