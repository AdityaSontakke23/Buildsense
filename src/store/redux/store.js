import { configureStore } from '@reduxjs/toolkit';
import formReducer from './formSlice';

export const reduxStore = configureStore({
  reducer: {
    newProjectForm: formReducer,
  },
});