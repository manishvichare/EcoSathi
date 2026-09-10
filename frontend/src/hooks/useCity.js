import { useContext } from 'react';
import { CityContext } from '../context/CityContext';

/**
 * useCity Hook
 * 
 * Custom hook that provides access to city selection from CityContext.
 * Makes it easy for components to get and change the selected city.
 * 
 * Returns:
 * - selectedCity: Current city name (string)
 * - changeCity: Function to change selected city
 * 
 * Example usage:
 * const { selectedCity, changeCity } = useCity();
 */
export function useCity() {
  const context = useContext(CityContext);

  // Error handling - ensure hook is used inside CityProvider
  if (!context) {
    throw new Error('useCity must be used within CityProvider');
  }

  return {
    selectedCity: context.selectedCity,
    cityData: context.cityData,
    loading: context.loading,
    fullLoading: context.fullLoading, // Phase 2: health score / green cover still loading
    error: context.error,
    changeCity: context.changeCity,
    refetchCityData: context.refetchCityData,
  };
}