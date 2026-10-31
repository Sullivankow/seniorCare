import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Mic } from 'lucide-react-native';
import { AppText, Button, Card, ErrorText } from '../../components/ui';
import { API_URL } from '../../config';
import { useAuth } from '../../context/AuthContext';
import { VoiceMessage } from '../../types';
import { colors, spacing } from '../../theme';
import { formatDateTime } from '../../utils/time';

interface Props {
  readonly messages: readonly VoiceMessage[];
}

function formatDuration(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

export function VoiceMessageList({ messages }: Props) {
  const { token } = useAuth();
  // Un seul lecteur natif sert toute la liste, même quand plusieurs messages sont présents.
  const player = useAudioPlayer(null, { updateInterval: 1000, downloadFirst: true });
  const playerState = useAudioPlayerStatus(player);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);

  useEffect(() => {
    if (playerState.didJustFinish) setActiveMessageId(null);
  }, [playerState.didJustFinish]);

  const playMessage = (message: VoiceMessage) => {
    if (!token) return;
    if (activeMessageId === message.id) {
      if (playerState.playing) player.pause();
      else player.play();
      return;
    }

    player.replace({
      uri: `${API_URL}/voice-messages/${message.id}/audio`,
      headers: { Authorization: `Bearer ${token}` },
    });
    setActiveMessageId(message.id);
    player.play();
  };

  return (
    <View style={styles.section}>
      <View style={styles.heading}>
        <Mic size={22} color={colors.seniorOk} />
        <AppText variant="title">Messages vocaux</AppText>
      </View>

      {messages.length === 0 ? (
        <AppText variant="small">Aucun message vocal pour le moment.</AppText>
      ) : messages.map((message) => {
        const isActive = activeMessageId === message.id;
        let label = 'Écouter le message';
        if (isActive) {
          if (playerState.isBuffering) label = 'Chargement…';
          else label = playerState.playing ? 'Mettre en pause' : 'Reprendre';
        }

        return (
          <Card key={message.id}>
            <View style={styles.messageDetails}>
              <AppText variant="small">{formatDateTime(message.createdAt)}</AppText>
              <AppText variant="small">Durée : {formatDuration(message.durationSeconds)}</AppText>
            </View>
            <Button
              label={label}
              variant={isActive && playerState.playing ? 'warning' : 'success'}
              onPress={() => playMessage(message)}
            />
          </Card>
        );
      })}
      <ErrorText message={playerState.error} />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.md, paddingTop: spacing.md },
  heading: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  messageDetails: { gap: spacing.xs },
});