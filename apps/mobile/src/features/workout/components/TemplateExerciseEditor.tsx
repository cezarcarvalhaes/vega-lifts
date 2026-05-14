import type { Exercise, TemplateExercise } from '../../../db';
import { useDatabase } from '@nozbe/watermelondb/react';
import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, fontSize, radius, spacing } from '../../../shared/constants/theme';
import { trpc } from '../../../shared/lib/trpc';

interface Props {
  templateExercise: TemplateExercise;
}

export function TemplateExerciseEditor({ templateExercise: te }: Props) {
  const database = useDatabase();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [setsText, setSetsText] = useState(te.targetSets != null ? String(te.targetSets) : '');
  const [repsText, setRepsText] = useState(te.targetReps ?? '');
  const [rpeText, setRpeText] = useState(te.targetRpe != null ? String(te.targetRpe) : '');
  const [restText, setRestText] = useState(te.restSeconds != null ? String(te.restSeconds) : '');

  const updateMutation = trpc.templates.updateTemplateExercise.useMutation();
  const removeMutation = trpc.templates.removeExercise.useMutation();
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    database.get<Exercise>('exercises').find(te.exerciseId).then(setExercise).catch(() => {});
  }, [database, te.exerciseId]);

  function scheduleSave(updates: {
    targetSets?: number | null;
    targetReps?: string | null;
    targetRpe?: number | null;
    restSeconds?: number | null;
  }) {
    if (saveTimeoutRef.current)
      clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const updated = await updateMutation.mutateAsync({ id: te.id, ...updates });
        await database.write(async () => {
          await te.update((row) => {
            const raw = row._raw as any;
            if (updates.targetSets !== undefined)
              raw.target_sets = updated.targetSets;
            if (updates.targetReps !== undefined)
              raw.target_reps = updated.targetReps;
            if (updates.targetRpe !== undefined)
              raw.target_rpe = updated.targetRpe;
            if (updates.restSeconds !== undefined)
              raw.rest_seconds = updated.restSeconds;
            raw.updated_at = new Date(updated.updatedAt).getTime();
          });
        });
      } catch {
        // Silent — UI keeps user input visible
      }
    }, 500);
  }

  function handleRemove() {
    Alert.alert('Remove exercise?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeMutation.mutateAsync({ id: te.id });
            await database.write(async () => {
              await te.destroyPermanently();
            });
          } catch {
            Alert.alert('Error', 'Could not remove exercise.');
          }
        },
      },
    ]);
  }

  if (!exercise)
    return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.name} numberOfLines={1}>{exercise.name}</Text>
        <Pressable onPress={handleRemove} hitSlop={12}>
          <Text style={styles.removeText}>✕</Text>
        </Pressable>
      </View>

      <View style={styles.fields}>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Sets</Text>
          <TextInput
            style={styles.input}
            value={setsText}
            onChangeText={(v) => {
              setSetsText(v);
              const parsed = v ? Number.parseInt(v, 10) : null;
              scheduleSave({ targetSets: parsed && parsed > 0 ? parsed : null });
            }}
            placeholder="-"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            returnKeyType="done"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Reps</Text>
          <TextInput
            style={styles.input}
            value={repsText}
            onChangeText={(v) => {
              setRepsText(v);
              scheduleSave({ targetReps: v.trim() || null });
            }}
            placeholder="e.g. 8-10"
            placeholderTextColor={colors.textMuted}
            returnKeyType="done"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>RPE</Text>
          <TextInput
            style={styles.input}
            value={rpeText}
            onChangeText={(v) => {
              setRpeText(v);
              const parsed = v ? Number.parseFloat(v) : null;
              scheduleSave({ targetRpe: parsed != null && !Number.isNaN(parsed) ? parsed : null });
            }}
            placeholder="-"
            placeholderTextColor={colors.textMuted}
            keyboardType="decimal-pad"
            returnKeyType="done"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Rest (s)</Text>
          <TextInput
            style={styles.input}
            value={restText}
            onChangeText={(v) => {
              setRestText(v);
              const parsed = v ? Number.parseInt(v, 10) : null;
              scheduleSave({ restSeconds: parsed != null && parsed >= 0 ? parsed : null });
            }}
            placeholder="-"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            returnKeyType="done"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  name: { flex: 1, color: colors.text, fontSize: fontSize.md, fontWeight: '600' },
  removeText: { color: colors.textMuted, fontSize: fontSize.md, paddingHorizontal: spacing.xs },
  fields: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  field: { flex: 1 },
  fieldLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    height: 40,
    color: colors.text,
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
});
