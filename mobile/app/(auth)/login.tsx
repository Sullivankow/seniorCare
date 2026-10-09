import React, { useState } from 'react';
import { router } from 'expo-router';
import { Screen, AppText, Button, Input, ErrorText } from '../../src/components/ui';
import { authApi } from '../../src/api/endpoints';
import { useAuth } from '../../src/context/AuthContext';
import { useAsyncAction } from '../../src/hooks/useAsyncAction';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const login = useAsyncAction(async () => {
    const session = await authApi.login({ email: email.trim(), password });
    await signIn(session);
    router.replace('/'); // l'aiguillage (index) choisit l'interface selon le rôle
  });

  return (
    <Screen>
      <AppText variant="huge">SeniorCare</AppText>
      <AppText>Gardez le lien, simplement.</AppText>

      <Input label="Adresse e-mail" value={email} onChangeText={setEmail} keyboardType="email-address" autoComplete="email" />
      <Input label="Mot de passe" value={password} onChangeText={setPassword} secureTextEntry />
      <ErrorText message={login.error} />

      <Button label="Se connecter" onPress={() => login.run()} loading={login.loading} />
      <Button label="Créer un compte" variant="ghost" onPress={() => router.push('/register')} />
    </Screen>
  );
}
