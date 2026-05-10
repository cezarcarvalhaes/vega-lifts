/* eslint-disable react-refresh/only-export-components */
import type { Set as SetModel, Workout, WorkoutExercise } from '../db';
import { useAuth } from '@clerk/clerk-expo';
import { Q } from '@nozbe/watermelondb';
import { useDatabase } from '@nozbe/watermelondb/react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';

const ACTIVE_KEY = '@vega/active_workout_id';

interface WorkoutContextValue {
  activeWorkoutId: string | null;
  startWorkout: (name: string) => Promise<string>;
  finishWorkout: (workoutId: string, durationSeconds: number) => Promise<void>;
  discardWorkout: (workoutId: string) => Promise<void>;
}

const WorkoutContext = createContext<WorkoutContextValue | null>(null);

export function WorkoutProvider({ children }: { children: React.ReactNode }) {
  const database = useDatabase();
  const { userId } = useAuth();
  const [activeWorkoutId, setActiveWorkoutId] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(ACTIVE_KEY).then(async (id) => {
      if (!id)
        return;
      try {
        const workout = await database.get<Workout>('workouts').find(id);
        if (!workout.finishedAt) {
          setActiveWorkoutId(id);
        } else {
          await AsyncStorage.removeItem(ACTIVE_KEY);
        }
      } catch {
        await AsyncStorage.removeItem(ACTIVE_KEY);
      }
    });
  }, [database]);

  async function startWorkout(name: string): Promise<string> {
    const now = Date.now();
    const workout = await database.write(async () => {
      return database.get<Workout>('workouts').create((w) => {
        const raw = w._raw as any;
        raw.user_id = userId!;
        raw.name = name;
        raw.template_id = null;
        raw.notes = null;
        raw.started_at = now;
        raw.finished_at = 0;
        raw.duration_seconds = 0;
        raw.created_at = now;
        raw.updated_at = now;
      });
    });
    await AsyncStorage.setItem(ACTIVE_KEY, workout.id);
    setActiveWorkoutId(workout.id);
    return workout.id;
  }

  async function finishWorkout(workoutId: string, durationSeconds: number): Promise<void> {
    const now = Date.now();
    const workout = await database.get<Workout>('workouts').find(workoutId);
    await database.write(async () => {
      await workout.update((w) => {
        const raw = w._raw as any;
        raw.finished_at = now;
        raw.duration_seconds = durationSeconds;
        raw.updated_at = now;
      });
    });
    await AsyncStorage.removeItem(ACTIVE_KEY);
    setActiveWorkoutId(null);
  }

  async function discardWorkout(workoutId: string): Promise<void> {
    const workout = await database.get<Workout>('workouts').find(workoutId);
    const workoutExercises = await database
      .get<WorkoutExercise>('workout_exercises')
      .query(Q.where('workout_id', workoutId))
      .fetch();

    await database.write(async () => {
      for (const we of workoutExercises) {
        const sets = await database
          .get<SetModel>('sets')
          .query(Q.where('workout_exercise_id', we.id))
          .fetch();
        for (const s of sets) {
          await s.destroyPermanently();
        }
        await we.destroyPermanently();
      }
      await workout.destroyPermanently();
    });
    await AsyncStorage.removeItem(ACTIVE_KEY);
    setActiveWorkoutId(null);
  }

  return (

    <WorkoutContext.Provider value={{ activeWorkoutId, startWorkout, finishWorkout, discardWorkout }}>
      {children}
    </WorkoutContext.Provider>
  );
}

export function useWorkout() {
  const ctx = useContext(WorkoutContext);
  if (!ctx)
    throw new Error('useWorkout must be used inside WorkoutProvider');
  return ctx;
}
