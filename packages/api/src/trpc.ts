import type { CreateExpressContextOptions } from '@trpc/server/adapters/express'
import { verifyToken } from '@clerk/backend'
import { initTRPC, TRPCError } from '@trpc/server'
import superjson from 'superjson'

export async function createContext({ req }: CreateExpressContextOptions) {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token)
    return { userId: null }

  const secretKey = process.env.CLERK_SECRET_KEY
  if (!secretKey)
    return { userId: null }

  try {
    const payload = await verifyToken(token, { secretKey })
    return { userId: payload.sub }
  }
  catch {
    return { userId: null }
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>

const t = initTRPC.context<Context>().create({ transformer: superjson })

export const router = t.router
export const publicProcedure = t.procedure

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({ ctx: { userId: ctx.userId } })
})
