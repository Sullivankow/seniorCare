import React, { useState } from 'react';
import { Alert, Image, StyleSheet, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { UserRound } from 'lucide-react-native';
import { AppText, Button, Card, ErrorText } from '../../components/ui';
import { userApi } from '../../api/endpoints';
import { useAppearance } from '../../context/AppearanceContext';
import { useAuth } from '../../context/AuthContext';
import { User } from '../../types';
import { getErrorMessage } from '../../utils/errorMessage';

interface Props {
  readonly user: User;
  readonly onUpdated: (user: User) => Promise<void>;
}

export function ProfilePhotoEditor({ user, onUpdated }: Props) {
  const { colors } = useAppearance();
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const choosePhoto = async () => {
    setError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Autorisez l’accès aux photos pour choisir une image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    setLoading(true);
    try {
      const updatedUser = await userApi.uploadProfilePhoto({
        uri: asset.uri,
        name: asset.fileName ?? `profil-${Date.now()}.jpg`,
        type: asset.mimeType ?? 'image/jpeg',
        blob: asset.file,
      });
      await onUpdated(updatedUser);
    } catch (uploadError: unknown) {
      setError(getErrorMessage(uploadError));
    } finally {
      setLoading(false);
    }
  };

  const removePhoto = () => Alert.alert('Supprimer la photo ?', 'Votre profil affichera de nouveau l’icône par défaut.', [
    { text: 'Annuler', style: 'cancel' },
    {
      text: 'Supprimer',
      style: 'destructive',
      onPress: () => {
        void (async () => {
          setLoading(true);
          setError(null);
          try {
            await onUpdated(await userApi.removeProfilePhoto());
          } catch (removeError: unknown) {
            setError(getErrorMessage(removeError));
          } finally {
            setLoading(false);
          }
        })();
      },
    },
  ]);

  return (
    <Card>
      <AppText variant="title">Photo de profil</AppText>
      <View style={styles.photoWrap}>
        {user.profilePhotoUpdatedAt ? (
          <Image
            accessibilityLabel={`Photo de profil de ${user.fullName}`}
            source={{ uri: userApi.profilePhotoUrl(user.profilePhotoUpdatedAt), headers: token ? { Authorization: `Bearer ${token}` } : undefined }}
            resizeMode="cover"
            style={[styles.photo, { backgroundColor: colors.line }]}
          />
        ) : (
          <View style={[styles.photo, styles.placeholder, { backgroundColor: colors.primarySoft }]}>
            <UserRound size={52} color={colors.primary} />
          </View>
        )}
      </View>
      <Button label="Choisir une photo" onPress={() => void choosePhoto()} loading={loading} />
      {Boolean(user.profilePhotoUpdatedAt) && <Button label="Supprimer la photo" onPress={removePhoto} variant="ghost" disabled={loading} />}
      <ErrorText message={error} />
    </Card>
  );
}

const styles = StyleSheet.create({
  photoWrap: { alignItems: 'center', paddingVertical: 8 },
  photo: { width: 128, height: 128, borderRadius: 64 },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
});