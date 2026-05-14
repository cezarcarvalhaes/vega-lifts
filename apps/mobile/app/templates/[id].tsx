import type { TemplateExercise, WorkoutTemplate } from '../../src/db';
import { Q } from '@nozbe/watermelondb';
import { useDatabase } from '@nozbe/watermelondb/react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TemplateExerciseEditor } from '../../src/features/workout/components/TemplateExerciseEditor';
import { colors, fontSize, radius, spacing } from '../../src/shared/constants/theme';
import { trpc } from '../../src/shared/lib/trpc';

export default function TemplateEditorScreen() {
  const { id: templateId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const database = useDatabase();

  const [template, setTemplate] = useState<WorkoutTemplate | null>(null);
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [templateExercises, setTemplateExercises] = useState<TemplateExercise[]>([]);

  const updateTemplate = trpc.templates.update.useMutation();
  const deleteTemplate = trpc.templates.delete.useMutation();
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    database.get<WorkoutTemplate>('workout_templates').find(templateId).then((t) => {
      if (cancelled)
        return;
      setTemplate(t);
      setName(t.name);
      setNotes(t.notes ?? '');
    }).catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [templateId, database]);

  useEffect(() => {
    const sub = database
      .get<TemplateExercise>('template_exercises')
      .query(Q.where('template_id', templateId), Q.sortBy('sort_order', Q.asc))
      .observe()
      .subscribe(setTemplateExercises);
    return () => sub.unsubscribe();
  }, [templateId, database]);

  function scheduleSave(updates: { name?: string; notes?: string | null }) {
    if (saveTimeoutRef.current)
      clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      if (!template)
        return;
      try {
        const updated = await updateTemplate.mutateAsync({ id: template.id, ...updates });
        await database.write(async () => {
          await template.update((t) => {
            const raw = t._raw as any;
            if (updates.name !== undefined)
              raw.name = updated.name;
            if (updates.notes !== undefined)
              raw.notes = updated.notes;
            raw.updated_at = new Date(updated.updatedAt).getTime();
          });
        });
      } catch {
        // swallow — UI still reflects user's input
      }
    }, 500);
  }

  function handleDelete() {
    if (!template)
      return;
    Alert.alert('Delete template?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTemplate.mutateAsync({ id: template.id });
            await database.write(async () => {
              // Local cleanup — template_exercises cascade locally too.
              for (const te of templateExercises)
                await te.destroyPermanently();
              await template.destroyPermanently();
            });
            router.back();
          } catch {
            Alert.alert('Error', 'Could not delete template.');
          }
        },
      },
    ]);
  }

  if (!template) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.headerBtn}>
          <Text style={styles.headerBtnText}>‹ Back</Text>
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>Edit Template</Text>
        <Pressable onPress={handleDelete} hitSlop={12} style={styles.headerBtn}>
          <Text style={styles.headerDeleteText}>Delete</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="always">
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={(v) => {
              setName(v);
              scheduleSave({ name: v });
            }}
            placeholder="Template name"
            placeholderTextColor={colors.textMuted}
            returnKeyType="done"
          />

          <Text style={styles.label}>Notes (optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={(v) => {
              setNotes(v);
              scheduleSave({ notes: v.trim() || null });
            }}
            placeholder="What is this template for?"
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <Text style={styles.label}>Exercises</Text>
          {templateExercises.map((te) => (
            <TemplateExerciseEditor key={te.id} templateExercise={te} />
          ))}

          <Pressable
            style={styles.addBtn}
            onPress={() => router.push({ pathname: '/templates/add-exercise', params: { templateId: template.id } })}
          >
            <Text style={styles.addBtnText}>+ Add exercise</Text>
          </Pressable>

          <View style={{ height: 80 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerBtn: { minWidth: 60 },
  headerBtnText: { color: colors.accent, fontSize: fontSize.md },
  headerDeleteText: { color: colors.accent, fontSize: fontSize.sm, textAlign: 'right' },
  headerTitle: { flex: 1, color: colors.text, fontSize: fontSize.md, fontWeight: '600', textAlign: 'center' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: colors.textSecondary, fontSize: fontSize.md },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  label: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 48,
    color: colors.text,
    fontSize: fontSize.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: { height: 80, paddingTop: spacing.sm },
  addBtn: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  addBtnText: { color: colors.accent, fontSize: fontSize.sm, fontWeight: '600' },
});
