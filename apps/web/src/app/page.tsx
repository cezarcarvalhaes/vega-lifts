import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs'

export default function HomePage() {
  return (
    <main style={{ padding: '2rem' }}>
      <h1>Vega Lifts</h1>
      <SignedOut>
        <SignInButton />
      </SignedOut>
      <SignedIn>
        <UserButton />
        <p>Welcome back. History and analytics coming in Phase 2.</p>
      </SignedIn>
    </main>
  )
}
