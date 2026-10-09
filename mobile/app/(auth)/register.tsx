import React, { useState } from 'react';
import { router } from 'expo-router';
import { Screen, AppText, Button, Input, ErrorText } from '../../src/components/ui';
import { RoleSelector } from '../../src/components/RoleSelector';
import { authApi } from '../../src/api/endpoints';
import { useAuth } from '../../src/context/AuthContext';
import { useAsyncAction } from '../../src/hooks/useAsyncAction';
import { Role } from '../../src/types';

export default function RegisterScreen() {
  const { signIn } = useAuth();
  const [role, setRole] = useState<Role>('SENIOR');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const register = useAsyncAction(async () => {
    const session = await authApi.register({ fullName: fullName.trim(), email: email.trim(), password, role });
    await signIn(session);
    router.replace('/');
  });

  return (
    <Screen>
      <AppText variant="title">Créer un compte</AppText>
      <RoleSelector value={role} onChange={setRole} />

      <Input label="Prénom et nom" value={fullName} onChangeText={setFullName} autoCapitalize="words" />
      <Input label="Adresse e-mail" value={email} onChangeText={setEmail} keyboardType="email-address" autoComplete="email" />
      <Input label="Mot de passe (6 caractères minimum)" value={password} onChangeText={setPassword} secureTextEntry />
      <ErrorText message={register.error} />

      <Button label="Créer mon compte" onPress={() => register.run()} loading={register.loading} />
      <Button label="J'ai déjà un compte" variant="ghost" onPress={() => router.back()} />
    </Screen>
  );
}
