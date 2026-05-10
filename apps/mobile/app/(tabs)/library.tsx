import type { Equipment, ExerciseType, MuscleGroup } from '@vega/types';
import type { Exercise } from '../../src/db';
import { Q } from '@nozbe/watermelondb';
import { useDatabase } from '@nozbe/watermelondb/react';
import { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  EQUIPMENT_LABELS,
  EQUIPMENT_OPTIONS,
  MUSCLE_GROUPS,
  MUSCLE_LABELS,
  MUSCLE_OPTIONS,
  TYPE_LABELS,
  TYPE_OPTIONS,
} from '../../src/constants/exercises';
import { colors, fontSize, radius, spacing } from '../../src/constants/theme';
import { trpc } from '../../src/lib/trpc';

interface CreateForm {
  name: string;
  type: ExerciseType;
  primaryMuscleGroup: MuscleGroup;
  equipment: Equipment;
  instructions: string;
}

export default function LibraryTab() {
  const database = useDatabase();

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [search, setSearch] = useState('');
  const [muscleFilter, setMuscleFilter] = useState<MuscleGroup | 'all'>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<CreateForm>({
    name: '',
    type: 'weighted',
    primaryMuscleGroup: 'chest',
    equipment: 'barbell',
    instructions: '',
  });
  const [saving, setSaving] = useState(false);

  const createExercise = trpc.exercises.create.useMutation();

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

  async function handleCreate() {
    if (!form.name.trim()) {
      Alert.alert('Name required', 'Please enter a name for the exercise.');
      return;
    }
    setSaving(true);
    try {
      const created = await createExercise.mutateAsync({
        name: form.name.trim(),
        type: form.type,
        primaryMuscleGroup: form.primaryMuscleGroup,
        equipment: form.equipment,
        instructions: form.instructions.trim() || undefined,
      });
      if (!created)
        throw new Error('No exercise returned');
      // Upsert into WatermelonDB
      await database.write(async () => {
        await database.get<Exercise>('exercises').create((record) => {
          const raw = record._raw as any;
          raw.id = created.id;
          raw.name = created.name;
          raw.type = created.type;
          raw.primary_muscle_group = created.primaryMuscleGroup;
          raw.equipment = created.equipment;
          raw.instructions = created.instructions ?? null;
          raw.user_id = created.userId ?? null;
          raw.is_system = created.isSystem ? 1 : 0;
          raw.created_at = new Date(created.createdAt).getTime();
          raw.updated_at = new Date(created.updatedAt).getTime();
        });
      });
      setShowCreate(false);
      setForm({ name: '', type: 'weighted', primaryMuscleGroup: 'chest', equipment: 'barbell', instructions: '' });
    }
    catch {
      Alert.alert('Error', 'Could not create exercise. Please try again.');
    }
    finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Library</Text>
        <Pressable style={styles.createBtn} onPress={() => setShowCreate(true)}>
          <Text style={styles.createBtnText}>+ Custom</Text>
        </Pressable>
      </View>

      <View style={styles.searchWrap}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search exercises..."
          placeholderTextColor={colors.textSecondary}
          value={search}
          onChangeText={setSearch}
          clearButtonMode="while-editing"
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
        style={styles.chipScroll}
      >
        {MUSCLE_GROUPS.map(m => (
          <Pressable
            key={m}
            style={[styles.chip, muscleFilter === m && styles.chipActive]}
            onPress={() => setMuscleFilter(m as MuscleGroup | 'all')}
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
        keyExtractor={item => item.id}
        keyboardShouldPersistTaps="always"
        renderItem={({ item }) => (
          <View style={styles.exerciseRow}>
            <View style={styles.exerciseInfo}>
              <Text style={styles.exerciseName}>{item.name}</Text>
              <Text style={styles.exerciseMeta}>
                {MUSCLE_LABELS[item.primaryMuscleGroup]}
                {' · '}
                {item.equipment}
                {item.isSystem ? '' : '  ·  Custom'}
              </Text>
            </View>
            <Text style={styles.exerciseType}>{item.type[0]?.toUpperCase()}</Text>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={(
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {exercises.length === 0 ? 'Loading exercises...' : 'No exercises match your search'}
            </Text>
          </View>
        )}
      />

      {/* Create custom exercise modal */}
      <Modal visible={showCreate} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>New Exercise</Text>
            <Pressable onPress={() => setShowCreate(false)} hitSlop={12}>
              <Text style={styles.modalClose}>Cancel</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="always">
            <Text style={styles.fieldLabel}>Name *</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="e.g. Close Grip Bench Press"
              placeholderTextColor={colors.textMuted}
              value={form.name}
              onChangeText={v => setForm(f => ({ ...f, name: v }))}
              autoFocus
            />

            <Text style={styles.fieldLabel}>Type</Text>
            <View style={styles.segmented}>
              {TYPE_OPTIONS.map(t => (
                <Pressable
                  key={t}
                  style={[styles.segment, form.type === t && styles.segmentActive]}
                  onPress={() => setForm(f => ({ ...f, type: t }))}
                >
                  <Text style={[styles.segmentText, form.type === t && styles.segmentTextActive]}>
                    {TYPE_LABELS[t]}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Muscle Group</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} style={{ marginBottom: spacing.md }}>
              {MUSCLE_OPTIONS.map(m => (
                <Pressable
                  key={m}
                  style={[styles.chip, form.primaryMuscleGroup === m && styles.chipActive]}
                  onPress={() => setForm(f => ({ ...f, primaryMuscleGroup: m }))}
                >
                  <Text style={[styles.chipText, form.primaryMuscleGroup === m && styles.chipTextActive]}>
                    {MUSCLE_LABELS[m]}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={styles.fieldLabel}>Equipment</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} style={{ marginBottom: spacing.md }}>
              {EQUIPMENT_OPTIONS.map(e => (
                <Pressable
                  key={e}
                  style={[styles.chip, form.equipment === e && styles.chipActive]}
                  onPress={() => setForm(f => ({ ...f, equipment: e }))}
                >
                  <Text style={[styles.chipText, form.equipment === e && styles.chipTextActive]}>
                    {EQUIPMENT_LABELS[e]}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={styles.fieldLabel}>Instructions (optional)</Text>
            <TextInput
              style={[styles.fieldInput, styles.textArea]}
              placeholder="Describe the exercise..."
              placeholderTextColor={colors.textMuted}
              value={form.instructions}
              onChangeText={v => setForm(f => ({ ...f, instructions: v }))}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <Pressable
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={handleCreate}
              disabled={saving}
            >
              <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Create Exercise'}</Text>
            </Pressable>
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: { flex: 1, color: colors.text, fontSize: fontSize.xxl, fontWeight: '700' },
  createBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  createBtnText: { color: colors.accent, fontSize: fontSize.sm, fontWeight: '600' },
  searchWrap: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
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
  countText: { color: colors.textMuted, fontSize: fontSize.xs, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  exerciseRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.md },
  exerciseInfo: { flex: 1 },
  exerciseName: { color: colors.text, fontSize: fontSize.md, fontWeight: '500' },
  exerciseMeta: { color: colors.textSecondary, fontSize: fontSize.xs, marginTop: 2, textTransform: 'capitalize' },
  exerciseType: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '700' },
  separator: { height: 1, backgroundColor: colors.border, marginHorizontal: spacing.lg },
  empty: { padding: spacing.xxl, alignItems: 'center' },
  emptyText: { color: colors.textSecondary, fontSize: fontSize.md },
  // Modal
  modal: { flex: 1, backgroundColor: colors.bg },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: { flex: 1, color: colors.text, fontSize: fontSize.lg, fontWeight: '700' },
  modalClose: { color: colors.accent, fontSize: fontSize.md },
  modalScroll: { flex: 1, paddingHorizontal: spacing.lg },
  fieldLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  fieldInput: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 48,
    color: colors.text,
    fontSize: fontSize.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: { height: 100, paddingTop: spacing.md },
  segmented: { flexDirection: 'row', gap: spacing.sm },
  segment: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  segmentActive: { borderColor: colors.accent, backgroundColor: `${colors.accent}20` },
  segmentText: { color: colors.textSecondary, fontSize: fontSize.sm },
  segmentTextActive: { color: colors.accent, fontWeight: '600' },
  saveBtn: {
    marginTop: spacing.xl,
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: colors.text, fontSize: fontSize.md, fontWeight: '700' },
});
