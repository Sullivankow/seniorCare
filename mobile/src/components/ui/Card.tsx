import React from 'react';
import { StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { useAppearance } from '../../context/AppearanceContext';
import { radius, spacing } from '../../theme';

interface Props {
  readonly children: React.ReactNode;
  readonly tone?: 'ok' | 'warn' | 'danger';
  readonly style?: StyleProp<ViewStyle>;
}

/** Surface blanche arrondie. `tone` colore le fond pour signaler un état (ok / alerte). */
export function Card({ children, tone, style }: Readonly<Props>) {
  const { colors } = useAppearance();
  let backgroundColor = colors.surface;
  if (tone === 'ok') backgroundColor = colors.okSoft;
  else if (tone === 'warn') backgroundColor = colors.warnSoft;
  else if (tone === 'danger') backgroundColor = colors.dangerSoft;
  return <View style={[styles.card, { backgroundColor, borderColor: colors.line }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm, borderWidth: 1 },
});
