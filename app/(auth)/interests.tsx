import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { ScreenContainer } from '@/components/ScreenContainer';
import { CATEGORIES } from '@/data/categories';
import { colors, radii, shadows, spacing, typography } from '@/constants/theme';
import { useApp } from '@/store/AppContext';

const MIN_SELECTED = 2;

export default function InterestsScreen() {
  const router = useRouter();
  const { state, setInterests } = useApp();
  const [selected, setSelected] = useState<string[]>(state.profile?.interests ?? []);

  const toggle = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const enough = selected.length >= MIN_SELECTED;

  const onContinue = () => {
    if (!enough) return;
    setInterests(selected);
    router.replace('/(tabs)/home');
  };

  return (
    <ScreenContainer
      footer={
        <AppButton
          title={enough ? 'Показать рекомендации' : `Выберите ещё ${MIN_SELECTED - selected.length}`}
          icon="sparkles"
          onPress={onContinue}
          disabled={!enough}
        />
      }
    >
      <Text style={styles.title}>Что вам интересно?</Text>
      <Text style={styles.subtitle}>
        Выберите минимум {MIN_SELECTED} категории — подберём подходящие товары и команды.
      </Text>

      <View style={styles.counterRow}>
        <Ionicons name="checkmark-circle" size={16} color={enough ? colors.success : colors.textMuted} />
        <Text style={[styles.counter, enough && styles.counterOk]}>Выбрано: {selected.length}</Text>
      </View>

      <View style={styles.grid}>
        {CATEGORIES.map((cat) => {
          const active = selected.includes(cat.id);
          return (
            <Pressable
              key={cat.id}
              onPress={() => toggle(cat.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={cat.label}
              style={({ pressed }) => [styles.card, active && styles.cardActive, pressed && styles.pressed]}
            >
              {active ? (
                <View style={styles.check}>
                  <Ionicons name="checkmark" size={14} color={colors.textInverse} />
                </View>
              ) : null}
              <View style={[styles.iconCircle, { backgroundColor: cat.color + '1A' }]}>
                <Ionicons name={cat.icon as keyof typeof Ionicons.glyphMap} size={26} color={cat.color} />
              </View>
              <Text style={[styles.cardLabel, active && styles.cardLabelActive]}>{cat.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.h1, color: colors.text, marginTop: spacing.xl },
  subtitle: { ...typography.body, color: colors.textSecondary, marginTop: spacing.sm, lineHeight: 22 },
  counterRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.lg },
  counter: { ...typography.caption, color: colors.textMuted, fontWeight: '700' },
  counterOk: { color: colors.success },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.md,
    marginTop: spacing.lg,
  },
  card: {
    width: '31.5%',
    aspectRatio: 0.92,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
    ...shadows.card,
  },
  cardActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  pressed: { opacity: 0.85 },
  check: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 22,
    height: 22,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  cardLabel: { ...typography.small, color: colors.textSecondary, textAlign: 'center' },
  cardLabelActive: { color: colors.primaryDark },
});
