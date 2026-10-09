import React from 'react';
import { Redirect, Stack } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { colors } from '../../src/theme';

/** Garde : seuls les comptes FAMILLE accèdent à cette interface. */
export default function FamilyLayout() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Redirect href="/login" />;
  if (user.role !== 'FAMILY') return <Redirect href="/" />;
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTitleStyle: { fontWeight: '700' },
        headerShadowVisible: false,
        headerBackTitle: 'Retour',
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Mes proches' }} />
      <Stack.Screen name="add-senior" options={{ title: 'Ajouter un proche' }} />
      <Stack.Screen name="senior/[id]" options={{ title: 'Historique' }} />
    </Stack>
  );
}
