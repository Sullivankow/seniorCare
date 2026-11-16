import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText, ErrorText } from '../../../../src/components/ui';
import { familyPhotosApi } from '../../../../src/api/endpoints';
import { FamilyPhoto } from '../../../../src/types';
import { FamilyPhotoCard } from '../../../../src/features/photos/FamilyPhotoCard';
import { FamilyPhotoComposer } from '../../../../src/features/photos/FamilyPhotoComposer';
import { useRealtime } from '../../../../src/hooks/useRealtime';
import { RealtimeEvents } from '../../../../src/api/events';
import { useAppearance } from '../../../../src/context/AppearanceContext';
import { spacing } from '../../../../src/theme';
import { getErrorMessage } from '../../../../src/utils/errorMessage';

export default function FamilyPhotosScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const { colors } = useAppearance();
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
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      {/* L'API peut renvoyer 100 photos ; la liste ne monte que les cartes proches de l'écran. */}
      <FlatList
        data={photos}
        keyExtractor={(photo) => photo.id}
        renderItem={({ item }) => <FamilyPhotoCard photo={item} />}
        ListHeaderComponent={(
          <View style={styles.header}>
            <Stack.Screen options={{ title: name ? `Photos de ${name}` : 'Album photo' }} />
            <ErrorText message={error} />
            <FamilyPhotoComposer seniorId={id} onUploaded={load} />
          </View>
        )}
        ListEmptyComponent={<AppText>Aucune photo pour le moment.</AppText>}
        contentContainerStyle={styles.content}
        initialNumToRender={3}
        maxToRenderPerBatch={4}
        windowSize={5}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.md, flexGrow: 1 },
  header: { gap: spacing.md },
});