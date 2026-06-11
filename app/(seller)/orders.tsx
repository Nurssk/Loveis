import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { ScreenContainer } from '@/components/ScreenContainer';
import { useToast } from '@/components/Toast';
import { colors, radii, shadows, spacing, typography } from '@/constants/theme';
import { useApp } from '@/store/AppContext';
import { formatPrice } from '@/utils/format';
import { generateSellerOrders, STATUS_META, SellerOrderStatus } from '@/utils/seller';

const TONE_BG: Record<'info' | 'warning' | 'success', string> = {
  info: colors.infoSoft,
  warning: colors.warningSoft,
  success: colors.successSoft,
};
const TONE_FG: Record<'info' | 'warning' | 'success', string> = {
  info: colors.info,
  warning: colors.warning,
  success: colors.savingsDeep,
};

export default function SellerOrders() {
  const toast = useToast();
  const { state } = useApp();
  const orders = useMemo(() => generateSellerOrders(state.sellerProducts), [state.sellerProducts]);

  // Local overrides for the "ship" action (demo — not persisted).
  const [shipped, setShipped] = useState<Record<string, boolean>>({});

  const shippedCount = orders.filter((o) => shipped[o.id] || o.status === 'shipped').length;

  const statusOf = (id: string, base: SellerOrderStatus): SellerOrderStatus =>
    shipped[id] ? 'shipped' : base;

  return (
    <ScreenContainer edges={['top']}>
      <Text style={styles.h1}>Заказы</Text>
      <Text style={styles.lead}>
        {orders.length > 0
          ? `${orders.length} заказов · ${shippedCount} отгружено`
          : 'Заказы появятся, когда покупатели начнут собирать группы.'}
      </Text>

      {orders.length === 0 ? (
        <EmptyState
          icon="receipt-outline"
          title="Пока нет заказов"
          description="Добавьте товары — и покупатели начнут присоединяться к группам."
        />
      ) : (
        <View style={styles.list}>
          {orders.map((o) => {
            const status = statusOf(o.id, o.status);
            const meta = STATUS_META[status];
            const canShip = status !== 'shipped';
            return (
              <View key={o.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{o.buyerName.charAt(0)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.buyer}>{o.buyerName}</Text>
                    <Text style={styles.when}>{o.when}</Text>
                  </View>
                  <View style={[styles.statusPill, { backgroundColor: TONE_BG[meta.tone] }]}>
                    <Text style={[styles.statusText, { color: TONE_FG[meta.tone] }]}>{meta.label}</Text>
                  </View>
                </View>

                <Text style={styles.product} numberOfLines={1}>{o.productTitle}</Text>

                <View style={styles.cardBottom}>
                  <Text style={styles.qty}>{o.quantity} шт · {formatPrice(o.total)}</Text>
                  {canShip ? (
                    <Pressable
                      onPress={() => {
                        setShipped((s) => ({ ...s, [o.id]: true }));
                        toast.show(`Заказ для ${o.buyerName} отгружен`);
                      }}
                      style={styles.shipBtn}
                      accessibilityRole="button"
                      accessibilityLabel="Отгрузить заказ"
                    >
                      <Ionicons name="cube-outline" size={15} color={colors.primaryDark} />
                      <Text style={styles.shipText}>Отгрузить</Text>
                    </Pressable>
                  ) : (
                    <View style={styles.doneRow}>
                      <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                      <Text style={styles.doneText}>Готово</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}

      <View style={styles.demoNote}>
        <Ionicons name="flask-outline" size={14} color={colors.warning} />
        <Text style={styles.demoNoteText}>Список заказов — симуляция для демонстрации MVP.</Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  h1: { ...typography.display, color: colors.text, marginTop: spacing.sm },
  lead: { ...typography.body, color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.lg },
  list: { gap: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadows.card,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: { width: 40, height: 40, borderRadius: radii.pill, backgroundColor: colors.surfaceStrong, alignItems: 'center', justifyContent: 'center' },
  avatarText: { ...typography.bodyStrong, color: colors.text },
  buyer: { ...typography.bodyStrong, color: colors.text },
  when: { ...typography.caption, color: colors.textMuted, marginTop: 1 },
  statusPill: { paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: radii.pill },
  statusText: { ...typography.small },
  product: { ...typography.body, color: colors.textSecondary, marginTop: spacing.md },
  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.md },
  qty: { ...typography.bodyStrong, color: colors.text },
  shipBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radii.pill, backgroundColor: colors.primarySoft },
  shipText: { ...typography.captionStrong, color: colors.primaryDark },
  doneRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  doneText: { ...typography.captionStrong, color: colors.success },
  demoNote: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl, padding: spacing.md, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed', backgroundColor: colors.surfaceAlt },
  demoNoteText: { ...typography.caption, color: colors.textSecondary, flex: 1 },
});
