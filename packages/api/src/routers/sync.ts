import { z } from 'zod'
import { protectedProcedure, router } from '../trpc'

/**
 * WatermelonDB sync endpoints — Phase 3 implementation.
 * Stubs are here so tRPC types are available to the client in Phase 0.
 */
export const syncRouter = router({
  pull: protectedProcedure
    .input(
      z.object({
        lastPulledAt: z.number().nullable(),
        schemaVersion: z.number(),
        migration: z.unknown().nullable(),
      }),
    )
    .query(async () => {
      // Phase 3: return delta changes since lastPulledAt
      return {
        changes: {},
        timestamp: Date.now(),
      }
    }),

  push: protectedProcedure
    .input(
      z.object({
        lastPulledAt: z.number(),
        changes: z.unknown(),
      }),
    )
    .mutation(async () => {
      // Phase 3: apply changes to Postgres
      return { ok: true }
    }),
})
