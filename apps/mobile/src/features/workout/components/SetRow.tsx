import type { ExerciseType, SetType } from '@vega/types';
import type { Set as SetModel } from '../../../db';
import { useDatabase } from '@nozbe/watermelondb/react';
import * as React from 'react';
import { useEffect, useReducer, useRef } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors, fontSize, radius, spacing } from '../../../shared/constants/theme';
import { useUnit } from '../../../shared/hooks/useUnit';
import { deriveState, rowReducer } from '../setRowHelpers';

const SET_TYPE_ORDER: SetType[] = ['normal', 'warmup', 'dropset'];
const SET_TYPE_LABELS: Record<SetType, string> = { normal: '', warmup: 'W', dropset: 'D' };
const SET_TYPE_COLORS: Record<SetType, string> = {
  normal: colors.textSecondary,
  warmup: colors.warmup,
  dropset: colors.dropset,
};

interface Props {
  set: SetModel;
  exerciseType: ExerciseType;
  setNumber: number;
  previousSet?: { weightKg: number | null; reps: number | null; durationSeconds: number | null } | null;
  targetReps?: string | null;
  targetRpe?: number | null;
  onComplete: () => void;
  onDelete: () => void;
}

export function SetRow({ set, exerciseType, setNumber, previousSet, targetReps, targetRpe, onComplete, onDelete }: Props) {
  const database = useDatabase();
  const { displayWeight, parseWeight, unitLabel } = useUnit();

  // Destructure primitive fields so each can serve as an individual effect dep.
  // completedAt is a Date so we extract its timestamp for stable comparison.
  const { weightKg, reps, durationSeconds, rpe } = set;
  const rawType = set.type;
  const completedAtMs = set.completedAt?.getTime() ?? null;

  const [state, dispatch] = useReducer(
    rowReducer,
    undefined,
    () => deriveState(weightKg, reps, durationSeconds, rpe, rawType, completedAtMs, displayWeight),
  );
  const { weightText, repsText, durationText, rpeText, setType, isCompleted } = state;
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync display state when the model changes externally (e.g. pushed by sync from another device).
  // dispatch from useReducer is stable and does not trigger react/set-state-in-effect.
  useEffect(() => {
    dispatch({
      type: 'sync',
      state: deriveState(weightKg, reps, durationSeconds, rpe, rawType, completedAtMs, displayWeight),
    });
  }, [set.id, weightKg, reps, durationSeconds, rpe, rawType, completedAtMs, displayWeight]);

  function scheduleSave(updates: {
    weightKg?: number | null;
    reps?: number | null;
    durationSeconds?: number | null;
    rpe?: number | null;
    type?: SetType;
  }) {
    if (saveTimeoutRef.current)
      clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      database.write(async () => {
        await set.update((s) => {
          if (updates.weightKg !== undefined)
            s.weightKg = updates.weightKg ?? null;
          if (updates.reps !== undefined)
            s.reps = updates.reps ?? null;
          if (updates.durationSeconds !== undefined)
            s.durationSeconds = updates.durationSeconds ?? null;
          if (updates.rpe !== undefined)
            s.rpe = updates.rpe ?? null;
          if (updates.type !== undefined)
            s.type = updates.type;
          s.updatedAt = new Date();
        });
      });
    }, 400);
  }

  function cycleType() {
    const idx = (SET_TYPE_ORDER.indexOf(setType) + 1) % SET_TYPE_ORDER.length;
    const next: SetType = SET_TYPE_ORDER[idx] ?? 'normal';
    dispatch({ type: 'patch', patch: { setType: next } });
    scheduleSave({ type: next });
  }

  async function handleComplete() {
    const now = new Date();
    await database.write(async () => {
      await set.update((s) => {
        s.weightKg = parseWeight(weightText) ?? null;
        s.reps = repsText ? Number.parseInt(repsText, 10) : null;
        s.durationSeconds = durationText ? Number.parseInt(durationText, 10) : null;
        s.rpe = rpeText ? Number.parseFloat(rpeText) : null;
        s.completedAt = now;
        s.updatedAt = now;
      });
    });
    dispatch({ type: 'patch', patch: { isCompleted: true } });
    onComplete();
  }

  async function handleUncomplete() {
    await database.write(async () => {
      await set.update((s) => {
        s.completedAt = null;
        s.updatedAt = new Date();
      });
    });
    dispatch({ type: 'patch', patch: { isCompleted: false } });
  }

  const weightPlaceholder = previousSet ? (displayWeight(previousSet.weightKg) || '-') : '-';
  // Reps: prefer previous-session data; fall back to template target if present.
  const repsPlaceholder = previousSet?.reps != null
    ? String(previousSet.reps)
    : (targetReps ?? '-');
  const durationPlaceholder = previousSet?.durationSeconds != null
    ? String(previousSet.durationSeconds)
    : '-';
  const rpePlaceholder = targetRpe != null ? String(targetRpe) : '-';

  const typeColor = SET_TYPE_COLORS[setType];
  const rowOpacity = isCompleted ? 0.6 : 1;
  const typeLabel = SET_TYPE_LABELS[setType];

  return (
    <View style={[styles.row, { opacity: rowOpacity }]}>
      {/* Set number + type badge — long press to delete */}
      <Pressable style={styles.typeBadge} onPress={cycleType} onLongPress={onDelete} hitSlop={8}>
        <Text style={[styles.typeText, { color: typeColor }]}>
          {setNumber}
          {typeLabel}
        </Text>
      </Pressable>

      {/* Weight input */}
      {exerciseType === 'weighted' && (
        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            value={weightText}
            onChangeText={(v) => {
              dispatch({ type: 'patch', patch: { weightText: v } });
              scheduleSave({ weightKg: parseWeight(v) });
            }}
            placeholder={weightPlaceholder}
            placeholderTextColor={colors.textMuted}
            keyboardType="decimal-pad"
            returnKeyType="done"
            editable={!isCompleted}
            selectTextOnFocus
          />
          <Text style={styles.inputUnit}>{unitLabel}</Text>
        </View>
      )}

      {/* Reps input */}
      {(exerciseType === 'weighted' || exerciseType === 'bodyweight') && (
        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            value={repsText}
            onChangeText={(v) => {
              dispatch({ type: 'patch', patch: { repsText: v } });
              scheduleSave({ reps: v ? Number.parseInt(v, 10) : null });
            }}
            placeholder={repsPlaceholder}
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            returnKeyType="done"
            editable={!isCompleted}
            selectTextOnFocus
          />
          <Text style={styles.inputUnit}>reps</Text>
        </View>
      )}

      {/* Duration input */}
      {exerciseType === 'timed' && (
        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            value={durationText}
            onChangeText={(v) => {
              dispatch({ type: 'patch', patch: { durationText: v } });
              scheduleSave({ durationSeconds: v ? Number.parseInt(v, 10) : null });
            }}
            placeholder={durationPlaceholder}
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            returnKeyType="done"
            editable={!isCompleted}
            selectTextOnFocus
          />
          <Text style={styles.inputUnit}>sec</Text>
        </View>
      )}

      {/* RPE input */}
      <TextInput
        style={styles.rpeInput}
        value={rpeText}
        onChangeText={(v) => {
          dispatch({ type: 'patch', patch: { rpeText: v } });
          scheduleSave({ rpe: v ? Number.parseFloat(v) : null });
        }}
        placeholder={rpePlaceholder}
        placeholderTextColor={colors.textMuted}
        keyboardType="decimal-pad"
        returnKeyType="done"
        editable={!isCompleted}
        selectTextOnFocus
      />

      {/* Complete button */}
      <Pressable
        style={[styles.checkBtn, isCompleted && styles.checkBtnDone]}
        onPress={isCompleted ? handleUncomplete : handleComplete}
        hitSlop={8}
      >
        <Text style={[styles.checkText, isCompleted && styles.checkTextDone]}>
          {isCompleted ? '✓' : '○'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  typeBadge: {
    width: 32,
    alignItems: 'center',
    minHeight: 40,
    justifyContent: 'center',
  },
  typeText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    height: 44,
  },
  rpeInput: {
    width: 56,
    backgroundColor: colors.card,
    borderRadius: radius.sm,
    height: 44,
    color: colors.text,
    fontSize: fontSize.md,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.md,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
    height: 44,
  },
  inputUnit: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
  },
  checkBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBtnDone: {
    borderColor: colors.success,
    backgroundColor: `${colors.success}22`,
  },
  checkText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  checkTextDone: {
    color: colors.success,
    fontWeight: '700',
  },
});
