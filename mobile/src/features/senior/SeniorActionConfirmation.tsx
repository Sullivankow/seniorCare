import React from 'react';
import { StyleSheet, View } from 'react-native';
import { CircleCheck } from 'lucide-react-native';
import { AppText, Button, Card } from '../../components/ui';
import { useAppearance } from '../../context/AppearanceContext';
import { spacing } from '../../theme';

export type SeniorConfirmationKind = 'OK' | 'NOT_GREAT' | 'SOS';

interface Props {
    readonly kind: SeniorConfirmationKind;
    readonly onDismiss?: () => void;
    readonly onCancel?: () => void;
    readonly cancelLoading?: boolean;
}

/**
 * Retour visuel unique après une action importante envoyée depuis l'accueil senior.
 * Garder ce composant isolé évite des messages divergents pour les pointages et le SOS.
 */
export function SeniorActionConfirmation({ kind, onDismiss, onCancel, cancelLoading }: Readonly<Props>) {
    const { colors } = useAppearance();
    const content = getConfirmationContent(kind);
    let accentColor = colors.ok;
    if (kind === 'SOS') accentColor = colors.danger;
    if (kind === 'NOT_GREAT') accentColor = colors.warn;

    return (
        <View
            accessibilityRole="summary"
            accessibilityLiveRegion="assertive"
        >
            <Card tone={content.tone}>
                <View style={styles.heading}>
                    <CircleCheck
                        size={28}
                        color={accentColor}
                    />
                    <AppText
                        variant="title"
                        color={accentColor}
                        style={styles.title}
                    >
                        {content.title}
                    </AppText>
                </View>
                <AppText>{content.message}</AppText>
                {onCancel && (
                    <Button
                        variant="ghost"
                        label="C'était une erreur : annuler"
                        onPress={onCancel}
                        loading={cancelLoading}
                    />
                )}
                {onDismiss && (
                    <Button
                        variant="ghost"
                        label="OK"
                        onPress={onDismiss}
                    />
                )}
            </Card>
        </View>
    );
}

function getConfirmationContent(kind: SeniorConfirmationKind): {
    readonly tone: 'ok' | 'warn' | 'danger';
    readonly title: string;
    readonly message: string;
} {
    if (kind === 'SOS') {
        return {
            tone: 'danger',
            title: 'Votre famille a été prévenue',
            message: 'Votre demande SOS est envoyée. Restez où vous êtes, votre famille peut maintenant vous rejoindre.',
        };
    }
    if (kind === 'NOT_GREAT') {
        return {
            tone: 'warn',
            title: 'Votre famille a été informée',
            message: 'Votre message « Pas très en forme » a été envoyé à vos proches reliés.',
        };
    }
    return {
        tone: 'ok',
        title: 'Votre famille a été rassurée',
        message: 'Votre message « Je vais bien » a été envoyé à vos proches reliés.',
    };
}

const styles = StyleSheet.create({
    heading: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    title: { flex: 1 },
});
