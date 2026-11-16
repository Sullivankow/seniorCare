import React from 'react';
import { RefreshControlProps, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppearance } from '../../context/AppearanceContext';
import { spacing } from '../../theme';

interface Props {
  children: React.ReactNode;
  /** Active le pull-to-refresh (passer un <RefreshControl />). */
  refreshControl?: React.ReactElement<RefreshControlProps>;
  /** Contenu non scrollable (écrans courts, centrés). */
  fixed?: boolean;
  backgroundColor?: string;
  /** Réserve l'espace de la barre d'onglets flottante sur les écrans senior. */
  reserveTabBarSpace?: boolean;
}

/** Conteneur d'écran standard : zone sûre, fond, marges, scroll. */
export function Screen({ children, refreshControl, fixed, backgroundColor, reserveTabBarSpace }: Readonly<Props>) {
  const { colors } = useAppearance();
  const contentStyle = [styles.content, reserveTabBarSpace && styles.tabBarContent];
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: backgroundColor ?? colors.bg }]}>
      {fixed ? (
        <View style={contentStyle}>{children}</View>
      ) : (
        <ScrollView contentContainerStyle={contentStyle} refreshControl={refreshControl} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.md, flexGrow: 1 },
  tabBarContent: { paddingBottom: 104 },
});
