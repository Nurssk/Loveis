import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useMemo, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { AppInput } from '@/components/AppInput';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { OptionCard } from '@/components/OptionCard';
import { ProductImage } from '@/components/ProductImage';
import { ScreenContainer } from '@/components/ScreenContainer';
import { StepProgress } from '@/components/StepProgress';
import { useToast } from '@/components/Toast';
import { colors, radii, shadows, spacing, typography } from '@/constants/theme';
import { halykConfigured, paymentLinks } from '@/config/payment';
import { paymentService, PaymentError } from '@/services/paymentService';
import { useApp } from '@/store/AppContext';
import { useProductsCtx } from '@/store/ProductsContext';
import { CartKind } from '@/types';
import { summarize } from '@/utils/cart';
import { formatPrice, itemWord } from '@/utils/format';

type PaymentStage = 'creating' | 'redirecting' | 'verifying';
const STAGE_LABEL: Record<PaymentStage, string> = {
  creating: 'Создание платежа…',
  redirecting: 'Переход в Halyk ePay…',
  verifying: 'Проверка статуса платежа…',
};

const DELIVERY_METHODS = [
  { id: 'courier', label: 'Курьер', detail: '2–4 дня · бесплатно', icon: 'bicycle-outline' },
  { id: 'pickup', label: 'Пункт выдачи', detail: 'Завтра · бесплатно', icon: 'storefront-outline' },
] as const;

const TITLES = ['Ваш заказ', 'Доставка', 'Оплата'];
const SUBTITLES = [
  'Проверьте товары и сумму со скидкой',
  'Куда и как привезти заказ',
  'Проверьте итог и подтвердите оплату',
];

