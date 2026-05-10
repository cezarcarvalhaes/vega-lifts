import { exercisesRouter } from './routers/exercises';
import { syncRouter } from './routers/sync';
import { router } from './trpc';

export const appRouter = router({
  exercises: exercisesRouter,
  sync: syncRouter,
});

export type AppRouter = typeof appRouter;
