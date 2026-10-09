import React, { useState } from 'react';
import { router } from 'expo-router';
import { Screen, AppText, Button, Input, ErrorText } from '../../src/components/ui';
import { familyApi } from '../../src/api/endpoints';
import { useAsyncAction } from '../../src/hooks/useAsyncAction';

export default function AddSeniorScreen() {
  const [code, setCode] = useState('');

  const link = useAsyncAction(async () => {
    await familyApi.linkSenior(code.trim().toUpperCase());
    router.back();
  });

  return (
    <Screen>
      <AppText>Saisissez le code à 6 caractères affiché sur l'écran de votre proche.</AppText>
      <Input label="Code du proche" value={code} onChangeText={setCode} autoCapitalize="characters" maxLength={6} />
      <ErrorText message={link.error} />
      <Button label="Suivre ce proche" onPress={() => link.run()} loading={link.loading} disabled={code.trim().length !== 6} />
    </Screen>
  );
}
