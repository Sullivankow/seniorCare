import React from 'react';
import { StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { colors, radius, spacing } from '../../theme';

/** Surface blanche arrondie. `tone` colore le fond pour signaler un état (ok / alerte). */
export function Card({
  children,
  tone,
  style,
}: {
  children: React.ReactNode;
  tone?: 'ok' | 'warn' | 'danger';
  style?: StyleProp<ViewStyle>;
}) {
  const bg = tone === 'ok' ? colors.okSoft : tone === 'warn' ? colors.warnSoft : tone === 'danger' ? colors.dangerSoft : colors.surface;
  return <View style={[styles.card, { backgroundColor: bg }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm, borderWidth: 1, borderColor: colors.line },
});
