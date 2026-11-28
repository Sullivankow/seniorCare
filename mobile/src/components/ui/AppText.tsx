import React from 'react';
import { StyleProp, Text, TextStyle } from 'react-native';
import { useAppearance } from '../../context/AppearanceContext';
import { useAccessibility } from '../../context/AccessibilityContext';

interface Props {
  readonly children: React.ReactNode;
  readonly variant?: 'body' | 'small' | 'title' | 'huge';
  readonly color?: string;
  readonly style?: StyleProp<TextStyle>;
  readonly center?: boolean;
}

/** Texte avec tailles harmonisées (jamais de fontSize en dur dans les écrans). */
export function AppText({ children, variant = 'body', color, style, center }: Props) {
  const { colors } = useAppearance();
  const { textStyles } = useAccessibility();
  return (
    <Text
      style={[
        textStyles[variant],
        { color: color ?? (variant === 'small' ? colors.inkSoft : colors.ink) },
        center && { textAlign: 'center' },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