export default function CheckoutScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ kind?: string }>();
  const kind: CartKind = params.kind === 'team' ? 'team' : 'individual';
  const { state, placeOrder } = useApp();

  const { getProduct } = useProductsCtx();
  const memberCount = kind === 'team' ? state.team?.members.length ?? 0 : 0;
  const items = kind === 'team' ? state.cart.teamItems : state.cart.individualItems;
  const summary = useMemo(() => summarize(items, getProduct, memberCount), [items, getProduct, memberCount]);

  const [step, setStep] = useState(0);
  const [address, setAddress] = useState('');
  const [delivery, setDelivery] = useState<string>(DELIVERY_METHODS[0].id);
  const [touched, setTouched] = useState(false);
  const [stage, setStage] = useState<PaymentStage | null>(null);
  const toast = useToast();
  const processing = stage !== null;

  const addressOk = address.trim().length >= 5;
  const canPay = addressOk && summary.itemCount > 0;

  const placeLocalOrder = () =>
    placeOrder({
      kind,
      status: 'confirmed',
      total: summary.finalTotal,
      city: state.profile?.city ?? 'Алматы',
      address: address.trim(),
      deliveryMethod: DELIVERY_METHODS.find((d) => d.id === delivery)?.label ?? '',
      paymentMethod: 'Halyk ePay',
      itemCount: summary.itemCount,
    });

  const onPay = async () => {
    setTouched(true);
    if (!canPay) return;

    if (!halykConfigured()) {
      toast.show('Demo-режим: Halyk creds не заданы', 'info');
      setStage('creating');
      setTimeout(() => {
        const order = placeLocalOrder();
        setStage(null);
        router.replace(`/checkout/success?orderId=${order.id}`);
      }, 1200);
      return;
    }

    try {
      setStage('creating');
      const profile = state.profile;
      const init = await paymentService.initPayment({
        orderRef: `${kind}-${Date.now()}`,
        userId: profile?.id ?? 'guest',
        title: summary.lines[0]?.product.title ?? 'Заказ',
        amount: summary.finalTotal,
      });

      setStage('redirecting');
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') {
          window.open(init.invoiceUrl, '_blank', 'noopener,noreferrer');
        }
      } else {
        WebBrowser.openAuthSessionAsync(init.invoiceUrl, 'https://example.com/checkout/')
          .then((b: unknown) => console.log('[pay] browser closed', b))
          .catch(() => {});
      }

      setStage(null);
      const confirmed = await new Promise<boolean>((resolve) => {
        Alert.alert(
          'Оплата в Halyk ePay',
          'Завершите оплату в открывшейся вкладке. После этого вернитесь сюда.',
          [
            { text: 'Отмена', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Я оплатил', onPress: () => resolve(true) },
          ],
          { cancelable: false },
        );
      });

      if (!confirmed) {
        toast.show('Оплата отменена', 'info');
        return;
      }
      const order = placeLocalOrder();
      router.replace(`/checkout/success?orderId=${order.id}&invoice=${init.invoiceId}`);
    } catch (err) {
      const msg =
        err instanceof PaymentError
          ? err.message
          : err instanceof Error
            ? err.message
            : String(err);
      Alert.alert('Ошибка оплаты', msg);
    } finally {
      setStage(null);
    }
  };

  const onPrimary = () => {
    if (step === 1) {
      setTouched(true);
      if (!addressOk) return;
    }
    if (step < 2) {
      setStep((s) => s + 1);
      return;
    }
    onPay();
  };

  const onBack = () => {
    if (step === 0) {
      router.back();
      return;
    }
    setStep((s) => s - 1);
  };

  if (summary.itemCount === 0) {
    return (
      <ScreenContainer>
        <Text style={styles.emptyText}>Корзина пуста. Добавьте товары перед оформлением.</Text>
        <AppButton title="На главную" onPress={() => router.replace('/(tabs)/home')} />
      </ScreenContainer>
    );
  }

  const primaryDisabled = step === 1 && !addressOk;

  return (
    <ScreenContainer
      footer={
        <View>
          <View style={styles.footerRow}>
            <Text style={styles.footerLabel}>К оплате</Text>
            <Text style={styles.footerTotal}>{formatPrice(summary.finalTotal)}</Text>
          </View>
          <AppButton
            title={step < 2 ? 'Продолжить' : 'Оплатить'}
            icon={step < 2 ? 'arrow-forward' : 'lock-closed'}
            onPress={onPrimary}
            disabled={primaryDisabled}
          />
          <Pressable onPress={onBack} style={styles.backBtn} accessibilityRole="button">
            <Text style={styles.backText}>Назад</Text>
          </Pressable>
        </View>
      }
    >
      {/* Progress */}
      <View style={styles.progressTop}>
        <StepProgress total={3} current={step + 1} />
      </View>
      <Text style={styles.stepCount}>Шаг {step + 1} из 3</Text>

      <Text style={styles.title}>{TITLES[step]}</Text>
      <Text style={styles.subtitle}>{SUBTITLES[step]}</Text>

      {/* Context chip */}
      <View style={[styles.context, kind === 'team' ? styles.contextTeam : styles.contextIndividual]}>
        <Ionicons name={kind === 'team' ? 'people' : 'person'} size={14} color={kind === 'team' ? colors.success : colors.text} />
        <Text style={[styles.contextText, { color: kind === 'team' ? colors.savingsDeep : colors.text }]}>
          {kind === 'team' ? `Командный заказ · ${state.team?.name ?? ''}` : 'Индивидуальный заказ'}
        </Text>
      </View>

      {/* Step 0 — order summary */}
      {step === 0 ? (
        <>
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
          <Summary summary={summary} />
        </>
      ) : null}

      {/* Step 1 — delivery */}
      {step === 1 ? (
        <>
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
          <Text style={styles.sectionTitle}>Способ доставки</Text>
          <View style={styles.options}>
            {DELIVERY_METHODS.map((d) => (
              <OptionCard
                key={d.id}
                icon={d.icon}
                title={d.label}
                subtitle={d.detail}
                selected={delivery === d.id}
                onPress={() => setDelivery(d.id)}
              />
            ))}
          </View>
        </>
      ) : null}

      {/* Step 2 — payment summary */}
      {step === 2 ? (
        <>
          <Summary summary={summary} />
          <Text style={styles.note}>
            {halykConfigured()
              ? 'Оплата через Halyk ePay. После оплаты вы вернётесь в приложение.'
              : 'Оплата симулируется — задайте Halyk creds в config/payment.ts для боевого режима.'}
          </Text>
        </>
      ) : null}

      <LoadingOverlay visible={processing} label={stage ? STAGE_LABEL[stage] : ''} />
    </ScreenContainer>
  );
}

