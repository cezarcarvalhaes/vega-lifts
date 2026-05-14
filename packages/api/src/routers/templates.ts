import { exercises, getDb, templateExercises, workoutTemplates } from '@vega/db';
import { and, asc, eq, or } from 'drizzle-orm';
import { z } from 'zod';
import { protectedProcedure, router } from '../trpc';

export const templatesRouter = router({
  // Returns system templates + the user's own templates, each with its ordered exercises.
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = getDb();

    const templates = await db
      .select()
      .from(workoutTemplates)
      .where(or(eq(workoutTemplates.isSystem, true), eq(workoutTemplates.userId, ctx.userId)));

    if (templates.length === 0)
      return [];

    const allExercises = await db
      .select()
      .from(templateExercises)
      .orderBy(asc(templateExercises.sortOrder));

    const byTemplate = new Map<string, typeof allExercises>();
    for (const te of allExercises) {
      const list = byTemplate.get(te.templateId) ?? [];
      list.push(te);
      byTemplate.set(te.templateId, list);
    }

    return templates.map((t) => ({
      ...t,
      exercises: byTemplate.get(t.id) ?? [],
    }));
  }),

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(100),
      notes: z.string().max(1000).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [template] = await getDb()
        .insert(workoutTemplates)
        .values({
          userId: ctx.userId,
          name: input.name,
          notes: input.notes ?? null,
          isSystem: false,
        })
        .returning();
      if (!template)
        throw new Error('Failed to create template');
      return template;
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      name: z.string().min(1).max(100).optional(),
      notes: z.string().max(1000).nullable().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...patch } = input;
      const [template] = await getDb()
        .update(workoutTemplates)
        .set({ ...patch, updatedAt: new Date() })
        .where(and(eq(workoutTemplates.id, id), eq(workoutTemplates.userId, ctx.userId)))
        .returning();
      if (!template)
        throw new Error('Template not found or not owned by user');
      return template;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await getDb()
        .delete(workoutTemplates)
        .where(and(eq(workoutTemplates.id, input.id), eq(workoutTemplates.userId, ctx.userId)));
      return { ok: true };
    }),

  addExercise: protectedProcedure
    .input(z.object({
      templateId: z.string().uuid(),
      exerciseId: z.string().uuid(),
      sortOrder: z.number().int().nonnegative(),
      targetSets: z.number().int().positive().nullable().optional(),
      targetReps: z.string().max(20).nullable().optional(),
      targetRpe: z.number().min(1).max(10).nullable().optional(),
      restSeconds: z.number().int().nonnegative().nullable().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify the template belongs to the user (or is system — but users can't add to system).
      const [template] = await getDb()
        .select()
        .from(workoutTemplates)
        .where(and(eq(workoutTemplates.id, input.templateId), eq(workoutTemplates.userId, ctx.userId)));
      if (!template)
        throw new Error('Template not found');

      // Validate exercise is accessible to this user.
      const [exercise] = await getDb()
        .select()
        .from(exercises)
        .where(and(
          eq(exercises.id, input.exerciseId),
          or(eq(exercises.isSystem, true), eq(exercises.userId, ctx.userId)),
        ));
      if (!exercise)
        throw new Error('Exercise not found');

      const [row] = await getDb()
        .insert(templateExercises)
        .values({
          templateId: input.templateId,
          exerciseId: input.exerciseId,
          sortOrder: input.sortOrder,
          targetSets: input.targetSets ?? null,
          targetReps: input.targetReps ?? null,
          targetRpe: input.targetRpe ?? null,
          restSeconds: input.restSeconds ?? null,
        })
        .returning();
      if (!row)
        throw new Error('Failed to add exercise to template');
      return row;
    }),

  updateTemplateExercise: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      sortOrder: z.number().int().nonnegative().optional(),
      targetSets: z.number().int().positive().nullable().optional(),
      targetReps: z.string().max(20).nullable().optional(),
      targetRpe: z.number().min(1).max(10).nullable().optional(),
      restSeconds: z.number().int().nonnegative().nullable().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...patch } = input;
      // We can't directly check ownership without joining; rely on the cascade FK relationship
      // — a user template_exercises row only exists if the parent template belongs to the user.
      // Defense in depth: verify parent template first.
      const [row] = await getDb()
        .select({ templateId: templateExercises.templateId })
        .from(templateExercises)
        .where(eq(templateExercises.id, id));
      if (!row)
        throw new Error('Template exercise not found');
      const [template] = await getDb()
        .select()
        .from(workoutTemplates)
        .where(and(eq(workoutTemplates.id, row.templateId), eq(workoutTemplates.userId, ctx.userId)));
      if (!template)
        throw new Error('Not authorized to modify this template');

      const [updated] = await getDb()
        .update(templateExercises)
        .set({ ...patch, updatedAt: new Date() })
        .where(eq(templateExercises.id, id))
        .returning();
      if (!updated)
        throw new Error('Failed to update template exercise');
      return updated;
    }),

  removeExercise: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [row] = await getDb()
        .select({ templateId: templateExercises.templateId })
        .from(templateExercises)
        .where(eq(templateExercises.id, input.id));
      if (!row)
        return { ok: true };
      const [template] = await getDb()
        .select()
        .from(workoutTemplates)
        .where(and(eq(workoutTemplates.id, row.templateId), eq(workoutTemplates.userId, ctx.userId)));
      if (!template)
        throw new Error('Not authorized to modify this template');

      await getDb()
        .delete(templateExercises)
        .where(eq(templateExercises.id, input.id));
      return { ok: true };
    }),
});
