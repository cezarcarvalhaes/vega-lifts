import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { PostHogProvider } from '@/providers/PostHogProvider'
import { TrpcProvider } from '@/providers/TrpcProvider'
import './globals.css'

export const metadata: Metadata = {
  title: 'Vega Lifts',
  description: 'A no-frills lifting app for getting strong',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <PostHogProvider>
            <TrpcProvider>{children}</TrpcProvider>
          </PostHogProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
