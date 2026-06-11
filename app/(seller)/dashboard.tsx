import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { EmptyState } from '@/components/EmptyState';
import { ScreenContainer } from '@/components/ScreenContainer';
import { SectionHeader } from '@/components/SectionHeader';
import { SellerProductRow } from '@/components/SellerProductRow';
import { colors, radii, shadows, spacing, typography } from '@/constants/theme';
import { useApp } from '@/store/AppContext';
import { formatPrice } from '@/utils/format';
import { generateSellerOrders, sellerStats } from '@/utils/seller';

export default function SellerDashboard() {
  const router = useRouter();
  const { state } = useApp();
  const profile = state.profile;

  const products = state.sellerProducts;
  const orders = useMemo(() => generateSellerOrders(products), [products]);
  const stats = useMemo(() => sellerStats(products, orders), [products, orders]);

  if (!profile) return null;

  const topProducts = products.slice(0, 2);

  return (
    <ScreenContainer edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.storeIcon}>
            <Ionicons name="storefront" size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>Кабинет продавца</Text>
            <Text style={styles.store} numberOfLines={1}>{profile.storeName ?? 'Мой магазин'}</Text>
          </View>
        </View>
        <Pressable
          onPress={() => router.replace('/(tabs)/home')}
          style={styles.exitBtn}
          accessibilityRole="button"
          accessibilityLabel="Вернуться в режим покупателя"
        >
          <Ionicons name="swap-horizontal" size={18} color={colors.primaryDark} />
          <Text style={styles.exitText}>Покупатель</Text>
        </Pressable>
      </View>

      {/* Stats grid */}
      <View style={styles.grid}>
        <StatTile icon="cube-outline" label="Товары" value={String(stats.productCount)} />
        <StatTile icon="people-outline" label="Участники" value={String(stats.totalParticipants)} tone="success" />
        <StatTile icon="checkmark-done-outline" label="Групп собрано" value={String(stats.groupsReached)} tone="success" />
        <StatTile icon="cash-outline" label="Выручка" value={formatPrice(stats.revenue)} />
      </View>

      <AppButton title="Добавить товар" icon="add" onPress={() => router.push('/seller-product-form')} style={styles.addBtn} />

      {/* Group-buy progress */}
      <SectionHeader title="Ваши группы" subtitle="Прогресс набора по товарам" icon="trending-up" iconColor={colors.success} />
      {products.length === 0 ? (
        <EmptyState
          icon="pricetags-outline"
          title="Пока нет товаров"
          description="Добавьте первый товар, чтобы запустить групповую закупку."
          actionLabel="Добавить товар"
          onAction={() => router.push('/seller-product-form')}
        />
      ) : (
        <View style={styles.list}>
          {topProducts.map((p) => (
            <SellerProductRow key={p.id} product={p} />
          ))}
          {products.length > topProducts.length ? (
            <Pressable onPress={() => router.push('/(seller)/products')} style={styles.moreLink} accessibilityRole="button">
              <Text style={styles.moreText}>Все товары ({products.length})</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.primaryDark} />
            </Pressable>
          ) : null}
        </View>
      )}

      {/* Recent orders */}
      {orders.length > 0 ? (
        <>
          <SectionHeader title="Последние заказы" icon="receipt-outline" />
          <View style={styles.ordersCard}>
            {orders.slice(0, 3).map((o, i) => (
              <View key={o.id} style={[styles.orderRow, i > 0 && styles.orderDivider]}>
                <View style={styles.orderAvatar}>
                  <Text style={styles.orderAvatarText}>{o.buyerName.charAt(0)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.orderBuyer}>{o.buyerName}</Text>
                  <Text style={styles.orderProduct} numberOfLines={1}>{o.productTitle}</Text>
                </View>
                <Text style={styles.orderTotal}>{formatPrice(o.total)}</Text>
              </View>
            ))}
            <Pressable onPress={() => router.push('/(seller)/orders')} style={styles.moreLink} accessibilityRole="button">
              <Text style={styles.moreText}>Все заказы ({orders.length})</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.primaryDark} />
            </Pressable>
          </View>
        </>
      ) : null}

      <View style={styles.demoNote}>
        <Ionicons name="flask-outline" size={14} color={colors.warning} />
        <Text style={styles.demoNoteText}>
          Заказы и статистика — симуляция для демонстрации MVP. Добавленные товары видны и в ленте покупателя.
        </Text>
      </View>
    </ScreenContainer>
  );
}

function StatTile({
  icon,
  label,
  value,
  tone = 'default',
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  tone?: 'default' | 'success';
}) {
  const accent = tone === 'success' ? colors.success : colors.text;
  return (
    <View style={styles.tile}>
      <Ionicons name={icon} size={18} color={accent} />
      <Text style={[styles.tileValue, { color: accent }]} numberOfLines={1}>{value}</Text>
      <Text style={styles.tileLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.sm, marginBottom: spacing.lg },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  storeIcon: { width: 44, height: 44, borderRadius: radii.md, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { ...typography.caption, color: colors.textSecondary },
  store: { ...typography.h2, color: colors.text },
  exitBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radii.pill, backgroundColor: colors.primarySoft },
  exitText: { ...typography.captionStrong, color: colors.primaryDark },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  tile: {
    flexGrow: 1,
    flexBasis: '47%',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.xs,
    ...shadows.card,
  },
  tileValue: { ...typography.h2, marginTop: spacing.xs },
  tileLabel: { ...typography.caption, color: colors.textSecondary },
  addBtn: { marginTop: spacing.lg },
  list: { gap: spacing.md },
  moreLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: spacing.md },
  moreText: { ...typography.captionStrong, color: colors.primaryDark },
  ordersCard: { backgroundColor: colors.surface, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.lg, ...shadows.card },
  orderRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  orderDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  orderAvatar: { width: 38, height: 38, borderRadius: radii.pill, backgroundColor: colors.surfaceStrong, alignItems: 'center', justifyContent: 'center' },
  orderAvatarText: { ...typography.bodyStrong, color: colors.text },
  orderBuyer: { ...typography.bodyStrong, color: colors.text },
  orderProduct: { ...typography.caption, color: colors.textSecondary, marginTop: 1 },
  orderTotal: { ...typography.bodyStrong, color: colors.text },
  demoNote: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl, padding: spacing.md, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed', backgroundColor: colors.surfaceAlt },
  demoNoteText: { ...typography.caption, color: colors.textSecondary, flex: 1, lineHeight: 18 },
});
