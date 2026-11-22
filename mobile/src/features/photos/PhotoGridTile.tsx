import React from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Heart } from 'lucide-react-native';
import { useAppearance } from '../../context/AppearanceContext';
import { FamilyPhoto } from '../../types';
import { PhotoImage } from './PhotoImage';

interface PhotoGridTileProps {
    readonly photo: FamilyPhoto;
    readonly size: number;
    readonly onOpen: () => void;
    readonly onLike: () => void;
    readonly likeDisabled: boolean;
}

interface PhotoLikeButtonProps {
    readonly liked: boolean;
    readonly disabled?: boolean;
    readonly onPress: () => void;
    readonly style?: StyleProp<ViewStyle>;
}

/** Une vignette ouvre le détail; le bouton cœur garde une action indépendante. */
export function SeniorPhotoGridTile({ photo, size, onOpen, onLike, likeDisabled }: PhotoGridTileProps) {
    const label = photo.caption || `Photo envoyée par ${photo.senderName}`;

    return (
        <View style={[styles.tile, { width: size, height: size }]}>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Ouvrir ${label}`}
                onPress={onOpen}
                style={StyleSheet.absoluteFill}
            >
                <PhotoImage photoId={photo.id} label={label} height={size} />
            </Pressable>
            <PhotoLikeButton
                liked={Boolean(photo.likedAt)}
                disabled={likeDisabled}
                onPress={onLike}
                style={styles.tileLikeButton}
            />
        </View>
    );
}

export function PhotoLikeButton({ liked, disabled, onPress, style }: PhotoLikeButtonProps) {
    const { colors } = useAppearance();

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={liked ? 'Retirer mon cœur' : 'Aimer cette photo'}
            accessibilityState={{ selected: liked, disabled }}
            disabled={disabled}
            hitSlop={6}
            onPress={onPress}
            style={({ pressed }) => [styles.likeButton, style, pressed && styles.pressed, disabled && styles.disabled]}
        >
            <Heart size={23} color={colors.danger} fill={liked ? colors.danger : 'transparent'} strokeWidth={2.5} />
        </Pressable>
    );
}

const styles = StyleSheet.create({
    tile: { position: 'relative', overflow: 'hidden', borderRadius: 3 },
    likeButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.94)',
    },
    tileLikeButton: { position: 'absolute', top: 6, right: 6 },
    pressed: { opacity: 0.75, transform: [{ scale: 0.94 }] },
    disabled: { opacity: 0.55 },
});