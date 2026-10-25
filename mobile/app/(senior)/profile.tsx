import React from 'react';
import { Alert as NativeAlert } from 'react-native';
import { AppText, Button, Card, Screen } from '../../src/components/ui';
import { useAuth } from '../../src/context/AuthContext';
import { InviteCodeCard } from '../../src/features/senior/InviteCodeCard';
import { colors } from '../../src/theme';

export default function SeniorProfile() {
  const { user, signOut } = useAuth();

  const confirmSignOut = () =>
    NativeAlert.alert('Se déconnecter ?', 'Vous ne pourrez plus prévenir votre famille tant que vous ne vous reconnectez pas.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Se déconnecter', style: 'destructive', onPress: signOut },
    ]);

  return (
    <Screen backgroundColor={colors.seniorBg}>
      <AppText variant="title" color={colors.white}>Mon profil</AppText>
      <Card>
        <AppText variant="title">{user?.fullName}</AppText>
        <AppText>{user?.email}</AppText>
      </Card>
      <InviteCodeCard code={user?.inviteCode} />
      <Button variant="danger" label="Se déconnecter" onPress={confirmSignOut} />
    </Screen>
  );
}