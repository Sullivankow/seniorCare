import React from 'react';
import { Redirect, Tabs } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { colors, font } from '../../src/theme';

/** Garde : seuls les comptes SENIOR accèdent à cette interface. */
export default function SeniorLayout() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Redirect href="/login" />;
  if (user.role !== 'SENIOR') return <Redirect href="/" />;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.seniorOk,
        tabBarInactiveTintColor: colors.white,
        tabBarLabelStyle: { fontSize: font.small, fontWeight: '600' },
        tabBarStyle: {
          backgroundColor: colors.seniorPanel,
          borderTopColor: colors.seniorLine,
          paddingTop: 6,
          paddingBottom: 6,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Accueil' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil' }} />
    </Tabs>
  );
}
