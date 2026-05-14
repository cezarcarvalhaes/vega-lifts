import type { NewExercise } from './schema';
import { neon } from '@neondatabase/serverless';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-http';
import { exercises, templateExercises, workoutTemplates } from './schema';
import 'dotenv/config';

const SYSTEM_EXERCISES: Omit<NewExercise, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[] = [
  // ── Chest ──
  { name: 'Barbell Bench Press', type: 'weighted', primaryMuscleGroup: 'chest', equipment: 'barbell', isSystem: true, instructions: 'Lie flat on bench. Lower bar to chest, press to lockout.' },
  { name: 'Incline Barbell Bench Press', type: 'weighted', primaryMuscleGroup: 'chest', equipment: 'barbell', isSystem: true, instructions: 'Set bench to 30-45°. Press from upper chest to lockout.' },
  { name: 'Dumbbell Bench Press', type: 'weighted', primaryMuscleGroup: 'chest', equipment: 'dumbbell', isSystem: true, instructions: 'Press dumbbells from chest level to full extension.' },
  { name: 'Dumbbell Fly', type: 'weighted', primaryMuscleGroup: 'chest', equipment: 'dumbbell', isSystem: true, instructions: 'Arc arms out and down with slight elbow bend, return to start.' },
  { name: 'Cable Fly', type: 'weighted', primaryMuscleGroup: 'chest', equipment: 'cable', isSystem: true, instructions: 'Set cables high. Pull handles together in front of chest.' },
  { name: 'Push-Up', type: 'bodyweight', primaryMuscleGroup: 'chest', equipment: 'bodyweight', isSystem: true, instructions: 'Hands shoulder-width, lower chest to ground, push up.' },
  // ── Back ──
  { name: 'Barbell Deadlift', type: 'weighted', primaryMuscleGroup: 'back', equipment: 'barbell', isSystem: true, instructions: 'Hinge at hips, brace core, pull bar from floor to lockout.' },
  { name: 'Barbell Row', type: 'weighted', primaryMuscleGroup: 'back', equipment: 'barbell', isSystem: true, instructions: 'Hinge forward ~45°. Pull bar to lower chest, retract scapula.' },
  { name: 'Pull-Up', type: 'bodyweight', primaryMuscleGroup: 'back', equipment: 'bodyweight', isSystem: true, instructions: 'Hang from bar, pull chest to bar, lower with control.' },
  { name: 'Lat Pulldown', type: 'weighted', primaryMuscleGroup: 'back', equipment: 'cable', isSystem: true, instructions: 'Pull bar to upper chest, elbows drive down and back.' },
  { name: 'Cable Row', type: 'weighted', primaryMuscleGroup: 'back', equipment: 'cable', isSystem: true, instructions: 'Sit upright, pull handle to abdomen, squeeze shoulder blades.' },
  { name: 'Dumbbell Row', type: 'weighted', primaryMuscleGroup: 'back', equipment: 'dumbbell', isSystem: true, instructions: 'Support on bench, row dumbbell to hip, elbow close to body.' },
  // ── Shoulders ──
  { name: 'Overhead Press', type: 'weighted', primaryMuscleGroup: 'shoulders', equipment: 'barbell', isSystem: true, instructions: 'Press bar from shoulder height to full lockout overhead.' },
  { name: 'Dumbbell Shoulder Press', type: 'weighted', primaryMuscleGroup: 'shoulders', equipment: 'dumbbell', isSystem: true, instructions: 'Press dumbbells from ear level to overhead.' },
  { name: 'Lateral Raise', type: 'weighted', primaryMuscleGroup: 'shoulders', equipment: 'dumbbell', isSystem: true, instructions: 'Raise arms to sides to shoulder height, lower slowly.' },
  { name: 'Face Pull', type: 'weighted', primaryMuscleGroup: 'shoulders', equipment: 'cable', isSystem: true, instructions: 'Pull rope to face, flare elbows high, external rotate.' },
  // ── Biceps ──
  { name: 'Barbell Curl', type: 'weighted', primaryMuscleGroup: 'biceps', equipment: 'barbell', isSystem: true, instructions: 'Curl bar from hips to chin, control the descent.' },
  { name: 'Dumbbell Curl', type: 'weighted', primaryMuscleGroup: 'biceps', equipment: 'dumbbell', isSystem: true, instructions: 'Supinate as you curl, lower with control.' },
  { name: 'Hammer Curl', type: 'weighted', primaryMuscleGroup: 'biceps', equipment: 'dumbbell', isSystem: true, instructions: 'Neutral grip throughout, curl to shoulder height.' },
  { name: 'Cable Curl', type: 'weighted', primaryMuscleGroup: 'biceps', equipment: 'cable', isSystem: true, instructions: 'Curl handle from hip to shoulder, keep elbows fixed.' },
  // ── Triceps ──
  { name: 'Tricep Pushdown', type: 'weighted', primaryMuscleGroup: 'triceps', equipment: 'cable', isSystem: true, instructions: 'Keep elbows fixed at sides, push handle to full extension.' },
  { name: 'Skull Crusher', type: 'weighted', primaryMuscleGroup: 'triceps', equipment: 'barbell', isSystem: true, instructions: 'Lower bar to forehead, extend to lockout keeping elbows fixed.' },
  { name: 'Overhead Tricep Extension', type: 'weighted', primaryMuscleGroup: 'triceps', equipment: 'dumbbell', isSystem: true, instructions: 'Hold dumbbell overhead, lower behind head, extend.' },
  { name: 'Dip', type: 'bodyweight', primaryMuscleGroup: 'triceps', equipment: 'bodyweight', isSystem: true, instructions: 'Lower until elbows at 90°, press to lockout.' },
  // ── Quads ──
  { name: 'Barbell Back Squat', type: 'weighted', primaryMuscleGroup: 'quads', equipment: 'barbell', isSystem: true, instructions: 'Bar on traps, squat to depth, drive through heels to stand.' },
  { name: 'Front Squat', type: 'weighted', primaryMuscleGroup: 'quads', equipment: 'barbell', isSystem: true, instructions: 'Bar on front delts, upright torso, squat to depth.' },
  { name: 'Leg Press', type: 'weighted', primaryMuscleGroup: 'quads', equipment: 'machine', isSystem: true, instructions: 'Press platform until legs straight, lower with control.' },
  { name: 'Leg Extension', type: 'weighted', primaryMuscleGroup: 'quads', equipment: 'machine', isSystem: true, instructions: 'Extend legs to full lock, lower slowly.' },
  { name: 'Bulgarian Split Squat', type: 'weighted', primaryMuscleGroup: 'quads', equipment: 'dumbbell', isSystem: true, instructions: 'Rear foot elevated, squat on front leg to depth.' },
  // ── Hamstrings ──
  { name: 'Romanian Deadlift', type: 'weighted', primaryMuscleGroup: 'hamstrings', equipment: 'barbell', isSystem: true, instructions: 'Hinge at hips with soft knees, feel hamstring stretch, stand tall.' },
  { name: 'Leg Curl', type: 'weighted', primaryMuscleGroup: 'hamstrings', equipment: 'machine', isSystem: true, instructions: 'Curl heels to glutes, lower under control.' },
  { name: 'Nordic Curl', type: 'bodyweight', primaryMuscleGroup: 'hamstrings', equipment: 'bodyweight', isSystem: true, instructions: 'Anchor feet, lower torso to floor eccentrically, use arms to return.' },
  // ── Glutes ──
  { name: 'Hip Thrust', type: 'weighted', primaryMuscleGroup: 'glutes', equipment: 'barbell', isSystem: true, instructions: 'Shoulders on bench, drive hips up with bar on hips to full extension.' },
  { name: 'Cable Kickback', type: 'weighted', primaryMuscleGroup: 'glutes', equipment: 'cable', isSystem: true, instructions: 'Kick leg back and up against cable resistance, squeeze glute at top.' },
  // ── Calves ──
  { name: 'Standing Calf Raise', type: 'weighted', primaryMuscleGroup: 'calves', equipment: 'machine', isSystem: true, instructions: 'Full range of motion — stretch at bottom, pause at top.' },
  { name: 'Seated Calf Raise', type: 'weighted', primaryMuscleGroup: 'calves', equipment: 'machine', isSystem: true, instructions: 'Knees at 90°, full ROM, slow and controlled.' },
  // ── Core ──
  { name: 'Plank', type: 'timed', primaryMuscleGroup: 'core', equipment: 'bodyweight', isSystem: true, instructions: 'Forearms on ground, body straight from head to heels.' },
  { name: 'Ab Wheel Rollout', type: 'bodyweight', primaryMuscleGroup: 'core', equipment: 'other', isSystem: true, instructions: 'Roll out until hips extend, pull back with abs.' },
  { name: 'Cable Crunch', type: 'weighted', primaryMuscleGroup: 'core', equipment: 'cable', isSystem: true, instructions: 'Kneel, pull rope to forehead, crunch down against resistance.' },
  { name: 'Hanging Leg Raise', type: 'bodyweight', primaryMuscleGroup: 'core', equipment: 'bodyweight', isSystem: true, instructions: 'Hang from bar, raise legs to parallel or beyond, control descent.' },
];

