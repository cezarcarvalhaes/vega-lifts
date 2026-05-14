import type { TemplateExercise, WorkoutTemplate } from '../../../db';
import { Q } from '@nozbe/watermelondb';
import { useDatabase } from '@nozbe/watermelondb/react';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radius, spacing } from '../../../shared/constants/theme';
import { trpc } from '../../../shared/lib/trpc';

interface Props {
  onStartFromTemplate: (templateId: string) => Promise<void>;
  onStartEmpty: () => void;
}

interface TemplateWithCount {
  template: WorkoutTemplate;
  exerciseCount: number;
}

export function TemplatePicker({ onStartFromTemplate, onStartEmpty }: Props) {
  const database = useDatabase();
  const router = useRouter();
  const [systemTemplates, setSystemTemplates] = useState<TemplateWithCount[]>([]);
  const [userTemplates, setUserTemplates] = useState<TemplateWithCount[]>([]);
  const [starting, setStarting] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const createTemplate = trpc.templates.create.useMutation();

  useEffect(() => {
    let cancelled = false;
    const sub = database
      .get<WorkoutTemplate>('workout_templates')
      .query(Q.sortBy('name', Q.asc))
      .observe()
      .subscribe(async (templates) => {
        const counts = await Promise.all(
          templates.map(async (t) => ({
            template: t,
            exerciseCount: await database
              .get<TemplateExercise>('template_exercises')
              .query(Q.where('template_id', t.id))
              .fetchCount(),
          })),
        );
        if (cancelled)
          return;
        setSystemTemplates(counts.filter((c) => c.template.isSystem));
        setUserTemplates(counts.filter((c) => !c.template.isSystem));
      });
    return () => {
      cancelled = true;
      sub.unsubscribe();
    };
  }, [database]);

  async function handleTemplateTap(templateId: string) {
    if (starting)
      return;
    setStarting(templateId);
    try {
      await onStartFromTemplate(templateId);
    } finally {
      setStarting(null);
    }
  }

  function handleUserTemplateLongPress(template: WorkoutTemplate) {
    Alert.alert(template.name, undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Edit', onPress: () => router.push({ pathname: '/templates/[id]', params: { id: template.id } }) },
      { text: 'Start workout', onPress: () => handleTemplateTap(template.id) },
    ]);
  }

  async function handleNewTemplate() {
    if (creating)
      return;
    setCreating(true);
    try {
      const created = await createTemplate.mutateAsync({ name: 'New Template' });
      await database.write(async () => {
        await database.get<WorkoutTemplate>('workout_templates').create((record) => {
          const raw = record._raw as any;
          raw.id = created.id;
          raw.user_id = created.userId ?? '';
          raw.name = created.name;
          raw.notes = created.notes ?? null;
          raw.is_system = created.isSystem ? 1 : 0;
          raw.created_at = new Date(created.createdAt).getTime();
          raw.updated_at = new Date(created.updatedAt).getTime();
        });
      });
      router.push({ pathname: '/templates/[id]', params: { id: created.id } });
    } catch {
      Alert.alert('Error', 'Could not create template. Please try again.');
    } finally {
      setCreating(false);
    }
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.sectionHeader}>Templates</Text>

      {systemTemplates.map(({ template, exerciseCount }) => (
        <Pressable
          key={template.id}
          style={[styles.card, starting === template.id && styles.cardDisabled]}
          onPress={() => handleTemplateTap(template.id)}
          disabled={starting !== null}
        >
          <View style={styles.cardMain}>
            <Text style={styles.cardName}>{template.name}</Text>
            <Text style={styles.cardMeta}>
              {exerciseCount}
              {' '}
              exercise
              {exerciseCount === 1 ? '' : 's'}
            </Text>
          </View>
          <Text style={styles.cardArrow}>›</Text>
        </Pressable>
      ))}

      {userTemplates.length > 0 && (
        <Text style={[styles.sectionHeader, styles.sectionHeaderUser]}>My Templates</Text>
      )}
      {userTemplates.map(({ template, exerciseCount }) => (
        <Pressable
          key={template.id}
          style={[styles.card, starting === template.id && styles.cardDisabled]}
          onPress={() => handleTemplateTap(template.id)}
          onLongPress={() => handleUserTemplateLongPress(template)}
          disabled={starting !== null}
        >
          <View style={styles.cardMain}>
            <Text style={styles.cardName}>{template.name}</Text>
            <Text style={styles.cardMeta}>
              {exerciseCount}
              {' '}
              exercise
              {exerciseCount === 1 ? '' : 's'}
            </Text>
          </View>
          <Text style={styles.cardArrow}>›</Text>
        </Pressable>
      ))}

      <Pressable
        style={[styles.newTemplateBtn, creating && styles.cardDisabled]}
        onPress={handleNewTemplate}
        disabled={creating}
      >
        <Text style={styles.newTemplateText}>{creating ? 'Creating...' : '+ New template'}</Text>
      </Pressable>

      <View style={styles.divider} />

      <Pressable style={styles.emptyBtn} onPress={onStartEmpty}>
        <Text style={styles.emptyBtnText}>Start empty workout</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingBottom: spacing.xxl },
  sectionHeader: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  sectionHeaderUser: {
    marginTop: spacing.lg,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  cardDisabled: { opacity: 0.5 },
  cardMain: { flex: 1 },
  cardName: { color: colors.text, fontSize: fontSize.md, fontWeight: '600' },
  cardMeta: { color: colors.textSecondary, fontSize: fontSize.xs, marginTop: 2 },
  cardArrow: { color: colors.textMuted, fontSize: fontSize.xl },
  newTemplateBtn: {
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  newTemplateText: { color: colors.accent, fontSize: fontSize.sm, fontWeight: '600' },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xl,
  },
  emptyBtn: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  emptyBtnText: { color: colors.textSecondary, fontSize: fontSize.md },
});
