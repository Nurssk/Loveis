import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, typography } from '@/constants/theme';
import { formatPrice } from '@/utils/format';

type Props = {
  regularPrice: number;
  teamPrice?: number;
  size?: 'sm' | 'lg';
};

/** Shows the regular price, struck through when a lower team price exists. */
export function PriceBlock({ regularPrice, teamPrice, size = 'sm' }: Props) {
  const hasTeam = typeof teamPrice === 'number' && teamPrice < regularPrice;
  const big = size === 'lg';

  return (
    <View>
      {hasTeam ? (
        <>
          <Text style={[styles.team, big && styles.teamLg]}>{formatPrice(teamPrice)}</Text>
          <Text style={[styles.regularStrike, big && styles.regularStrikeLg]}>
            {formatPrice(regularPrice)}
          </Text>
        </>
      ) : (
        <Text style={[styles.team, big && styles.teamLg]}>{formatPrice(regularPrice)}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  team: { ...typography.h3, color: colors.text },
  teamLg: { ...typography.display, color: colors.text },
  regularStrike: {
    ...typography.caption,
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  regularStrikeLg: { ...typography.body, color: colors.textMuted, textDecorationLine: 'line-through' },
});
