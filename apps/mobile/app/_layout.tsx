import { ClerkProvider } from '@clerk/clerk-expo';
import { Stack } from 'expo-router';
import { PreferencesProvider } from '../src/features/preferences/context/PreferencesContext';
import { WorkoutProvider } from '../src/features/workout/context/WorkoutContext';
import { AuthRedirect } from '../src/providers/AuthRedirect';
import { DatabaseProvider } from '../src/providers/DatabaseProvider';
import { ExerciseBootstrap } from '../src/providers/ExerciseBootstrap';
import { TemplateBootstrap } from '../src/providers/TemplateBootstrap';
import { TrpcProvider } from '../src/providers/TrpcProvider';
import { colors } from '../src/shared/constants/theme';
import { CLERK_PUBLISHABLE_KEY, tokenCache } from '../src/shared/lib/clerk';
import { configureNotifications } from '../src/shared/lib/notifications';

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
              <TemplateBootstrap />
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
                <Stack.Screen name="templates/[id]" />
                <Stack.Screen
                  name="templates/add-exercise"
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
