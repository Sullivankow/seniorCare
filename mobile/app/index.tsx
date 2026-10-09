import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';

/** Aiguillage de départ : non connecté → login, sinon interface selon le rôle. */
export default function Index() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  if (!user) return <Redirect href="/login" />;
  return <Redirect href={user.role === 'SENIOR' ? '/(senior)' : '/(family)'} />;
}
