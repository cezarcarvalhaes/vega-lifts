import { exercisesRouter } from './routers/exercises';
import { syncRouter } from './routers/sync';
import { templatesRouter } from './routers/templates';
import { router } from './trpc';

export const appRouter = router({
  exercises: exercisesRouter,
  sync: syncRouter,
  templates: templatesRouter,
});

export type AppRouter = typeof appRouter;
