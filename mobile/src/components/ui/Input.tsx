import React from 'react';
import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import { useAppearance } from '../../context/AppearanceContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { font, radius } from '../../theme';
import { AppText } from './AppText';

/** Champ de saisie avec libellé visible (pas seulement un placeholder, plus lisible pour les seniors). */
export function Input({ label, ...props }: TextInputProps & { label: string }) {
  const { colors } = useAppearance();
  const { textScale } = useAccessibility();
  return (
    <View style={{ gap: 6 }}>
      <AppText variant="small" style={{ fontWeight: '600' }}>
        {label}
      </AppText>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.inkSoft}
        style={[styles.input, { borderColor: colors.line, backgroundColor: colors.surface, color: colors.ink, fontSize: font.body * textScale }]}
        autoCapitalize="none"
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: 56,
    borderWidth: 2,
    borderRadius: radius.md,
    paddingHorizontal: 16,
  },
});
