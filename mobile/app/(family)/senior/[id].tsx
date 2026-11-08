import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Alert as NativeAlert, Animated, PanResponder, Platform, Pressable, StyleSheet, View } from 'react-native';
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Trash2 } from 'lucide-react-native';
import { Screen, AppText, Button, Card, ErrorText } from '../../../src/components/ui';
import { familyApi, voiceMessagesApi } from '../../../src/api/endpoints';
import { useRealtime } from '../../../src/hooks/useRealtime';
import { RealtimeEvents } from '../../../src/api/events';
import { formatDateTime } from '../../../src/utils/time';
import { Alert, CheckIn, VoiceMessage } from '../../../src/types';
import { colors, radius } from '../../../src/theme';
import { getErrorMessage } from '../../../src/utils/errorMessage';
import { VoiceMessageList } from '../../../src/features/family/VoiceMessageList';

/** Une ligne de la chronologie : pointage ou alerte, triés par date. */
type Entry =
  | { kind: 'checkin'; id: string; at: string; data: CheckIn }
  | { kind: 'alert'; id: string; at: string; data: Alert };

const SWIPE_ACTION_WIDTH = 72;

interface SwipeToDeleteProps {
  readonly children: React.ReactNode;
  readonly disabled: boolean;
  readonly onDelete: () => void;
}

function SwipeToDelete({ children, disabled, onDelete }: SwipeToDeleteProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const [isOpen, setIsOpen] = useState(false);
  const closeSwipe = useCallback(() => {
    setIsOpen(false);
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [translateX]);
  const settleSwipe = useCallback((gestureState: { dx: number; vx: number }) => {
    let shouldOpen = isOpen;
    if (gestureState.dx < -SWIPE_ACTION_WIDTH / 2 || gestureState.vx < -0.5) {
      shouldOpen = true;
    } else if (gestureState.dx > SWIPE_ACTION_WIDTH / 2 || gestureState.vx > 0.5) {
      shouldOpen = false;
    }
    setIsOpen(shouldOpen);
    Animated.spring(translateX, {
      toValue: shouldOpen ? -SWIPE_ACTION_WIDTH : 0,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [isOpen, translateX]);
  const panResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_event, gestureState) => (
      !disabled
      && Math.abs(gestureState.dx) > Math.abs(gestureState.dy)
      && (gestureState.dx < -8 || (isOpen && gestureState.dx > 8))
    ),
    onPanResponderMove: (_event, gestureState) => {
      const startOffset = isOpen ? -SWIPE_ACTION_WIDTH : 0;
      translateX.setValue(Math.max(
        -SWIPE_ACTION_WIDTH,
        Math.min(0, startOffset + gestureState.dx),
      ));
    },
    onPanResponderTerminationRequest: () => false,
    onPanResponderRelease: (_event, gestureState) => settleSwipe(gestureState),
    onPanResponderTerminate: (_event, gestureState) => settleSwipe(gestureState),
  }), [disabled, isOpen, settleSwipe, translateX]);

  const deleteFromCard = () => {
    closeSwipe();
    onDelete();
  };

  return (
    <View style={styles.swipeContainer}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Supprimer ce pointage"
        disabled={disabled}
        onPress={deleteFromCard}
        style={styles.swipeDeleteAction}
      >
        <Trash2 size={22} color={colors.white} />
      </Pressable>
      <Animated.View
        {...panResponder.panHandlers}
        style={[styles.swipeForeground, { transform: [{ translateX }] }]}
      >
        <Pressable onPress={isOpen ? closeSwipe : undefined}>
          {children}
        </Pressable>
      </Animated.View>
    </View>
  );
}

export default function SeniorHistoryScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [voiceMessages, setVoiceMessages] = useState<VoiceMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [deletingCheckInId, setDeletingCheckInId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [checkins, alerts, messages] = await Promise.all([
        familyApi.checkins(id),
        familyApi.alerts(id),
        voiceMessagesApi.listForFamily(id),
      ]);
      const merged: Entry[] = [
        ...checkins.map((c): Entry => ({ kind: 'checkin', id: c.id, at: c.createdAt, data: c })),
        ...alerts.map((a): Entry => ({ kind: 'alert', id: a.id, at: a.createdAt, data: a })),
      ].sort((x, y) => (x.at < y.at ? 1 : -1));
      setEntries(merged);
      setVoiceMessages(messages);
      setError(null);
    } catch (error: unknown) {
      setError(getErrorMessage(error));
    }
  }, [id]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));
  useRealtime({
    [RealtimeEvents.CHECKIN_CREATED]: () => { void load(); },
    [RealtimeEvents.CHECKIN_DELETED]: () => { void load(); },
    [RealtimeEvents.ALERT_CREATED]: () => { void load(); },
    [RealtimeEvents.ALERT_RESOLVED]: () => { void load(); },
    [RealtimeEvents.VOICE_MESSAGE_CREATED]: () => { void load(); },
    [RealtimeEvents.VOICE_MESSAGE_DELETED]: () => { void load(); },
  });

  const deleteCheckIn = async (checkIn: CheckIn) => {
    setError(null);
    setDeletingCheckInId(checkIn.id);
    try {
      await familyApi.deleteCheckIn(id, checkIn.id);
      setEntries((current) => current.filter((entry) => entry.id !== checkIn.id));
    } catch (deleteError: unknown) {
      setError(getErrorMessage(deleteError));
    } finally {
      setDeletingCheckInId(null);
    }
  };

  const confirmDeleteCheckIn = (checkIn: CheckIn) => {
    const onConfirm = () => { void deleteCheckIn(checkIn); };
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm('Supprimer ce pointage de l’historique ?')) onConfirm();
      return;
    }

    NativeAlert.alert('Supprimer ce pointage ?', 'Cette action est définitive.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: onConfirm },
    ]);
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: name ? `Historique de ${name}` : 'Historique' }} />
      <Button
        label="Voir et ajouter des photos"
        onPress={() => router.push({ pathname: '/senior/[id]/photos', params: { id, name } })}
      />
      <ErrorText message={error} />
      {entries.length === 0 && voiceMessages.length === 0 && <AppText>Aucun évènement pour l'instant.</AppText>}

      {entries.map((e) =>
        e.kind === 'alert' ? (
          <Card key={`a-${e.id}`} tone="danger">
            <AppText style={{ fontWeight: '700' }} color={colors.danger}>Urgence</AppText>
            <AppText variant="small">
              {formatDateTime(e.at)} · {e.data.status === 'ACTIVE' ? 'en cours' : 'traitée'}
            </AppText>
          </Card>
        ) : (
          <SwipeToDelete
            key={`c-${e.id}`}
            disabled={deletingCheckInId !== null}
            onDelete={() => confirmDeleteCheckIn(e.data)}
          >
            <Card tone={e.data.status === 'OK' ? 'ok' : 'warn'}>
              <AppText style={{ fontWeight: '700' }}>{e.data.status === 'OK' ? 'Tout va bien' : 'Pas très en forme'}</AppText>
              <AppText variant="small">{formatDateTime(e.at)}</AppText>
            </Card>
          </SwipeToDelete>
        ),
      )}
      <VoiceMessageList
        messages={voiceMessages}
        onMessageDeleted={(messageId) => {
          setVoiceMessages((current) => current.filter((message) => message.id !== messageId));
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  swipeContainer: { overflow: 'hidden', borderRadius: radius.lg },
  swipeDeleteAction: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: SWIPE_ACTION_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.danger,
  },
  swipeForeground: { zIndex: 1 },
});
