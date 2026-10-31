import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert as NativeAlert, Linking, RefreshControl, StyleSheet, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { ContactRound } from 'lucide-react-native';
import { AppText, Button, Card, ErrorText, Input, Screen } from '../../src/components/ui';
import { directoryApi } from '../../src/api/endpoints';
import { DirectoryContact } from '../../src/types';
import { colors, spacing } from '../../src/theme';

export default function SeniorDirectory() {
    const [contacts, setContacts] = useState<DirectoryContact[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [formError, setFormError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const load = useCallback(async () => {
        try {
            setContacts(await directoryApi.listContacts());
            setError(null);
        } catch (e: any) {
            setError(e.message);
        }
    }, []);

    useFocusEffect(useCallback(() => { void load(); }, [load]));

    const openContact = async (url: string) => {
        try {
            await Linking.openURL(url);
        } catch {
            NativeAlert.alert('Action indisponible', 'Aucune application compatible n’est disponible sur cet appareil.');
        }
    };

    const addContact = async () => {
        setSaving(true);
        setFormError(null);
        try {
            await directoryApi.createContact({
                fullName: fullName.trim(),
                phone: phone.trim(),
                ...(email.trim() ? { email: email.trim() } : {}),
            });
            setFullName('');
            setPhone('');
            setEmail('');
            setShowForm(false);
            await load();
        } catch (e: any) {
            setFormError(e.message);
        } finally {
            setSaving(false);
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
            <AppText color={colors.white}>Vos proches et les personnes que vous souhaitez joindre.</AppText>
            <ErrorText message={error} />

            <Button
                label={showForm ? 'Fermer le formulaire' : 'Ajouter une personne'}
                variant={showForm ? 'ghost' : 'success'}
                onPress={() => { setShowForm(!showForm); setFormError(null); }}
            />

            {showForm && (
                <Card>
                    <AppText variant="title">Nouveau contact</AppText>
                    <Input label="Nom" value={fullName} onChangeText={setFullName} autoCapitalize="words" maxLength={100} />
                    <Input label="Téléphone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" maxLength={30} />
                    <Input label="E-mail (facultatif)" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" maxLength={255} />
                    <ErrorText message={formError} />
                    <Button label="Enregistrer le contact" onPress={() => { void addContact(); }} loading={saving} disabled={!fullName.trim() || !phone.trim()} />
                </Card>
            )}

            {contacts === null && !error && <ActivityIndicator color={colors.white} />}
            {contacts?.length === 0 && (
                <Card>
                    <AppText variant="title">Votre répertoire est vide</AppText>
                    <AppText>Ajoutez une personne ou partagez votre code depuis Profil pour retrouver votre famille ici.</AppText>
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
                            {Boolean(contact.phone) && <AppText variant="small">{contact.phone}</AppText>}
                            {Boolean(contact.email) && <AppText variant="small">{contact.email}</AppText>}
                        </View>
                    </View>
                    {Boolean(contact.phone) && (
                        <Button label="Appeler" variant="success" onPress={() => { void openContact(`tel:${contact.phone}`); }} />
                    )}
                    {Boolean(contact.email) && (
                        <Button label="Envoyer un e-mail" variant="ghost" onPress={() => { void openContact(`mailto:${contact.email}`); }} />
                    )}
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