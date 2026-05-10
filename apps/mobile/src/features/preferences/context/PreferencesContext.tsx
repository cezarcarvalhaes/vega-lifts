/* eslint-disable react-refresh/only-export-components */
import type { UserPreferences } from '@vega/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';

type Prefs = Omit<UserPreferences, 'userId' | 'updatedAt'>;

const defaults: Prefs = {
  unitSystem: 'kg',
  autoStartRestTimer: true,
  defaultRestSeconds: 90,
  restTimerSound: true,
  restTimerHaptics: true,
};

const KEY = '@vega/preferences';

interface PreferencesContextValue {
  preferences: Prefs;
  updatePreferences: (patch: Partial<Prefs>) => Promise<void>;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefs] = useState<Prefs>(defaults);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((raw) => {
      if (raw) {
        try {
          setPrefs({ ...defaults, ...JSON.parse(raw) });
        } catch {}
      }
      setLoaded(true);
    });
  }, []);

  async function updatePreferences(patch: Partial<Prefs>) {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  }

  if (!loaded)
    return null;

  return (

    <PreferencesContext.Provider value={{ preferences: prefs, updatePreferences }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx)
    throw new Error('usePreferences must be used inside PreferencesProvider');
  return ctx;
}
