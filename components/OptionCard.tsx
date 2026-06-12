import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { colors, radii, spacing, typography } from '@/constants/theme';

type Props = {
  title: string;
  subtitle?: string;
  /** Right-aligned value, e.g. a price or "+5 000 ₸". */
  price?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  selected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
};

/**
 * Selectable card used across the booking-style flows (delivery, payment, fares,
 * team choices). Soft-coral fill + coral border when selected; radio on the right.
 */
export function OptionCard({ title, subtitle, price, icon, selected, onPress, style }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      style={[styles.card, selected && styles.cardSelected, style]}
    >
      {icon ? (
        <Ionicons name={icon} size={20} color={selected ? colors.primary : colors.textSecondary} />
      ) : null}
      <View style={styles.body}>
        <Text style={[styles.title, selected && styles.titleSelected]}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {price ? <Text style={[styles.price, selected && styles.titleSelected]}>{price}</Text> : null}
      <Ionicons
        name={selected ? 'radio-button-on' : 'radio-button-off'}
        size={20}
        color={selected ? colors.primary : colors.borderStrong}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  cardSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  body: { flex: 1 },
  title: { ...typography.bodyStrong, color: colors.text },
  titleSelected: { color: colors.primaryDark },
  subtitle: { ...typography.caption, color: colors.textSecondary, marginTop: 1 },
  price: { ...typography.bodyStrong, color: colors.text },
});
