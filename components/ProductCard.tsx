import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/Badge';
import { PriceBlock } from '@/components/PriceBlock';
import { ProductImage } from '@/components/ProductImage';
import { Rating } from '@/components/Rating';
import { TeamDiscountBadge } from '@/components/TeamDiscountBadge';
import { categoryLabel } from '@/data/categories';
import { colors, radii, shadows, spacing, typography } from '@/constants/theme';
import { Product } from '@/types';
import { teamDiscountPercent, teamPrice } from '@/utils/discount';
import { formatPrice } from '@/utils/format';

type Props = {
  product: Product;
  /** Team size used to preview a potential team price. Defaults to a 3-person example. */
  teamMemberCount?: number;
  reason?: string;
  variant?: 'shelf' | 'list';
  onPress?: () => void;
};

export function ProductCard({ product, teamMemberCount, reason, variant = 'shelf', onPress }: Props) {
  // When the user has no team yet, preview the typical 3-person discount.
  const previewCount = teamMemberCount && teamMemberCount > 0 ? teamMemberCount : 3;
  const percent = teamDiscountPercent(previewCount);
  const tPrice = teamPrice(product.regularPrice, previewCount);
  const savings = product.regularPrice - tPrice;
  const isList = variant === 'list';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${product.title}, ${formatPrice(product.regularPrice)}`}
      style={({ pressed }) => [
        styles.card,
        isList ? styles.listCard : styles.shelfCard,
        pressed && styles.pressed,
      ]}
    >
      <View style={isList ? styles.listImageWrap : styles.shelfImageWrap}>
        <ProductImage uri={product.image} category={product.category} style={styles.image} />
        <View style={styles.discountOverlay}>
          <TeamDiscountBadge percent={percent} />
        </View>
      </View>

      <View style={isList ? styles.listBody : styles.shelfBody}>
        {reason ? <Badge label={reason} icon="pricetag" /> : null}
        <Text style={styles.title} numberOfLines={2}>
          {product.title}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.meta} numberOfLines={1}>
            {categoryLabel(product.category)} · {product.marketplace}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <Rating value={product.rating} />
          <View style={styles.buyers}>
            <Ionicons name="people-outline" size={13} color={colors.textMuted} />
            <Text style={styles.buyersText}>{product.activeBuyers}</Text>
          </View>
        </View>

        <View style={styles.priceRow}>
          <PriceBlock regularPrice={product.regularPrice} teamPrice={tPrice} />
        </View>
        {savings > 0 ? (
          <Text style={styles.savings}>Экономия {formatPrice(savings)} в команде</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.card,
  },
  pressed: { opacity: 0.9, transform: [{ scale: 0.995 }] },
  shelfCard: { width: 210 },
  listCard: { flexDirection: 'row', width: '100%' },
  shelfImageWrap: { width: '100%', height: 140 },
  listImageWrap: { width: 120, height: 'auto' },
  image: { width: '100%', height: '100%' },
  discountOverlay: { position: 'absolute', top: spacing.sm, left: spacing.sm },
  shelfBody: { padding: spacing.md },
  listBody: { flex: 1, padding: spacing.md },
  title: { ...typography.bodyStrong, color: colors.text, marginTop: spacing.xs, lineHeight: 20 },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.xs },
  meta: { ...typography.caption, color: colors.textSecondary, flex: 1 },
  buyers: { flexDirection: 'row', alignItems: 'center', gap: 3, marginLeft: spacing.sm },
  buyersText: { ...typography.caption, color: colors.textMuted },
  priceRow: { marginTop: spacing.sm },
  savings: { ...typography.small, color: colors.success, marginTop: spacing.xs },
});
