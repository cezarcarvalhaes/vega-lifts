import { getDayName } from '@vega/types';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, fontSize, radius, spacing } from '../../constants/theme';

interface Props {
  onStart: (name: string) => Promise<void>;
}

export function StartWorkoutForm({ onStart }: Props) {
  const [name, setName] = useState('');
  const [starting, setStarting] = useState(false);

  const placeholder = `${getDayName()} Session`;

  async function handleStart() {
    if (starting)
      return;
    setStarting(true);
    try {
      await onStart(name.trim() || placeholder);
      setName('');
    }
    finally {
      setStarting(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>New Workout</Text>
      <TextInput
        style={styles.nameInput}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        value={name}
        onChangeText={setName}
        returnKeyType="done"
        onSubmitEditing={handleStart}
      />
      <Pressable
        style={[styles.startBtn, starting && styles.startBtnDisabled]}
        onPress={handleStart}
        disabled={starting}
      >
        <Text style={styles.startBtnText}>
          {starting ? 'Starting...' : 'Start Workout'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  label: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  nameInput: {
    height: 52,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    color: colors.text,
    fontSize: fontSize.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  startBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    paddingVertical: spacing.md + 4,
    alignItems: 'center',
  },
  startBtnDisabled: {
    opacity: 0.5,
  },
  startBtnText: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
});
