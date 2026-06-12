import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { CategoryChip } from '@/components/CategoryChip';
import { EmptyState } from '@/components/EmptyState';
import { ProductCard } from '@/components/ProductCard';
import { ScreenContainer } from '@/components/ScreenContainer';
import { SectionHeader } from '@/components/SectionHeader';
import { CATEGORIES, categoryLabel } from '@/data/categories';
import { getProduct } from '@/data/products';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { useApp } from '@/store/AppContext';
import { Product } from '@/types';
import { itemWord } from '@/utils/format';
import { bestSavings, popularTeamPurchases, recommendedProducts, searchProducts } from '@/utils/recommendations';


export default function HomeScreen() {
  const router = useRouter();
  const { state } = useApp();

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  const teamCount = state.team?.members.length ?? 0;
  const open = (id: string) => router.push(`/product/${id}`);

  const recos = useMemo(() => recommendedProducts(state.profile), [state.profile]);
  const popular = useMemo(() => popularTeamPurchases(), []);
  const savings = useMemo(() => bestSavings(), []);
  const recent = useMemo(
    () => state.recentlyViewed.map(getProduct).filter((p): p is Product => !!p),
    [state.recentlyViewed],
  );

  const filtering = query.trim() !== '' || category !== null;
  const results = useMemo(() => {
    if (!filtering) return [];
    let list = searchProducts(query, categoryLabel);
    if (category) list = list.filter((p) => p.category === category);
    return list;
  }, [filtering, query, category]);

  const renderShelf = (items: Product[], reasons?: Record<string, string>) => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.shelf}>
      {items.map((p) => (
        <ProductCard
          key={p.id}
          product={p}
          teamMemberCount={teamCount}
          reason={reasons?.[p.id]}
          onPress={() => open(p.id)}
        />
      ))}
    </ScrollView>
  );

  return (
    <ScreenContainer padded={false} edges={['top']}>
      {/* Top bar: PFP | Location | Search */}
      <View style={styles.topBar}>
        <Pressable onPress={() => router.push('/(tabs)/profile')} style={styles.avatarBtn} accessibilityLabel="Профиль">
          <Text style={styles.avatarInitial}>
            {(state.profile?.name ?? 'U')[0].toUpperCase()}
          </Text>
        </Pressable>

        <View style={styles.locationBlock}>
          <Text style={styles.locationLabel}>Местоположение</Text>
          <View style={styles.cityRow}>
            <Ionicons name="location-sharp" size={13} color={colors.primary} />
            <Text style={styles.city}>{state.profile?.city ?? 'Алматы'}</Text>
            <Ionicons name="chevron-down" size={13} color={colors.textMuted} />
          </View>
        </View>

        <Pressable
          onPress={() => {
            if (searchOpen) setQuery('');
            setSearchOpen((v) => !v);
          }}
          style={[styles.iconBtn, searchOpen && styles.iconBtnActive]}
          accessibilityLabel="Поиск"
        >
          <Ionicons name={searchOpen ? 'close' : 'search'} size={20} color={searchOpen ? colors.primary : colors.text} />
        </Pressable>
      </View>

      {/* Collapsible search */}
      {searchOpen && (
        <View style={styles.searchRow}>
          <View style={styles.search}>
            <Ionicons name="search" size={18} color={colors.text} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Поиск товаров и магазинов"
              placeholderTextColor={colors.textMuted}
              style={styles.searchInput}
              returnKeyType="search"
              autoFocus
              accessibilityLabel="Поиск"
            />
            {query.length > 0 ? (
              <Pressable onPress={() => setQuery('')} hitSlop={8} accessibilityLabel="Очистить">
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </Pressable>
            ) : null}
          </View>
          <Pressable
            onPress={() => setCategory(null)}
            style={[styles.filterBtn, category && styles.filterBtnActive]}
            accessibilityRole="button"
            accessibilityLabel="Сбросить фильтр"
          >
            <Ionicons name="options-outline" size={20} color={category ? colors.primaryDark : colors.text} />
          </Pressable>
        </View>
      )}

      {/* Category strip */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <CategoryChip label="Все" selected={category === null} onPress={() => setCategory(null)} />
        {CATEGORIES.map((c) => (
          <CategoryChip
            key={c.id}
            label={c.label}
            icon={c.icon as keyof typeof Ionicons.glyphMap}
            selected={category === c.id}
            onPress={() => setCategory((cur) => (cur === c.id ? null : c.id))}
          />
        ))}
      </ScrollView>

      {filtering ? (
        <View style={styles.results}>
          <Text style={styles.resultsCount}>
            Найдено: {results.length} {itemWord(results.length)}
          </Text>
          {results.length === 0 ? (
            <EmptyState
              icon="search-outline"
              title="Ничего не найдено"
              description="Попробуйте изменить запрос или выбрать другую категорию."
              actionLabel="Сбросить"
              onAction={() => {
                setQuery('');
                setCategory(null);
              }}
            />
          ) : (
            <View style={styles.list}>
              {results.map((p) => (
                <ProductCard key={p.id} product={p} teamMemberCount={teamCount} variant="list" onPress={() => open(p.id)} />
              ))}
            </View>
          )}
        </View>
      ) : (
        <View style={styles.feed}>
          <View style={styles.padX}>
            <SectionHeader title="Рекомендации для вас" subtitle="Подобрано по вашим интересам" icon="sparkles" />
          </View>
          {renderShelf(
            recos.map((r) => r.product),
            Object.fromEntries(recos.map((r) => [r.product.id, r.reason])),
          )}

          <View style={styles.padX}>
            <SectionHeader title="Популярно в команде" subtitle="Чаще всего покупают вместе" icon="flame" iconColor={colors.danger} />
          </View>
          {renderShelf(popular)}

          <View style={styles.padX}>
            <SectionHeader title="Лучшая экономия" subtitle="Максимальная выгода при покупке командой" icon="trending-down" iconColor={colors.success} />
          </View>
          {renderShelf(savings)}

          {recent.length > 0 ? (
            <>
              <View style={styles.padX}>
                <SectionHeader title="Вы недавно смотрели" icon="time-outline" />
              </View>
              {renderShelf(recent)}
            </>
          ) : null}
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  avatarBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    ...typography.bodyStrong,
    color: colors.textInverse,
  },
  locationBlock: {
    flex: 1,
    alignItems: 'center',
  },
  locationLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  cityRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 1 },
  city: { ...typography.h3, color: colors.text },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnActive: {
    backgroundColor: colors.primarySoft,
  },

  searchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, marginTop: spacing.sm, marginBottom: spacing.xs },
  search: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    minHeight: 52,
  },
  searchInput: { flex: 1, ...typography.body, color: colors.text },
  filterBtn: {
    width: 52,
    height: 52,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtnActive: { backgroundColor: colors.primarySoft, borderColor: colors.primarySoft },

  chips: { gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.lg },
  feed: {},
  padX: { paddingHorizontal: spacing.lg },
  shelf: { gap: spacing.md, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  results: { paddingHorizontal: spacing.lg, paddingTop: spacing.xs },
  resultsCount: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.md },
  list: { gap: spacing.md },

  promo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.successSoft,
  },
  promoIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoBody: { flex: 1 },
  promoTitle: { ...typography.bodyStrong, color: colors.savingsDeep },
  promoText: { ...typography.caption, color: colors.savingsDeep, marginTop: 1 },

  cartBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.primarySoft,
  },
  cartBannerText: { ...typography.caption, color: colors.primaryDark, fontWeight: '700', flex: 1 },
});
