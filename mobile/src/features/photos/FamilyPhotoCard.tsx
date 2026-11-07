import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, Card } from '../../components/ui';
import { FamilyPhoto } from '../../types';
import { spacing } from '../../theme';
import { formatDateTime } from '../../utils/time';
import { PhotoImage } from './PhotoImage';

export function FamilyPhotoCard({ photo }: { readonly photo: FamilyPhoto }) {
  return (
    <Card>
      <PhotoImage photoId={photo.id} label={photo.caption || 'Photo de famille'} height={220} />
      <View style={styles.details}>
        <AppText variant="small">Envoyée par {photo.senderName} · {formatDateTime(photo.createdAt)}</AppText>
        {!!photo.caption && <AppText>{photo.caption}</AppText>}
        {!!photo.memoryDate && <AppText variant="small">Souvenir du {photo.memoryDate}</AppText>}
        {!!photo.surpriseDate && <AppText variant="small">Photo surprise</AppText>}
        {!!photo.likedAt && <AppText variant="small">Votre proche a aimé cette photo</AppText>}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  details: { gap: spacing.sm, paddingTop: spacing.md },
});