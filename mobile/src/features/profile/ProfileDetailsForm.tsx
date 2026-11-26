import React, { useEffect, useState } from 'react';
import { Card, Button, ErrorText, Input, AppText } from '../../components/ui';
import { userApi } from '../../api/endpoints';
import { User } from '../../types';
import { getErrorMessage } from '../../utils/errorMessage';

interface Props {
  readonly user: User;
  readonly onUpdated: (user: User) => Promise<void>;
}

export function ProfileDetailsForm({ user, onUpdated }: Props) {
  const [fullName, setFullName] = useState(user.fullName);
  const [email, setEmail] = useState(user.email);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setFullName(user.fullName);
    setEmail(user.email);
  }, [user.fullName, user.email]);

  const save = async () => {
    setLoading(true);
    setError(null);
    setSaved(false);
    try {
      const updatedUser = await userApi.updateProfile({ fullName: fullName.trim(), email: email.trim() });
      await onUpdated(updatedUser);
      setSaved(true);
    } catch (requestError: unknown) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <AppText variant="title">Mes coordonnées</AppText>
      <Input label="Nom complet" value={fullName} onChangeText={setFullName} autoCapitalize="words" maxLength={100} />
      <Input label="Adresse e-mail" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
      <ErrorText message={error} />
      {saved && <AppText>Profil enregistré.</AppText>}
      <Button label="Enregistrer les coordonnées" onPress={() => void save()} loading={loading} disabled={!fullName.trim() || !email.trim()} />
    </Card>
  );
}