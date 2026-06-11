import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
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
import { resolveLines } from '@/utils/cart';
import { DISCOUNT_PER_MEMBER, MAX_DISCOUNT, nextDiscountThreshold, teamDiscountPercent } from '@/utils/discount';
import { formatPrice, memberWord } from '@/utils/format';

// ─── Constants ────────────────────────────────────────────────────────────────

const TEAM_TTL_MS = 48 * 60 * 60 * 1000; // 48 hours
const MILESTONES = [1, 2, 3, 4, 5, 6] as const;

const BENEFITS = [
  { icon: 'pricetags-outline', text: 'Скидка 5% за каждого участника команды' },
  { icon: 'trending-down-outline', text: 'До 30% экономии на любом товаре' },
  { icon: 'cube-outline', text: 'Одна общая доставка на всех' },
] as const;

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useCountdown(createdAt: string): string | null {
  const expiresAt = useMemo(
    () => new Date(new Date(createdAt).getTime() + TEAM_TTL_MS),
    [createdAt],
  );

  const calc = () => {
    const diff = expiresAt.getTime() - Date.now();
    if (diff <= 0) return null;
    const h = Math.floor(diff / 3_600_000);
    const m = Math.floor((diff % 3_600_000) / 60_000);
    const s = Math.floor((diff % 60_000) / 1_000);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const [remaining, setRemaining] = useState<string | null>(calc);

  useEffect(() => {
    const id = setInterval(() => setRemaining(calc()), 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  return remaining;
}

// ─── Coupons (catalog) ────────────────────────────────────────────────────────
// Заработанные купоны живут в AppContext (state.coupons). Этот каталог нужен
// только чтобы показывать незаработанные карточки (locked) на странице.

import type { CouponType } from '@/types';

const COUPON_DISPLAY: { type: CouponType; title: string; description: string; discount: number }[] = [
  { type: 'newcomer',       title: 'Новичок',         description: 'За вступление в команду',          discount: 3 },
  { type: 'team_player',    title: 'Командный игрок', description: 'Команда 3+ участника',             discount: 5 },
  { type: 'first_purchase', title: 'Первая покупка',  description: 'Первый товар в командной корзине', discount: 2 },
];

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function TeamScreen() {
  const router = useRouter();
  const toast = useToast();
  const { state, createTeam, joinTeam, leaveTeam, addDemoMember, placeTeamOrder } = useApp();

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const team = state.team;
  const memberCount = team?.members.length ?? 0;
  const discount = teamDiscountPercent(memberCount);
  const next = nextDiscountThreshold(memberCount);

  const countdown = useCountdown(team?.createdAt ?? new Date().toISOString());

  const cartLines = useMemo(() => resolveLines(state.cart.teamItems), [state.cart.teamItems]);
  const cartSubtotal = cartLines.reduce((s, l) => s + l.product.regularPrice * l.quantity, 0);
  const cartDiscount = Math.round((cartSubtotal * discount) / 100);
  const cartTotal = cartSubtotal - cartDiscount;

  const earnedTypes = useMemo(
    () => new Set(state.coupons.map((c) => c.type)),
    [state.coupons],
  );

  const pendingTeamOrder = useMemo(
    () => state.teamOrders.find((o) => o.status === 'pending_participants') ?? null,
    [state.teamOrders],
  );

  // Auto-expire team when countdown reaches zero
  useEffect(() => {
    if (!team) return;
    if (countdown === null) {
      leaveTeam();
      toast.show('Команда истекла — создайте новую', 'info');
    }
  }, [countdown, team]);

  const onPlaceTeamOrder = () => {
    const order = placeTeamOrder();
    if (!order) return;
    if (order.status === 'pending_participants') {
      toast.show(`Заказ #${order.id} создан — ждём ещё ${(order.membersNeeded ?? 6) - (order.membersAtOrder ?? 0)} участников`, 'info');
    } else {
      toast.show('Заказ подтверждён 🎉');
    }
    router.push('/(tabs)/cart');
  };

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

  // ── Empty state ─────────────────────────────────────────────────────────────
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
          <AppButton
            title="Присоединиться"
            variant="secondary"
            onPress={onJoin}
            disabled={code.trim().length === 0}
          />
          <Text style={styles.demoCodes}>Демо-коды: {VALID_DEMO_CODES.join(', ')}</Text>
        </View>
      </ScreenContainer>
    );
  }

  // ── Active team ─────────────────────────────────────────────────────────────
  return (
    <ScreenContainer>
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.h1}>{team.name}</Text>
          <Text style={styles.lead}>{memberCount} {memberWord(memberCount)} в команде</Text>
        </View>
        <Pressable
          onPress={leaveTeam}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Покинуть команду"
        >
          <Ionicons name="exit-outline" size={24} color={colors.danger} />
        </Pressable>
      </View>

      {/* Countdown timer */}
      {countdown ? (
        <View style={styles.timerBanner}>
          <Ionicons name="timer-outline" size={15} color={colors.warning} />
          <Text style={styles.timerText}>Команда активна ещё </Text>
          <Text style={styles.timerValue}>{countdown}</Text>
        </View>
      ) : null}

      {/* Discount card + milestone ladder */}
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

        {/* Milestone ladder */}
        <View style={styles.ladder}>
          {MILESTONES.map((n) => {
            const reached = memberCount >= n;
            const isCurrent = memberCount === n;
            return (
              <View key={n} style={styles.ladderStep}>
                <View
                  style={[
                    styles.ladderDot,
                    reached ? styles.ladderDotReached : styles.ladderDotEmpty,
                    isCurrent && styles.ladderDotCurrent,
                  ]}
                >
                  {reached ? (
                    <Ionicons name="checkmark" size={11} color={colors.textInverse} />
                  ) : (
                    <Text style={styles.ladderDotNum}>{n}</Text>
                  )}
                </View>
                <Text style={[styles.ladderPct, reached && styles.ladderPctReached]}>
                  {n * DISCOUNT_PER_MEMBER}%
                </Text>
              </View>
            );
          })}
        </View>

        <Text style={styles.nextText}>
          {next ? `Ещё +1 участник → скидка ${next.percent}%` : 'Достигнут максимум — 30% скидки!'}
        </Text>
      </View>

      {/* Invite card */}
      <View style={styles.inviteCard}>
        <View style={styles.inviteHeader}>
          <View style={styles.inviteHeaderLeft}>
            <Text style={styles.inviteTitle}>
              {next ? 'Пригласите ещё 1 участника' : 'Поделитесь командой'}
            </Text>
            <Text style={styles.inviteSubtitle}>
              {next
                ? `и скидка вырастет до ${next.percent}%`
                : 'Вы достигли максимальной скидки 30%'}
            </Text>
          </View>
          <View style={styles.qrBox}>
            <QRCode value={team.code} size={72} color={colors.text} backgroundColor={colors.surface} />
          </View>
        </View>

        <View style={styles.codePill}>
          <Text style={styles.codeValue}>{team.code}</Text>
        </View>

        <View style={styles.inviteActions}>
          <Pressable
            onPress={onCopy}
            style={styles.inviteBtn}
            accessibilityRole="button"
            accessibilityLabel="Скопировать код"
          >
            <Ionicons name="copy-outline" size={18} color={colors.primary} />
            <Text style={styles.inviteBtnText}>Скопировать</Text>
          </Pressable>
          <View style={styles.inviteBtnDivider} />
          <Pressable
            onPress={onShare}
            style={[styles.inviteBtn, styles.inviteBtnShare]}
            accessibilityRole="button"
            accessibilityLabel="Поделиться кодом"
          >
            <Ionicons name="share-social-outline" size={18} color={colors.textInverse} />
            <Text style={[styles.inviteBtnText, styles.inviteBtnTextLight]}>Поделиться</Text>
          </Pressable>
        </View>
      </View>

      {/* Coupons */}
      <SectionHeader title="Ваши купоны" icon="pricetag-outline" />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.couponsContent}
      >
        {COUPON_DISPLAY.map((c) => {
          const earned = earnedTypes.has(c.type);
          return (
            <View key={c.type} style={[styles.couponCard, !earned && styles.couponCardLocked]}>
              <Text style={[styles.couponDiscount, !earned && styles.couponDiscountLocked]}>
                -{c.discount}%
              </Text>
              <Text style={[styles.couponTitle, !earned && styles.couponTitleLocked]}>
                {c.title}
              </Text>
              <Text style={styles.couponDesc} numberOfLines={2}>
                {c.description}
              </Text>
              <View style={earned ? styles.couponEarnedBadge : styles.couponLockedBadge}>
                <Ionicons
                  name={earned ? 'checkmark-circle' : 'lock-closed-outline'}
                  size={13}
                  color={earned ? colors.success : colors.textMuted}
                />
                <Text style={earned ? styles.couponEarnedText : styles.couponLockedText}>
                  {earned ? 'Получен' : 'Не получен'}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

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
        <AppButton
          title="Добавить тестового участника"
          variant="ghost"
          icon="person-add-outline"
          onPress={addDemoMember}
        />
      </View>

      {/* Team cart */}
      <SectionHeader title="Командная корзина" icon="cart-outline" />
      <View style={styles.cartSummary}>
        {cartLines.length === 0 ? (
          <Text style={styles.emptyCartText}>
            Корзина команды пуста. Добавьте товары из каталога.
          </Text>
        ) : (
          <>
            {cartLines.map((line) => {
              const lineOriginal = line.product.regularPrice * line.quantity;
              const lineFinal = Math.round(lineOriginal * (1 - discount / 100));
              return (
                <View key={line.product.id} style={styles.cartLine}>
                  <View style={styles.cartLineInfo}>
                    <Text style={styles.cartLineName} numberOfLines={2}>
                      {line.product.title}
                    </Text>
                    <Text style={styles.cartLineQty}>× {line.quantity}</Text>
                  </View>
                  <View style={styles.cartLinePrice}>
                    <Text style={styles.cartLineFinal}>{formatPrice(lineFinal)}</Text>
                    {discount > 0 && (
                      <Text style={styles.cartLineOriginal}>{formatPrice(lineOriginal)}</Text>
                    )}
                  </View>
                </View>
              );
            })}

            <View style={styles.cartDivider} />

            {discount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.success }]}>
                  Скидка команды ({discount}%)
                </Text>
                <Text style={[styles.summaryValue, { color: colors.success }]}>
                  −{formatPrice(cartDiscount)}
                </Text>
              </View>
            )}
            <View style={[styles.summaryRow, styles.summaryTotal]}>
              <Text style={styles.totalLabel}>Итого</Text>
              <Text style={styles.totalValue}>{formatPrice(cartTotal)}</Text>
            </View>
            {pendingTeamOrder ? (
              <View style={styles.pendingBanner}>
                <Ionicons name="hourglass-outline" size={14} color={colors.warning} />
                <Text style={styles.pendingText}>
                  Заказ #{pendingTeamOrder.id} ждёт ещё{' '}
                  {(pendingTeamOrder.membersNeeded ?? 6) - memberCount}{' '}
                  {memberWord((pendingTeamOrder.membersNeeded ?? 6) - memberCount)}
                </Text>
              </View>
            ) : discount < MAX_DISCOUNT ? (
              <View style={styles.pendingBanner}>
                <Ionicons name="people-outline" size={14} color={colors.warning} />
                <Text style={styles.pendingText}>
                  Пригласите ещё {6 - memberCount} {memberWord(6 - memberCount)} → скидка до {MAX_DISCOUNT}%
                </Text>
              </View>
            ) : null}
            {pendingTeamOrder ? (
              <AppButton
                title="К корзине"
                icon="arrow-forward"
                variant="ghost"
                onPress={() => router.push('/(tabs)/cart')}
                style={styles.cartBtn}
              />
            ) : (
              <AppButton
                title="Оформить командный заказ"
                icon="checkmark-circle-outline"
                onPress={onPlaceTeamOrder}
                style={styles.cartBtn}
              />
            )}
          </>
        )}
      </View>
    </ScreenContainer>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── Shared ──
  h1: { ...typography.h1, color: colors.text, marginTop: spacing.sm },
  lead: { ...typography.body, color: colors.textSecondary, marginTop: spacing.xs, lineHeight: 22 },

  // ── Empty state ──
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
  benefitIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitText: { ...typography.body, color: colors.text, flex: 1 },
  createBtn: { marginTop: spacing.xl },
  joinBlock: { marginTop: spacing.sm },
  demoCodes: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.md,
    textAlign: 'center',
  },

  // ── Active team header ──
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },

  // ── Timer ──
  timerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  timerText: { ...typography.caption, color: colors.textSecondary },
  timerValue: { ...typography.bodyStrong, color: colors.warning },

  // ── Discount card ──
  discountCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginTop: spacing.md,
    ...shadows.card,
  },
  discountTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  discountLabel: { ...typography.caption, color: colors.textSecondary },
  discountValue: { ...typography.display, color: colors.success, marginTop: 2 },
  discountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.success,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.pill,
  },
  discountBadgeText: { ...typography.bodyStrong, color: colors.textInverse },
  nextText: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.sm },

  // ── Milestone ladder ──
  ladder: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  ladderStep: { alignItems: 'center', gap: 4, flex: 1 },
  ladderDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  ladderDotEmpty: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
  },
  ladderDotReached: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  ladderDotCurrent: {
    borderColor: colors.primary,
  },
  ladderDotNum: { ...typography.small, color: colors.textMuted },
  ladderPct: { ...typography.small, color: colors.textMuted },
  ladderPctReached: { color: colors.success, fontWeight: '700' },

  // ── Invite card ──
  inviteCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginTop: spacing.md,
    ...shadows.card,
  },
  inviteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  inviteHeaderLeft: { flex: 1 },
  inviteTitle: { ...typography.h3, color: colors.text },
  inviteSubtitle: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  qrBox: {
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  codePill: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
  },
  codeValue: { ...typography.h2, color: colors.primary, letterSpacing: 2 },
  inviteActions: {
    flexDirection: 'row',
    marginTop: spacing.md,
    borderRadius: radii.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  inviteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
  },
  inviteBtnShare: { backgroundColor: colors.primary },
  inviteBtnDivider: { width: 1, backgroundColor: colors.border },
  inviteBtnText: { ...typography.bodyStrong, color: colors.primary },
  inviteBtnTextLight: { color: colors.textInverse },

  // ── Members ──
  membersCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    ...shadows.card,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  memberDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  memberName: { ...typography.bodyStrong, color: colors.text, flex: 1 },
  youPill: {
    backgroundColor: colors.infoSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
  youPillText: { ...typography.small, color: colors.info },
  memberDiscount: {
    backgroundColor: colors.successSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
  memberDiscountText: { ...typography.small, color: colors.success },

  // ── Demo control ──
  demoControl: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    backgroundColor: colors.surfaceAlt,
  },
  demoLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: spacing.sm,
  },
  demoLabel: { ...typography.small, color: colors.warning },

  // ── Cart ──
  cartSummary: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadows.card,
  },
  emptyCartText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  cartLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  cartLineInfo: { flex: 1 },
  cartLineName: { ...typography.body, color: colors.text },
  cartLineQty: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  cartLinePrice: { alignItems: 'flex-end' },
  cartLineFinal: { ...typography.bodyStrong, color: colors.text },
  cartLineOriginal: {
    ...typography.small,
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  cartDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  summaryLabel: { ...typography.body, color: colors.textSecondary },
  summaryValue: { ...typography.bodyStrong, color: colors.text },
  summaryTotal: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    marginTop: spacing.sm,
    paddingTop: spacing.md,
  },
  totalLabel: { ...typography.h3, color: colors.text },
  totalValue: { ...typography.h2, color: colors.text },
  cartBtn: { marginTop: spacing.lg },

  // ── Coupons ──
  couponsContent: {
    gap: spacing.md,
    paddingBottom: spacing.xs,
  },
  couponCard: {
    width: 140,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 4,
    ...shadows.card,
  },
  couponCardLocked: {
    backgroundColor: colors.surfaceAlt,
    opacity: 0.65,
  },
  couponDiscount: {
    ...typography.h2,
    color: colors.success,
  },
  couponDiscountLocked: {
    color: colors.textMuted,
  },
  couponTitle: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  couponTitleLocked: {
    color: colors.textSecondary,
  },
  couponDesc: {
    ...typography.small,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  couponEarnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: spacing.xs,
    backgroundColor: colors.successSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.pill,
    alignSelf: 'flex-start',
  },
  couponLockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: spacing.xs,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.pill,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.border,
  },
  couponEarnedText: {
    ...typography.small,
    color: colors.success,
  },
  couponLockedText: {
    ...typography.small,
    color: colors.textMuted,
  },

  // ── Pending banner ──
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
  },
  pendingText: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
  },
});
