import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

import { colors, radii, spacing, typography } from '@/constants/theme';

type Props = {
  label: string;
  color?: string;
  background?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
};

export function Badge({ label, color = colors.primaryDark, background = colors.primarySoft, icon, style }: Props) {
  return (
    <View style={[styles.badge, { backgroundColor: background }, style]}>
      {icon ? <Ionicons name={icon} size={12} color={color} style={styles.icon} /> : null}
      <Text style={[styles.text, { color }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  icon: { marginRight: 4 },
  text: { ...typography.small },
});
