import React from 'react';
import { Redirect, Stack } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';

/** Garde : seuls les comptes SENIOR accèdent à cette interface. */
export default function SeniorLayout() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Redirect href="/login" />;
  if (user.role !== 'SENIOR') return <Redirect href="/" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
