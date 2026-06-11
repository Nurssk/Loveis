import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { ScreenContainer } from '@/components/ScreenContainer';
import { colors, radii, shadows, spacing, typography } from '@/constants/theme';
import { useApp } from '@/store/AppContext';
import { formatPrice } from '@/utils/format';

export default function SuccessScreen() {
  const router = useRouter();
  useLocalSearchParams<{ orderId?: string }>();
  const { state } = useApp();
  const order = state.lastOrder;

  return (
    <ScreenContainer
      footer={
        <AppButton title="Вернуться на главную" icon="home" onPress={() => router.replace('/(tabs)/home')} />
      }
    >
      <View style={styles.center}>
        <View style={styles.circleOuter}>
          <View style={styles.circleInner}>
            <Ionicons name="checkmark" size={56} color={colors.textInverse} />
          </View>
        </View>

        <Text style={styles.title}>Заказ успешно оформлен</Text>
        <Text style={styles.subtitle}>Спасибо за покупку! Мы уже собираем ваш заказ.</Text>

        {order ? (
          <View style={styles.card}>
            <DetailRow label="Номер заказа" value={`№ ${order.id}`} strong />
            <Divider />
            <DetailRow label="Сумма оплаты" value={formatPrice(order.total)} strong />
            <Divider />
            <DetailRow label="Тип покупки" value={order.kind === 'team' ? 'Командная' : 'Индивидуальная'} />
            <Divider />
            <DetailRow label="Способ оплаты" value={order.paymentMethod} />
            <Divider />
            <DetailRow label="Доставка" value={`${order.deliveryMethod}, ${order.city}`} />
            <Divider />
            <DetailRow label="Ожидаемая доставка" value="2–4 дня" />
          </View>
        ) : null}

        <View style={styles.tracker}>
          <Ionicons name="cube-outline" size={18} color={colors.info} />
          <Text style={styles.trackerText}>Уведомление о доставке придёт в приложение</Text>
        </View>
      </View>
    </ScreenContainer>
  );
}

function DetailRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, strong && styles.detailValueStrong]}>{value}</Text>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', paddingTop: spacing.xxxl },
  circleOuter: { width: 120, height: 120, borderRadius: 60, backgroundColor: colors.successSoft, alignItems: 'center', justifyContent: 'center' },
  circleInner: { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center' },
  title: { ...typography.h1, color: colors.text, marginTop: spacing.xl, textAlign: 'center' },
  subtitle: { ...typography.body, color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center', lineHeight: 22 },
  card: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginTop: spacing.xxl,
    ...shadows.card,
  },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm },
  detailLabel: { ...typography.body, color: colors.textSecondary },
  detailValue: { ...typography.bodyStrong, color: colors.text, flexShrink: 1, textAlign: 'right', marginLeft: spacing.md },
  detailValueStrong: { ...typography.h3, color: colors.text },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  tracker: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xl, backgroundColor: colors.infoSoft, padding: spacing.md, borderRadius: radii.sm },
  trackerText: { ...typography.caption, color: colors.info, fontWeight: '600' },
});
