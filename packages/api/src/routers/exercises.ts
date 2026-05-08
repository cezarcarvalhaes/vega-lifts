import { exercises, getDb } from '@vega/db'
import { eq, or } from 'drizzle-orm'
import { z } from 'zod'
import { protectedProcedure, publicProcedure, router } from '../trpc'

const ExerciseTypeSchema = z.enum(['weighted', 'bodyweight', 'timed'])
const MuscleGroupSchema = z.enum([
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'forearms',
  'core',
  'quads',
  'hamstrings',
  'glutes',
  'calves',
  'full_body',
  'other',
])
const EquipmentSchema = z.enum([
  'barbell',
  'dumbbell',
  'cable',
  'machine',
  'bodyweight',
  'kettlebell',
  'bands',
  'other',
])

export const exercisesRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return getDb()
      .select()
      .from(exercises)
      .where(or(eq(exercises.isSystem, true), eq(exercises.userId, ctx.userId)))
  }),

  listSystem: publicProcedure.query(async () => {
    return getDb().select().from(exercises).where(eq(exercises.isSystem, true))
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        type: ExerciseTypeSchema,
        primaryMuscleGroup: MuscleGroupSchema,
        equipment: EquipmentSchema,
        instructions: z.string().max(1000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [exercise] = await getDb()
        .insert(exercises)
        .values({ ...input, userId: ctx.userId, isSystem: false })
        .returning()
      return exercise
    }),
})
