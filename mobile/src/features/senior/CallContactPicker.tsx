import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Modal, StyleSheet, View } from 'react-native';
import { Phone } from 'lucide-react-native';
import { AppText, Button, Card, ErrorText, Screen } from '../../components/ui';
import { directoryApi } from '../../api/endpoints';
import { DirectoryContact } from '../../types';
import { colors, spacing } from '../../theme';
import { getErrorMessage } from '../../utils/errorMessage';

interface Props {
    readonly visible: boolean;
    readonly onClose: () => void;
}

export function CallContactPicker({ visible, onClose }: Props) {
    const [contacts, setContacts] = useState<DirectoryContact[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        if (!visible) return;
        let active = true;
        setContacts(null);
        setError(null);
        setLoading(true);

        void directoryApi.listContacts()
            .then((result) => {
                if (active) setContacts(result);
            })
            .catch((loadError: unknown) => {
                if (active) setError(getErrorMessage(loadError));
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => { active = false; };
    }, [reloadKey, visible]);

    const callContact = async (phone: string) => {
        try {
            await Linking.openURL(`tel:${phone}`);
            onClose();
        } catch {
            setError("Impossible d'ouvrir l'application Téléphone sur cet appareil.");
        }
    };

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <Screen backgroundColor={colors.seniorBg}>
                <View style={styles.header}>
                    <View style={styles.title}>
                        <AppText variant="small" color={colors.seniorOk}>VOS CONTACTS</AppText>
                        <AppText variant="title" color={colors.white}>Qui voulez-vous appeler ?</AppText>
                    </View>
                    <Button label="Fermer" variant="ghost" onPress={onClose} />
                </View>

                {loading && <ActivityIndicator color={colors.white} />}
                {contacts?.length === 0 && (
                    <Card>
                        <AppText variant="title">Votre répertoire est vide</AppText>
                        <AppText>Ajoutez un contact avec un numéro de téléphone dans le répertoire.</AppText>
                    </Card>
                )}
                {contacts?.map((contact) => {
                    const phone = contact.phone?.trim();
                    return (
                        <Card key={contact.id}>
                            <View style={styles.contactDetails}>
                                <AppText variant="title">{contact.fullName}</AppText>
                                <AppText variant="small">{phone || 'Numéro non renseigné'}</AppText>
                            </View>
                            <Button
                                label={phone ? 'Appeler' : 'Numéro indisponible'}
                                variant="success"
                                disabled={!phone}
                                onPress={() => { if (phone) void callContact(phone); }}
                            />
                        </Card>
                    );
                })}
                <ErrorText message={error} />
                {error && <Button label="Réessayer" variant="ghost" onPress={() => setReloadKey((key) => key + 1)} />}
            </Screen>
        </Modal>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    title: { flex: 1, gap: spacing.xs },
    contactDetails: { gap: spacing.xs },
});