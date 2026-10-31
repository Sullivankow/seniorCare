import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert as NativeAlert, Linking, RefreshControl, StyleSheet, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { ContactRound } from 'lucide-react-native';
import { AppText, Button, Card, ErrorText, Screen } from '../../src/components/ui';
import { directoryApi } from '../../src/api/endpoints';
import { DirectoryContact } from '../../src/types';
import { colors, spacing } from '../../src/theme';

export default function SeniorDirectory() {
    const [contacts, setContacts] = useState<DirectoryContact[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const load = useCallback(async () => {
        try {
            setContacts(await directoryApi.listContacts());
            setError(null);
        } catch (e: any) {
            setError(e.message);
        }
    }, []);

    useFocusEffect(useCallback(() => { void load(); }, [load]));

    const emailContact = async (email: string) => {
        try {
            await Linking.openURL(`mailto:${email}`);
        } catch {
            NativeAlert.alert('Messagerie indisponible', 'Impossible d’ouvrir une application de messagerie sur cet appareil.');
        }
    };

    return (
        <Screen
            backgroundColor={colors.seniorBg}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />
            }
        >
            <AppText variant="small" color={colors.seniorOk}>VOS CONTACTS</AppText>
            <AppText variant="title" color={colors.white}>Répertoire</AppText>
            <AppText color={colors.white}>Les proches reliés à votre compte.</AppText>
            <ErrorText message={error} />

            {contacts === null && !error && <ActivityIndicator color={colors.white} />}
            {contacts?.length === 0 && (
                <Card>
                    <AppText variant="title">Aucun proche relié</AppText>
                    <AppText>Partagez votre code d’invitation depuis l’onglet Profil pour retrouver votre famille ici.</AppText>
                </Card>
            )}

            {contacts?.map((contact) => (
                <Card key={contact.id}>
                    <View style={styles.contactHeader}>
                        <View style={styles.iconBox}>
                            <ContactRound size={26} color={colors.seniorOk} />
                        </View>
                        <View style={styles.contactDetails}>
                            <AppText variant="title">{contact.fullName}</AppText>
                            <AppText variant="small">{contact.email}</AppText>
                        </View>
                    </View>
                    <Button label="Envoyer un e-mail" onPress={() => { void emailContact(contact.email); }} />
                </Card>
            ))}
        </Screen>
    );
}

const styles = StyleSheet.create({
    contactHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    iconBox: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.okSoft },
    contactDetails: { flex: 1, gap: spacing.xs },
});