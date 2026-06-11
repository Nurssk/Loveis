import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/AppButton';
import { Badge } from '@/components/Badge';
import { CheckList } from '@/components/CheckList';
import { EmptyState } from '@/components/EmptyState';
import { ProductImage } from '@/components/ProductImage';
import { Rating } from '@/components/Rating';
import { ScreenContainer } from '@/components/ScreenContainer';
import { useToast } from '@/components/Toast';
import { categoryLabel } from '@/data/categories';
import { getProduct } from '@/data/products';
import { colors, LAYOUT, radii, shadows, spacing, typography } from '@/constants/theme';
import { useApp } from '@/store/AppContext';
import { applyDiscount, teamDiscountPercent } from '@/utils/discount';
import { formatPrice, memberWord } from '@/utils/format';
import { batchProgress } from '@/utils/seller';

const PREVIEW_TEAM_SIZE = 3;

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const { state, addToCart, markViewed } = useApp();
  const [modalVisible, setModalVisible] = useState(false);

  const product = id ? getProduct(id) : undefined;

  useEffect(() => {
    if (product) markViewed(product.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id]);

  if (!product) {
    return (
      <ScreenContainer>
        <Pressable onPress={() => router.back()} style={styles.backStandalone} accessibilityLabel="Назад" accessibilityRole="button">
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </Pressable>
        <EmptyState
          icon="alert-circle-outline"
          title="Товар недоступен"
          description="Этот товар больше не найден. Вернитесь к каталогу."
          actionLabel="На главную"
          onAction={() => router.replace('/(tabs)/home')}
        />
      </ScreenContainer>
    );
  }

  const hasTeam = !!state.team;
  const teamSize = state.team?.members.length ?? PREVIEW_TEAM_SIZE;
  const percent = teamDiscountPercent(teamSize);
  const { finalTotal: tPrice, discountAmount: savings } = applyDiscount(product.regularPrice, percent);

  const addIndividual = () => {
    addToCart('individual', product.id);
    toast.show('Добавлено в индивидуальную корзину');
  };

  const addTeam = () => {
    if (!hasTeam) {
      setModalVisible(true);
      return;
    }
    addToCart('team', product.id);
    toast.show('Добавлено в командную корзину');
  };

  return (
    <View style={styles.root}>
      <ScreenContainer padded={false} edges={['top']}>
        {/* Image with floating back button */}
        <View style={styles.imageWrap}>
          <ProductImage uri={product.image} category={product.category} style={styles.image} iconSize={72} />
          <SafeAreaView edges={['top']} style={styles.imageOverlay} pointerEvents="box-none">
            <Pressable onPress={() => router.back()} style={styles.roundBtn} accessibilityLabel="Назад" accessibilityRole="button">
              <Ionicons name="chevron-back" size={24} color={colors.text} />
            </Pressable>
          </SafeAreaView>
        </View>

        <View style={styles.body}>
          <Badge label={categoryLabel(product.category)} icon="pricetag" />
          <Text style={styles.title}>{product.title}</Text>

          <View style={styles.metaRow}>
            <Rating value={product.rating} size={16} />
            <View style={styles.metaItem}>
              <Ionicons name="storefront-outline" size={15} color={colors.textSecondary} />
              <Text style={styles.metaText}>{product.marketplace}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="people-outline" size={15} color={colors.textSecondary} />
              <Text style={styles.metaText}>{product.activeBuyers} покупают</Text>
            </View>
          </View>

          <View style={styles.deliveryRow}>
            <Ionicons name="cube-outline" size={16} color={colors.info} />
            <Text style={styles.deliveryText}>Доставка в {product.city} — 2–4 дня</Text>
          </View>

          <Text style={styles.sectionTitle}>Описание</Text>
          <Text style={styles.description}>{product.description}</Text>

          {/* Pricing card */}
          <View style={styles.priceCard}>
            <View style={styles.priceTop}>
              <View>
                <Text style={styles.priceLabel}>Обычная цена</Text>
                <Text style={styles.regularPrice}>{formatPrice(product.regularPrice)}</Text>
              </View>
              <View style={styles.discountTag}>
                <Ionicons name="people" size={14} color={colors.textInverse} />
                <Text style={styles.discountTagText}>−{percent}%</Text>
              </View>
            </View>

            <View style={styles.teamBlock}>
              <Text style={styles.teamLabel}>
                Цена в команде {hasTeam ? `(${teamSize} ${memberWord(teamSize)})` : `(пример: ${teamSize})`}
              </Text>
              <View style={styles.teamRow}>
                <Text style={styles.teamPrice}>{formatPrice(tPrice)}</Text>
                <View style={styles.savingsBox}>
                  <Text style={styles.savingsLabel}>Вы экономите</Text>
                  <Text style={styles.savingsValue}>{formatPrice(savings)}</Text>
                </View>
              </View>
            </View>

            <View style={styles.explain}>
              <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.explainText}>
                Каждый участник команды добавляет 5% скидки (до 30%). Чем больше команда — тем ниже цена для всех.
              </Text>
            </View>
          </View>

          {/* Seller group-buy target (only for merchant-listed products) */}
          {product.sellerId && product.groupPrice && product.minBatch ? (
            <View style={styles.groupCard}>
              <View style={styles.groupHeader}>
                <Ionicons name="storefront-outline" size={16} color={colors.savingsDeep} />
                <Text style={styles.groupHeaderText}>Оптовая цена от продавца</Text>
              </View>
              <View style={styles.groupRow}>
                <View>
                  <Text style={styles.groupPriceLabel}>При наборе группы</Text>
                  <Text style={styles.groupPrice}>{formatPrice(product.groupPrice)}</Text>
                </View>
                <View style={styles.groupTargetBox}>
                  <Text style={styles.groupTargetText}>
                    {batchProgress(product).current} / {batchProgress(product).target}
                  </Text>
                  <Text style={styles.groupTargetLabel}>{memberWord(batchProgress(product).target)}</Text>
                </View>
              </View>
              <View style={styles.groupTrack}>
                <View style={[styles.groupFill, { width: `${batchProgress(product).percent}%` }]} />
              </View>
              <Text style={styles.groupHint}>
                {batchProgress(product).reached
                  ? 'Группа собрана — оптовая цена доступна!'
                  : `Ещё ${batchProgress(product).remaining} участников до оптовой цены`}
              </Text>
            </View>
          ) : null}

          <Text style={styles.sectionTitle}>Что входит</Text>
          <CheckList
            items={[
              `Доставка в ${product.city} — 2–4 дня`,
              '−5% за каждого участника',
              'До −30% в команде',
              'Оплата Kaspi / Halyk / картой',
              'Возврат в течение 14 дней',
              'Гарантия качества',
            ]}
          />
        </View>
      </ScreenContainer>

      {/* Sticky actions */}
      <SafeAreaView edges={['bottom']} style={styles.actionBar}>
        <View style={styles.actionInner}>
          <AppButton title="Купить индивидуально" variant="ghost" icon="person-outline" onPress={addIndividual} style={styles.actionBtn} />
          <AppButton title="В командную корзину" icon="people" onPress={addTeam} style={styles.actionBtn} />
        </View>
      </SafeAreaView>

      {/* No-team modal */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)} statusBarTranslucent>
        <Pressable style={styles.modalBackdrop} onPress={() => setModalVisible(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <View style={styles.modalIcon}>
              <Ionicons name="people-outline" size={28} color={colors.primary} />
            </View>
            <Text style={styles.modalTitle}>Нужна команда</Text>
            <Text style={styles.modalText}>
              Для командной покупки сначала создайте команду или присоединитесь к существующей.
            </Text>
            <AppButton
              title="Создать команду"
              icon="add"
              onPress={() => {
                setModalVisible(false);
                router.push('/(tabs)/team');
              }}
              style={styles.modalBtn}
            />
            <AppButton
              title="Ввести код"
              variant="secondary"
              icon="key-outline"
              onPress={() => {
                setModalVisible(false);
                router.push('/(tabs)/team');
              }}
              style={styles.modalBtn}
            />
            <AppButton title="Отмена" variant="ghost" onPress={() => setModalVisible(false)} style={styles.modalBtn} />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  backStandalone: { marginTop: spacing.sm, marginBottom: spacing.md, alignSelf: 'flex-start' },
  imageWrap: { width: '100%', height: 300, backgroundColor: colors.surfaceAlt },
  image: { width: '100%', height: '100%' },
  imageOverlay: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  roundBtn: {
    width: 42,
    height: 42,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  body: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  title: { ...typography.h1, color: colors.text, marginTop: spacing.sm },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.md },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { ...typography.caption, color: colors.textSecondary },
  deliveryRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md, backgroundColor: colors.infoSoft, padding: spacing.md, borderRadius: radii.sm },
  deliveryText: { ...typography.caption, color: colors.info, fontWeight: '600' },
  sectionTitle: { ...typography.h3, color: colors.text, marginTop: spacing.xl },
  description: { ...typography.body, color: colors.textSecondary, lineHeight: 23, marginTop: spacing.sm },
  priceCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginTop: spacing.xl,
    ...shadows.card,
  },
  priceTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  priceLabel: { ...typography.caption, color: colors.textSecondary },
  regularPrice: { ...typography.h3, color: colors.textMuted, textDecorationLine: 'line-through', marginTop: 2 },
  discountTag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.success, paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radii.pill },
  discountTagText: { ...typography.bodyStrong, color: colors.textInverse },
  teamBlock: { backgroundColor: colors.successSoft, borderRadius: radii.md, padding: spacing.md, marginTop: spacing.md },
  teamLabel: { ...typography.captionStrong, color: colors.savingsDeep },
  teamRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: spacing.xs },
  teamPrice: { ...typography.savingsHero, color: colors.savingsDeep },
  savingsBox: { alignItems: 'flex-end' },
  savingsLabel: { ...typography.caption, color: colors.savingsDeep },
  savingsValue: { ...typography.h2, color: colors.success, marginTop: 2 },
  explain: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg, backgroundColor: colors.surfaceAlt, padding: spacing.md, borderRadius: radii.sm },
  explainText: { ...typography.caption, color: colors.textSecondary, flex: 1, lineHeight: 18 },
  groupCard: { backgroundColor: colors.successSoft, borderRadius: radii.lg, padding: spacing.lg, marginTop: spacing.lg },
  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  groupHeaderText: { ...typography.captionStrong, color: colors.savingsDeep },
  groupRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: spacing.md },
  groupPriceLabel: { ...typography.caption, color: colors.savingsDeep },
  groupPrice: { ...typography.h1, color: colors.savingsDeep, marginTop: 2 },
  groupTargetBox: { alignItems: 'flex-end' },
  groupTargetText: { ...typography.h3, color: colors.savingsDeep },
  groupTargetLabel: { ...typography.small, color: colors.savingsDeep },
  groupTrack: { height: 8, borderRadius: radii.pill, backgroundColor: colors.surface, marginTop: spacing.md, overflow: 'hidden' },
  groupFill: { height: '100%', borderRadius: radii.pill, backgroundColor: colors.success },
  groupHint: { ...typography.caption, color: colors.savingsDeep, marginTop: spacing.sm },
  actionBar: { backgroundColor: colors.surface, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  actionInner: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, maxWidth: LAYOUT.maxContentWidth, alignSelf: 'center', width: '100%' },
  actionBtn: { flex: 1 },
  modalBackdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
    maxWidth: LAYOUT.maxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  modalIcon: { width: 56, height: 56, borderRadius: radii.pill, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  modalTitle: { ...typography.h2, color: colors.text, textAlign: 'center', marginTop: spacing.md },
  modalText: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm, lineHeight: 22, marginBottom: spacing.lg },
  modalBtn: { marginTop: spacing.sm },
});
