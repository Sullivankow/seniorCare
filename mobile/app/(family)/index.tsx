import React, { useCallback, useState } from 'react';
import { Alert as NativeAlert, RefreshControl, StyleSheet, View, useWindowDimensions } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Screen, AppText, Button, Card, ErrorText } from '../../src/components/ui';
import { SeniorCard } from '../../src/features/family/SeniorCard';
import { familyApi, alertsApi } from '../../src/api/endpoints';
import { useAuth } from '../../src/context/AuthContext';
import { useRealtime } from '../../src/hooks/useRealtime';
import { RealtimeEvents } from '../../src/api/events';
import { SeniorSummary } from '../../src/types';
import { colors, spacing } from '../../src/theme';

/** Tableau de bord FAMILLE : l'état de chaque proche, mis à jour en temps réel. */
export default function FamilyHome() {
  const { signOut } = useAuth();
  const { width } = useWindowDimensions();
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

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  // Temps réel : on recharge le tableau de bord à chaque évènement + pop-up pour les urgences
  useRealtime({
    [RealtimeEvents.CHECKIN_CREATED]: () => { void load(); },
    [RealtimeEvents.ALERT_RESOLVED]: () => { void load(); },
    [RealtimeEvents.ALERT_CREATED]: (p) => {
      void load();
      NativeAlert.alert('URGENCE', `${p.seniorName ?? 'Un proche'} a déclenché une alerte.`);
    },
  });

  const resolve = async (alertId: string) => {
    try {
      await alertsApi.resolve(alertId);
      void load();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const columns = width >= 700 ? 2 : 1;
  const rows = items ? Array.from({ length: Math.ceil(items.length / columns) }, (_, index) => items.slice(index * columns, (index + 1) * columns)) : [];

  return (
    <Screen
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />
      }
    >
      <ErrorText message={error} />

      <View style={styles.header}>
        <View style={styles.heading}>
          <AppText variant="small" color={colors.primary}>ESPACE FAMILLE</AppText>
          <AppText variant="huge">Vos proches</AppText>
          <AppText>Retrouvez leur état et leurs dernières nouvelles.</AppText>
        </View>
        <Button label="Ajouter un proche" onPress={() => router.push('/add-senior')} />
      </View>

      {items && items.length > 0 && (
        <View style={styles.sectionHeading}>
          <AppText variant="title">Suivi</AppText>
          <AppText variant="small" color={colors.inkSoft}>{items.length} {items.length > 1 ? 'proches' : 'proche'}</AppText>
        </View>
      )}

      {items?.length === 0 && (
        <Card>
          <AppText variant="title">Aucun proche suivi</AppText>
          <AppText>Demandez à votre proche le code affiché sur son écran, puis ajoutez-le ici.</AppText>
        </Card>
      )}

      {rows.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={columns === 2 ? styles.gridRow : undefined}>
          {row.map((s) => (
            <SeniorCard
              key={s.senior.id}
              summary={s}
              onOpen={() => router.push({ pathname: '/senior/[id]', params: { id: s.senior.id, name: s.senior.fullName } })}
              onResolveAlert={resolve}
              style={columns === 2 ? styles.gridCard : undefined}
            />
          ))}
        </View>
      ))}

      <Button label="Se déconnecter" variant="ghost" onPress={signOut} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.md, paddingBottom: spacing.sm },
  heading: { gap: spacing.xs },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: spacing.sm },
  gridRow: { flexDirection: 'row', alignItems: 'stretch', gap: spacing.md },
  gridCard: { flex: 1 },
});
