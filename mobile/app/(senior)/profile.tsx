import React from 'react';
import { Alert as NativeAlert } from 'react-native';
import { AppText, Button, Screen } from '../../src/components/ui';
import { useAuth } from '../../src/context/AuthContext';
import { InviteCodeCard } from '../../src/features/senior/InviteCodeCard';
import { ProfileDetailsForm } from '../../src/features/profile/ProfileDetailsForm';
import { ProfilePhotoEditor } from '../../src/features/profile/ProfilePhotoEditor';
import { PasswordChangeForm } from '../../src/features/profile/PasswordChangeForm';
import { AccountDeletionForm } from '../../src/features/profile/AccountDeletionForm';

export default function SeniorProfile() {
  const { user, signOut, updateUser } = useAuth();

  const confirmSignOut = () =>
    NativeAlert.alert('Se déconnecter ?', 'Vous ne pourrez plus prévenir votre famille tant que vous ne vous reconnectez pas.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Se déconnecter', style: 'destructive', onPress: signOut },
    ]);

  return (
    <Screen reserveTabBarSpace>
      <AppText variant="title">Mon profil</AppText>
      {user && (
        <>
          <ProfilePhotoEditor user={user} onUpdated={updateUser} />
          <ProfileDetailsForm user={user} onUpdated={updateUser} />
          <PasswordChangeForm />
        </>
      )}
      <InviteCodeCard code={user?.inviteCode} />
      <AccountDeletionForm />
      <Button variant="danger" label="Se déconnecter" onPress={confirmSignOut} />
    </Screen>
  );
}