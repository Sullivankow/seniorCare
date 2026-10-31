import React, { useCallback, useState } from 'react';
import { Alert as NativeAlert, RefreshControl, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Check, ChevronRight, CircleCheck, Images, Mic, Phone, Play } from 'lucide-react-native';
import { Screen, AppText, Button, Card, ErrorText } from '../../src/components/ui';
import { SosButton } from '../../src/features/senior/SosButton';
import { SeniorActionButton } from '../../src/features/senior/SeniorActionButton';
import { SeniorStatusPanel } from '../../src/features/senior/SeniorStatusPanel';
import { alertsApi, checkinsApi } from '../../src/api/endpoints';
import { useAuth } from '../../src/context/AuthContext';
import { useRealtime } from '../../src/hooks/useRealtime';
import { useAsyncAction } from '../../src/hooks/useAsyncAction';
import { RealtimeEvents } from '../../src/api/events';
import { timeAgo } from '../../src/utils/time';
import { Alert, CheckIn } from '../../src/types';
import { colors, spacing } from '../../src/theme';
import { getErrorMessage } from '../../src/utils/errorMessage';

/** Tableau de bord senior : actions principales et urgence accessibles en un toucher. */
export default function SeniorHome() {
  const { user } = useAuth();
  const { width } = useWindowDimensions();
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
    } catch (error: unknown) {
      setLoadError(getErrorMessage(error));
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

  const firstName = user?.fullName.split(' ')[0];
  const error = loadError ?? sendCheckIn.error ?? sendNotGreat.error ?? triggerSos.error ?? cancelSos.error;
  const showUnavailableAction = (action: string) =>
    NativeAlert.alert(action, 'Cette fonction sera disponible lorsque les coordonnées de votre proche seront configurées.');

  let columns = 1;
  if (width >= 900) {
    columns = 4;
  } else if (width >= 360) {
    columns = 2;
  }
  const actions = [
    {
      key: 'checkin',
      title: 'JE VAIS BIEN',
      subtitle: last?.status === 'OK' ? 'Confirmer à nouveau' : 'Rassurer ma famille',
      icon: <CircleCheck size={28} color={colors.white} strokeWidth={2.4} />,
      trailing: <Check size={22} color={colors.white} strokeWidth={2.8} />,
      color: colors.seniorOk,
      onPress: () => sendCheckIn.run(),
      loading: sendCheckIn.loading,
    },
    {
      key: 'call',
      title: `Appeler ${firstName ?? 'mon proche'}`,
      subtitle: 'Appel direct',
      icon: <Phone size={28} color={colors.white} strokeWidth={2.2} />,
      trailing: <ChevronRight size={22} color={colors.white} strokeWidth={2.4} />,
      color: colors.seniorBlue,
      onPress: () => showUnavailableAction('Appel direct'),
    },
    {
      key: 'voice',
      title: 'Message vocal',
      subtitle: 'Parler sans écrire',
      icon: <Mic size={28} color={colors.white} strokeWidth={2.2} />,
      trailing: <Play size={20} color={colors.white} strokeWidth={2.4} />,
      color: colors.seniorPurple,
      onPress: () => showUnavailableAction('Message vocal'),
    },
    {
      key: 'photos',
      title: 'Photo de famille',
      subtitle: 'Voir les photos de vos proches',
      icon: <Images size={28} color={colors.white} strokeWidth={2.2} />,
      trailing: <ChevronRight size={22} color={colors.white} strokeWidth={2.4} />,
      color: colors.seniorOrange,
      onPress: () => NativeAlert.alert('Photo de famille', 'Aucune photo n’est disponible pour le moment.'),
    },
  ];
  const actionRows = Array.from({ length: Math.ceil(actions.length / columns) }, (_, index) =>
    actions.slice(index * columns, (index + 1) * columns),
  );

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
          {actionRows.map((row, rowIndex) => (
            <View key={`actions-${rowIndex}`} style={columns > 1 ? styles.actionRow : undefined}>
              {row.map(({ key, ...action }) => (
                <SeniorActionButton
                  key={key}
                  {...action}
                  style={columns > 1 ? styles.actionTile : undefined}
                />
              ))}
            </View>
          ))}
          <AppText center color={colors.white}>
            {last ? `Dernier message envoyé ${timeAgo(last.createdAt)}` : "Appuyez pour dire à votre famille que tout va bien."}
          </AppText>
          <Button variant="warning" label="Je ne suis pas très en forme" onPress={() => sendNotGreat.run()} loading={sendNotGreat.loading} />
          <SosButton onTrigger={() => triggerSos.run()} disabled={triggerSos.loading} />
        </>
      )}

      <ErrorText message={error} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  actionRow: { flexDirection: 'row', alignItems: 'stretch', gap: spacing.md },
  actionTile: { flex: 1 },
});
