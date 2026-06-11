import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { AppInput } from '@/components/AppInput';
import { ScreenContainer } from '@/components/ScreenContainer';
import { colors, spacing, typography } from '@/constants/theme';
import { useApp } from '@/store/AppContext';
import { formatPhoneInput, isValidKzPhone, normalizePhone } from '@/utils/format';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useApp();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState(false);

  const phoneOk = isValidKzPhone(phone);
  const passwordOk = password.length >= 6;
  const canSubmit = phoneOk && passwordOk;

  const phoneError = useMemo(() => {
    if (!touched || phoneOk || phone.replace(/\D/g, '').length <= 1) return null;
    return 'Введите корректный номер: +7 7XX XXX XX XX';
  }, [touched, phoneOk, phone]);

  const passwordError = touched && password.length > 0 && !passwordOk ? 'Минимум 6 символов' : null;

  const onSubmit = () => {
    setTouched(true);
    if (!canSubmit) return;
    Keyboard.dismiss();
    login(normalizePhone(phone));
    router.replace('/(auth)/sms-verification');
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
          <AppInput
            leftIcon="lock-closed-outline"
            placeholder="Пароль (минимум 6 символов)"
            password
            value={password}
            onChangeText={setPassword}
            error={passwordError}
            autoCapitalize="none"
          />
        </View>

        {/* Buttons */}
        <View style={styles.actions}>
          <AppButton title="Войти" onPress={onSubmit} disabled={!canSubmit} icon="log-in-outline" />

          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>или</Text>
            <View style={styles.line} />
          </View>

          <AppButton title="Создать аккаунт" variant="secondary" onPress={onSubmit} disabled={!canSubmit} />
        </View>

        <Text style={styles.hint}>
          Демо: подойдёт любой корректный номер +7 и пароль из 6+ символов.
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
