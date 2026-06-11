import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/AppButton';
import { Badge } from '@/components/Badge';
import { EmptyState } from '@/components/EmptyState';
import { ProductImage } from '@/components/ProductImage';
import { Rating } from '@/components/Rating';
import { ScreenContainer } from '@/components/ScreenContainer';
import { useToast } from '@/components/Toast';
import { categoryLabel } from '@/data/categories';
import { colors, LAYOUT, radii, shadows, spacing, typography } from '@/constants/theme';
import { useApp } from '@/store/AppContext';
import { useProductsCtx } from '@/store/ProductsContext';
import { applyDiscount, teamDiscountPercent } from '@/utils/discount';
import { formatPrice, memberWord } from '@/utils/format';

const PREVIEW_TEAM_SIZE = 3;

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const { state, addToCart, markViewed, saveProduct, unsaveProduct } = useApp();
  const { getProduct, loading } = useProductsCtx();
  const [modalVisible, setModalVisible] = useState(false);

  const product = id ? getProduct(id) : undefined;

  useEffect(() => {
    if (product) markViewed(product.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id]);

  if (loading && !product) {
    return (
      <ScreenContainer>
        <Pressable onPress={() => router.back()} style={styles.backStandalone} accessibilityLabel="Назад" accessibilityRole="button">
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </Pressable>
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 48 }} />
      </ScreenContainer>
    );
  }

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

  const isSaved = state.savedProducts.includes(product.id);
  const toggleSave = () => {
    if (isSaved) {
      unsaveProduct(product.id);
      toast.show('Убрано из сохранённых');
    } else {
      saveProduct(product.id);
      toast.show('Сохранено в закладки');
    }
  };

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

            <View style={styles.priceDivider} />

            <View style={styles.priceTop}>
              <View>
                <Text style={[styles.priceLabel, { color: colors.success }]}>
                  Цена в команде {hasTeam ? `(${teamSize} ${memberWord(teamSize)})` : `(пример: ${teamSize})`}
                </Text>
                <Text style={styles.teamPrice}>{formatPrice(tPrice)}</Text>
              </View>
              <View style={styles.savingsBox}>
                <Text style={styles.savingsLabel}>Экономия</Text>
                <Text style={styles.savingsValue}>{formatPrice(savings)}</Text>
              </View>
            </View>

            <View style={styles.explain}>
              <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.explainText}>
                Каждый участник команды добавляет 5% скидки (до 30%). Чем больше команда — тем ниже цена для всех.
              </Text>
            </View>
          </View>
        </View>
      </ScreenContainer>

      {/* Sticky actions — Pinduoduo style: icon shortcuts + 2 buy buttons */}
      <SafeAreaView edges={['bottom']} style={styles.actionBar}>
        <View style={styles.actionInner}>
          {/* Store & Save icon buttons */}
          <View style={styles.iconBtns}>
            <Pressable
              onPress={() => router.back()}
              style={styles.iconBtn}
              accessibilityRole="button"
              accessibilityLabel="Магазин"
            >
              <Ionicons name="storefront-outline" size={22} color={colors.textSecondary} />
              <Text style={styles.iconBtnLabel}>Магазин</Text>
            </Pressable>
            <Pressable
              onPress={toggleSave}
              style={styles.iconBtn}
              accessibilityRole="button"
              accessibilityLabel={isSaved ? 'Убрать из сохранённых' : 'Сохранить'}
            >
              <Ionicons
                name={isSaved ? 'bookmark' : 'bookmark-outline'}
                size={22}
                color={isSaved ? colors.primary : colors.textSecondary}
              />
              <Text style={[styles.iconBtnLabel, isSaved && { color: colors.primary }]}>
                {isSaved ? 'Сохранено' : 'Сохранить'}
              </Text>
            </Pressable>
          </View>
          <View style={styles.iconSeparator} />
          <Pressable
            onPress={addIndividual}
            style={styles.buyAloneBtn}
            accessibilityRole="button"
            accessibilityLabel="Купить одному"
          >
            <Text style={styles.buyAlonePrice}>{formatPrice(product.regularPrice)}</Text>
            <Text style={styles.buyAloneLabel}>Купить одному</Text>
          </Pressable>
          <Pressable
            onPress={addTeam}
            style={styles.buyTeamBtn}
            accessibilityRole="button"
            accessibilityLabel="Купить в команде"
          >
            <Text style={styles.buyTeamPrice}>{formatPrice(tPrice)}</Text>
            <Text style={styles.buyTeamLabel}>В команде −{percent}%</Text>
          </Pressable>
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
  priceDivider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: spacing.md },
  teamPrice: { ...typography.display, color: colors.text, marginTop: 2 },
  savingsBox: { alignItems: 'flex-end' },
  savingsLabel: { ...typography.caption, color: colors.textSecondary },
  savingsValue: { ...typography.h3, color: colors.success, marginTop: 2 },
  explain: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg, backgroundColor: colors.surfaceAlt, padding: spacing.md, borderRadius: radii.sm },
  explainText: { ...typography.caption, color: colors.textSecondary, flex: 1, lineHeight: 18 },
  actionBar: { backgroundColor: colors.surface, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  actionInner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.md, maxWidth: LAYOUT.maxContentWidth, alignSelf: 'center', width: '100%' },
  actionBtn: { flex: 1 },
  iconBtns: { flexDirection: 'row', gap: spacing.xs },
  iconBtn: { alignItems: 'center', justifyContent: 'center', width: 48, paddingVertical: 2 },
  iconBtnLabel: { ...typography.small, color: colors.textSecondary, marginTop: 2, fontSize: 10, textAlign: 'center' },
  iconSeparator: { width: StyleSheet.hairlineWidth, backgroundColor: colors.border, alignSelf: 'stretch', marginHorizontal: spacing.xs },
  buyAloneBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buyAlonePrice: { ...typography.h3, color: colors.text },
  buyAloneLabel: { ...typography.small, color: colors.textSecondary, marginTop: 2 },
  buyTeamBtn: {
    flex: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
  },
  buyTeamPrice: { ...typography.h3, color: colors.textInverse },
  buyTeamLabel: { ...typography.small, color: colors.textInverse, marginTop: 2, fontWeight: '700' },
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