interface TemplateExerciseSeed {
  exerciseName: string;
  targetSets: number;
  targetReps: string;
  restSeconds: number;
}

interface TemplateSeed {
  name: string;
  notes: string;
  exercises: TemplateExerciseSeed[];
}

const SYSTEM_TEMPLATES: TemplateSeed[] = [
  {
    name: 'Strong 5×5 — Workout A',
    notes: 'Classic linear-progression strength template. Alternate with Workout B.',
    exercises: [
      { exerciseName: 'Barbell Back Squat', targetSets: 5, targetReps: '5', restSeconds: 180 },
      { exerciseName: 'Barbell Bench Press', targetSets: 5, targetReps: '5', restSeconds: 180 },
      { exerciseName: 'Barbell Row', targetSets: 5, targetReps: '5', restSeconds: 180 },
    ],
  },
  {
    name: 'Strong 5×5 — Workout B',
    notes: 'Classic linear-progression strength template. Alternate with Workout A.',
    exercises: [
      { exerciseName: 'Barbell Back Squat', targetSets: 5, targetReps: '5', restSeconds: 180 },
      { exerciseName: 'Overhead Press', targetSets: 5, targetReps: '5', restSeconds: 180 },
      { exerciseName: 'Barbell Deadlift', targetSets: 1, targetReps: '5', restSeconds: 240 },
    ],
  },
  {
    name: 'Upper Day',
    notes: 'Upper body — push, pull, isolation.',
    exercises: [
      { exerciseName: 'Barbell Bench Press', targetSets: 4, targetReps: '6-8', restSeconds: 150 },
      { exerciseName: 'Barbell Row', targetSets: 4, targetReps: '6-8', restSeconds: 150 },
      { exerciseName: 'Overhead Press', targetSets: 3, targetReps: '8-10', restSeconds: 120 },
      { exerciseName: 'Lat Pulldown', targetSets: 3, targetReps: '10-12', restSeconds: 90 },
      { exerciseName: 'Barbell Curl', targetSets: 3, targetReps: '10-12', restSeconds: 60 },
      { exerciseName: 'Tricep Pushdown', targetSets: 3, targetReps: '10-12', restSeconds: 60 },
    ],
  },
  {
    name: 'Lower Day',
    notes: 'Lower body — squat, hinge, accessories.',
    exercises: [
      { exerciseName: 'Barbell Back Squat', targetSets: 4, targetReps: '6-8', restSeconds: 180 },
      { exerciseName: 'Romanian Deadlift', targetSets: 4, targetReps: '8-10', restSeconds: 150 },
      { exerciseName: 'Leg Press', targetSets: 3, targetReps: '10-12', restSeconds: 120 },
      { exerciseName: 'Leg Curl', targetSets: 3, targetReps: '10-12', restSeconds: 90 },
      { exerciseName: 'Standing Calf Raise', targetSets: 4, targetReps: '12-15', restSeconds: 60 },
    ],
  },
];