function Summary({ summary }: { summary: ReturnType<typeof summarize> }) {
  return (
    <View style={styles.summaryCard}>
      <Row label={`Сумма (${summary.itemCount})`} value={formatPrice(summary.subtotal)} />
      {summary.discountPercent > 0 ? (
        <Row label={`Скидка команды (${summary.discountPercent}%)`} value={`−${formatPrice(summary.discountAmount)}`} highlight />
      ) : null}
      <Row label="Доставка" value="Бесплатно" />
      <View style={styles.grandRow}>
        <Text style={styles.grandLabel}>Итого</Text>
        <Text style={styles.grandValue}>{formatPrice(summary.finalTotal)}</Text>
      </View>
      {summary.discountAmount > 0 ? (
        <View style={styles.savingsPill}>
          <Ionicons name="sparkles" size={14} color={colors.success} />
          <Text style={styles.savingsPillText}>Вы экономите {formatPrice(summary.discountAmount)}</Text>
        </View>
      ) : null}
    </View>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, highlight && { color: colors.savingsDeep }]}>{label}</Text>
      <Text style={[styles.rowValue, highlight && { color: colors.savingsDeep }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  progressTop: { marginTop: spacing.sm },
  stepCount: { ...typography.caption, color: colors.textMuted, marginTop: spacing.sm },
  title: { ...typography.display, color: colors.text, marginTop: spacing.xs },
  subtitle: { ...typography.body, color: colors.textSecondary, marginTop: spacing.xs },
  context: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    marginTop: spacing.lg,
  },
  contextTeam: { backgroundColor: colors.successSoft },
  contextIndividual: { backgroundColor: colors.surfaceStrong },
  contextText: { ...typography.captionStrong },
  emptyText: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginVertical: spacing.xl },
  sectionTitle: { ...typography.h3, color: colors.text, marginTop: spacing.xl, marginBottom: spacing.md },
  card: { backgroundColor: colors.surface, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, ...shadows.card },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  itemDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  itemImage: { width: 44, height: 44, borderRadius: radii.sm },
  itemTitle: { ...typography.caption, color: colors.text, flex: 1, fontWeight: '600' },
  itemQty: { ...typography.caption, color: colors.textMuted },
  itemPrice: { ...typography.caption, color: colors.text, fontWeight: '700' },
  cityRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.lg, marginBottom: spacing.md },
  cityText: { ...typography.caption, color: colors.textSecondary },
  options: { gap: spacing.sm },
  note: { ...typography.caption, color: colors.textMuted, textAlign: 'center', marginTop: spacing.lg },
  summaryCard: { backgroundColor: colors.surface, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginTop: spacing.xl, ...shadows.card },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs },
  rowLabel: { ...typography.body, color: colors.textSecondary },
  rowValue: { ...typography.bodyStrong, color: colors.text },
  grandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, marginTop: spacing.sm, paddingTop: spacing.md },
  grandLabel: { ...typography.h3, color: colors.text },
  grandValue: { ...typography.h2, color: colors.text },
  savingsPill: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, alignSelf: 'flex-start', backgroundColor: colors.successSoft, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radii.pill, marginTop: spacing.md },
  savingsPillText: { ...typography.caption, color: colors.savingsDeep, fontWeight: '700' },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  footerLabel: { ...typography.body, color: colors.textSecondary },
  footerTotal: { ...typography.h2, color: colors.text },
  backBtn: { alignItems: 'center', paddingVertical: spacing.md, marginTop: spacing.xs },
  backText: { ...typography.bodyStrong, color: colors.text },
});
