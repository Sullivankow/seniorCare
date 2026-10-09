import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { colors, font, radius } from '../../theme';
import { AppText } from './AppText';

type Variant = 'primary' | 'success' | 'warning' | 'danger' | 'ghost';

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
}

const palette: Record<Variant, { bg: string; fg: string; border?: string }> = {
  primary: { bg: colors.primary, fg: colors.white },
  success: { bg: colors.ok, fg: colors.white },
  warning: { bg: colors.warnSoft, fg: colors.warn, border: colors.warn },
  danger: { bg: colors.danger, fg: colors.white },
  ghost: { bg: 'transparent', fg: colors.primary, border: colors.line },
};

/** Bouton standard : hauteur ≥ 56 pt pour rester facile à toucher. */
export function Button({ label, onPress, variant = 'primary', loading, disabled }: Props) {
  const p = palette[variant];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: p.bg, borderColor: p.border ?? p.bg, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={p.fg} />
      ) : (
        <AppText color={p.fg} style={{ fontWeight: '700', fontSize: font.body }}>
          {label}
        </AppText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 56,
    borderRadius: radius.md,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
});
