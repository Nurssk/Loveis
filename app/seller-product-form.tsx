import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { AppInput } from '@/components/AppInput';
import { CategoryChip } from '@/components/CategoryChip';
import { ScreenContainer } from '@/components/ScreenContainer';
import { useToast } from '@/components/Toast';
import { CATEGORIES } from '@/data/categories';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { useApp } from '@/store/AppContext';
import { SellerProductInput } from '@/types';
import { formatPrice } from '@/utils/format';

function digits(s: string): string {
  return s.replace(/\D/g, '');
}

export default function SellerProductForm() {
  const router = useRouter();
  const toast = useToast();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { state, addSellerProduct, updateSellerProduct } = useApp();

  const existing = useMemo(
    () => (id ? state.sellerProducts.find((p) => p.id === id) : undefined),
    [id, state.sellerProducts],
  );
  const isEdit = !!existing;

  const [title, setTitle] = useState(existing?.title ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [category, setCategory] = useState<string | null>(existing?.category ?? null);
  const [price, setPrice] = useState(existing ? String(existing.regularPrice) : '');
  const [groupPrice, setGroupPrice] = useState(existing?.groupPrice ? String(existing.groupPrice) : '');
  const [minBatch, setMinBatch] = useState(existing?.minBatch ? String(existing.minBatch) : '10');
  const [image, setImage] = useState(existing?.image ?? '');
  const [error, setError] = useState<string | null>(null);

  const priceNum = Number(digits(price));
  const groupNum = groupPrice ? Number(digits(groupPrice)) : undefined;
  const batchNum = Number(digits(minBatch));

  const validate = (): string | null => {
    if (title.trim().length < 3) return 'Введите название товара (минимум 3 символа).';
    if (!category) return 'Выберите категорию.';
    if (!priceNum || priceNum < 100) return 'Укажите корректную обычную цену.';
    if (groupNum !== undefined && groupNum >= priceNum) return 'Групповая цена должна быть ниже обычной.';
    if (!batchNum || batchNum < 2) return 'Размер группы — минимум 2 участника.';
    return null;
  };

  const save = () => {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    const input: SellerProductInput = {
      title,
      description: description.trim() || 'Товар для групповой закупки.',
      category: category!,
      regularPrice: priceNum,
      groupPrice: groupNum,
      minBatch: batchNum,
      image,
    };
    if (isEdit && existing) {
      updateSellerProduct(existing.id, input);
      toast.show('Товар обновлён');
    } else {
      addSellerProduct(input);
      toast.show('Товар добавлен');
    }
    router.back();
  };

  return (
    <ScreenContainer
      edges={['top', 'bottom']}
      footer={<AppButton title={isEdit ? 'Сохранить изменения' : 'Опубликовать товар'} icon="checkmark" onPress={save} />}
    >
      <View style={styles.header}>
        <AppButton title="" variant="ghost" icon="chevron-back" fullWidth={false} onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Назад" />
        <Text style={styles.h1}>{isEdit ? 'Редактировать товар' : 'Новый товар'}</Text>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={16} color={colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <AppInput
        label="Название"
        placeholder="Например, Наушники TWS Pro"
        leftIcon="cube-outline"
        value={title}
        onChangeText={(t) => { setError(null); setTitle(t); }}
        maxLength={60}
      />

      <AppInput
        label="Описание"
        placeholder="Коротко опишите товар и его выгоду в группе"
        leftIcon="document-text-outline"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
        style={styles.multiline}
        maxLength={240}
      />

      <Text style={styles.label}>Категория</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {CATEGORIES.map((c) => (
          <CategoryChip
            key={c.id}
            label={c.label}
            icon={c.icon as keyof typeof Ionicons.glyphMap}
            selected={category === c.id}
            onPress={() => { setError(null); setCategory(c.id); }}
          />
        ))}
      </ScrollView>

      <View style={styles.row}>
        <View style={styles.col}>
          <AppInput
            label="Обычная цена, ₸"
            placeholder="24990"
            leftIcon="pricetag-outline"
            keyboardType="number-pad"
            value={price}
            onChangeText={(t) => { setError(null); setPrice(digits(t)); }}
          />
        </View>
        <View style={styles.col}>
          <AppInput
            label="Групповая цена, ₸"
            placeholder="18990"
            leftIcon="people-outline"
            keyboardType="number-pad"
            value={groupPrice}
            onChangeText={(t) => { setError(null); setGroupPrice(digits(t)); }}
          />
        </View>
      </View>

      <AppInput
        label="Размер группы для оптовой цены"
        placeholder="10"
        leftIcon="flag-outline"
        keyboardType="number-pad"
        value={minBatch}
        onChangeText={(t) => { setError(null); setMinBatch(digits(t)); }}
      />

      <AppInput
        label="Ссылка на фото (необязательно)"
        placeholder="https://…"
        leftIcon="image-outline"
        autoCapitalize="none"
        value={image}
        onChangeText={setImage}
      />

      {/* Savings preview */}
      {priceNum >= 100 && groupNum && groupNum < priceNum ? (
        <View style={styles.preview}>
          <Ionicons name="trending-down" size={18} color={colors.success} />
          <Text style={styles.previewText}>
            Покупатели экономят <Text style={styles.previewStrong}>{formatPrice(priceNum - groupNum)}</Text> при наборе {batchNum || 10} участников
          </Text>
        </View>
      ) : null}

      <Text style={styles.hint}>
        Товар появится в ленте покупателей. Групповая цена откроется, когда наберётся указанная группа.
      </Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm, marginBottom: spacing.lg },
  backBtn: { minHeight: 40, paddingHorizontal: spacing.xs, borderColor: 'transparent' },
  h1: { ...typography.h1, color: colors.text },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radii.sm, backgroundColor: colors.dangerSoft, marginBottom: spacing.md },
  errorText: { ...typography.caption, color: colors.danger, flex: 1 },
  label: { ...typography.captionStrong, color: colors.textSecondary, marginBottom: spacing.sm },
  chips: { gap: spacing.sm, paddingBottom: spacing.lg, paddingRight: spacing.lg },
  multiline: { minHeight: 72, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: spacing.md },
  col: { flex: 1 },
  preview: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radii.md, backgroundColor: colors.successSoft, marginTop: spacing.xs },
  previewText: { ...typography.caption, color: colors.savingsDeep, flex: 1, lineHeight: 18 },
  previewStrong: { ...typography.captionStrong, color: colors.savingsDeep },
  hint: { ...typography.caption, color: colors.textMuted, marginTop: spacing.lg, lineHeight: 18 },
});
