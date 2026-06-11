import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { AppButton } from '@/components/AppButton';
import { AppInput } from '@/components/AppInput';
import { Avatar } from '@/components/AvatarGroup';
import { ErrorMessage } from '@/components/ErrorMessage';
import { SectionHeader } from '@/components/SectionHeader';
import { ScreenContainer } from '@/components/ScreenContainer';
import { useToast } from '@/components/Toast';
import { VALID_DEMO_CODES } from '@/data/teams';
import { colors, radii, shadows, spacing, typography } from '@/constants/theme';
import { useApp } from '@/store/AppContext';
import { summarize } from '@/utils/cart';
import { MAX_DISCOUNT, nextDiscountThreshold, teamDiscountPercent } from '@/utils/discount';
import { formatPrice, memberWord } from '@/utils/format';

const BENEFITS = [
  { icon: 'pricetags-outline', text: 'Скидка 5% за каждого участника команды' },
  { icon: 'trending-down-outline', text: 'До 30% экономии на любом товаре' },
  { icon: 'cube-outline', text: 'Одна общая доставка на всех' },
];

export default function TeamScreen() {
  const router = useRouter();
  const toast = useToast();
  const { state, createTeam, joinTeam, leaveTeam, addDemoMember } = useApp();

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const team = state.team;
  const memberCount = team?.members.length ?? 0;
  const discount = teamDiscountPercent(memberCount);
  const next = nextDiscountThreshold(memberCount);

  const teamSummary = useMemo(
    () => summarize(state.cart.teamItems, memberCount),
    [state.cart.teamItems, memberCount],
  );

  const onJoin = () => {
    const result = joinTeam(code);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    setCode('');
    toast.show('Вы присоединились к команде');
  };

  const onCopy = async () => {
    if (!team) return;
    await Clipboard.setStringAsync(team.code);
    toast.show('Код скопирован');
  };

  const onShare = async () => {
    if (!team) return;
    try {
      await Share.share({
        message: `Присоединяйтесь к моей команде в BirGe! Код: ${team.code}. Покупаем вместе и экономим до 30%.`,
      });
    } catch {
      await Clipboard.setStringAsync(team.code);
      toast.show('Код скопирован — поделитесь им вручную', 'info');
    }
  };

  // ---- Empty state ----
  if (!team) {
    return (
      <ScreenContainer>
        <Text style={styles.h1}>Команда</Text>
        <Text style={styles.lead}>
          Объединяйтесь с друзьями или соседями — и покупайте дешевле. Каждый участник снижает цену для всех.
        </Text>

        <View style={styles.benefitsCard}>
          {BENEFITS.map((b) => (
            <View key={b.text} style={styles.benefitRow}>
              <View style={styles.benefitIcon}>
                <Ionicons name={b.icon as keyof typeof Ionicons.glyphMap} size={18} color={colors.primary} />
              </View>
              <Text style={styles.benefitText}>{b.text}</Text>
            </View>
          ))}
        </View>

        <AppButton title="Создать команду" icon="add" onPress={createTeam} style={styles.createBtn} />

        <View style={styles.joinBlock}>
          <SectionHeader title="Присоединиться по коду" icon="key-outline" />
          <ErrorMessage message={error} />
          <AppInput
            placeholder="Например, BUY-2026"
            autoCapitalize="characters"
            leftIcon="people-outline"
            value={code}
            onChangeText={(t) => {
              setError(null);
              setCode(t.toUpperCase());
            }}
          />
          <AppButton title="Присоединиться" variant="secondary" onPress={onJoin} disabled={code.trim().length === 0} />
          <Text style={styles.demoCodes}>Демо-коды: {VALID_DEMO_CODES.join(', ')}</Text>
        </View>
      </ScreenContainer>
    );
  }

  // ---- Active team ----
  return (
    <ScreenContainer>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.h1}>{team.name}</Text>
          <Text style={styles.lead}>{memberCount} {memberWord(memberCount)} в команде</Text>
        </View>
        <Pressable onPress={leaveTeam} hitSlop={8} accessibilityRole="button" accessibilityLabel="Покинуть команду">
          <Ionicons name="exit-outline" size={24} color={colors.danger} />
        </Pressable>
      </View>

      {/* Code + QR */}
      <View style={styles.codeCard}>
        <View style={styles.qrBox}>
          <QRCode value={team.code} size={96} color={colors.text} backgroundColor={colors.surface} />
        </View>
        <View style={styles.codeRight}>
          <Text style={styles.codeLabel}>Код команды</Text>
          <Text style={styles.codeValue}>{team.code}</Text>
          <View style={styles.codeActions}>
            <Pressable onPress={onCopy} style={styles.codeAction} accessibilityRole="button" accessibilityLabel="Скопировать код">
              <Ionicons name="copy-outline" size={16} color={colors.primaryDark} />
              <Text style={styles.codeActionText}>Копировать</Text>
            </Pressable>
            <Pressable onPress={onShare} style={styles.codeAction} accessibilityRole="button" accessibilityLabel="Поделиться кодом">
              <Ionicons name="share-social-outline" size={16} color={colors.primaryDark} />
              <Text style={styles.codeActionText}>Поделиться</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Discount progress */}
      <View style={styles.discountCard}>
        <View style={styles.discountTop}>
          <View>
            <Text style={styles.discountLabel}>Текущая скидка команды</Text>
            <Text style={styles.discountValue}>{discount}%</Text>
          </View>
          <View style={styles.discountBadge}>
            <Ionicons name="people" size={16} color={colors.textInverse} />
            <Text style={styles.discountBadgeText}>×{memberCount}</Text>
          </View>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${(discount / MAX_DISCOUNT) * 100}%` }]} />
        </View>
        <Text style={styles.nextText}>
          {next
            ? `Ещё +1 участник → скидка ${next.percent}%`
            : 'Достигнут максимум — 30% скидки!'}
        </Text>
      </View>

      {/* Members */}
      <SectionHeader title="Участники" icon="people-outline" />
      <View style={styles.membersCard}>
        {team.members.map((m, i) => (
          <View key={m.id} style={[styles.memberRow, i > 0 && styles.memberDivider]}>
            <Avatar name={m.name} index={i} size={40} />
            <Text style={styles.memberName}>{m.name}</Text>
            {m.isCurrentUser ? (
              <View style={styles.youPill}>
                <Text style={styles.youPillText}>Это вы</Text>
              </View>
            ) : null}
            <View style={styles.memberDiscount}>
              <Text style={styles.memberDiscountText}>+5%</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Demo control */}
      <View style={styles.demoControl}>
        <View style={styles.demoLabelRow}>
          <Ionicons name="flask-outline" size={14} color={colors.warning} />
          <Text style={styles.demoLabel}>Демо-функция для презентации</Text>
        </View>
        <AppButton title="Добавить тестового участника" variant="ghost" icon="person-add-outline" onPress={addDemoMember} />
      </View>

      {/* Team cart summary */}
      <SectionHeader title="Командная корзина" icon="cart-outline" />
      <View style={styles.cartSummary}>
        {teamSummary.itemCount === 0 ? (
          <Text style={styles.emptyCartText}>Корзина команды пуста. Добавьте товары из каталога.</Text>
        ) : (
          <>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Товары ({teamSummary.itemCount})</Text>
              <Text style={styles.summaryValue}>{formatPrice(teamSummary.subtotal)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.success }]}>Скидка команды ({discount}%)</Text>
              <Text style={[styles.summaryValue, { color: colors.success }]}>−{formatPrice(teamSummary.discountAmount)}</Text>
            </View>
            <View style={[styles.summaryRow, styles.summaryTotal]}>
              <Text style={styles.totalLabel}>Итого</Text>
              <Text style={styles.totalValue}>{formatPrice(teamSummary.finalTotal)}</Text>
            </View>
            <AppButton title="Перейти в корзину" icon="arrow-forward" onPress={() => router.push('/(tabs)/cart')} style={styles.cartBtn} />
          </>
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  h1: { ...typography.h1, color: colors.text, marginTop: spacing.sm },
  lead: { ...typography.body, color: colors.textSecondary, marginTop: spacing.xs, lineHeight: 22 },
  benefitsCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginTop: spacing.xl,
    gap: spacing.md,
    ...shadows.card,
  },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  benefitIcon: { width: 36, height: 36, borderRadius: radii.pill, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  benefitText: { ...typography.body, color: colors.text, flex: 1 },
  createBtn: { marginTop: spacing.xl },
  joinBlock: { marginTop: spacing.sm },
  demoCodes: { ...typography.caption, color: colors.textMuted, marginTop: spacing.md, textAlign: 'center' },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  codeCard: {
    flexDirection: 'row',
    gap: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginTop: spacing.lg,
    ...shadows.card,
  },
  qrBox: { padding: spacing.sm, backgroundColor: colors.surface, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border },
  codeRight: { flex: 1, justifyContent: 'center' },
  codeLabel: { ...typography.caption, color: colors.textSecondary },
  codeValue: { ...typography.h1, color: colors.primary, letterSpacing: 1, marginTop: 2 },
  codeActions: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.md },
  codeAction: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  codeActionText: { ...typography.caption, color: colors.primaryDark, fontWeight: '700' },
  discountCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginTop: spacing.md,
    ...shadows.card,
  },
  discountTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  discountLabel: { ...typography.caption, color: colors.textSecondary },
  discountValue: { ...typography.display, color: colors.success, marginTop: 2 },
  discountBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.success, paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radii.pill },
  discountBadgeText: { ...typography.bodyStrong, color: colors.textInverse },
  progressTrack: { height: 8, borderRadius: radii.pill, backgroundColor: colors.surfaceAlt, marginTop: spacing.md, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: radii.pill, backgroundColor: colors.success },
  nextText: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.sm },
  membersCard: { backgroundColor: colors.surface, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.lg, ...shadows.card },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  memberDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  memberName: { ...typography.bodyStrong, color: colors.text, flex: 1 },
  youPill: { backgroundColor: colors.infoSoft, paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radii.pill },
  youPillText: { ...typography.small, color: colors.info },
  memberDiscount: { backgroundColor: colors.successSoft, paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radii.pill },
  memberDiscountText: { ...typography.small, color: colors.success },
  demoControl: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    backgroundColor: colors.surfaceAlt,
  },
  demoLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: spacing.sm },
  demoLabel: { ...typography.small, color: colors.warning },
  cartSummary: { backgroundColor: colors.surface, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, ...shadows.card },
  emptyCartText: { ...typography.body, color: colors.textSecondary, textAlign: 'center', paddingVertical: spacing.md },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.xs },
  summaryLabel: { ...typography.body, color: colors.textSecondary },
  summaryValue: { ...typography.bodyStrong, color: colors.text },
  summaryTotal: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, marginTop: spacing.sm, paddingTop: spacing.md },
  totalLabel: { ...typography.h3, color: colors.text },
  totalValue: { ...typography.h2, color: colors.text },
  cartBtn: { marginTop: spacing.lg },
});
