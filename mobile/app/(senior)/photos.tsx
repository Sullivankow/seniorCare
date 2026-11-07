import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import * as Speech from 'expo-speech';
import { Screen, AppText, Button, Card, ErrorText } from '../../src/components/ui';
import { familyPhotosApi } from '../../src/api/endpoints';
import { FamilyPhoto } from '../../src/types';
import { PhotoImage } from '../../src/features/photos/PhotoImage';
import { useRealtime } from '../../src/hooks/useRealtime';
import { RealtimeEvents } from '../../src/api/events';
import { getErrorMessage } from '../../src/utils/errorMessage';
import { colors, spacing } from '../../src/theme';

type AlbumView = 'today' | 'all' | 'memories';

const today = () => new Date().toISOString().slice(0, 10);

export default function SeniorPhotosScreen() {
  const [photos, setPhotos] = useState<FamilyPhoto[]>([]);
  const [view, setView] = useState<AlbumView>('today');
  const [index, setIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setPhotos(await familyPhotosApi.listMine());
      setError(null);
    } catch (loadError: unknown) {
      setError(getErrorMessage(loadError));
    }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));
  useRealtime({ [RealtimeEvents.PHOTO_CREATED]: () => { void load(); } });
  useEffect(() => () => { void Speech.stop(); }, []);

  const visiblePhotos = photos.filter((photo) => {
    if (view === 'today') return photo.surpriseDate === today();
    if (view === 'memories') return photo.memoryDate !== null;
    return true;
  });
  const photo = visiblePhotos[index] ?? visiblePhotos[0] ?? null;

  const selectView = (nextView: AlbumView) => {
    setView(nextView);
    setIndex(0);
  };

  const setLiked = async () => {
    if (!photo) return;
    try {
      const updated = photo.likedAt
        ? await familyPhotosApi.unlike(photo.id)
        : await familyPhotosApi.like(photo.id);
      setPhotos((current) => current.map((item) => item.id === updated.id ? updated : item));
      setError(null);
    } catch (likeError: unknown) {
      setError(getErrorMessage(likeError));
    }
  };

  const readCaption = async () => {
    if (!photo?.caption) return;
    if (await Speech.isSpeakingAsync()) {
      void Speech.stop();
      return;
    }
    Speech.speak(photo.caption, { language: 'fr-FR', rate: 0.9 });
  };

  return (
    <Screen backgroundColor={colors.seniorBg}>
      <AppText variant="title" color={colors.white}>Ma famille en photos</AppText>
      <View style={styles.tabs}>
        <AlbumTab label="Photo du jour" selected={view === 'today'} onPress={() => selectView('today')} />
        <AlbumTab label="Toutes" selected={view === 'all'} onPress={() => selectView('all')} />
        <AlbumTab label="Souvenirs" selected={view === 'memories'} onPress={() => selectView('memories')} />
      </View>
      <ErrorText message={error} />

      {photo ? (
        <Card>
          <PhotoImage photoId={photo.id} label={photo.caption || 'Photo de famille'} height={340} />
          <View style={styles.details}>
            <AppText variant="title">Un petit coucou de {photo.senderName}</AppText>
            <AppText variant="small">Envoyée le {new Date(photo.createdAt).toLocaleDateString('fr-FR')}</AppText>
            {!!photo.memoryDate && <AppText variant="small">Souvenir du {photo.memoryDate}</AppText>}
            {!!photo.caption && <AppText>{photo.caption}</AppText>}
            <Button
              label={photo.likedAt ? 'Retirer mon cœur' : 'Faire un cœur'}
              onPress={() => void setLiked()}
              variant={photo.likedAt ? 'warning' : 'success'}
            />
            {!!photo.caption && <Button label="Écouter le petit mot" onPress={() => void readCaption()} variant="ghost" />}
            {visiblePhotos.length > 1 && (
              <View style={styles.navigation}>
                <Button label="Précédente" onPress={() => setIndex((index + visiblePhotos.length - 1) % visiblePhotos.length)} variant="ghost" />
                <AppText>{index + 1} sur {visiblePhotos.length}</AppText>
                <Button label="Suivante" onPress={() => setIndex((index + 1) % visiblePhotos.length)} variant="ghost" />
              </View>
            )}
          </View>
        </Card>
      ) : (
        <Card>
          <AppText variant="title">{view === 'today' ? 'Pas de photo surprise aujourd’hui' : 'Aucune photo ici pour le moment'}</AppText>
          <AppText>Les nouvelles photos de votre famille apparaîtront ici.</AppText>
          {view === 'today' && <Button label="Voir toutes les photos" onPress={() => selectView('all')} />}
        </Card>
      )}
      <Button label="Retour à l’accueil" variant="ghost" onPress={() => router.back()} />
    </Screen>
  );
}

function AlbumTab({ label, selected, onPress }: { readonly label: string; readonly selected: boolean; readonly onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.tab, selected && styles.selectedTab]}
    >
      <AppText color={selected ? colors.ink : colors.white} style={styles.tabLabel}>{label}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: spacing.sm },
  tab: { flex: 1, minHeight: 52, borderWidth: 2, borderColor: colors.seniorLine, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xs },
  selectedTab: { backgroundColor: colors.white, borderColor: colors.white },
  tabLabel: { fontWeight: '700', textAlign: 'center' },
  details: { gap: spacing.md, paddingTop: spacing.md },
  navigation: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
});