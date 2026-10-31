import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { SeniorSummary } from '../../types';
import { colors } from '../../theme';
import { timeAgo } from '../../utils/time';
import { AppText, Button, Card } from '../../components/ui';

interface Props {
  readonly summary: SeniorSummary;
  readonly onOpen: () => void;
  readonly onResolveAlert: (alertId: string) => void;
  readonly style?: StyleProp<ViewStyle>;
}

/**
 * Carte d'un proche sur le tableau de bord.
 * Priorité d'affichage : urgence > pas bien > rien reçu aujourd'hui > tout va bien.
 */
export function SeniorCard({ summary, onOpen, onResolveAlert, style }: Props) {
  const { senior, lastCheckIn, activeAlert, checkedInToday } = summary;

  let tone: 'ok' | 'warn' | 'danger' = 'ok';
  let title = 'Tout va bien';
  let detail = lastCheckIn ? `Dernier message ${timeAgo(lastCheckIn.createdAt)}` : '';

  if (activeAlert) {
    tone = 'danger';
    title = 'URGENCE';
    const message = activeAlert.message ? ` : ${activeAlert.message}` : '';
    detail = `Alerte déclenchée ${timeAgo(activeAlert.createdAt)}${message}`;
  } else if (lastCheckIn?.status === 'NOT_GREAT' && checkedInToday) {
    tone = 'warn';
    title = 'Pas très en forme';
    const note = lastCheckIn.note ? ` : ${lastCheckIn.note}` : '';
    detail = `Signalé ${timeAgo(lastCheckIn.createdAt)}${note}`;
  } else if (!checkedInToday) {
    tone = 'warn';
    title = "Pas encore de nouvelles aujourd'hui";
    detail = lastCheckIn ? `Dernier message ${timeAgo(lastCheckIn.createdAt)}` : "Aucun message pour l'instant";
  }

  let accent = colors.ok;
  if (tone === 'danger') {
    accent = colors.danger;
  } else if (tone === 'warn') {
    accent = colors.warn;
  }

  return (
    <Card tone={tone} style={style}>
      <AppText variant="small">{senior.fullName}</AppText>
      <AppText variant="title" color={accent}>
        {title}
      </AppText>
      <AppText variant="small">{detail}</AppText>
      {activeAlert && <Button variant="danger" label="Marquer comme traitée" onPress={() => onResolveAlert(activeAlert.id)} />}
      <Button variant="ghost" label="Voir l'historique" onPress={onOpen} />
    </Card>
  );
}
