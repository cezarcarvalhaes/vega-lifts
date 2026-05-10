import { ClerkProvider } from '@clerk/clerk-expo';
import { Stack } from 'expo-router';
import { AuthRedirect } from '../src/components/AuthRedirect';
import { ExerciseBootstrap } from '../src/components/ExerciseBootstrap';
import { colors } from '../src/constants/theme';
import { PreferencesProvider } from '../src/contexts/PreferencesContext';
import { WorkoutProvider } from '../src/contexts/WorkoutContext';
import { CLERK_PUBLISHABLE_KEY, tokenCache } from '../src/lib/clerk';
import { configureNotifications } from '../src/lib/notifications';
import { DatabaseProvider } from '../src/providers/DatabaseProvider';
import { TrpcProvider } from '../src/providers/TrpcProvider';

configureNotifications();

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
      <DatabaseProvider>
        <PreferencesProvider>
          <WorkoutProvider>
            <AuthRedirect />
            <TrpcProvider>
              <ExerciseBootstrap />
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen
                  name="workout/[id]"
                  options={{ animation: 'slide_from_bottom' }}
                />
                <Stack.Screen
                  name="workout/add-exercise"
                  options={{
                    presentation: 'modal',
                    headerShown: true,
                    title: 'Add Exercise',
                    headerStyle: { backgroundColor: colors.surface },
                    headerTintColor: colors.text,
                    headerShadowVisible: false,
                  }}
                />
              </Stack>
            </TrpcProvider>
          </WorkoutProvider>
        </PreferencesProvider>
      </DatabaseProvider>
    </ClerkProvider>
  );
}
