import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { AppInput } from '@/components/AppInput';
import { CheckList } from '@/components/CheckList';
import { ScreenContainer } from '@/components/ScreenContainer';
import { useToast } from '@/components/Toast';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { useApp } from '@/store/AppContext';

export default function BecomeSeller() {
  const router = useRouter();
  const toast = useToast();
  const { state, becomeSeller } = useApp();
  const [store, setStore] = useState(state.profile?.storeName ?? '');

  const open = () => {
    becomeSeller(store);
    toast.show('Магазин открыт');
    router.replace('/(seller)/dashboard');
  };

  return (
    <ScreenContainer
      edges={['top', 'bottom']}
      footer={<AppButton title="Открыть магазин" icon="storefront" onPress={open} disabled={store.trim().length < 2} />}
    >
      <Pressable onPress={() => router.back()} style={styles.back} accessibilityRole="button" accessibilityLabel="Назад">
        <Ionicons name="chevron-back" size={26} color={colors.text} />
      </Pressable>

      <View style={styles.hero}>
        <Ionicons name="storefront" size={32} color={colors.primary} />
      </View>
      <Text style={styles.h1}>Станьте продавцом</Text>
      <Text style={styles.lead}>
        Размещайте товары и продавайте их группам покупателей по оптовым ценам. Чем больше группа — тем привлекательнее ваше предложение.
      </Text>

      <Text style={styles.sectionTitle}>Что вы получаете</Text>
      <CheckList
        items={[
          'Витрина в общей ленте покупателей',
          'Групповые закупки — больше объём заказа',
          'Управление товарами и ценой группы',
          'Заказы и статистика в одном кабинете',
        ]}
      />

      <View style={styles.formCard}>
        <AppInput
          label="Название магазина"
          placeholder="Например, TechnoStore KZ"
          leftIcon="business-outline"
          value={store}
          onChangeText={setStore}
          maxLength={32}
        />
        <Text style={styles.hint}>Это имя увидят покупатели рядом с вашими товарами.</Text>
      </View>

      <View style={styles.note}>
        <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
        <Text style={styles.noteText}>
          Вы остаётесь покупателем — переключаться между режимами можно в любой момент.
        </Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  back: { marginTop: spacing.sm, marginBottom: spacing.sm, alignSelf: 'flex-start' },
  hero: { width: 64, height: 64, borderRadius: radii.lg, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginTop: spacing.sm },
  h1: { ...typography.display, color: colors.text, marginTop: spacing.lg },
  lead: { ...typography.body, color: colors.textSecondary, marginTop: spacing.sm, lineHeight: 23 },
  sectionTitle: { ...typography.h3, color: colors.text, marginTop: spacing.xl, marginBottom: spacing.md },
  formCard: { marginTop: spacing.xl },
  hint: { ...typography.caption, color: colors.textMuted, marginTop: -spacing.xs },
  note: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg, padding: spacing.md, borderRadius: radii.md, backgroundColor: colors.surfaceAlt },
  noteText: { ...typography.caption, color: colors.textSecondary, flex: 1, lineHeight: 18 },
});
