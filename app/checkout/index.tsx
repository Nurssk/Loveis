import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { AppInput } from '@/components/AppInput';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { ProductImage } from '@/components/ProductImage';
import { ScreenContainer } from '@/components/ScreenContainer';
import { colors, radii, shadows, spacing, typography } from '@/constants/theme';
import { useApp } from '@/store/AppContext';
import { CartKind } from '@/types';
import { summarize } from '@/utils/cart';
import { formatPrice, itemWord } from '@/utils/format';

const DELIVERY_METHODS = [
  { id: 'courier', label: 'Курьер', detail: '2–4 дня · 0 ₸', icon: 'bicycle-outline' },
  { id: 'pickup', label: 'Пункт выдачи', detail: 'Завтра · 0 ₸', icon: 'storefront-outline' },
] as const;

const PAYMENT_METHODS = [
  { id: 'kaspi', label: 'Kaspi', icon: 'card-outline' },
  { id: 'halyk', label: 'Halyk', icon: 'card-outline' },
  { id: 'card', label: 'Банковская карта', icon: 'card-outline' },
] as const;

export default function CheckoutScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ kind?: string }>();
  const kind: CartKind = params.kind === 'team' ? 'team' : 'individual';
  const { state, placeOrder } = useApp();

  const memberCount = kind === 'team' ? state.team?.members.length ?? 0 : 0;
  const items = kind === 'team' ? state.cart.teamItems : state.cart.individualItems;
  const summary = useMemo(() => summarize(items, memberCount), [items, memberCount]);

  const [address, setAddress] = useState('');
  const [delivery, setDelivery] = useState<string>(DELIVERY_METHODS[0].id);
  const [payment, setPayment] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const [processing, setProcessing] = useState(false);

  const addressOk = address.trim().length >= 5;
  const paymentOk = !!payment;
  const canPay = addressOk && paymentOk && summary.itemCount > 0;

  const onPay = () => {
    setTouched(true);
    if (!canPay) return;
    setProcessing(true);
    // Simulated payment processing delay.
    setTimeout(() => {
      const order = placeOrder({
        kind,
        total: summary.finalTotal,
        city: state.profile?.city ?? 'Алматы',
        address: address.trim(),
        deliveryMethod: DELIVERY_METHODS.find((d) => d.id === delivery)?.label ?? '',
        paymentMethod: PAYMENT_METHODS.find((p) => p.id === payment)?.label ?? '',
        itemCount: summary.itemCount,
      });
      setProcessing(false);
      router.replace(`/checkout/success?orderId=${order.id}`);
    }, 1400);
  };

  if (summary.itemCount === 0) {
    return (
      <ScreenContainer>
        <Header onBack={() => router.back()} />
        <Text style={styles.emptyText}>Корзина пуста. Добавьте товары перед оформлением.</Text>
        <AppButton title="На главную" onPress={() => router.replace('/(tabs)/home')} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      footer={
        <View>
          <View style={styles.footerRow}>
            <Text style={styles.footerLabel}>К оплате</Text>
            <Text style={styles.footerTotal}>{formatPrice(summary.finalTotal)}</Text>
          </View>
          <AppButton title="Оплатить" icon="lock-closed" onPress={onPay} disabled={!canPay} />
        </View>
      }
    >
      <Header onBack={() => router.back()} />

      {/* Order type */}
      <View style={[styles.typeBanner, kind === 'team' ? styles.typeTeam : styles.typeIndividual]}>
        <Ionicons name={kind === 'team' ? 'people' : 'person'} size={18} color={kind === 'team' ? colors.success : colors.info} />
        <Text style={[styles.typeText, { color: kind === 'team' ? colors.success : colors.info }]}>
          {kind === 'team' ? `Командный заказ · ${state.team?.name ?? ''}` : 'Индивидуальный заказ'}
        </Text>
      </View>

      {/* Products */}
      <Text style={styles.sectionTitle}>Товары ({summary.itemCount} {itemWord(summary.itemCount)})</Text>
      <View style={styles.card}>
        {summary.lines.map((l, i) => (
          <View key={l.product.id} style={[styles.itemRow, i > 0 && styles.itemDivider]}>
            <ProductImage uri={l.product.image} category={l.product.category} style={styles.itemImage} iconSize={22} />
            <Text style={styles.itemTitle} numberOfLines={2}>{l.product.title}</Text>
            <Text style={styles.itemQty}>×{l.quantity}</Text>
            <Text style={styles.itemPrice}>{formatPrice(l.product.regularPrice * l.quantity)}</Text>
          </View>
        ))}
      </View>

      {/* Delivery */}
      <Text style={styles.sectionTitle}>Доставка</Text>
      <View style={styles.cityRow}>
        <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
        <Text style={styles.cityText}>Город: {state.profile?.city ?? 'Алматы'}</Text>
      </View>
      <AppInput
        label="Адрес доставки"
        placeholder="Улица, дом, квартира"
        leftIcon="home-outline"
        value={address}
        onChangeText={setAddress}
        error={touched && !addressOk ? 'Укажите адрес доставки (минимум 5 символов)' : null}
      />
      <View style={styles.options}>
        {DELIVERY_METHODS.map((d) => (
          <Option
            key={d.id}
            selected={delivery === d.id}
            icon={d.icon}
            title={d.label}
            subtitle={d.detail}
            onPress={() => setDelivery(d.id)}
          />
        ))}
      </View>

      {/* Payment */}
      <Text style={styles.sectionTitle}>Способ оплаты</Text>
      <View style={styles.options}>
        {PAYMENT_METHODS.map((p) => (
          <Option
            key={p.id}
            selected={payment === p.id}
            icon={p.icon}
            title={p.label}
            onPress={() => setPayment(p.id)}
          />
        ))}
      </View>
      {touched && !paymentOk ? <Text style={styles.error}>Выберите способ оплаты</Text> : null}

      {/* Summary */}
      <View style={styles.summaryCard}>
        <Row label={`Сумма (${summary.itemCount})`} value={formatPrice(summary.subtotal)} />
        {summary.discountPercent > 0 ? (
          <Row
            label={`Скидка команды (${summary.discountPercent}%)`}
            value={`−${formatPrice(summary.discountAmount)}`}
            highlight
          />
        ) : null}
        <Row label="Доставка" value="Бесплатно" />
        <View style={styles.grandRow}>
          <Text style={styles.grandLabel}>Итого</Text>
          <Text style={styles.grandValue}>{formatPrice(summary.finalTotal)}</Text>
        </View>
      </View>

      <Text style={styles.note}>Оплата симулируется — реальные платёжные системы не подключены.</Text>

      <LoadingOverlay visible={processing} label="Обработка оплаты…" />
    </ScreenContainer>
  );
}

