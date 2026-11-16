import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../src/context/AuthContext';
import { AppearanceProvider, useAppearance } from '../src/context/AppearanceContext';

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
    <AppearanceProvider>
      <AuthProvider>
        <AppNavigation />
      </AuthProvider>
    </AppearanceProvider>
  );
}
