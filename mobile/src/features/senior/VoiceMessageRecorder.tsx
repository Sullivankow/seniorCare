import React, { useEffect, useRef, useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { Mic } from 'lucide-react-native';
import { AppText, Button, ErrorText, Screen } from '../../components/ui';
import { voiceMessagesApi } from '../../api/endpoints';
import { colors, spacing } from '../../theme';
import { getErrorMessage } from '../../utils/errorMessage';

const MAX_RECORDING_SECONDS = 60;

interface Props {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly onMessageSent: () => void;
}

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
}

export function VoiceMessageRecorder({ visible, onClose, onMessageSent }: Props) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);
  const player = useAudioPlayer(null);
  const playerState = useAudioPlayerStatus(player);
  const recordingStarted = useRef(false);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (recorderState.isRecording) {
      recordingStarted.current = true;
      setDurationSeconds(Math.min(
        MAX_RECORDING_SECONDS,
        Math.floor(recorderState.durationMillis / 1000),
      ));
      return;
    }

    if (!recordingStarted.current) return;
    recordingStarted.current = false;
    setRecordingUri(recorder.uri);
    setDurationSeconds(Math.min(
      MAX_RECORDING_SECONDS,
      Math.max(1, Math.ceil(recorderState.durationMillis / 1000)),
    ));
    void setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => undefined);
  }, [recorder, recorderState.durationMillis, recorderState.isRecording]);

  useEffect(() => {
    if (recordingUri) player.replace(recordingUri);
  }, [player, recordingUri]);

  const startRecording = async () => {
    setError(null);
    setRecordingUri(null);
    try {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) {
        setError("L'autorisation du microphone est nécessaire pour enregistrer.");
        return;
      }

      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recordingStarted.current = true;
      recorder.record({ forDuration: MAX_RECORDING_SECONDS });
    } catch (recordingError: unknown) {
      recordingStarted.current = false;
      setError(getErrorMessage(recordingError));
    }
  };

  const stopRecording = async () => {
    try {
      await recorder.stop();
      recordingStarted.current = false;
      setRecordingUri(recorder.uri);
      setDurationSeconds(Math.min(
        MAX_RECORDING_SECONDS,
        Math.max(1, Math.ceil(recorderState.durationMillis / 1000)),
      ));
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
    } catch (recordingError: unknown) {
      setError(getErrorMessage(recordingError));
    }
  };

  const close = async () => {
    try {
      if (recorderState.isRecording) await recorder.stop();
      recordingStarted.current = false;
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      player.pause();
      onClose();
    } catch (closingError: unknown) {
      setError(getErrorMessage(closingError));
    }
  };

  const sendRecording = async () => {
    if (!recordingUri) return;
    setSaving(true);
    setError(null);
    try {
      await voiceMessagesApi.upload(
        { uri: recordingUri, name: 'voice-message.m4a', type: 'audio/mp4' },
        durationSeconds,
      );
      discardRecording();
      onMessageSent();
      await close();
    } catch (uploadError: unknown) {
      setError(getErrorMessage(uploadError));
    } finally {
      setSaving(false);
    }
  };

  const discardRecording = () => {
    player.pause();
    player.replace(null);
    setRecordingUri(null);
    setDurationSeconds(0);
    setError(null);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={() => { void close(); }}>
      <Screen fixed backgroundColor={colors.seniorBg}>
        <View style={styles.header}>
          <View style={styles.heading}>
            <AppText variant="small" color={colors.seniorOk}>MESSAGE À VOTRE FAMILLE</AppText>
            <AppText variant="title" color={colors.white}>Message vocal</AppText>
          </View>
          <Button label="Fermer" variant="ghost" onPress={() => { void close(); }} disabled={saving} />
        </View>

        <View style={styles.body}>
          {recorderState.isRecording && (
            <>
              <View style={styles.micIcon}><Mic size={40} color={colors.white} /></View>
              <AppText variant="huge" color={colors.white} center>{formatDuration(durationSeconds)}</AppText>
              <AppText color={colors.white} center>Enregistrement en cours</AppText>
              <Button label="Arrêter l’enregistrement" variant="danger" onPress={() => { void stopRecording(); }} />
            </>
          )}
          {!recorderState.isRecording && Boolean(recordingUri) && (
            <>
              <AppText color={colors.white} center>Écoutez votre message avant de l’envoyer.</AppText>
              <AppText variant="title" color={colors.white} center>{formatDuration(durationSeconds)}</AppText>
              <Button
                label={playerState.playing ? 'Mettre en pause' : 'Écouter le message'}
                variant="success"
                onPress={() => { playerState.playing ? player.pause() : player.play(); }}
              />
              <Button label="Recommencer" variant="ghost" onPress={discardRecording} disabled={saving} />
              <Button label="Envoyer à ma famille" onPress={() => { void sendRecording(); }} loading={saving} />
            </>
          )}
          {!recorderState.isRecording && !recordingUri && (
            <>
              <View style={styles.micIcon}><Mic size={40} color={colors.white} /></View>
              <AppText color={colors.white} center>Appuyez pour enregistrer un message de 60 secondes maximum.</AppText>
              <Button label="Commencer l’enregistrement" variant="success" onPress={() => { void startRecording(); }} />
            </>
          )}
          <ErrorText message={error} />
        </View>
        <AppText variant="small" color={colors.white} center>
          Votre message est envoyé uniquement aux proches reliés à votre compte.
        </AppText>
      </Screen>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  heading: { flex: 1, gap: spacing.xs },
  body: { flex: 1, justifyContent: 'center', gap: spacing.md },
  micIcon: {
    width: 88,
    height: 88,
    alignSelf: 'center',
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.seniorPurple,
  },
});