import { getDayName } from '@vega/types';
import { useRouter } from 'expo-router';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActiveWorkoutCard } from '../../src/features/workout/components/ActiveWorkoutCard';
import { TemplatePicker } from '../../src/features/workout/components/TemplatePicker';
import { useWorkout } from '../../src/features/workout/context/WorkoutContext';
import { colors, fontSize, spacing } from '../../src/shared/constants/theme';

export default function WorkoutTab() {
  const router = useRouter();
  const { activeWorkoutId, startWorkout, startWorkoutFromTemplate, discardWorkout } = useWorkout();

  async function handleStartFromTemplate(templateId: string) {
    const id = await startWorkoutFromTemplate(templateId);
    router.push({ pathname: '/workout/[id]', params: { id } });
  }

  async function handleStartEmpty() {
    const id = await startWorkout(`${getDayName()} Session`);
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
              <TemplatePicker
                onStartFromTemplate={handleStartFromTemplate}
                onStartEmpty={handleStartEmpty}
              />
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
