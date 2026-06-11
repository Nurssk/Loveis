import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ProductImage } from '@/components/ProductImage';
import { colors, radii, shadows, spacing, typography } from '@/constants/theme';
import { Product } from '@/types';
import { formatPrice } from '@/utils/format';
import { batchProgress } from '@/utils/seller';

type Props = {
  product: Product;
  onEdit?: () => void;
  onDelete?: () => void;
};

/** Merchant-side product card: pricing + live group-buy batch progress. */
export function SellerProductRow({ product, onEdit, onDelete }: Props) {
  const batch = batchProgress(product);
  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View style={styles.imageWrap}>
          <ProductImage uri={product.image} category={product.category} style={styles.image} iconSize={28} />
        </View>
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={2}>
            {product.title}
          </Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatPrice(product.regularPrice)}</Text>
            {product.groupPrice ? (
              <View style={styles.groupPill}>
                <Ionicons name="people" size={12} color={colors.savingsDeep} />
                <Text style={styles.groupPillText}>{formatPrice(product.groupPrice)}</Text>
              </View>
            ) : null}
          </View>
        </View>
        {onEdit || onDelete ? (
          <View style={styles.actions}>
            {onEdit ? (
              <Pressable onPress={onEdit} hitSlop={8} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Редактировать товар">
                <Ionicons name="create-outline" size={20} color={colors.text} />
              </Pressable>
            ) : null}
            {onDelete ? (
              <Pressable onPress={onDelete} hitSlop={8} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Удалить товар">
                <Ionicons name="trash-outline" size={20} color={colors.danger} />
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>

      {/* Group-buy progress */}
      <View style={styles.progressHeader}>
        <Text style={styles.progressLabel}>
          {batch.reached ? 'Группа собрана' : 'Набор группы'}
        </Text>
        <Text style={[styles.progressCount, batch.reached && { color: colors.success }]}>
          {batch.current} / {batch.target}
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${batch.percent}%` }]} />
      </View>
      <Text style={styles.hint}>
        {batch.reached
          ? `Оптовая цена разблокирована для всех участников`
          : `Ещё ${batch.remaining} участников до оптовой цены`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadows.card,
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  imageWrap: { width: 56, height: 56, borderRadius: radii.md, overflow: 'hidden', backgroundColor: colors.surfaceAlt },
  image: { width: '100%', height: '100%' },
  info: { flex: 1 },
  title: { ...typography.bodyStrong, color: colors.text, lineHeight: 20 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  price: { ...typography.caption, color: colors.textSecondary },
  groupPill: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: colors.successSoft, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radii.pill },
  groupPillText: { ...typography.small, color: colors.savingsDeep },
  actions: { flexDirection: 'row', gap: spacing.xs },
  iconBtn: { width: 36, height: 36, borderRadius: radii.pill, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  progressHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.lg },
  progressLabel: { ...typography.caption, color: colors.textSecondary },
  progressCount: { ...typography.captionStrong, color: colors.text },
  track: { height: 8, borderRadius: radii.pill, backgroundColor: colors.surfaceAlt, marginTop: spacing.sm, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radii.pill, backgroundColor: colors.success },
  hint: { ...typography.small, color: colors.textMuted, marginTop: spacing.sm },
});
