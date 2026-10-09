import React, { useCallback, useState } from 'react';
import { Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Screen, AppText, Card, ErrorText } from '../../../src/components/ui';
import { familyApi } from '../../../src/api/endpoints';
import { useRealtime } from '../../../src/hooks/useRealtime';
import { RealtimeEvents } from '../../../src/api/events';
import { formatDateTime } from '../../../src/utils/time';
import { Alert, CheckIn } from '../../../src/types';
import { colors } from '../../../src/theme';

/** Une ligne de la chronologie : pointage ou alerte, triés par date. */
type Entry =
  | { kind: 'checkin'; id: string; at: string; data: CheckIn }
  | { kind: 'alert'; id: string; at: string; data: Alert };

export default function SeniorHistoryScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [checkins, alerts] = await Promise.all([familyApi.checkins(id), familyApi.alerts(id)]);
      const merged: Entry[] = [
        ...checkins.map((c): Entry => ({ kind: 'checkin', id: c.id, at: c.createdAt, data: c })),
        ...alerts.map((a): Entry => ({ kind: 'alert', id: a.id, at: a.createdAt, data: a })),
      ].sort((x, y) => (x.at < y.at ? 1 : -1));
      setEntries(merged);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    }
  }, [id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  useRealtime({
    [RealtimeEvents.CHECKIN_CREATED]: () => load(),
    [RealtimeEvents.ALERT_CREATED]: () => load(),
    [RealtimeEvents.ALERT_RESOLVED]: () => load(),
  });

  return (
    <Screen>
      <Stack.Screen options={{ title: name ? `Historique de ${name}` : 'Historique' }} />
      <ErrorText message={error} />
      {entries.length === 0 && <AppText>Aucun évènement pour l'instant.</AppText>}

      {entries.map((e) =>
        e.kind === 'alert' ? (
          <Card key={`a-${e.id}`} tone="danger">
            <AppText style={{ fontWeight: '700' }} color={colors.danger}>Urgence</AppText>
            <AppText variant="small">
              {formatDateTime(e.at)} · {e.data.status === 'ACTIVE' ? 'en cours' : 'traitée'}
            </AppText>
          </Card>
        ) : (
          <Card key={`c-${e.id}`} tone={e.data.status === 'OK' ? 'ok' : 'warn'}>
            <AppText style={{ fontWeight: '700' }}>{e.data.status === 'OK' ? 'Tout va bien' : 'Pas très en forme'}</AppText>
            <AppText variant="small">{formatDateTime(e.at)}</AppText>
          </Card>
        ),
      )}
    </Screen>
  );
}
