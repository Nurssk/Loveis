import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Image, ImageStyle, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { CATEGORY_BY_ID } from '@/data/categories';
import { colors } from '@/constants/theme';

type Props = {
  uri: string;
  category?: string;
  style?: StyleProp<ImageStyle & ViewStyle>;
  iconSize?: number;
};

/** Image with a graceful category-icon fallback when loading fails. */
export function ProductImage({ uri, category, style, iconSize = 40 }: Props) {
  const [failed, setFailed] = useState(false);
  const cat = category ? CATEGORY_BY_ID[category] : undefined;

  if (failed || !uri) {
    return (
      <View style={[styles.fallback, { backgroundColor: (cat?.color ?? colors.primary) + '18' }, style as StyleProp<ViewStyle>]}>
        <Ionicons
          name={(cat?.icon as keyof typeof Ionicons.glyphMap) ?? 'cube-outline'}
          size={iconSize}
          color={cat?.color ?? colors.primary}
        />
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={[styles.image, style]}
      resizeMode="cover"
      onError={() => setFailed(true)}
    />
  );
}

const styles = StyleSheet.create({
  image: { backgroundColor: colors.surfaceAlt },
  fallback: { alignItems: 'center', justifyContent: 'center' },
});
