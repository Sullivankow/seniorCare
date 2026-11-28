import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../src/context/AuthContext';
import { AppearanceProvider, useAppearance } from '../src/context/AppearanceContext';
import { AccessibilityProvider } from '../src/context/AccessibilityContext';

function AppNavigation() {
  const { mode } = useAppearance();
  return (
    <>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}

/** Racine de l'app : fournit la session à tous les écrans. */
export default function RootLayout() {
  return (
    <AccessibilityProvider>
      <AppearanceProvider>
        <AuthProvider>
          <AppNavigation />
        </AuthProvider>
      </AppearanceProvider>
    </AccessibilityProvider>
  );
}
