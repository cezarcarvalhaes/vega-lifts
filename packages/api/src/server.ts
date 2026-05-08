import { createExpressMiddleware } from '@trpc/server/adapters/express'
import cors from 'cors'
import express from 'express'
import { appRouter } from './router'
import { createContext } from './trpc'
import 'dotenv/config'

const app = express()
const PORT = process.env.PORT ?? 3001

app.use(
  cors({
    origin: [
      process.env.WEB_URL ?? 'http://localhost:3000',
    ],
    credentials: true,
  }),
)

app.use(
  '/trpc',
  createExpressMiddleware({
    router: appRouter,
    createContext,
  }),
)

app.get('/health', (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() })
})

app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`)
})
