import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { Avatar } from '@/components/AvatarGroup';
import { Badge } from '@/components/Badge';
import { SectionHeader } from '@/components/SectionHeader';
import { ScreenContainer } from '@/components/ScreenContainer';
import { useToast } from '@/components/Toast';
import { categoryLabel } from '@/data/categories';
import { colors, radii, shadows, spacing, typography } from '@/constants/theme';
import { useApp } from '@/store/AppContext';
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

const DEMO_INDIVIDUAL = ['p1', 'p7'];
const DEMO_TEAM = ['p2', 'p5', 'p13'];

export default function ProfileScreen() {
  const router = useRouter();
  const toast = useToast();
  const { state, logout, resetAll, setInterests, createTeam, addToCart, clearCart } = useApp();
  const [showDemo, setShowDemo] = useState(false);

  const profile = state.profile;
  if (!profile) return null;

  const fillTeamCart = () => {
    if (!state.team) createTeam();
    DEMO_TEAM.forEach((id) => addToCart('team', id));
    toast.show('Командная корзина заполнена');
  };

  const fillIndividualCart = () => {
    DEMO_INDIVIDUAL.forEach((id) => addToCart('individual', id));
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
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xs },
  detailLabel: { ...typography.body, color: colors.textSecondary, flex: 1 },
  detailValue: { ...typography.bodyStrong, color: colors.text },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: spacing.md },
  interestsHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  edit: { ...typography.caption, color: colors.primary, fontWeight: '700', paddingBottom: spacing.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  noInterests: { ...typography.body, color: colors.textMuted },
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
