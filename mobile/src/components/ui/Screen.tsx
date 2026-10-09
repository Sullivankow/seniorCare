import React from 'react';
import { RefreshControlProps, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../../theme';

interface Props {
  children: React.ReactNode;
  /** Active le pull-to-refresh (passer un <RefreshControl />). */
  refreshControl?: React.ReactElement<RefreshControlProps>;
  /** Contenu non scrollable (écrans courts, centrés). */
  fixed?: boolean;
}

/** Conteneur d'écran standard : zone sûre, fond, marges, scroll. */
export function Screen({ children, refreshControl, fixed }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      {fixed ? (
        <View style={styles.content}>{children}</View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} refreshControl={refreshControl} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.md, flexGrow: 1 },
});