async function seed() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }
  const sql = neon(databaseUrl);
  const db = drizzle(sql, { schema: { exercises, workoutTemplates, templateExercises } });

  // Clear in dependency order: templates cascade-delete their template_exercises;
  // then exercises (which can't be deleted while referenced).
  console.log('Clearing existing system templates...');
  await db.delete(workoutTemplates).where(eq(workoutTemplates.isSystem, true));

  console.log('Clearing existing system exercises...');
  await db.delete(exercises).where(eq(exercises.isSystem, true));

  console.log(`Seeding ${SYSTEM_EXERCISES.length} system exercises...`);
  const insertedExercises = await db
    .insert(exercises)
    .values(SYSTEM_EXERCISES.map((e) => ({ ...e, userId: null })))
    .returning();

  const exerciseIdByName = new Map(insertedExercises.map((e) => [e.name, e.id]));

  console.log(`Seeding ${SYSTEM_TEMPLATES.length} system templates...`);
  for (const template of SYSTEM_TEMPLATES) {
    const [inserted] = await db
      .insert(workoutTemplates)
      .values({
        userId: null,
        name: template.name,
        notes: template.notes,
        isSystem: true,
      })
      .returning();
    if (!inserted)
      throw new Error(`Failed to insert template ${template.name}`);

    const rows = template.exercises.map((ex, idx) => {
      const exerciseId = exerciseIdByName.get(ex.exerciseName);
      if (!exerciseId)
        throw new Error(`Unknown exercise "${ex.exerciseName}" in template "${template.name}"`);
      return {
        templateId: inserted.id,
        exerciseId,
        sortOrder: idx,
        targetSets: ex.targetSets,
        targetReps: ex.targetReps,
        restSeconds: ex.restSeconds,
      };
    });
    await db.insert(templateExercises).values(rows);
  }

  console.log('Seed complete.');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
