import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { Avatar } from '@/components/AvatarGroup';
import { Badge } from '@/components/Badge';
import { SectionHeader } from '@/components/SectionHeader';
import { ScreenContainer } from '@/components/ScreenContainer';
import { useToast } from '@/components/Toast';
import { categoryLabel } from '@/data/categories';
import { ProductImage } from '@/components/ProductImage';
import { colors, radii, shadows, spacing, typography } from '@/constants/theme';
import { useApp } from '@/store/AppContext';
import { useProductsCtx } from '@/store/ProductsContext';
import { formatPhoneInput, formatPrice } from '@/utils/format';

/** Cross-platform confirm (web has no Alert dialog). */
function confirm(title: string, message: string, onYes: () => void) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.confirm(`${title}\n\n${message}`)) onYes();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Отмена', style: 'cancel' },
    { text: 'Подтвердить', style: 'destructive', onPress: onYes },
  ]);
}

export default function ProfileScreen() {
  const router = useRouter();
  const toast = useToast();
  const { state, logout, resetAll, setInterests, createTeam, addToCart, clearCart, unsaveProduct } = useApp();
  const { getProduct, products } = useProductsCtx();
  const [showDemo, setShowDemo] = useState(false);

  const profile = state.profile;
  if (!profile) return null;

  const fillTeamCart = () => {
    if (!state.team) createTeam();
    products.slice(2, 5).forEach((p) => addToCart('team', p.id));
    toast.show('Командная корзина заполнена');
  };

  const fillIndividualCart = () => {
    products.slice(0, 2).forEach((p) => addToCart('individual', p.id));
    toast.show('Индивидуальная корзина заполнена');
  };

  return (
    <ScreenContainer>
      <Text style={styles.h1}>Профиль</Text>

      {/* Identity card */}
      <View style={styles.card}>
        <View style={styles.identityRow}>
          <Avatar name={profile.name} size={56} />
          <View style={styles.identityInfo}>
            <Text style={styles.name}>{profile.name}</Text>
            <Text style={styles.phone}>{formatPhoneInput(profile.phone)}</Text>
          </View>
        </View>
        <View style={styles.verifiedRow}>
          <Ionicons name="shield-checkmark" size={16} color={colors.success} />
          <Text style={styles.verifiedText}>SIM/eSIM ID подтверждён</Text>
          <Text style={styles.deviceId}>{profile.deviceId}</Text>
        </View>
      </View>

      {/* Seller cabinet entry */}
      <Pressable
        onPress={() => router.push(profile.isSeller ? '/(seller)/dashboard' : '/become-seller')}
        style={styles.sellerCard}
        accessibilityRole="button"
        accessibilityLabel={profile.isSeller ? 'Открыть кабинет продавца' : 'Стать продавцом'}
      >
        <View style={styles.sellerIcon}>
          <Ionicons name="storefront" size={22} color={colors.primary} />
        </View>
        <View style={styles.sellerBody}>
          <Text style={styles.sellerTitle}>
            {profile.isSeller ? 'Кабинет продавца' : 'Стать продавцом'}
          </Text>
          <Text style={styles.sellerSubtitle}>
            {profile.isSeller
              ? profile.storeName ?? 'Управляйте товарами и заказами'
              : 'Размещайте товары и продавайте группам'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </Pressable>

      {/* Details */}
      <View style={styles.card}>
        <DetailRow icon="location-outline" label="Город" value={profile.city} />
        <Divider />
        <DetailRow icon="wallet-outline" label="Бюджет" value={formatPrice(profile.budget)} />
      </View>

      {/* Interests */}
      <View style={styles.interestsHeader}>
        <SectionHeader title="Мои интересы" icon="heart-outline" iconColor={colors.danger} />
        <Pressable onPress={() => router.push('/(auth)/interests')} hitSlop={8} accessibilityRole="button">
          <Text style={styles.edit}>Изменить</Text>
        </Pressable>
      </View>
      <View style={styles.chips}>
        {profile.interests.length === 0 ? (
          <Text style={styles.noInterests}>Категории не выбраны</Text>
        ) : (
          profile.interests.map((id) => <Badge key={id} label={categoryLabel(id)} />)
        )}
      </View>

      {/* Saved products */}
      {state.savedProducts.length > 0 ? (
        <View style={styles.savedSection}>
          <SectionHeader title="Сохранённые товары" icon="bookmark-outline" iconColor={colors.primary} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.savedScrollContent}
            style={styles.savedScroll}
          >
            {state.savedProducts.map((id) => {
              const product = getProduct(id);
              // product may still be loading; skip until catalog is ready
              if (!product) return null;
              return (
                <View key={id} style={styles.savedCard}>
                  <Pressable
                    onPress={() => router.push(`/product/${id}`)}
                    accessibilityRole="button"
                    accessibilityLabel={product.title}
                  >
                    <ProductImage uri={product.image} category={product.category} style={styles.savedCardImage} iconSize={24} />
                    <Text style={styles.savedCardTitle} numberOfLines={2}>{product.title}</Text>
                    <Text style={styles.savedCardPrice}>{formatPrice(product.regularPrice)}</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => unsaveProduct(id)}
                    style={styles.savedCardRemove}
                    hitSlop={6}
                    accessibilityRole="button"
                    accessibilityLabel="Убрать"
                  >
                    <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                  </Pressable>
                </View>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      {/* Demo panel */}
      <Pressable
        onPress={() => setShowDemo((s) => !s)}
        style={styles.demoToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: showDemo }}
      >
        <Ionicons name="flask-outline" size={18} color={colors.warning} />
        <Text style={styles.demoToggleText}>Демо-панель для жюри</Text>
        <Ionicons name={showDemo ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} />
      </Pressable>

      {showDemo ? (
        <View style={styles.demoPanel}>
          <DemoAction icon="cart-outline" label="Заполнить индивидуальную корзину" onPress={fillIndividualCart} />
          <DemoAction icon="people-outline" label="Заполнить командную корзину" onPress={fillTeamCart} />
          <DemoAction
            icon="sparkles-outline"
            label="Пройти выбор интересов заново"
            onPress={() => {
              setInterests([]);
              router.push('/(auth)/interests');
            }}
          />
          <DemoAction
            icon="refresh-outline"
            label="Очистить корзины"
            onPress={() => {
              clearCart('individual');
              clearCart('team');
              toast.show('Корзины очищены', 'info');
            }}
          />
          <DemoAction
            icon="trash-outline"
            tone="danger"
            label="Сбросить все демо-данные"
            onPress={() =>
              confirm('Сброс данных', 'Все локальные данные будут удалены, вы вернётесь к экрану входа.', () => {
                resetAll();
                router.replace('/');
              })
            }
          />
        </View>
      ) : null}

      {/* Logout */}
      <AppButton
        title="Выйти"
        variant="danger"
        icon="log-out-outline"
        style={styles.logout}
        onPress={() =>
          confirm('Выход', 'Вы уверены, что хотите выйти?', () => {
            logout();
            router.replace('/');
          })
        }
      />

      <Text style={styles.footerNote}>
        SMS, SIM/eSIM, оплата и интеграции с маркетплейсами — симуляция для демонстрации MVP.
      </Text>
    </ScreenContainer>
  );
}

function DetailRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Ionicons name={icon} size={20} color={colors.textSecondary} />
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

function DemoAction({
  icon,
  label,
  onPress,
  tone = 'default',
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  tone?: 'default' | 'danger';
}) {
  const color = tone === 'danger' ? colors.danger : colors.text;
  return (
    <Pressable onPress={onPress} style={styles.demoAction} accessibilityRole="button" accessibilityLabel={label}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={[styles.demoActionText, { color }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  h1: { ...typography.display, color: colors.text, marginTop: spacing.sm, marginBottom: spacing.lg },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  identityRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  identityInfo: { flex: 1 },
  name: { ...typography.h2, color: colors.text },
  phone: { ...typography.body, color: colors.textSecondary, marginTop: 2 },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.lg, backgroundColor: colors.successSoft, padding: spacing.md, borderRadius: radii.sm },
  verifiedText: { ...typography.caption, color: colors.success, fontWeight: '700', flex: 1 },
  deviceId: { ...typography.small, color: colors.success, letterSpacing: 0.5 },
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  sellerIcon: { width: 44, height: 44, borderRadius: radii.md, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  sellerBody: { flex: 1 },
  sellerTitle: { ...typography.bodyStrong, color: colors.text },
  sellerSubtitle: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xs },
  detailLabel: { ...typography.body, color: colors.textSecondary, flex: 1 },
  detailValue: { ...typography.bodyStrong, color: colors.text },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: spacing.md },
  interestsHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  edit: { ...typography.caption, color: colors.primary, fontWeight: '700', paddingBottom: spacing.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  noInterests: { ...typography.body, color: colors.textMuted },
  savedSection: { marginBottom: spacing.md },
  savedScroll: { marginTop: spacing.sm },
  savedScrollContent: { flexDirection: 'row', gap: spacing.sm, paddingRight: spacing.md },
  savedCard: {
    width: 120,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.card,
  },
  savedCardImage: { width: 120, height: 80 },
  savedCardTitle: { ...typography.small, color: colors.text, padding: spacing.sm, paddingBottom: 2, lineHeight: 16 },
  savedCardPrice: { ...typography.caption, color: colors.primary, fontWeight: '700', paddingHorizontal: spacing.sm, paddingBottom: spacing.sm },
  savedCardRemove: { position: 'absolute', top: 4, right: 4, backgroundColor: colors.surface, borderRadius: 9 },
  demoToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceAlt,
    marginTop: spacing.md,
  },
  demoToggleText: { ...typography.bodyStrong, color: colors.text, flex: 1 },
  demoPanel: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  demoAction: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  demoActionText: { ...typography.body, flex: 1 },
  logout: { marginTop: spacing.xl },
  footerNote: { ...typography.caption, color: colors.textMuted, textAlign: 'center', marginTop: spacing.lg, lineHeight: 18 },
});
