import type { RestTimerState } from '../hooks/useRestTimer';
import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radius, spacing } from '../constants/theme';

interface Props {
  timer: RestTimerState;
  onStop: () => void;
}

function formatSeconds(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export function RestTimerOverlay({ timer, onStop }: Props) {
  if (!timer.isActive)
    return null;

  const progress = timer.total > 0 ? timer.remaining / timer.total : 0;
  const isAlmostDone = timer.remaining <= 5;

  return (
    <View style={styles.container} pointerEvents="box-none">
      <View style={styles.card}>
        <Text style={styles.label}>Rest</Text>
        <Text style={[styles.countdown, isAlmostDone && styles.countdownUrgent]}>
          {formatSeconds(timer.remaining)}
        </Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressBar, { width: `${progress * 100}%` as `${number}%` }]} />
        </View>
        <Pressable style={styles.stopBtn} onPress={onStop} hitSlop={8}>
          <Text style={styles.stopText}>Skip</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: spacing.lg,
    right: spacing.lg,
    alignItems: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 12,
  },
  label: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  countdown: {
    color: colors.text,
    fontSize: fontSize.xxl + 12,
    fontWeight: '200',
    fontVariant: ['tabular-nums'],
    letterSpacing: 2,
  },
  countdownUrgent: {
    color: colors.accent,
  },
  progressTrack: {
    width: '100%',
    height: 2,
    backgroundColor: colors.border,
    borderRadius: 1,
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  progressBar: {
    height: 2,
    backgroundColor: colors.accent,
    borderRadius: 1,
  },
  stopBtn: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  stopText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
});
