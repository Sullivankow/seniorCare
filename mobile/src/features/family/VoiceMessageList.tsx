import React, { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { preload, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { File, Paths } from 'expo-file-system';
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

interface RemoteAudioSource {
  readonly uri: string;
  readonly headers: { readonly Authorization: string };
}

async function prepareAudioSource(
  message: VoiceMessage,
  source: RemoteAudioSource,
): Promise<{ source: string | RemoteAudioSource; localFile?: File }> {
  if (Platform.OS === 'web') {
    await preload(source);
    return { source };
  }

  if (Platform.OS === 'ios') {
    const mimeType = message.mimeType.split(';')[0].trim().toLowerCase();
    if (mimeType === 'audio/webm') {
      throw new Error('Ce message est au format WebM et ne peut pas être lu sur iPhone.');
    }

    const extension = mimeType === 'audio/aac' ? 'aac' : 'm4a';
    const localFile = await File.downloadFileAsync(
      source.uri,
      new File(Paths.cache, `voice-message-${message.id}.${extension}`),
      { headers: source.headers, idempotent: true },
    );
    return { source: localFile.uri, localFile };
  }

  return { source };
}

export function VoiceMessageList({ messages }: Props) {
  const { token } = useAuth();
  // Un seul lecteur natif sert toute la liste, même quand plusieurs messages sont présents.
  const player = useAudioPlayer(null, { updateInterval: 1000, downloadFirst: true });
  const playerState = useAudioPlayerStatus(player);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const cachedAudioFile = useRef<File | null>(null);

  useEffect(() => {
    if (playerState.didJustFinish) setActiveMessageId(null);
  }, [playerState.didJustFinish]);

  useEffect(() => () => cachedAudioFile.current?.delete(), []);

  const playMessage = async (message: VoiceMessage) => {
    if (!token) return;
    if (activeMessageId === message.id) {
      if (playerState.playing) player.pause();
      else player.play();
      return;
    }

    setPlaybackError(null);
    const source = {
      uri: `${API_URL}/voice-messages/${message.id}/audio`,
      headers: { Authorization: `Bearer ${token}` },
    };

    try {
      const preparedAudio = await prepareAudioSource(message, source);
      player.replace(preparedAudio.source);
      if (preparedAudio.localFile) {
        const previousFile = cachedAudioFile.current;
        cachedAudioFile.current = preparedAudio.localFile;
        if (previousFile && previousFile.uri !== preparedAudio.localFile.uri) previousFile.delete();
      }
      setActiveMessageId(message.id);
      player.play();
    } catch (error: unknown) {
      setPlaybackError(error instanceof Error ? error.message : 'Impossible de charger le message vocal.');
    }
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
      <ErrorText message={playbackError ?? playerState.error} />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.md, paddingTop: spacing.md },
  heading: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  messageDetails: { gap: spacing.xs },
});