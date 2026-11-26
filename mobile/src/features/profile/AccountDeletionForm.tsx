import React, { useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { AppText, Button, Card, ErrorText, Input } from '../../components/ui';
import { userApi } from '../../api/endpoints';
import { useAppearance } from '../../context/AppearanceContext';
import { useAuth } from '../../context/AuthContext';
import { spacing } from '../../theme';
import { getErrorMessage } from '../../utils/errorMessage';

export function AccountDeletionForm() {
  const { colors } = useAppearance();
  const { signOut } = useAuth();
  const [visible, setVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteAccount = async () => {
    setLoading(true);
    setError(null);
    try {
      await userApi.deleteProfile(currentPassword);
      await signOut();
      setVisible(false);
      router.replace('/');
    } catch (requestError: unknown) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card tone="danger">
        <AppText variant="title">Supprimer mon compte</AppText>
        <AppText>Cette action supprime définitivement votre profil, vos pointages, vos contacts et vos médias.</AppText>
        <Button label="Supprimer mon compte" variant="danger" onPress={() => { setError(null); setVisible(true); }} />
      </Card>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <View style={styles.overlay}>
          <View style={[styles.dialog, { backgroundColor: colors.surface }]}>
            <AppText variant="title">Confirmer la suppression</AppText>
            <AppText>Saisissez votre mot de passe actuel pour supprimer définitivement le compte.</AppText>
            <Input label="Mot de passe actuel" value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry autoComplete="current-password" />
            <ErrorText message={error} />
            <Button label="Supprimer définitivement" variant="danger" onPress={() => void deleteAccount()} loading={loading} disabled={!currentPassword} />
            <Button label="Annuler" variant="ghost" onPress={() => { setVisible(false); setCurrentPassword(''); }} disabled={loading} />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', padding: spacing.lg, backgroundColor: 'rgba(0, 0, 0, 0.45)' },
  dialog: { width: '100%', maxWidth: 480, alignSelf: 'center', gap: spacing.md, padding: spacing.lg, borderRadius: 8 },
});