import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radius, spacing } from '../../../shared/constants/theme';

interface Props {
  onContinue: () => void;
  onDiscard: () => void;
}

export function ActiveWorkoutCard({ onContinue, onDiscard }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>Workout in progress</Text>
      <Pressable style={styles.continueBtn} onPress={onContinue}>
        <Text style={styles.continueBtnText}>Continue Workout →</Text>
      </Pressable>
      <Pressable style={styles.discardLink} onPress={onDiscard}>
        <Text style={styles.discardLinkText}>Discard workout</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: `${colors.accent}40`,
    gap: spacing.md,
  },
  label: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  continueBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  continueBtnText: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  discardLink: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  discardLinkText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
});
