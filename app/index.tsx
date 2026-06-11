import { Redirect } from 'expo-router';
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { colors } from '@/constants/theme';
import { useApp } from '@/store/AppContext';

/** Entry router: sends the user to the correct step based on persisted state. */
export default function Index() {
  const { state } = useApp();

  if (!state.hydrated) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!state.profile) return <Redirect href="/(auth)/login" />;
  if (!state.profile.isVerified) return <Redirect href="/(auth)/sms-verification" />;
  if (state.profile.interests.length < 2) return <Redirect href="/(auth)/interests" />;
  return <Redirect href="/(tabs)/home" />;
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
});
