import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Modal, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { X } from 'lucide-react-native';
import * as Speech from 'expo-speech';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText, Button, Card, ErrorText } from '../../src/components/ui';
import { familyPhotosApi } from '../../src/api/endpoints';
import { FamilyPhoto } from '../../src/types';
import { PhotoImage } from '../../src/features/photos/PhotoImage';
import { PhotoLikeButton, SeniorPhotoGridTile } from '../../src/features/photos/PhotoGridTile';
import { useRealtime } from '../../src/hooks/useRealtime';
import { RealtimeEvents } from '../../src/api/events';
import { getErrorMessage } from '../../src/utils/errorMessage';
import { useAppearance } from '../../src/context/AppearanceContext';
import { spacing } from '../../src/theme';

type AlbumView = 'today' | 'all' | 'memories';

const today = () => new Date().toISOString().slice(0, 10);

export default function SeniorPhotosScreen() {
  const { colors } = useAppearance();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [photos, setPhotos] = useState<FamilyPhoto[]>([]);
  const [view, setView] = useState<AlbumView>('today');
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [pendingLikeIds, setPendingLikeIds] = useState<Set<string>>(() => new Set());
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

  const columns = width >= 900 ? 5 : width >= 600 ? 4 : 3;
  const tileSize = Math.floor((width - spacing.lg * 2 - spacing.xs * (columns - 1)) / columns);
  const visiblePhotos = photos.filter((photo) => {
    if (view === 'today') return photo.surpriseDate === today();
    if (view === 'memories') return photo.memoryDate !== null;
    return true;
  });
  const selectedPhoto = photos.find((photo) => photo.id === selectedPhotoId) ?? null;

  const selectView = (nextView: AlbumView) => {
    setView(nextView);
    setSelectedPhotoId(null);
  };

  const toggleLike = async (photo: FamilyPhoto) => {
    if (pendingLikeIds.has(photo.id)) return;
    setPendingLikeIds((current) => new Set(current).add(photo.id));
    try {
      const updated = photo.likedAt
        ? await familyPhotosApi.unlike(photo.id)
        : await familyPhotosApi.like(photo.id);
      setPhotos((current) => current.map((item) => item.id === updated.id ? updated : item));
      setError(null);
    } catch (likeError: unknown) {
      setError(getErrorMessage(likeError));
    } finally {
      setPendingLikeIds((current) => {
        const next = new Set(current);
        next.delete(photo.id);
        return next;
      });
    }
  };

  const readCaption = async () => {
    if (!selectedPhoto?.caption) return;
    if (await Speech.isSpeakingAsync()) {
      void Speech.stop();
      return;
    }
    Speech.speak(selectedPhoto.caption, { language: 'fr-FR', rate: 0.9 });
  };

  const selectPhoto = (photoId: string) => setSelectedPhotoId(photoId);
  const closePhoto = () => setSelectedPhotoId(null);
  const emptyTitle = view === 'today' ? 'Pas de photo surprise aujourd’hui' : 'Aucune photo ici pour le moment';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      {/* La FlatList ne monte que les vignettes proches de l’écran, même pour les grands albums. */}
      <FlatList
        key={`photo-grid-${columns}`}
        data={visiblePhotos}
        keyExtractor={(photo) => photo.id}
        numColumns={columns}
        columnWrapperStyle={styles.gridRow}
        ItemSeparatorComponent={GridRowSeparator}
        renderItem={({ item }) => (
          <SeniorPhotoGridTile
            photo={item}
            size={tileSize}
            onOpen={() => selectPhoto(item.id)}
            onLike={() => { void toggleLike(item); }}
            likeDisabled={pendingLikeIds.has(item.id)}
          />
        )}
        ListHeaderComponent={(
          <View style={styles.header}>
            <AppText variant="title">Ma famille en photos</AppText>
            <View style={styles.tabs}>
              <AlbumTab label="Photo du jour" selected={view === 'today'} onPress={() => selectView('today')} />
              <AlbumTab label="Toutes" selected={view === 'all'} onPress={() => selectView('all')} />
              <AlbumTab label="Souvenirs" selected={view === 'memories'} onPress={() => selectView('memories')} />
            </View>
            {!selectedPhoto && <ErrorText message={error} />}
          </View>
        )}
        ListEmptyComponent={(
          <Card>
            <AppText variant="title">{emptyTitle}</AppText>
            <AppText>Les nouvelles photos de votre famille apparaîtront ici.</AppText>
            {view === 'today' && <Button label="Voir toutes les photos" onPress={() => selectView('all')} />}
          </Card>
        )}
        contentContainerStyle={styles.content}
        initialNumToRender={columns * 4}
        maxToRenderPerBatch={columns * 4}
        windowSize={7}
      />

      <Modal visible={selectedPhoto !== null} animationType="fade" onRequestClose={closePhoto}>
        <SafeAreaView edges={['left', 'right', 'bottom']} style={[styles.modal, { backgroundColor: colors.bg }]}>
          <View style={[styles.modalHeader, { paddingTop: insets.top + spacing.sm }]}>
            <AppText variant="title">Photo</AppText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Fermer la photo"
              onPress={closePhoto}
              style={[styles.closeButton, { backgroundColor: colors.surface }]}
            >
              <X size={24} color={colors.ink} />
            </Pressable>
          </View>
          {selectedPhoto && (
            <ScrollView contentContainerStyle={styles.detailContent}>
              <PhotoImage
                photoId={selectedPhoto.id}
                label={selectedPhoto.caption || 'Photo de famille'}
                height={Math.min(width - spacing.lg * 2, 480)}
                resizeMode="contain"
              />
              <View style={styles.detailHeading}>
                <View style={styles.detailCopy}>
                  <AppText variant="title">Un petit coucou de {selectedPhoto.senderName}</AppText>
                  <AppText variant="small">Envoyée le {new Date(selectedPhoto.createdAt).toLocaleDateString('fr-FR')}</AppText>
                </View>
                <PhotoLikeButton
                  liked={Boolean(selectedPhoto.likedAt)}
                  disabled={pendingLikeIds.has(selectedPhoto.id)}
                  onPress={() => { void toggleLike(selectedPhoto); }}
                />
              </View>
              {!!selectedPhoto.memoryDate && <AppText variant="small">Souvenir du {selectedPhoto.memoryDate}</AppText>}
              {!!selectedPhoto.caption && <AppText>{selectedPhoto.caption}</AppText>}
              {!!selectedPhoto.caption && <Button label="Écouter le petit mot" onPress={() => void readCaption()} variant="ghost" />}
              <ErrorText message={error} />
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function AlbumTab({ label, selected, onPress }: { readonly label: string; readonly selected: boolean; readonly onPress: () => void }) {
  const { colors } = useAppearance();
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.tab, { borderColor: colors.line, backgroundColor: selected ? colors.primary : colors.surface }]}
    >
      <AppText color={selected ? colors.white : colors.inkSoft} style={styles.tabLabel}>{label}</AppText>
    </Pressable>
  );
}

function GridRowSeparator() {
  return <View style={styles.rowSeparator} />;
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: 104, flexGrow: 1 },
  header: { gap: spacing.md, paddingBottom: spacing.md },
  tabs: { flexDirection: 'row', gap: spacing.sm },
  tab: { flex: 1, minHeight: 52, borderWidth: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xs },
  tabLabel: { fontWeight: '700', textAlign: 'center' },
  gridRow: { gap: spacing.xs },
  rowSeparator: { height: spacing.xs },
  modal: { flex: 1 },
  modalHeader: { minHeight: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg },
  closeButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  detailContent: { padding: spacing.lg, gap: spacing.md },
  detailHeading: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  detailCopy: { flex: 1, gap: spacing.xs },
});