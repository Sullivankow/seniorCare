import React from 'react';
import { Image, ImageResizeMode, StyleSheet } from 'react-native';
import { familyPhotosApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';

interface Props {
  readonly photoId: string;
  readonly label: string;
  readonly height: number;
  readonly resizeMode?: ImageResizeMode;
}

/** Images are fetched through the same authenticated API as the album metadata. */
export function PhotoImage({ photoId, label, height, resizeMode = 'cover' }: Props) {
  const { token } = useAuth();

  return (
    <Image
      accessibilityLabel={label}
      source={{
        uri: familyPhotosApi.imageUrl(photoId),
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      }}
      resizeMode={resizeMode}
      style={[styles.image, { height }]}
    />
  );
}

const styles = StyleSheet.create({
  image: { width: '100%', backgroundColor: '#DCE3E8' },
});