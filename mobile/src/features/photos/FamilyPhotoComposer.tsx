import React, { useState } from 'react';
import { Image, StyleSheet, Switch, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { AppText, Button, Card, ErrorText, Input } from '../../components/ui';
import { familyPhotosApi } from '../../api/endpoints';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { colors, spacing } from '../../theme';

interface Props {
  readonly seniorId: string;
  readonly onUploaded: () => Promise<void>;
}

export function FamilyPhotoComposer({ seniorId, onUploaded }: Props) {
  const [asset, setAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [caption, setCaption] = useState('');
  const [memoryDate, setMemoryDate] = useState('');
  const [isSurprise, setIsSurprise] = useState(false);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const upload = useAsyncAction(async () => {
    if (!asset) throw new Error('Choisissez une photo avant de l’envoyer.');
    if (memoryDate && !/^\d{4}-\d{2}-\d{2}$/.test(memoryDate)) {
      throw new Error('La date du souvenir doit respecter le format AAAA-MM-JJ.');
    }

    const fields: Record<string, string> = {};
    if (caption.trim()) fields.caption = caption.trim();
    if (memoryDate) fields.memoryDate = memoryDate;
    if (isSurprise) fields.surpriseDate = new Date().toISOString().slice(0, 10);

    await familyPhotosApi.upload(
      seniorId,
      {
        uri: asset.uri,
        name: asset.fileName ?? `photo-${Date.now()}.jpg`,
        type: asset.mimeType ?? 'image/jpeg',
      },
      fields,
    );
    setAsset(null);
    setCaption('');
    setMemoryDate('');
    setIsSurprise(false);
    await onUploaded();
  });

  const choosePhoto = async () => {
    setSelectionError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setSelectionError('Autorisez l’accès aux photos pour choisir une image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled) setAsset(result.assets[0]);
  };

  return (
    <Card>
      <View style={styles.content}>
        <AppText variant="title">Ajouter une photo</AppText>
        {asset ? (
          <Image source={{ uri: asset.uri }} resizeMode="cover" style={styles.preview} />
        ) : (
          <Button label="Choisir une photo" onPress={() => void choosePhoto()} variant="ghost" />
        )}
        {asset && <Button label="Changer la photo" onPress={() => void choosePhoto()} variant="ghost" />}
        <Input
          label="Petit mot pour votre proche"
          value={caption}
          onChangeText={setCaption}
          placeholder="On pense fort à toi !"
          multiline
          maxLength={500}
          style={styles.captionInput}
          textAlignVertical="top"
        />
        <Input
          label="Date du souvenir (facultative)"
          value={memoryDate}
          onChangeText={setMemoryDate}
          placeholder="AAAA-MM-JJ"
          keyboardType="numbers-and-punctuation"
          maxLength={10}
        />
        <View style={styles.switchRow}>
          <AppText style={styles.switchLabel}>Photo surprise du jour</AppText>
          <Switch
            accessibilityLabel="Photo surprise du jour"
            value={isSurprise}
            onValueChange={setIsSurprise}
            trackColor={{ true: colors.primary }}
          />
        </View>
        <ErrorText message={selectionError ?? upload.error} />
        <Button
          label="Envoyer à mon proche"
          onPress={() => upload.run()}
          disabled={!asset}
          loading={upload.loading}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md },
  preview: { width: '100%', height: 220, borderRadius: 8, backgroundColor: colors.line },
  captionInput: { minHeight: 96, paddingTop: 14 },
  switchRow: { minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  switchLabel: { flex: 1 },
});