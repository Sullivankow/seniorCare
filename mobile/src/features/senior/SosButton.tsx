import React from 'react';
import { Pressable, StyleSheet, Vibration } from 'react-native';
import { useAppearance } from '../../context/AppearanceContext';
import { radius } from '../../theme';
import { AppText } from '../../components/ui';

/**
 * Bouton d'urgence. Il faut MAINTENIR ~1,5 s pour déclencher : évite les alertes par erreur
 * tout en restant utilisable par une personne qui tremble ou a du mal à viser.
 */
export function SosButton({ onTrigger, disabled }: Readonly<{ onTrigger: () => void; disabled?: boolean }>) {
  const { colors } = useAppearance();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Urgence. Maintenez appuyé pour prévenir votre famille"
      disabled={disabled}
      delayLongPress={1500}
      onLongPress={() => {
        Vibration.vibrate(400);
        onTrigger();
      }}
      style={({ pressed }) => [styles.button, { backgroundColor: colors.danger }, pressed && { opacity: 0.8 }, disabled && { opacity: 0.5 }]}
    >
      <AppText variant="title" color={colors.white} center>
        URGENCE
      </AppText>
      <AppText variant="small" color={colors.white} center>
        Maintenez appuyé pour prévenir votre famille
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { borderRadius: radius.lg, padding: 20, gap: 4, alignItems: 'center' },
});
