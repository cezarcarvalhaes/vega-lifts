import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fontSize } from '../../src/shared/constants/theme';

export default function HistoryTab() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        <Text style={styles.title}>History</Text>
        <Text style={styles.subtitle}>Workout history coming in Phase 2</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  title: { color: colors.text, fontSize: fontSize.xl, fontWeight: '700' },
  subtitle: { color: colors.textSecondary, fontSize: fontSize.sm },
});
