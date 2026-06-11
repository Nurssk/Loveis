import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/constants/theme';

/** Compact "−X%" pill used on cards and the product page. */
export function TeamDiscountBadge({ percent }: { percent: number }) {
  if (percent <= 0) return null;
  return (
    <View style={styles.badge}>
      <Ionicons name="people" size={12} color={colors.textInverse} />
      <Text style={styles.text}>−{percent}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.success,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  text: { ...typography.small, color: colors.textInverse },
});
