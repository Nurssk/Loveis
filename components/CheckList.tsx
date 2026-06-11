import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/constants/theme';

/** Two-column green-check benefit list (reference "what's included" pattern). */
export function CheckList({ items }: { items: string[] }) {
  return (
    <View style={styles.grid}>
      {items.map((item) => (
        <View key={item} style={styles.row}>
          <Ionicons name="checkmark-circle" size={16} color={colors.success} />
          <Text style={styles.text}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, width: '50%', paddingRight: spacing.sm },
  text: { ...typography.caption, color: colors.text, flex: 1 },
});
