import React from 'react';
import { StyleProp, StyleSheet, Text, TextStyle } from 'react-native';
import { colors, font } from '../../theme';

interface Props {
  children: React.ReactNode;
  variant?: 'body' | 'small' | 'title' | 'huge';
  color?: string;
  style?: StyleProp<TextStyle>;
  center?: boolean;
}

/** Texte avec tailles harmonisées (jamais de fontSize en dur dans les écrans). */
export function AppText({ children, variant = 'body', color, style, center }: Props) {
  return (
    <Text
      style={[
        styles[variant],
        { color: color ?? (variant === 'small' ? colors.inkSoft : colors.ink) },
        center && { textAlign: 'center' },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  body: { fontSize: font.body, lineHeight: font.body * 1.4 },
  small: { fontSize: font.small, lineHeight: font.small * 1.4 },
  title: { fontSize: font.title, fontWeight: '700', lineHeight: font.title * 1.2 },
  huge: { fontSize: font.huge, fontWeight: '800', lineHeight: font.huge * 1.15 },
});
