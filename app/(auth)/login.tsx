import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { AppInput } from '@/components/AppInput';
import { Logo } from '@/components/Logo';
import { ScreenContainer } from '@/components/ScreenContainer';
import { useToast } from '@/components/Toast';
import { colors, spacing, typography } from '@/constants/theme';
import { useApp } from '@/store/AppContext';
import { formatPhoneInput, isValidKzPhone, normalizePhone } from '@/utils/format';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useApp();
  const toast = useToast();

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
        <View style={styles.top}>
          <Logo />
        </View>

        <Text style={styles.title}>Добро пожаловать</Text>
        <Text style={styles.subtitle}>
          Покупайте вместе и экономьте до 30%. Войдите по номеру телефона, чтобы начать.
        </Text>

        <View style={styles.form}>
          <AppInput
            label="Номер телефона"
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
            label="Пароль"
            leftIcon="lock-closed-outline"
            placeholder="Минимум 6 символов"
            password
            value={password}
            onChangeText={setPassword}
            error={passwordError}
            autoCapitalize="none"
          />

          <Pressable
            onPress={() => toast.show('Демо-режим: восстановление пароля недоступно', 'info')}
            style={styles.forgot}
            accessibilityRole="button"
          >
            <Text style={styles.forgotText}>Забыли пароль?</Text>
          </Pressable>

          <AppButton title="Войти" onPress={onSubmit} disabled={!canSubmit} icon="log-in-outline" />

          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>или</Text>
            <View style={styles.line} />
          </View>

          <AppButton
            title="Зарегистрироваться"
            variant="secondary"
            onPress={onSubmit}
            disabled={!canSubmit}
          />
        </View>

        <Text style={styles.hint}>
          Демо: подойдёт любой корректный номер +7 и пароль из 6+ символов.
        </Text>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  top: { alignItems: 'center', marginTop: spacing.xxxl, marginBottom: spacing.xxl },
  title: { ...typography.display, color: colors.text, marginTop: spacing.sm },
  subtitle: { ...typography.body, color: colors.textSecondary, marginTop: spacing.sm, lineHeight: 22 },
  form: { marginTop: spacing.xxl },
  forgot: { alignSelf: 'flex-end', marginBottom: spacing.lg, paddingVertical: spacing.xs },
  forgotText: { ...typography.caption, color: colors.primary, fontWeight: '700' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.lg },
  line: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.borderStrong },
  dividerText: { ...typography.caption, color: colors.textMuted, marginHorizontal: spacing.md },
  hint: { ...typography.caption, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
});
