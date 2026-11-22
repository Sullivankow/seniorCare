import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert as NativeAlert, Linking, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { ContactRound, Mail, Pencil, Phone, Trash2 } from 'lucide-react-native';
import { AppText, Button, Card, ErrorText, Input, Screen } from '../../src/components/ui';
import { directoryApi } from '../../src/api/endpoints';
import { DirectoryContact } from '../../src/types';
import { useAppearance } from '../../src/context/AppearanceContext';
import { spacing } from '../../src/theme';
import { getErrorMessage } from '../../src/utils/errorMessage';

export default function SeniorDirectory() {
    const { colors } = useAppearance();
    const [contacts, setContacts] = useState<DirectoryContact[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingContactId, setEditingContactId] = useState<string | null>(null);
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [formError, setFormError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [deletingContactId, setDeletingContactId] = useState<string | null>(null);

    const load = useCallback(async () => {
        try {
            setContacts(await directoryApi.listContacts());
            setError(null);
        } catch (error: unknown) {
            setError(getErrorMessage(error));
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

    const resetForm = () => {
        setEditingContactId(null);
        setFullName('');
        setPhone('');
        setEmail('');
        setFormError(null);
        setShowForm(false);
    };

    const startEditing = (contact: DirectoryContact) => {
        setEditingContactId(contact.id);
        setFullName(contact.fullName);
        setPhone(contact.phone ?? '');
        setEmail(contact.email ?? '');
        setFormError(null);
        setShowForm(true);
    };

    const saveContact = async () => {
        setSaving(true);
        setFormError(null);
        try {
            const data = { fullName: fullName.trim(), phone: phone.trim() };
            if (editingContactId) {
                await directoryApi.updateContact(editingContactId, { ...data, email: email.trim() || null });
            } else {
                await directoryApi.createContact({ ...data, ...(email.trim() ? { email: email.trim() } : {}) });
            }
            resetForm();
            await load();
        } catch (error: unknown) {
            setFormError(getErrorMessage(error));
        } finally {
            setSaving(false);
        }
    };

    const removeContact = async (contact: DirectoryContact) => {
        setDeletingContactId(contact.id);
        try {
            await directoryApi.deleteContact(contact.id);
            setContacts((current) => current?.filter((item) => item.id !== contact.id) ?? null);
            setError(null);
        } catch (error: unknown) {
            setError(getErrorMessage(error));
        } finally {
            setDeletingContactId(null);
        }
    };

    const confirmDelete = (contact: DirectoryContact) => {
        NativeAlert.alert('Supprimer ce contact ?', `${contact.fullName} ne figurera plus dans votre répertoire.`, [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Supprimer', style: 'destructive', onPress: () => { void removeContact(contact); } },
        ]);
    };

    return (
        <Screen
            reserveTabBarSpace
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />
            }
        >
            <AppText variant="small" color={colors.seniorOk}>VOS CONTACTS</AppText>
            <AppText variant="title">Répertoire</AppText>
            <AppText>Vos proches et les personnes que vous souhaitez joindre.</AppText>
            <ErrorText message={error} />

            <Button
                label={showForm ? 'Fermer le formulaire' : 'Ajouter une personne'}
                variant={showForm ? 'ghost' : 'success'}
                onPress={() => { if (showForm) resetForm(); else { setEditingContactId(null); setFormError(null); setShowForm(true); } }}
            />

            {showForm && (
                <Card>
                    <AppText variant="title">{editingContactId ? 'Modifier le contact' : 'Nouveau contact'}</AppText>
                    <Input label="Nom" value={fullName} onChangeText={setFullName} autoCapitalize="words" maxLength={100} />
                    <Input label="Téléphone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" maxLength={30} />
                    <Input label="E-mail (facultatif)" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" maxLength={255} />
                    <ErrorText message={formError} />
                    <Button label={editingContactId ? 'Enregistrer les modifications' : 'Enregistrer le contact'} onPress={() => { void saveContact(); }} loading={saving} disabled={!fullName.trim() || !phone.trim()} />
                </Card>
            )}

            {contacts === null && !error && <ActivityIndicator color={colors.primary} />}
            {contacts?.length === 0 && (
                <Card>
                    <AppText variant="title">Votre répertoire est vide</AppText>
                    <AppText>Ajoutez une personne ou partagez votre code depuis Profil pour retrouver votre famille ici.</AppText>
                </Card>
            )}

            {contacts?.map((contact) => {
                const canManage = contact.source === 'personal';
                const isDeleting = deletingContactId === contact.id;
                return (
                    <Card key={contact.id}>
                        <View style={styles.contactTitleRow}>
                            <AppText variant="title" style={styles.contactName}>{contact.fullName}</AppText>
                            {canManage && (
                                <View style={styles.manageActions}>
                                    <IconAction
                                        label={`Modifier ${contact.fullName}`}
                                        disabled={isDeleting}
                                        onPress={() => startEditing(contact)}
                                        icon={<Pencil size={20} color={colors.primary} />}
                                    />
                                    <IconAction
                                        label={`Supprimer ${contact.fullName}`}
                                        destructive
                                        disabled={isDeleting}
                                        onPress={() => confirmDelete(contact)}
                                        icon={<Trash2 size={20} color={colors.danger} />}
                                    />
                                </View>
                            )}
                        </View>
                        <View style={styles.contactHeader}>
                            <View style={[styles.iconBox, { backgroundColor: colors.okSoft }]}>
                                <ContactRound size={26} color={colors.seniorOk} />
                            </View>
                            <View style={styles.contactDetails}>
                                {Boolean(contact.phone) && <AppText variant="small">{contact.phone}</AppText>}
                                {Boolean(contact.email) && <AppText variant="small">{contact.email}</AppText>}
                            </View>
                        </View>
                        {(contact.phone || contact.email) && (
                            <View style={styles.contactActions}>
                                {Boolean(contact.phone) && (
                                    <ContactAction
                                        icon={<Phone size={20} color={colors.primary} />}
                                        label="Appeler"
                                        onPress={() => { void openContact(`tel:${contact.phone}`); }}
                                    />
                                )}
                                {Boolean(contact.email) && (
                                    <ContactAction
                                        icon={<Mail size={20} color={colors.primary} />}
                                        label="E-mail"
                                        onPress={() => { void openContact(`mailto:${contact.email}`); }}
                                    />
                                )}
                            </View>
                        )}
                    </Card>
                );
            })}
        </Screen>
    );
}

function ContactAction({ icon, label, onPress }: { readonly icon: React.ReactNode; readonly label: string; readonly onPress: () => void }) {
    const { colors } = useAppearance();
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={label}
            onPress={onPress}
            style={({ pressed }) => [styles.contactAction, { backgroundColor: colors.primarySoft }, pressed && styles.pressed]}
        >
            {icon}
            <AppText color={colors.primary} style={styles.actionLabel}>{label}</AppText>
        </Pressable>
    );
}

function IconAction({ icon, label, onPress, destructive, disabled }: { readonly icon: React.ReactNode; readonly label: string; readonly onPress: () => void; readonly destructive?: boolean; readonly disabled?: boolean }) {
    const { colors } = useAppearance();
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={label}
            disabled={disabled}
            onPress={onPress}
            style={({ pressed }) => [
                styles.iconAction,
                { backgroundColor: destructive ? colors.dangerSoft : colors.primarySoft },
                pressed && styles.pressed,
                disabled && styles.disabled,
            ]}
        >
            {icon}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    contactTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    contactName: { flex: 1 },
    contactHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    iconBox: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    contactDetails: { flex: 1, gap: spacing.xs },
    contactActions: { flexDirection: 'row', gap: spacing.sm },
    contactAction: { flex: 1, minHeight: 52, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingHorizontal: spacing.sm },
    actionLabel: { fontWeight: '700' },
    manageActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm },
    iconAction: { width: 44, height: 44, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    pressed: { opacity: 0.75 },
    disabled: { opacity: 0.5 },
});