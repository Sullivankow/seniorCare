import React from 'react';
import { StyleSheet } from 'react-native';
import { Redirect, Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ContactRound, House, Images, Settings2, UserRound } from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import { useAppearance } from '../../src/context/AppearanceContext';
import { font } from '../../src/theme';

/** Garde : seuls les comptes SENIOR accèdent à cette interface. */
export default function SeniorLayout() {
  const { user, loading } = useAuth();
  const { colors, mode } = useAppearance();
  const insets = useSafeAreaInsets();
  if (loading) return null;
  if (!user) return <Redirect href="/login" />;
  if (user.role !== 'SENIOR') return <Redirect href="/" />;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.inkSoft,
        tabBarLabelStyle: { fontSize: font.small - 2, fontWeight: '600' },
        tabBarBackground: () => (
          <BlurView
            tint={mode === 'dark' ? 'dark' : 'light'}
            intensity={90}
            style={[
              StyleSheet.absoluteFill,
              styles.glassBackground,
              { backgroundColor: mode === 'dark' ? 'rgba(17, 27, 31, 0.68)' : 'rgba(255, 255, 255, 0.62)' },
            ]}
          />
        ),
        tabBarStyle: {
          backgroundColor: 'transparent',
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.18)' : 'rgba(21, 37, 45, 0.12)',
          borderRadius: 28,
          bottom: Math.max(insets.bottom, 8) + 8,
          elevation: 8,
          height: 72,
          left: 12,
          overflow: 'hidden',
          paddingTop: 6,
          paddingBottom: 6,
          position: 'absolute',
          right: 12,
          shadowColor: '#15252D',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.14,
          shadowRadius: 14,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Accueil', tabBarIcon: ({ color, size }) => <House color={color} size={size} /> }} />
      <Tabs.Screen name="photos" options={{ title: 'Photos', tabBarIcon: ({ color, size }) => <Images color={color} size={size} /> }} />
      <Tabs.Screen name="directory" options={{ title: 'Contacts', tabBarIcon: ({ color, size }) => <ContactRound color={color} size={size} /> }} />
      <Tabs.Screen name="settings" options={{ title: 'Réglages', tabBarIcon: ({ color, size }) => <Settings2 color={color} size={size} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil', tabBarIcon: ({ color, size }) => <UserRound color={color} size={size} /> }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  glassBackground: { borderRadius: 28 },
});
