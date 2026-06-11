import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { ScreenContainer } from '@/components/ScreenContainer';
import { colors, radii, shadows, spacing, typography } from '@/constants/theme';
import { useApp } from '@/store/AppContext';
import { maskPhone } from '@/utils/format';

const DEMO_CODE = '1234';
const RESEND_SECONDS = 30;

export default function SmsVerificationScreen() {
  const router = useRouter();
  const { state, verify } = useApp();
  const inputRef = useRef<TextInput>(null);

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const [success, setSuccess] = useState(false);

  const phone = state.profile?.phone ?? '';

  useEffect(() => {
    if (seconds <= 0) return;
    const id = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [seconds]);

  const cells = useMemo(() => Array.from({ length: 4 }, (_, i) => code[i] ?? ''), [code]);

  const onConfirm = () => {
    if (code.length < 4) {
      setError('Введите 4-значный код');
      return;
    }
    if (code !== DEMO_CODE) {
      setError('Неверный код. Подсказка: используйте 1234');
      return;
    }
    setError(null);
    verify();
    setSuccess(true);
  };

  const onResend = () => {
    setSeconds(RESEND_SECONDS);
    setCode('');
    setError(null);
  };

  if (success) {
    return (
      <ScreenContainer>
        <View style={styles.successWrap}>
          <View style={styles.successCircle}>
            <Ionicons name="shield-checkmark" size={48} color={colors.success} />
          </View>
          <Text style={styles.successTitle}>Номер подтверждён</Text>
          <Text style={styles.successSubtitle}>Профиль защищён через SIM/eSIM ID</Text>

          <View style={styles.deviceCard}>
            <View style={styles.deviceRow}>
              <Ionicons name="phone-portrait-outline" size={20} color={colors.info} />
              <Text style={styles.deviceLabel}>Проверенное устройство</Text>
              <View style={styles.verifiedPill}>
                <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            </View>
            <Text style={styles.deviceId}>{state.profile?.deviceId}</Text>
            <Text style={styles.deviceNote}>
              Концепт SIM/eSIM идентификации. Реальный доступ к SIM не используется.
            </Text>
          </View>

          <AppButton
            title="Продолжить"
            icon="arrow-forward"
            onPress={() => router.replace('/(auth)/interests')}
            style={styles.continueBtn}
          />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Pressable onPress={() => router.back()} style={styles.back} hitSlop={10} accessibilityLabel="Назад" accessibilityRole="button">
        <Ionicons name="chevron-back" size={26} color={colors.text} />
      </Pressable>

      <View style={styles.iconBadge}>
        <Ionicons name="chatbubble-ellipses-outline" size={30} color={colors.primary} />
      </View>
      <Text style={styles.title}>Подтверждение номера</Text>
      <Text style={styles.subtitle}>
        Мы отправили код на номер{'\n'}
        <Text style={styles.phone}>{maskPhone(phone)}</Text>
      </Text>

      <Pressable style={styles.cells} onPress={() => inputRef.current?.focus()} accessibilityLabel="Поле ввода кода">
        {cells.map((c, i) => {
          const active = i === code.length;
          return (
            <View key={i} style={[styles.cell, active && styles.cellActive, !!c && styles.cellFilled]}>
              <Text style={styles.cellText}>{c}</Text>
            </View>
          );
        })}
      </Pressable>

      <TextInput
        ref={inputRef}
        value={code}
        onChangeText={(t) => {
          setError(null);
          setCode(t.replace(/\D/g, '').slice(0, 4));
        }}
        keyboardType="number-pad"
        maxLength={4}
        autoFocus
        style={styles.hiddenInput}
        accessibilityLabel="Код из СМС"
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.demoHint}>
        <Ionicons name="flask-outline" size={16} color={colors.warning} />
        <Text style={styles.demoHintText}>Демо-код для жюри: {DEMO_CODE}</Text>
      </View>

      <View style={styles.resendRow}>
        {seconds > 0 ? (
          <Text style={styles.timer}>Отправить код повторно через 0:{seconds.toString().padStart(2, '0')}</Text>
        ) : (
          <Pressable onPress={onResend} accessibilityRole="button">
            <Text style={styles.resend}>Отправить код повторно</Text>
          </Pressable>
        )}
      </View>

      <AppButton title="Подтвердить" onPress={onConfirm} disabled={code.length < 4} style={styles.confirmBtn} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  back: { marginTop: spacing.sm, marginBottom: spacing.md, alignSelf: 'flex-start' },
  iconBadge: {
    width: 60,
    height: 60,
    borderRadius: radii.lg,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  title: { ...typography.display, color: colors.text, marginTop: spacing.lg },
  subtitle: { ...typography.body, color: colors.textSecondary, marginTop: spacing.sm, lineHeight: 22 },
  phone: { color: colors.text, fontWeight: '700' },
  cells: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xxl },
  cell: {
    flex: 1,
    height: 64,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellActive: { borderColor: colors.primary },
  cellFilled: { borderColor: colors.borderStrong },
  cellText: { ...typography.display, color: colors.text },
  hiddenInput: { position: 'absolute', width: 1, height: 1, opacity: 0 },
  error: { ...typography.caption, color: colors.danger, marginTop: spacing.md },
  demoHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.warningSoft,
    borderRadius: radii.sm,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  demoHintText: { ...typography.caption, color: colors.warning, fontWeight: '700' },
  resendRow: { marginTop: spacing.lg, alignItems: 'center' },
  timer: { ...typography.caption, color: colors.textMuted },
  resend: { ...typography.caption, color: colors.primary, fontWeight: '700' },
  confirmBtn: { marginTop: spacing.xl },
  // success
  successWrap: { alignItems: 'center', paddingTop: spacing.xxxl },
  successCircle: {
    width: 96,
    height: 96,
    borderRadius: radii.pill,
    backgroundColor: colors.successSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: { ...typography.h1, color: colors.text, marginTop: spacing.xl },
  successSubtitle: { ...typography.body, color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center' },
  deviceCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginTop: spacing.xxl,
    ...shadows.card,
  },
  deviceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  deviceLabel: { ...typography.caption, color: colors.textSecondary, flex: 1 },
  verifiedPill: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: colors.successSoft, paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radii.pill },
  verifiedText: { ...typography.small, color: colors.success },
  deviceId: { ...typography.h2, color: colors.text, marginTop: spacing.md, letterSpacing: 1 },
  deviceNote: { ...typography.caption, color: colors.textMuted, marginTop: spacing.sm, lineHeight: 18 },
  continueBtn: { marginTop: spacing.xxxl, alignSelf: 'stretch' },
});
