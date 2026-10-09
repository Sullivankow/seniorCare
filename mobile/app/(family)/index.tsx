import React, { useCallback, useState } from 'react';
import { Alert as NativeAlert, RefreshControl } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Screen, AppText, Button, Card, ErrorText } from '../../src/components/ui';
import { SeniorCard } from '../../src/features/family/SeniorCard';
import { familyApi, alertsApi } from '../../src/api/endpoints';
import { useAuth } from '../../src/context/AuthContext';
import { useRealtime } from '../../src/hooks/useRealtime';
import { RealtimeEvents } from '../../src/api/events';
import { SeniorSummary } from '../../src/types';

/** Tableau de bord FAMILLE : l'état de chaque proche, mis à jour en temps réel. */
export default function FamilyHome() {
  const { signOut } = useAuth();
  const [items, setItems] = useState<SeniorSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setItems(await familyApi.listSeniors());
      setError(null);
    } catch (e: any) {
      setError(e.message);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // Temps réel : on recharge le tableau de bord à chaque évènement + pop-up pour les urgences
  useRealtime({
    [RealtimeEvents.CHECKIN_CREATED]: () => load(),
    [RealtimeEvents.ALERT_RESOLVED]: () => load(),
    [RealtimeEvents.ALERT_CREATED]: (p) => {
      load();
      NativeAlert.alert('URGENCE', `${p.seniorName ?? 'Un proche'} a déclenché une alerte.`);
    },
  });

  const resolve = async (alertId: string) => {
    try {
      await alertsApi.resolve(alertId);
      load();
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <Screen
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />
      }
    >
      <ErrorText message={error} />

      {items?.length === 0 && (
        <Card>
          <AppText variant="title">Aucun proche suivi</AppText>
          <AppText>Demandez à votre proche le code affiché sur son écran, puis ajoutez-le ici.</AppText>
        </Card>
      )}

      {items?.map((s) => (
        <SeniorCard
          key={s.senior.id}
          summary={s}
          onOpen={() => router.push({ pathname: '/senior/[id]', params: { id: s.senior.id, name: s.senior.fullName } })}
          onResolveAlert={resolve}
        />
      ))}

      <Button label="Ajouter un proche" onPress={() => router.push('/add-senior')} />
      <Button label="Se déconnecter" variant="ghost" onPress={signOut} />
    </Screen>
  );
}
