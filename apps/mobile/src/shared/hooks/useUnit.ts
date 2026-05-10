import { useCallback } from 'react';
import { usePreferences } from '../../features/preferences/context/PreferencesContext';

const KG_TO_LB = 2.20462;

export function useUnit() {
  const { preferences: { unitSystem } } = usePreferences();
  const isKg = unitSystem === 'kg';

  const displayWeight = useCallback((weightKg: number | null): string => {
    if (weightKg == null)
      return '';
    const val = isKg ? weightKg : Math.round(weightKg * KG_TO_LB * 10) / 10;
    return String(val);
  }, [isKg]);

  const parseWeight = useCallback((raw: string): number | null => {
    const n = Number.parseFloat(raw);
    if (Number.isNaN(n) || n < 0)
      return null;
    return isKg ? n : Math.round((n / KG_TO_LB) * 100) / 100;
  }, [isKg]);

  return {
    unitLabel: isKg ? 'kg' : 'lb',
    displayWeight,
    parseWeight,
  };
}
