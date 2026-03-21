import { useState } from 'react';

const INITIAL_FORM = {
  // step 1
  city: '',
  lat: null,
  lon: null,
  weather: null,
  // step 2
  name: '',
  area: '',
  floors: '1',
  orientation: 'N',
  // step 3
  wallType: 'brick',
  roofType: 'rcc',
  wwr: 30,
  // step 4
  passiveStrategies: [],
};

export const useProjectForm = () => {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [currentStep, setCurrentStep] = useState(1);

  const updateStep = (stepData) => {
    setFormData((prev) => ({ ...prev, ...stepData }));
  };

  const setStep = (step) => setCurrentStep(step);

  const resetForm = () => {
    setFormData(INITIAL_FORM);
    setCurrentStep(1);
  };

  return { formData, currentStep, setStep, updateStep, resetForm };
};