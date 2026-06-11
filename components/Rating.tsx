import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, typography } from '@/constants/theme';

export function Rating({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <View style={styles.row} accessibilityLabel={`Рейтинг ${value} из 5`}>
      <Ionicons name="star" size={size} color={colors.star} />
      <Text style={[styles.text, { fontSize: size }]}>{value.toFixed(1)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  text: { ...typography.caption, color: colors.textSecondary, fontWeight: '700' },
});
