import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useRef, useState } from 'react';
import { usePreferences } from '../../features/preferences/context/PreferencesContext';

const END_KEY = '@vega/rest_timer_end';
const NOTIF_KEY = '@vega/rest_timer_notif';

export interface RestTimerState {
  isActive: boolean;
  remaining: number;
  total: number;
}

export function useRestTimer() {
  const { preferences } = usePreferences();
  const [state, setState] = useState<RestTimerState>({
    isActive: false,
    remaining: 0,
    total: 0,
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const endTimestampRef = useRef<number>(0);

  // Keep a ref to the current haptics preference so the interval callback
  // always reads the latest value without needing to be recreated.
  const restTimerHapticsRef = useRef(preferences.restTimerHaptics);
  useEffect(() => {
    restTimerHapticsRef.current = preferences.restTimerHaptics;
  }, [preferences.restTimerHaptics]);

  // handleExpiry is assigned to a ref every render so that startInterval's
  // stable closure always calls the latest version.
  const handleExpiryRef = useRef<() => void>(() => {});
  handleExpiryRef.current = () => {
    if (intervalRef.current)
      clearInterval(intervalRef.current);
    intervalRef.current = null;
    setState({ isActive: false, remaining: 0, total: 0 });
    AsyncStorage.removeItem(END_KEY);
    AsyncStorage.removeItem(NOTIF_KEY);
    if (restTimerHapticsRef.current)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const startInterval = useCallback(() => {
    if (intervalRef.current)
      clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.round((endTimestampRef.current - Date.now()) / 1000));
      setState((prev) => ({ ...prev, remaining }));
      if (remaining === 0)
        handleExpiryRef.current();
    }, 500);
  }, []); // stable — reads only refs, never stale

  // Restore a timer that was active before the app was closed.
  useEffect(() => {
    AsyncStorage.getItem(END_KEY).then((raw) => {
      if (!raw)
        return;
      const end = Number(raw);
      const remaining = Math.max(0, Math.round((end - Date.now()) / 1000));
      if (remaining > 0) {
        endTimestampRef.current = end;
        setState({ isActive: true, remaining, total: remaining });
        startInterval();
      } else {
        AsyncStorage.removeItem(END_KEY);
        AsyncStorage.removeItem(NOTIF_KEY);
      }
    });
    return () => {
      if (intervalRef.current)
        clearInterval(intervalRef.current);
    };
  }, [startInterval]);

  const startTimer = useCallback(async (seconds: number) => {
    const existingNotifId = await AsyncStorage.getItem(NOTIF_KEY);
    if (existingNotifId)
      await Notifications.cancelScheduledNotificationAsync(existingNotifId).catch(() => {});

    const end = Date.now() + seconds * 1000;
    endTimestampRef.current = end;
    await AsyncStorage.setItem(END_KEY, String(end));

    setState({ isActive: true, remaining: seconds, total: seconds });
    startInterval();

    try {
      const { status } = await Notifications.getPermissionsAsync();
      const granted = status === 'granted'
        || (await Notifications.requestPermissionsAsync()).status === 'granted';

      if (granted) {
        const notifId = await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Rest complete',
            body: 'Time for your next set!',
            sound: preferences.restTimerSound,
          },
          trigger: { seconds, repeats: false } as Notifications.TimeIntervalTriggerInput,
        });
        await AsyncStorage.setItem(NOTIF_KEY, notifId);
      }
    } catch {}
  }, [preferences.restTimerSound, startInterval]);

  const stopTimer = useCallback(async () => {
    if (intervalRef.current)
      clearInterval(intervalRef.current);
    intervalRef.current = null;
    setState({ isActive: false, remaining: 0, total: 0 });
    await AsyncStorage.removeItem(END_KEY);
    const existingNotifId = await AsyncStorage.getItem(NOTIF_KEY);
    if (existingNotifId) {
      await Notifications.cancelScheduledNotificationAsync(existingNotifId).catch(() => {});
      await AsyncStorage.removeItem(NOTIF_KEY);
    }
  }, []);

  return { timer: state, startTimer, stopTimer };
}
