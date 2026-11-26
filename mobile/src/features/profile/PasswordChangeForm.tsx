import React, { useState } from 'react';
import { AppText, Button, Card, ErrorText, Input } from '../../components/ui';
import { userApi } from '../../api/endpoints';
import { getErrorMessage } from '../../utils/errorMessage';

export function PasswordChangeForm() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const changePassword = async () => {
    setError(null);
    setSaved(false);
    if (newPassword.length < 6) {
      setError('Le nouveau mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (newPassword !== confirmation) {
      setError('Les deux nouveaux mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      await userApi.changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmation('');
      setSaved(true);
    } catch (requestError: unknown) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <AppText variant="title">Changer le mot de passe</AppText>
      <Input label="Mot de passe actuel" value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry autoComplete="current-password" />
      <Input label="Nouveau mot de passe" value={newPassword} onChangeText={setNewPassword} secureTextEntry autoComplete="new-password" />
      <Input label="Confirmer le nouveau mot de passe" value={confirmation} onChangeText={setConfirmation} secureTextEntry autoComplete="new-password" />
      <ErrorText message={error} />
      {saved && <AppText>Mot de passe modifié.</AppText>}
      <Button label="Modifier le mot de passe" onPress={() => void changePassword()} loading={loading} disabled={!currentPassword || !newPassword || !confirmation} />
    </Card>
  );
}