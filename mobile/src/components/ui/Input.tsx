import React from 'react';
import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import { colors, font, radius } from '../../theme';
import { AppText } from './AppText';

/** Champ de saisie avec libellé visible (pas seulement un placeholder, plus lisible pour les seniors). */
export function Input({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={{ gap: 6 }}>
      <AppText variant="small" style={{ fontWeight: '600' }}>
        {label}
      </AppText>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.inkSoft}
        style={styles.input}
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
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    fontSize: font.body,
    color: colors.ink,
  },
});
