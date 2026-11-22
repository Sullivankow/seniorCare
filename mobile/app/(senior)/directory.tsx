import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert as NativeAlert, Linking, Pressable, RefreshControl, StyleSheet, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { ContactRound, Mail, Pencil, Phone, Plus, Search, Trash2, X } from 'lucide-react-native';
import { AppText, Button, Card, ErrorText, Input, Screen } from '../../src/components/ui';
import { directoryApi } from '../../src/api/endpoints';
import { DirectoryContact } from '../../src/types';
import { useAppearance } from '../../src/context/AppearanceContext';
import { font, spacing } from '../../src/theme';
import { getErrorMessage } from '../../src/utils/errorMessage';

export default function SeniorDirectory(): React.JSX.Element {
    const { colors } = useAppearance();
    const [contacts, setContacts] = useState<DirectoryContact[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [search, setSearch] = useState('');
    const [editingContactId, setEditingContactId] = useState<string | null>(null);
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [formError, setFormError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [deletingContactId, setDeletingContactId] = useState<string | null>(null);

    const filteredContacts = filterContacts(contacts ?? [], search);
    const countLabel = getContactCountLabel(contacts, filteredContacts.length, search);

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

    const toggleForm = () => {
        if (showForm) {
            resetForm();
            return;
        }
        setEditingContactId(null);
        setFormError(null);
        setShowForm(true);
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

            <DirectoryToolbar
                search={search}
                onSearchChange={setSearch}
                countLabel={countLabel}
                formOpen={showForm}
                onToggleForm={toggleForm}
            />

            {showForm && <ContactFormCard
                editing={editingContactId !== null}
                fullName={fullName}
                phone={phone}
                email={email}
                error={formError}
                saving={saving}
                onFullNameChange={setFullName}
                onPhoneChange={setPhone}
                onEmailChange={setEmail}
                onSave={() => { void saveContact(); }}
            />}

            {contacts === null && !error && <ActivityIndicator color={colors.primary} />}
            {contacts?.length === 0 && <DirectoryEmptyState />}
            {contacts && contacts.length > 0 && filteredContacts.length === 0 && <SearchEmptyState />}

            {filteredContacts.map((contact) => (
                <DirectoryContactCard
                    key={contact.id}
                    contact={contact}
                    deleting={deletingContactId === contact.id}
                    onEdit={() => startEditing(contact)}
                    onDelete={() => confirmDelete(contact)}
                    onCall={(contactPhone) => { void openContact(`tel:${contactPhone}`); }}
                    onEmail={(contactEmail) => { void openContact(`mailto:${contactEmail}`); }}
                />
            ))}
        </Screen>
    );
}

function filterContacts(contacts: DirectoryContact[], query: string): DirectoryContact[] {
    const normalizedQuery = query.trim().toLocaleLowerCase('fr-FR');
    if (!normalizedQuery) return contacts;

    return contacts.filter((contact) =>
        [contact.fullName, contact.phone, contact.email]
            .filter(Boolean)
            .join(' ')
            .toLocaleLowerCase('fr-FR')
            .includes(normalizedQuery),
    );
}

function getContactCountLabel(contacts: DirectoryContact[] | null, resultCount: number, query: string): string {
    if (!contacts) return 'Chargement des contacts…';
    if (!query.trim()) return formatContactCount(contacts.length);
    return `${formatResultCount(resultCount)} sur ${formatContactCount(contacts.length)}`;
}

function formatContactCount(count: number): string {
    return `${count} contact${count === 1 ? '' : 's'}`;
}

function formatResultCount(count: number): string {
    return `${count} résultat${count === 1 ? '' : 's'}`;
}

interface DirectoryToolbarProps {
    readonly search: string;
    readonly onSearchChange: (value: string) => void;
    readonly countLabel: string;
    readonly formOpen: boolean;
    readonly onToggleForm: () => void;
}

function DirectoryToolbar({ search, onSearchChange, countLabel, formOpen, onToggleForm }: DirectoryToolbarProps): React.JSX.Element {
    const { colors } = useAppearance();
    const addButtonBackground = formOpen ? colors.surface : colors.primary;
    const addButtonBorder = formOpen ? colors.line : colors.primary;

    return (
        <>
            <View style={styles.searchRow}>
                <View style={[styles.searchField, { borderColor: colors.line, backgroundColor: colors.surface }]}>
                    <Search size={22} color={colors.inkSoft} />
                    <TextInput
                        accessibilityLabel="Rechercher un contact"
                        placeholder="Nom, téléphone ou e-mail"
                        placeholderTextColor={colors.inkSoft}
                        value={search}
                        onChangeText={onSearchChange}
                        returnKeyType="search"
                        style={[styles.searchInput, { color: colors.ink }]}
                    />
                </View>
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={formOpen ? 'Fermer le formulaire' : 'Ajouter une personne'}
                    onPress={onToggleForm}
                    style={({ pressed }) => [styles.addButton, { backgroundColor: addButtonBackground, borderColor: addButtonBorder }, pressed && styles.pressed]}
                >
                    {formOpen ? <X size={24} color={colors.ink} /> : <Plus size={26} color={colors.white} />}
                </Pressable>
            </View>
            <AppText variant="small" color={colors.inkSoft}>{countLabel}</AppText>
        </>
    );
}

interface ContactFormCardProps {
    readonly editing: boolean;
    readonly fullName: string;
    readonly phone: string;
    readonly email: string;
    readonly error: string | null;
    readonly saving: boolean;
    readonly onFullNameChange: (value: string) => void;
    readonly onPhoneChange: (value: string) => void;
    readonly onEmailChange: (value: string) => void;
    readonly onSave: () => void;
}

function ContactFormCard({
    editing,
    fullName,
    phone,
    email,
    error,
    saving,
    onFullNameChange,
    onPhoneChange,
    onEmailChange,
    onSave,
}: ContactFormCardProps): React.JSX.Element {
    return (
        <Card>
            <AppText variant="title">{editing ? 'Modifier le contact' : 'Nouveau contact'}</AppText>
            <Input label="Nom" value={fullName} onChangeText={onFullNameChange} autoCapitalize="words" maxLength={100} />
            <Input label="Téléphone" value={phone} onChangeText={onPhoneChange} keyboardType="phone-pad" maxLength={30} />
            <Input label="E-mail (facultatif)" value={email} onChangeText={onEmailChange} keyboardType="email-address" autoCapitalize="none" maxLength={255} />
            <ErrorText message={error} />
            <Button
                label={editing ? 'Enregistrer les modifications' : 'Enregistrer le contact'}
                onPress={onSave}
                loading={saving}
                disabled={!fullName.trim() || !phone.trim()}
            />
        </Card>
    );
}

function DirectoryEmptyState(): React.JSX.Element {
    return (
        <Card>
            <AppText variant="title">Votre répertoire est vide</AppText>
            <AppText>Ajoutez une personne ou partagez votre code depuis Profil pour retrouver votre famille ici.</AppText>
        </Card>
    );
}

function SearchEmptyState(): React.JSX.Element {
    return (
        <Card>
            <AppText variant="title">Aucun contact trouvé</AppText>
            <AppText>Essayez avec un autre nom, numéro ou e-mail.</AppText>
        </Card>
    );
}

interface DirectoryContactCardProps {
    readonly contact: DirectoryContact;
    readonly deleting: boolean;
    readonly onEdit: () => void;
    readonly onDelete: () => void;
    readonly onCall: (phone: string) => void;
    readonly onEmail: (email: string) => void;
}

function DirectoryContactCard({ contact, deleting, onEdit, onDelete, onCall, onEmail }: DirectoryContactCardProps): React.JSX.Element {
    const { colors } = useAppearance();
    const phone = contact.phone;
    const email = contact.email;
    const canManage = contact.source === 'personal';

    return (
        <Card>
            <View style={styles.contactTitleRow}>
                <AppText variant="title" style={styles.contactName}>{contact.fullName}</AppText>
                {canManage && (
                    <View style={styles.manageActions}>
                        <IconAction
                            label={`Modifier ${contact.fullName}`}
                            disabled={deleting}
                            onPress={onEdit}
                            icon={<Pencil size={20} color={colors.primary} />}
                        />
                        <IconAction
                            label={`Supprimer ${contact.fullName}`}
                            destructive
                            disabled={deleting}
                            onPress={onDelete}
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
                    {!!phone && <AppText variant="small">{phone}</AppText>}
                    {!!email && <AppText variant="small">{email}</AppText>}
                </View>
            </View>
            {(phone || email) && (
                <View style={styles.contactActions}>
                    {!!phone && <ContactAction icon={<Phone size={20} color={colors.primary} />} label="Appeler" onPress={() => onCall(phone)} />}
                    {!!email && <ContactAction icon={<Mail size={20} color={colors.primary} />} label="E-mail" onPress={() => onEmail(email)} />}
                </View>
            )}
        </Card>
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
    searchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    searchField: { flex: 1, minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderWidth: 2, borderRadius: 8, paddingHorizontal: spacing.md },
    searchInput: { flex: 1, minWidth: 0, minHeight: 52, fontSize: font.body },
    addButton: { width: 56, height: 56, borderWidth: 2, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
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