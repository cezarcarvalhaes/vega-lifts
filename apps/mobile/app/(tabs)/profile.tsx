import { useAuth, useUser } from '@clerk/clerk-expo';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePreferences } from '../../src/features/preferences/context/PreferencesContext';
import { colors, fontSize, radius, spacing } from '../../src/shared/constants/theme';

const REST_PRESETS = [30, 60, 90, 120, 180, 240, 300];

export default function ProfileTab() {
  const { signOut } = useAuth();
  const { user } = useUser();
  const { preferences, updatePreferences } = usePreferences();

  function formatRest(seconds: number): string {
    if (seconds < 60)
      return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return s === 0 ? `${m}m` : `${m}m ${s}s`;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Settings</Text>

        {/* Units */}
        <Text style={styles.sectionHeader}>Units</Text>
        <View style={styles.card}>
          <View style={styles.segmentRow}>
            {(['kg', 'lb'] as const).map((unit) => (
              <Pressable
                key={unit}
                style={[styles.segment, preferences.unitSystem === unit && styles.segmentActive]}
                onPress={() => updatePreferences({ unitSystem: unit })}
              >
                <Text style={[styles.segmentText, preferences.unitSystem === unit && styles.segmentTextActive]}>
                  {unit.toUpperCase()}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Rest Timer */}
        <Text style={styles.sectionHeader}>Rest Timer</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Auto-start after set</Text>
            <Switch
              value={preferences.autoStartRestTimer}
              onValueChange={(v) => updatePreferences({ autoStartRestTimer: v })}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor={colors.text}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Sound</Text>
            <Switch
              value={preferences.restTimerSound}
              onValueChange={(v) => updatePreferences({ restTimerSound: v })}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor={colors.text}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Haptics</Text>
            <Switch
              value={preferences.restTimerHaptics}
              onValueChange={(v) => updatePreferences({ restTimerHaptics: v })}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor={colors.text}
            />
          </View>
          <View style={styles.divider} />
          <View>
            <Text style={styles.rowLabel}>Default duration</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presets} style={{ marginTop: spacing.sm }}>
              {REST_PRESETS.map((s) => (
                <Pressable
                  key={s}
                  style={[styles.preset, preferences.defaultRestSeconds === s && styles.presetActive]}
                  onPress={() => updatePreferences({ defaultRestSeconds: s })}
                >
                  <Text style={[styles.presetText, preferences.defaultRestSeconds === s && styles.presetTextActive]}>
                    {formatRest(s)}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Account */}
        <Text style={styles.sectionHeader}>Account</Text>
        <View style={styles.card}>
          <Text style={styles.email}>{user?.primaryEmailAddress?.emailAddress}</Text>
          <View style={styles.divider} />
          <Pressable onPress={() => signOut()} style={styles.signOutRow}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  title: {
    color: colors.text,
    fontSize: fontSize.xxl,
    fontWeight: '700',
    paddingTop: spacing.md,
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginTop: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  segmentRow: { flexDirection: 'row', gap: spacing.sm },
  segment: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.card,
  },
  segmentActive: { borderColor: colors.accent, backgroundColor: `${colors.accent}20` },
  segmentText: { color: colors.textSecondary, fontSize: fontSize.md, fontWeight: '500' },
  segmentTextActive: { color: colors.accent, fontWeight: '700' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  rowLabel: { flex: 1, color: colors.text, fontSize: fontSize.md },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.xs },
  presets: { gap: spacing.sm, paddingBottom: spacing.xs },
  preset: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  presetActive: { borderColor: colors.accent, backgroundColor: `${colors.accent}20` },
  presetText: { color: colors.textSecondary, fontSize: fontSize.sm },
  presetTextActive: { color: colors.accent, fontWeight: '600' },
  email: { color: colors.textSecondary, fontSize: fontSize.sm, paddingVertical: spacing.sm },
  signOutRow: { paddingVertical: spacing.sm },
  signOutText: { color: colors.accent, fontSize: fontSize.md },
});
