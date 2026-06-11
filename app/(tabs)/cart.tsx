import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { EmptyState } from '@/components/EmptyState';
import { ProductImage } from '@/components/ProductImage';
import { ScreenContainer } from '@/components/ScreenContainer';
import { categoryLabel } from '@/data/categories';
import { colors, radii, shadows, spacing, typography } from '@/constants/theme';
import { useApp } from '@/store/AppContext';
import { CartKind } from '@/types';
import { CartLine, summarize } from '@/utils/cart';
import { teamDiscountPercent } from '@/utils/discount';
import { formatPrice, memberWord } from '@/utils/format';

export default function CartScreen() {
  const router = useRouter();
  const { state, setQuantity, removeFromCart } = useApp();
  const [tab, setTab] = useState<CartKind>('individual');

  const memberCount = state.team?.members.length ?? 0;
  const individual = useMemo(() => summarize(state.cart.individualItems, 0), [state.cart.individualItems]);
  const team = useMemo(() => summarize(state.cart.teamItems, memberCount), [state.cart.teamItems, memberCount]);

  const active = tab === 'individual' ? individual : team;

  const Line = ({ line, kind }: { line: CartLine; kind: CartKind }) => {
    const { product, quantity } = line;
    return (
      <View style={styles.line}>
        <ProductImage uri={product.image} category={product.category} style={styles.lineImage} iconSize={28} />
        <View style={styles.lineBody}>
          <Text style={styles.lineTitle} numberOfLines={2}>{product.title}</Text>
          <Text style={styles.lineMeta}>{categoryLabel(product.category)}</Text>
          <Text style={styles.linePrice}>{formatPrice(product.regularPrice * quantity)}</Text>
        </View>
        <View style={styles.lineRight}>
          <Pressable
            onPress={() => removeFromCart(kind, product.id)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Удалить ${product.title}`}
          >
            <Ionicons name="trash-outline" size={18} color={colors.danger} />
          </Pressable>
          <View style={styles.stepper}>
            <Pressable
              onPress={() => setQuantity(kind, product.id, quantity - 1)}
              style={styles.stepBtn}
              accessibilityRole="button"
              accessibilityLabel="Уменьшить количество"
            >
              <Ionicons name="remove" size={16} color={colors.text} />
            </Pressable>
            <Text style={styles.qty}>{quantity}</Text>
            <Pressable
              onPress={() => setQuantity(kind, product.id, quantity + 1)}
              style={styles.stepBtn}
              accessibilityRole="button"
              accessibilityLabel="Увеличить количество"
            >
              <Ionicons name="add" size={16} color={colors.text} />
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  const goCheckout = () => router.push(`/checkout?kind=${tab}`);

  const showFooter = active.itemCount > 0;

  return (
    <ScreenContainer
      footer={
        showFooter ? (
          <View>
            <View style={styles.footerRow}>
              <Text style={styles.footerLabel}>К оплате</Text>
              <Text style={styles.footerTotal}>{formatPrice(active.finalTotal)}</Text>
            </View>
            <AppButton title="Перейти к оплате" icon="card-outline" onPress={goCheckout} />
          </View>
        ) : undefined
      }
    >
      <Text style={styles.h1}>Корзина</Text>

      {/* Segmented control */}
      <View style={styles.segments}>
        <Pressable
          onPress={() => setTab('individual')}
          style={[styles.segment, tab === 'individual' && styles.segmentActive]}
          accessibilityRole="button"
          accessibilityState={{ selected: tab === 'individual' }}
        >
          <Text style={[styles.segmentText, tab === 'individual' && styles.segmentTextActive]}>
            Индивидуальная {individual.itemCount > 0 ? `(${individual.itemCount})` : ''}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setTab('team')}
          style={[styles.segment, tab === 'team' && styles.segmentActive]}
          accessibilityRole="button"
          accessibilityState={{ selected: tab === 'team' }}
        >
          <Text style={[styles.segmentText, tab === 'team' && styles.segmentTextActive]}>
            Командная {team.itemCount > 0 ? `(${team.itemCount})` : ''}
          </Text>
        </Pressable>
      </View>

      {active.itemCount === 0 ? (
        <EmptyState
          icon="cart-outline"
          title={tab === 'individual' ? 'Индивидуальная корзина пуста' : 'Командная корзина пуста'}
          description={
            tab === 'team' && !state.team
              ? 'Создайте команду, чтобы покупать со скидкой до 30%.'
              : 'Добавьте товары из каталога, чтобы оформить заказ.'
          }
          actionLabel={tab === 'team' && !state.team ? 'К команде' : 'За покупками'}
          onAction={() => router.push(tab === 'team' && !state.team ? '/(tabs)/team' : '/(tabs)/home')}
        />
      ) : (
        <View style={styles.content}>
          {tab === 'team' && state.team ? (
            <View style={styles.teamInfo}>
              <Ionicons name="people" size={16} color={colors.success} />
              <Text style={styles.teamInfoText}>
                {state.team.name} · {memberCount} {memberWord(memberCount)} · скидка {teamDiscountPercent(memberCount)}%
              </Text>
            </View>
          ) : null}

          <View style={styles.lines}>
            {active.lines.map((l) => (
              <Line key={l.product.id} line={l} kind={tab} />
            ))}
          </View>

          {/* Totals */}
          <View style={styles.totals}>
            <View style={styles.totalRow}>
              <Text style={styles.totalRowLabel}>Сумма ({active.itemCount})</Text>
              <Text style={styles.totalRowValue}>{formatPrice(active.subtotal)}</Text>
            </View>
            {active.discountPercent > 0 ? (
              <View style={styles.totalRow}>
                <Text style={[styles.totalRowLabel, { color: colors.success }]}>
                  Скидка команды ({active.discountPercent}%)
                </Text>
                <Text style={[styles.totalRowValue, { color: colors.success }]}>
                  −{formatPrice(active.discountAmount)}
                </Text>
              </View>
            ) : null}
            <View style={[styles.totalRow, styles.grandRow]}>
              <Text style={styles.grandLabel}>Итого</Text>
              <Text style={styles.grandValue}>{formatPrice(active.finalTotal)}</Text>
            </View>
            {active.discountAmount > 0 ? (
              <View style={styles.savingsPill}>
                <Ionicons name="sparkles" size={14} color={colors.success} />
                <Text style={styles.savingsPillText}>Вы экономите {formatPrice(active.discountAmount)}</Text>
              </View>
            ) : null}
          </View>
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  h1: { ...typography.h1, color: colors.text, marginTop: spacing.sm },
  segments: { flexDirection: 'row', backgroundColor: colors.surfaceAlt, borderRadius: radii.md, padding: 4, marginTop: spacing.lg },
  segment: { flex: 1, paddingVertical: spacing.sm, borderRadius: radii.sm, alignItems: 'center' },
  segmentActive: { backgroundColor: colors.surface, ...shadows.card },
  segmentText: { ...typography.caption, color: colors.textSecondary, fontWeight: '700' },
  segmentTextActive: { color: colors.text },
  content: { marginTop: spacing.lg },
  teamInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.successSoft, padding: spacing.md, borderRadius: radii.sm, marginBottom: spacing.md },
  teamInfoText: { ...typography.caption, color: colors.success, fontWeight: '700', flex: 1 },
  lines: { gap: spacing.md },
  line: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadows.card,
  },
  lineImage: { width: 64, height: 64, borderRadius: radii.md },
  lineBody: { flex: 1 },
  lineTitle: { ...typography.bodyStrong, color: colors.text, lineHeight: 20 },
  lineMeta: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  linePrice: { ...typography.bodyStrong, color: colors.text, marginTop: spacing.xs },
  lineRight: { alignItems: 'flex-end', justifyContent: 'space-between' },
  stepper: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceAlt, borderRadius: radii.pill, padding: 2 },
  stepBtn: { width: 30, height: 30, borderRadius: radii.pill, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  qty: { ...typography.bodyStrong, color: colors.text, minWidth: 26, textAlign: 'center' },
  totals: { backgroundColor: colors.surface, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginTop: spacing.lg, ...shadows.card },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.xs },
  totalRowLabel: { ...typography.body, color: colors.textSecondary },
  totalRowValue: { ...typography.bodyStrong, color: colors.text },
  grandRow: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, marginTop: spacing.sm, paddingTop: spacing.md },
  grandLabel: { ...typography.h3, color: colors.text },
  grandValue: { ...typography.h2, color: colors.text },
  savingsPill: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, alignSelf: 'flex-start', backgroundColor: colors.successSoft, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radii.pill, marginTop: spacing.md },
  savingsPillText: { ...typography.caption, color: colors.success, fontWeight: '700' },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  footerLabel: { ...typography.body, color: colors.textSecondary },
  footerTotal: { ...typography.h2, color: colors.text },
});
