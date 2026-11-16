import React from 'react';
import { Redirect, Stack } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useAppearance } from '../../src/context/AppearanceContext';

/** Garde : seuls les comptes FAMILLE accèdent à cette interface. */
export default function FamilyLayout() {
  const { user, loading } = useAuth();
  const { colors } = useAppearance();
  if (loading) return null;
  if (!user) return <Redirect href="/login" />;
  if (user.role !== 'FAMILY') return <Redirect href="/" />;
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.ink,
        headerTitleStyle: { fontWeight: '700', color: colors.ink },
        headerShadowVisible: false,
        headerBackTitle: 'Retour',
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Mes proches' }} />
      <Stack.Screen name="add-senior" options={{ title: 'Ajouter un proche' }} />
      <Stack.Screen name="senior/[id]" options={{ title: 'Historique' }} />
      <Stack.Screen name="senior/[id]/photos" options={{ title: 'Album photo' }} />
    </Stack>
  );
}
