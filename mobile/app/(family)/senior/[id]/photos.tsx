import React, { useCallback, useState } from 'react';
import { Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { AppText, ErrorText, Screen } from '../../../../src/components/ui';
import { familyPhotosApi } from '../../../../src/api/endpoints';
import { FamilyPhoto } from '../../../../src/types';
import { FamilyPhotoCard } from '../../../../src/features/photos/FamilyPhotoCard';
import { FamilyPhotoComposer } from '../../../../src/features/photos/FamilyPhotoComposer';
import { useRealtime } from '../../../../src/hooks/useRealtime';
import { RealtimeEvents } from '../../../../src/api/events';
import { getErrorMessage } from '../../../../src/utils/errorMessage';

export default function FamilyPhotosScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const [photos, setPhotos] = useState<FamilyPhoto[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setPhotos(await familyPhotosApi.listForFamily(id));
      setError(null);
    } catch (loadError: unknown) {
      setError(getErrorMessage(loadError));
    }
  }, [id]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));
  useRealtime({
    [RealtimeEvents.PHOTO_CREATED]: () => { void load(); },
    [RealtimeEvents.PHOTO_REACTION_UPDATED]: () => { void load(); },
  });

  return (
    <Screen>
      <Stack.Screen options={{ title: name ? `Photos de ${name}` : 'Album photo' }} />
      <ErrorText message={error} />
      <FamilyPhotoComposer seniorId={id} onUploaded={load} />
      {photos.length === 0 ? (
        <AppText>Aucune photo pour le moment.</AppText>
      ) : photos.map((photo) => <FamilyPhotoCard key={photo.id} photo={photo} />)}
    </Screen>
  );
}