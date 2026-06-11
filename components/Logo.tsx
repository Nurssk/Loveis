import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/constants/theme';

const MARK = require('@/assets/birge-logo.png');

type Props = { size?: 'sm' | 'lg'; showWord?: boolean };

/** Brand lockup: the BirGe squircle mark + optional wordmark. */
export function Logo({ size = 'lg', showWord = true }: Props) {
  const mark = size === 'lg' ? 52 : 34;
  return (
    <View style={styles.row}>
      <Image source={MARK} style={{ width: mark, height: mark }} resizeMode="contain" />
      {showWord ? (
        <Text style={[styles.word, size === 'lg' ? typography.h1 : typography.h3]}>
          Bir<Text style={styles.accent}>Ge</Text>
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  word: { color: colors.text },
  accent: { color: colors.primary },
});
