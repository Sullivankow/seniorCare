import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { colors } from '../../theme';
import { AppText } from '../../components/ui';

/** Gros bouton rond « Je vais bien » : l'action principale de l'app senior. */
export function CheckInButton({ onPress, loading, doneToday }: { onPress: () => void; loading: boolean; doneToday: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Je vais bien"
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [styles.button, pressed && { transform: [{ scale: 0.97 }] }]}
    >
      {loading ? (
        <ActivityIndicator size="large" color={colors.white} />
      ) : (
        <>
          <AppText variant="huge" color={colors.white} center>
            Je vais bien
          </AppText>
          {doneToday && (
            <AppText variant="small" color={colors.white} center>
              Appuyez à nouveau pour confirmer
            </AppText>
          )}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: 'center',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: colors.ok,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 6,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
});