function Header({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.header}>
      <Pressable onPress={onBack} hitSlop={10} accessibilityRole="button" accessibilityLabel="Назад">
        <Ionicons name="chevron-back" size={26} color={colors.text} />
      </Pressable>
      <Text style={styles.headerTitle}>Оформление</Text>
      <View style={{ width: 26 }} />
    </View>
  );
}

function Option({
  selected,
  icon,
  title,
  subtitle,
  onPress,
}: {
  selected: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.option, selected && styles.optionSelected]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Ionicons name={icon} size={20} color={selected ? colors.primary : colors.textSecondary} />
      <View style={styles.optionBody}>
        <Text style={[styles.optionTitle, selected && styles.optionTitleSelected]}>{title}</Text>
        {subtitle ? <Text style={styles.optionSubtitle}>{subtitle}</Text> : null}
      </View>
      <Ionicons
        name={selected ? 'radio-button-on' : 'radio-button-off'}
        size={20}
        color={selected ? colors.primary : colors.borderStrong}
      />
    </Pressable>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, highlight && { color: colors.success }]}>{label}</Text>
      <Text style={[styles.rowValue, highlight && { color: colors.success }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm, marginBottom: spacing.md },
  headerTitle: { ...typography.h3, color: colors.text },
  emptyText: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginVertical: spacing.xl },
  typeBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radii.md },
  typeTeam: { backgroundColor: colors.successSoft },
  typeIndividual: { backgroundColor: colors.infoSoft },
  typeText: { ...typography.caption, fontWeight: '700', flex: 1 },
  sectionTitle: { ...typography.h3, color: colors.text, marginTop: spacing.xl, marginBottom: spacing.md },
  card: { backgroundColor: colors.surface, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, ...shadows.card },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  itemDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  itemImage: { width: 44, height: 44, borderRadius: radii.sm },
  itemTitle: { ...typography.caption, color: colors.text, flex: 1, fontWeight: '600' },
  itemQty: { ...typography.caption, color: colors.textMuted },
  itemPrice: { ...typography.caption, color: colors.text, fontWeight: '700' },
  cityRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.md },
  cityText: { ...typography.caption, color: colors.textSecondary },
  options: { gap: spacing.sm },
  option: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radii.md, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface },
  optionSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  optionBody: { flex: 1 },
  optionTitle: { ...typography.bodyStrong, color: colors.text },
  optionTitleSelected: { color: colors.primaryDark },
  optionSubtitle: { ...typography.caption, color: colors.textSecondary, marginTop: 1 },
  error: { ...typography.caption, color: colors.danger, marginTop: spacing.sm },
  summaryCard: { backgroundColor: colors.surface, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginTop: spacing.xl, ...shadows.card },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs },
  rowLabel: { ...typography.body, color: colors.textSecondary },
  rowValue: { ...typography.bodyStrong, color: colors.text },
  grandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, marginTop: spacing.sm, paddingTop: spacing.md },
  grandLabel: { ...typography.h3, color: colors.text },
  grandValue: { ...typography.h2, color: colors.text },
  note: { ...typography.caption, color: colors.textMuted, textAlign: 'center', marginTop: spacing.lg },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  footerLabel: { ...typography.body, color: colors.textSecondary },
  footerTotal: { ...typography.h2, color: colors.text },
});
