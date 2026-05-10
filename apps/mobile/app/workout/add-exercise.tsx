import type { MuscleGroup } from '@vega/types';
import type { Exercise, Set as SetModel, WorkoutExercise } from '../../src/db';
import { Q } from '@nozbe/watermelondb';
import { useDatabase } from '@nozbe/watermelondb/react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { EXERCISE_TYPE_BG, MUSCLE_GROUPS, MUSCLE_LABELS } from '../../src/shared/constants/exercises';
import { colors, fontSize, radius, spacing } from '../../src/shared/constants/theme';

export default function AddExerciseScreen() {
  const { workoutId } = useLocalSearchParams<{ workoutId: string }>();
  const router = useRouter();
  const database = useDatabase();

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [search, setSearch] = useState('');
  const [muscleFilter, setMuscleFilter] = useState<MuscleGroup | 'all'>('all');
  const [adding, setAdding] = useState<string | null>(null);

  useEffect(() => {
    const sub = database
      .get<Exercise>('exercises')
      .query(Q.sortBy('name', Q.asc))
      .observe()
      .subscribe(setExercises);
    return () => sub.unsubscribe();
  }, [database]);

  const filtered = exercises.filter((e) => {
    const matchSearch = search.length === 0
      || e.name.toLowerCase().includes(search.toLowerCase());
    const matchMuscle = muscleFilter === 'all' || e.primaryMuscleGroup === muscleFilter;
    return matchSearch && matchMuscle;
  });

  const handleSelect = useCallback(async (exercise: Exercise) => {
    if (adding)
      return;
    setAdding(exercise.id);
    try {
      const now = Date.now();
      const existing = await database
        .get<WorkoutExercise>('workout_exercises')
        .query(Q.where('workout_id', workoutId))
        .fetchCount();

      await database.write(async () => {
        const we = await database.get<WorkoutExercise>('workout_exercises').create((record) => {
          const raw = record._raw as any;
          raw.workout_id = workoutId;
          raw.exercise_id = exercise.id;
          raw.sort_order = existing;
          raw.notes = null;
          raw.created_at = now;
          raw.updated_at = now;
        });

        await database.get<SetModel>('sets').create((s) => {
          const raw = s._raw as any;
          raw.workout_exercise_id = we.id;
          raw.sort_order = 0;
          raw.type = 'normal';
          raw.weight_kg = null;
          raw.reps = null;
          raw.duration_seconds = null;
          raw.rpe = null;
          raw.completed_at = 0;
          raw.created_at = now;
          raw.updated_at = now;
        });
      });

      router.back();
    } catch (err) {
      console.error('Failed to add exercise:', err);
      setAdding(null);
    }
  }, [workoutId, database, adding, router]);

  return (
    <View style={styles.container}>
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search exercises..."
          placeholderTextColor={colors.textSecondary}
          value={search}
          onChangeText={setSearch}
          autoFocus
          clearButtonMode="while-editing"
          returnKeyType="search"
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
        style={styles.chipScroll}
      >
        {MUSCLE_GROUPS.map((m) => (
          <Pressable
            key={m}
            style={[styles.chip, muscleFilter === m && styles.chipActive]}
            onPress={() => setMuscleFilter(m)}
          >
            <Text style={[styles.chipText, muscleFilter === m && styles.chipTextActive]}>
              {MUSCLE_LABELS[m]}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <Text style={styles.countText}>
        {filtered.length}
        {' '}
        exercises
      </Text>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="always"
        renderItem={({ item }) => (
          <Pressable
            style={[styles.exerciseRow, adding === item.id && styles.exerciseRowAdding]}
            onPress={() => handleSelect(item)}
          >
            <View style={styles.exerciseInfo}>
              <Text style={styles.exerciseName}>{item.name}</Text>
              <Text style={styles.exerciseMeta}>
                {MUSCLE_LABELS[item.primaryMuscleGroup] ?? item.primaryMuscleGroup}
                {' · '}
                {item.equipment}
              </Text>
            </View>
            <View style={[styles.typeBadge, { backgroundColor: EXERCISE_TYPE_BG[item.type] }]}>
              <Text style={styles.typeBadgeText}>{item.type[0]?.toUpperCase()}</Text>
            </View>
          </Pressable>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={(
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {exercises.length === 0 ? 'Loading exercises...' : 'No exercises found'}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  searchWrap: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  searchInput: {
    height: 44,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    color: colors.text,
    fontSize: fontSize.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipScroll: { maxHeight: 44 },
  chips: { paddingHorizontal: spacing.lg, gap: spacing.sm, alignItems: 'center' },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { borderColor: colors.accent, backgroundColor: `${colors.accent}20` },
  chipText: { color: colors.textSecondary, fontSize: fontSize.xs, fontWeight: '500' },
  chipTextActive: { color: colors.accent },
  countText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  exerciseRowAdding: { opacity: 0.5 },
  exerciseInfo: { flex: 1 },
  exerciseName: { color: colors.text, fontSize: fontSize.md, fontWeight: '500' },
  exerciseMeta: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  typeBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeBadgeText: { color: colors.textSecondary, fontSize: fontSize.xs, fontWeight: '700' },
  separator: { height: 1, backgroundColor: colors.border, marginHorizontal: spacing.lg },
  empty: { padding: spacing.xxl, alignItems: 'center' },
  emptyText: { color: colors.textSecondary, fontSize: fontSize.md },
});
