import React, { useCallback, useState } from 'react';
import { Alert as NativeAlert, RefreshControl } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Screen, AppText, Button, Card, ErrorText } from '../../src/components/ui';
import { SosButton } from '../../src/features/senior/SosButton';
import { InviteCodeCard } from '../../src/features/senior/InviteCodeCard';
import { SeniorActionButton } from '../../src/features/senior/SeniorActionButton';
import { SeniorStatusPanel } from '../../src/features/senior/SeniorStatusPanel';
import { alertsApi, checkinsApi } from '../../src/api/endpoints';
import { useAuth } from '../../src/context/AuthContext';
import { useRealtime } from '../../src/hooks/useRealtime';
import { useAsyncAction } from '../../src/hooks/useAsyncAction';
import { RealtimeEvents } from '../../src/api/events';
import { timeAgo } from '../../src/utils/time';
import { Alert, CheckIn } from '../../src/types';
import { colors } from '../../src/theme';

/** Tableau de bord senior : actions principales et urgence accessibles en un toucher. */
export default function SeniorHome() {
  const { user, signOut } = useAuth();
  const [last, setLast] = useState<CheckIn | null>(null);
  const [activeAlert, setActiveAlert] = useState<Alert | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [c, a] = await Promise.all([checkinsApi.last(), alertsApi.myActive()]);
      setLast(c);
      setActiveAlert(a);
      setLoadError(null);
    } catch (e: any) {
      setLoadError(e.message);
    }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  // Si un proche clôture l'alerte, l'écran se met à jour tout seul
  useRealtime({ [RealtimeEvents.ALERT_RESOLVED]: () => load() });

  const sendCheckIn = useAsyncAction(async () => {
    setLast(await checkinsApi.create('OK'));
  });
  const sendNotGreat = useAsyncAction(async () => {
    setLast(await checkinsApi.create('NOT_GREAT', 'Pas très en forme'));
  });
  const triggerSos = useAsyncAction(async () => {
    setActiveAlert(await alertsApi.create("J'ai besoin d'aide"));
  });
  const cancelSos = useAsyncAction(async (id: string) => {
    await alertsApi.resolve(id);
    setActiveAlert(null);
  });

  const confirmSignOut = () =>
    NativeAlert.alert('Se déconnecter ?', 'Vous ne pourrez plus prévenir votre famille tant que vous ne vous reconnectez pas.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Se déconnecter', style: 'destructive', onPress: signOut },
    ]);

  const firstName = user?.fullName.split(' ')[0];
  const error = loadError ?? sendCheckIn.error ?? sendNotGreat.error ?? triggerSos.error ?? cancelSos.error;
  const showUnavailableAction = (action: string) =>
    NativeAlert.alert(action, 'Cette fonction sera disponible lorsque les coordonnées de votre proche seront configurées.');

  return (
    <Screen
      backgroundColor={colors.seniorBg}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />
      }
    >
      <SeniorStatusPanel />
      <AppText variant="title" color={colors.white}>Bonjour {firstName}</AppText>

      {activeAlert ? (
        <Card tone="danger">
          <AppText variant="title" color={colors.danger}>Votre famille a été prévenue</AppText>
          <AppText>Alerte envoyée {timeAgo(activeAlert.createdAt)}. Restez où vous êtes, on s'occupe de vous.</AppText>
          <Button variant="ghost" label="C'était une erreur : annuler" onPress={() => cancelSos.run(activeAlert.id)} loading={cancelSos.loading} />
        </Card>
      ) : (
        <>
          <SeniorActionButton
            title="JE VAIS BIEN"
            subtitle={last?.status === 'OK' ? 'Appuyez pour confirmer à nouveau' : 'Appuyez pour rassurer la famille'}
            icon="☺"
            trailing="✓"
            color={colors.seniorOk}
            onPress={() => sendCheckIn.run()}
            loading={sendCheckIn.loading}
          />
          <SeniorActionButton
            title={`Appeler ${firstName ?? 'mon proche'}`}
            subtitle="Appel direct"
            icon="☎"
            trailing="›"
            color={colors.seniorBlue}
            onPress={() => showUnavailableAction('Appel direct')}
          />
          <SeniorActionButton
            title="Message vocal"
            subtitle="Parler sans écrire"
            icon="♫"
            trailing="▶"
            color={colors.seniorPurple}
            onPress={() => showUnavailableAction('Message vocal')}
          />
          <AppText center color={colors.white}>
            {last ? `Dernier message envoyé ${timeAgo(last.createdAt)}` : "Appuyez pour dire à votre famille que tout va bien."}
          </AppText>
          <Button variant="warning" label="Je ne suis pas très en forme" onPress={() => sendNotGreat.run()} loading={sendNotGreat.loading} />
          <SosButton onTrigger={() => triggerSos.run()} disabled={triggerSos.loading} />
        </>
      )}

      <ErrorText message={error} />
      <InviteCodeCard code={user?.inviteCode} />
      <Button variant="ghost" label="Se déconnecter" onPress={confirmSignOut} />
    </Screen>
  );
}
