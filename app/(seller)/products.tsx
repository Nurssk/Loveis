import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { EmptyState } from '@/components/EmptyState';
import { ScreenContainer } from '@/components/ScreenContainer';
import { SellerProductRow } from '@/components/SellerProductRow';
import { useToast } from '@/components/Toast';
import { colors, spacing, typography } from '@/constants/theme';
import { useApp } from '@/store/AppContext';

/** Cross-platform confirm (web has no Alert dialog). */
function confirm(title: string, message: string, onYes: () => void) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.confirm(`${title}\n\n${message}`)) onYes();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Отмена', style: 'cancel' },
    { text: 'Удалить', style: 'destructive', onPress: onYes },
  ]);
}

export default function SellerProducts() {
  const router = useRouter();
  const toast = useToast();
  const { state, deleteSellerProduct } = useApp();
  const products = state.sellerProducts;

  return (
    <ScreenContainer edges={['top']}>
      <View style={styles.headerRow}>
        <Text style={styles.h1}>Мои товары</Text>
        <Pressable
          onPress={() => router.push('/seller-product-form')}
          style={styles.addBtn}
          accessibilityRole="button"
          accessibilityLabel="Добавить товар"
        >
          <Ionicons name="add" size={24} color={colors.textInverse} />
        </Pressable>
      </View>
      <Text style={styles.lead}>
        Управляйте каталогом и следите за набором групп. Товары сразу появляются в ленте покупателей.
      </Text>

      {products.length === 0 ? (
        <EmptyState
          icon="pricetags-outline"
          title="Каталог пуст"
          description="Добавьте первый товар и задайте размер группы для оптовой цены."
          actionLabel="Добавить товар"
          onAction={() => router.push('/seller-product-form')}
        />
      ) : (
        <View style={styles.list}>
          {products.map((p) => (
            <SellerProductRow
              key={p.id}
              product={p}
              onEdit={() => router.push({ pathname: '/seller-product-form', params: { id: p.id } })}
              onDelete={() =>
                confirm('Удалить товар', `«${p.title}» будет удалён из каталога.`, () => {
                  deleteSellerProduct(p.id);
                  toast.show('Товар удалён', 'info');
                })
              }
            />
          ))}
        </View>
      )}

      {products.length > 0 ? (
        <AppButton title="Добавить ещё товар" variant="secondary" icon="add" onPress={() => router.push('/seller-product-form')} style={styles.bottomAdd} />
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm },
  h1: { ...typography.display, color: colors.text },
  addBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  lead: { ...typography.body, color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.lg, lineHeight: 22 },
  list: { gap: spacing.md },
  bottomAdd: { marginTop: spacing.lg },
});
