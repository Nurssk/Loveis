import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/constants/theme';

export function ErrorMessage({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <View style={styles.wrapper} accessibilityRole="alert">
      <Ionicons name="alert-circle" size={16} color={colors.danger} style={styles.icon} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerSoft,
    borderRadius: radii.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  icon: { marginRight: spacing.sm },
  text: { ...typography.caption, color: colors.danger, flex: 1 },
});
