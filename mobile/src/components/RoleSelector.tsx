import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Role } from '../types';
import { useAppearance } from '../context/AppearanceContext';
import { radius } from '../theme';
import { AppText } from './ui';

const OPTIONS: { role: Role; title: string; hint: string }[] = [
  { role: 'SENIOR', title: 'Je suis un senior', hint: 'Je dis « tout va bien » à mes proches' },
  { role: 'FAMILY', title: 'Je suis un proche', hint: 'Je veille sur un parent ou grand-parent' },
];

/** Choix du profil à l'inscription : détermine l'interface affichée ensuite. */
export function RoleSelector({ value, onChange }: Readonly<{ value: Role; onChange: (r: Role) => void }>) {
  const { colors } = useAppearance();
  return (
    <View style={{ gap: 12 }}>
      {OPTIONS.map((o) => {
        const selected = o.role === value;
        return (
          <Pressable
            key={o.role}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => onChange(o.role)}
            style={[styles.option, { borderColor: selected ? colors.primary : colors.line, backgroundColor: selected ? colors.primarySoft : colors.surface }]}
          >
            <AppText style={{ fontWeight: '700' }}>{o.title}</AppText>
            <AppText variant="small">{o.hint}</AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  option: { borderWidth: 2, borderRadius: radius.md, padding: 16 },
});
