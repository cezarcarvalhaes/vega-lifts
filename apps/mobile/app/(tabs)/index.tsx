import { useRouter } from 'expo-router';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActiveWorkoutCard } from '../../src/components/workout/ActiveWorkoutCard';
import { StartWorkoutForm } from '../../src/components/workout/StartWorkoutForm';
import { colors, fontSize, spacing } from '../../src/constants/theme';
import { useWorkout } from '../../src/contexts/WorkoutContext';

export default function WorkoutTab() {
  const router = useRouter();
  const { activeWorkoutId, startWorkout, discardWorkout } = useWorkout();

  async function handleStart(name: string) {
    const id = await startWorkout(name);
    router.push({ pathname: '/workout/[id]', params: { id } });
  }

  function handleContinue() {
    if (activeWorkoutId) {
      router.push({ pathname: '/workout/[id]', params: { id: activeWorkoutId } });
    }
  }

  function handleDiscard() {
    if (!activeWorkoutId)
      return;
    Alert.alert('Discard workout?', 'This will delete the active workout and all its sets.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => discardWorkout(activeWorkoutId) },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        <Text style={styles.appName}>Vega Lifts</Text>

        {activeWorkoutId
          ? (
              <ActiveWorkoutCard onContinue={handleContinue} onDiscard={handleDiscard} />
            )
          : (
              <StartWorkoutForm onStart={handleStart} />
            )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
  },
  appName: {
    color: colors.text,
    fontSize: fontSize.xxl,
    fontWeight: '700',
    marginBottom: spacing.xxl,
  },
});
