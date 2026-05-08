import { ClerkProvider, useAuth } from '@clerk/clerk-expo'
import Constants from 'expo-constants'
import { Slot, useRouter, useSegments } from 'expo-router'
import * as SecureStore from 'expo-secure-store'
import { useEffect } from 'react'
import { DatabaseProvider } from '../src/providers/DatabaseProvider'
import { TrpcProvider } from '../src/providers/TrpcProvider'

const CLERK_PUBLISHABLE_KEY
  = Constants.expoConfig?.extra?.clerkPublishableKey
    ?? process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY
    ?? ''

const tokenCache = {
  async getToken(key: string) {
    return SecureStore.getItemAsync(key)
  },
  async saveToken(key: string, value: string) {
    return SecureStore.setItemAsync(key, value)
  },
}

function AuthGuard() {
  const { isSignedIn, isLoaded } = useAuth()
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    if (!isLoaded)
      return
    const inAuthGroup = segments[0] === '(auth)'
    if (!isSignedIn && !inAuthGroup) {
      router.replace('/(auth)/sign-in')
    }
    else if (isSignedIn && inAuthGroup) {
      router.replace('/(tabs)')
    }
  }, [isSignedIn, isLoaded, segments, router])

  return <Slot />
}

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
      <DatabaseProvider>
        <TrpcProvider>
          <AuthGuard />
        </TrpcProvider>
      </DatabaseProvider>
    </ClerkProvider>
  )
}
