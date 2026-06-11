import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Avatar } from '@/components/AvatarGroup';
import { CategoryChip } from '@/components/CategoryChip';
import { EmptyState } from '@/components/EmptyState';
import { ProductCard } from '@/components/ProductCard';
import { ScreenContainer } from '@/components/ScreenContainer';
import { SectionHeader } from '@/components/SectionHeader';
import { useToast } from '@/components/Toast';
import { CATEGORIES, categoryLabel } from '@/data/categories';
import { getProduct } from '@/data/products';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { useApp } from '@/store/AppContext';
import { Product } from '@/types';
import { lineCount } from '@/utils/cart';
import { itemWord } from '@/utils/format';
import { bestSavings, popularTeamPurchases, recommendedProducts, searchProducts } from '@/utils/recommendations';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 6) return 'Доброй ночи';
  if (h < 12) return 'Доброе утро';
  if (h < 18) return 'Добрый день';
  return 'Добрый вечер';
}

export default function HomeScreen() {
  const router = useRouter();
  const toast = useToast();
  const { state } = useApp();

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);

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
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.shelf}
    >
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
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>{greeting()},</Text>
          <View style={styles.cityRow}>
            <Ionicons name="location-outline" size={15} color={colors.primary} />
            <Text style={styles.city}>{state.profile?.city ?? 'Алматы'}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <Pressable
            onPress={() => toast.show('Новых уведомлений нет', 'info')}
            style={styles.iconBtn}
            accessibilityRole="button"
            accessibilityLabel="Уведомления"
          >
            <Ionicons name="notifications-outline" size={22} color={colors.text} />
            <View style={styles.dot} />
          </Pressable>
          <Pressable onPress={() => router.push('/(tabs)/profile')} accessibilityRole="button" accessibilityLabel="Профиль">
            <Avatar name={state.profile?.name ?? 'Вы'} size={40} />
          </Pressable>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.search}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Поиск товаров, категорий, магазинов"
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
            returnKeyType="search"
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
          <Ionicons name="options-outline" size={20} color={category ? colors.textInverse : colors.text} />
        </Pressable>
      </View>

      {/* Category chips */}
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
          {state.cart.individualItems.length + state.cart.teamItems.length > 0 ? (
            <Pressable style={styles.cartBanner} onPress={() => router.push('/(tabs)/cart')} accessibilityRole="button">
              <Ionicons name="cart" size={20} color={colors.primaryDark} />
              <Text style={styles.cartBannerText}>
                В корзине {lineCount(state.cart.individualItems) + lineCount(state.cart.teamItems)}{' '}
                {itemWord(lineCount(state.cart.individualItems) + lineCount(state.cart.teamItems))}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.primaryDark} />
            </Pressable>
          ) : null}

          <View style={styles.padX}>
            <SectionHeader
              title="Рекомендации для вас"
              subtitle="Подобрано по вашим интересам"
              icon="sparkles"
            />
          </View>
          {renderShelf(
            recos.map((r) => r.product),
            Object.fromEntries(recos.map((r) => [r.product.id, r.reason])),
          )}

          <View style={styles.padX}>
            <SectionHeader
              title="Популярно в команде"
              subtitle="Чаще всего покупают вместе"
              icon="flame"
              iconColor={colors.danger}
            />
          </View>
          {renderShelf(popular)}

          <View style={styles.padX}>
            <SectionHeader
              title="Лучшая экономия"
              subtitle="Максимальная выгода при покупке командой"
              icon="trending-down"
              iconColor={colors.success}
            />
          </View>
          {renderShelf(savings)}

          {recent.length > 0 ? (
            <>
              <View style={styles.padX}>
                <SectionHeader title="Вы недавно смотрели" icon="time-outline" iconColor={colors.info} />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  headerLeft: {},
  greeting: { ...typography.caption, color: colors.textSecondary },
  cityRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  city: { ...typography.h3, color: colors.text },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconBtn: { padding: 4 },
  dot: { position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg },
  search: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    minHeight: 50,
  },
  searchInput: { flex: 1, ...typography.body, color: colors.text },
  filterBtn: {
    width: 50,
    height: 50,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chips: { gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  feed: {},
  padX: { paddingHorizontal: spacing.lg },
  shelf: { gap: spacing.md, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  results: { paddingHorizontal: spacing.lg, paddingTop: spacing.xs },
  resultsCount: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.md },
  list: { gap: spacing.md },
  cartBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.primarySoft,
  },
  cartBannerText: { ...typography.caption, color: colors.primaryDark, fontWeight: '700', flex: 1 },
});
