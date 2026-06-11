import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/constants/theme';

export function Logo({ size = 'lg' }: { size?: 'sm' | 'lg' }) {
  const big = size === 'lg';
  const mark = big ? 56 : 36;
  return (
    <View style={styles.row}>
      <View style={[styles.mark, { width: mark, height: mark, borderRadius: mark / 3 }]}>
        <Ionicons name="people" size={mark * 0.55} color={colors.textInverse} />
      </View>
      <Text style={[styles.word, big ? typography.h1 : typography.h3]}>
        Bir<Text style={styles.accent}>Ge</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  mark: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
  },
  word: { color: colors.text },
  accent: { color: colors.primary },
});
