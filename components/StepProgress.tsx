import React from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, radii, spacing } from '@/constants/theme';

/** Segmented progress bar for multi-step flows (current is 1-based). */
export function StepProgress({ total, current }: { total: number; current: number }) {
  return (
    <View style={styles.row}>
      {Array.from({ length: total }, (_, i) => (
        <View key={i} style={[styles.segment, i < current && styles.filled]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.xs },
  segment: { flex: 1, height: 4, borderRadius: radii.pill, backgroundColor: colors.surfaceStrong },
  filled: { backgroundColor: colors.primary },
});
