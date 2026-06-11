import { Stack } from 'expo-router';
import React from 'react';

import { colors } from '@/constants/theme';

export default function CheckoutLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="success" options={{ gestureEnabled: false }} />
    </Stack>
  );
}
