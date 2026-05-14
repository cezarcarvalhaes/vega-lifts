import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import { createClerkClient, verifyToken } from '@clerk/backend';
import { initTRPC, TRPCError } from '@trpc/server';
import { getDb, users } from '@vega/db';
import superjson from 'superjson';

// In-memory set so we only hit Clerk + DB once per server process per user
const provisionedUsers = new Set<string>();

function getClerkClient() {
  return createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });
}

export async function createContext({ req }: CreateExpressContextOptions) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token)
    return { userId: null };

  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey)
    return { userId: null };

  try {
    const payload = await verifyToken(token, { secretKey });
    return { userId: payload.sub };
  } catch {
    return { userId: null };
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create({ transformer: superjson });

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  if (!provisionedUsers.has(ctx.userId)) {
    try {
      const clerkUser = await getClerkClient().users.getUser(ctx.userId);
      const email = clerkUser.emailAddresses[0]?.emailAddress ?? '';
      await getDb()
        .insert(users)
        .values({ id: ctx.userId, email })
        .onConflictDoNothing();
      provisionedUsers.add(ctx.userId);
    } catch (err) {
      console.error('User provisioning failed:', err);
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'User provisioning failed' });
    }
  }
  return next({ ctx: { userId: ctx.userId } });
});
