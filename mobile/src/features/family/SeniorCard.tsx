import React from 'react';
import { SeniorSummary } from '../../types';
import { colors } from '../../theme';
import { timeAgo } from '../../utils/time';
import { AppText, Button, Card } from '../../components/ui';

interface Props {
  summary: SeniorSummary;
  onOpen: () => void;
  onResolveAlert: (alertId: string) => void;
}

/**
 * Carte d'un proche sur le tableau de bord.
 * Priorité d'affichage : urgence > pas bien > rien reçu aujourd'hui > tout va bien.
 */
export function SeniorCard({ summary, onOpen, onResolveAlert }: Props) {
  const { senior, lastCheckIn, activeAlert, checkedInToday } = summary;

  let tone: 'ok' | 'warn' | 'danger' = 'ok';
  let title = 'Tout va bien';
  let detail = lastCheckIn ? `Dernier message ${timeAgo(lastCheckIn.createdAt)}` : '';

  if (activeAlert) {
    tone = 'danger';
    title = 'URGENCE';
    detail = `Alerte déclenchée ${timeAgo(activeAlert.createdAt)}${activeAlert.message ? ` : ${activeAlert.message}` : ''}`;
  } else if (lastCheckIn?.status === 'NOT_GREAT' && checkedInToday) {
    tone = 'warn';
    title = 'Pas très en forme';
    detail = `Signalé ${timeAgo(lastCheckIn.createdAt)}${lastCheckIn.note ? ` : ${lastCheckIn.note}` : ''}`;
  } else if (!checkedInToday) {
    tone = 'warn';
    title = "Pas encore de nouvelles aujourd'hui";
    detail = lastCheckIn ? `Dernier message ${timeAgo(lastCheckIn.createdAt)}` : "Aucun message pour l'instant";
  }

  const accent = tone === 'danger' ? colors.danger : tone === 'warn' ? colors.warn : colors.ok;

  return (
    <Card tone={tone}>
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
