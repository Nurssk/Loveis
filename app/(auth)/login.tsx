import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { AppInput } from '@/components/AppInput';
import { ScreenContainer } from '@/components/ScreenContainer';
import { useToast } from '@/components/Toast';
import { colors, spacing, typography } from '@/constants/theme';
import { RECAPTCHA_CONTAINER_ID, sendOtp } from '@/lib/phoneAuth';
import { useApp } from '@/store/AppContext';
import { formatPhoneInput, isValidKzPhone, normalizePhone } from '@/utils/format';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useApp();
  const toast = useToast();

  const [phone, setPhone] = useState('');
  const [touched, setTouched] = useState(false);
  const [sending, setSending] = useState(false);

  const phoneOk = isValidKzPhone(phone);
  const canSubmit = phoneOk;

  const phoneError = useMemo(() => {
    if (!touched || phoneOk || phone.replace(/\D/g, '').length <= 1) return null;
    return 'Введите корректный номер: +7 7XX XXX XX XX';
  }, [touched, phoneOk, phone]);

  const onSubmit = async () => {
    setTouched(true);
    if (!canSubmit || sending) return;
    Keyboard.dismiss();
    const e164 = normalizePhone(phone);
    try {
      setSending(true);
      login(e164);
      await sendOtp(e164);
      router.replace('/(auth)/sms-verification');
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Не удалось отправить код', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <ScreenContainer>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Brand + headline */}
        <View style={styles.brand}>
          <Text style={styles.headline}>Добро пожаловать</Text>
          <Text style={styles.description}>
            Покупайте командой и экономьте до 30% на каждом заказе. Войдите по номеру телефона, чтобы начать.
          </Text>
        </View>

        {/* Inputs */}
        <View style={styles.form}>
          <AppInput
            leftIcon="call-outline"
            placeholder="+7 (7__) ___ __ __"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={(t) => setPhone(formatPhoneInput(t))}
            onBlur={() => setTouched(true)}
            error={phoneError}
            maxLength={18}
          />
        </View>

        {/* Buttons */}
        <View style={styles.actions}>
          <AppButton
            title={sending ? 'Отправляем код…' : 'Войти'}
            onPress={onSubmit}
            disabled={!canSubmit || sending}
            icon="log-in-outline"
          />

          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>или</Text>
            <View style={styles.line} />
          </View>

          <AppButton
            title="Зарегистрироваться"
            variant="secondary"
            onPress={onSubmit}
            disabled={!canSubmit || sending}
          />

          {/* Invisible reCAPTCHA mount point (web only; renders a <div>). */}
          <View nativeID={RECAPTCHA_CONTAINER_ID} />
        </View>

        <Text style={styles.hint}>
          Введите номер +7 — мы отправим SMS с кодом подтверждения.
        </Text>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  brand: { alignItems: 'center', marginTop: spacing.xxxl, marginBottom: spacing.xxl },
  headline: { ...typography.display, color: colors.text, textAlign: 'center', marginTop: spacing.lg },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: spacing.sm,
  },
  form: { marginBottom: spacing.lg },
  actions: {},
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.lg },
  line: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  dividerText: { ...typography.caption, color: colors.textMuted, marginHorizontal: spacing.md },
  hint: { ...typography.caption, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xxl },
});
