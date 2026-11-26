import React, { useEffect, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Switch, View } from 'react-native';
import { router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BellRing, ChevronRight, Clock3, Info, Moon, Scale, ShieldCheck } from 'lucide-react-native';
import { AppText, Button, Card, ErrorText, Screen } from '../../../src/components/ui';
import { checkinsApi } from '../../../src/api/endpoints';
import { useAuth } from '../../../src/context/AuthContext';
import { useAppearance } from '../../../src/context/AppearanceContext';
import {
    configureCheckInReminder,
    getCheckInReminderTime,
    isCheckInReminderEnabled,
    saveCheckInReminderTime,
} from '../../../src/services/checkInReminder';
import { getErrorMessage } from '../../../src/utils/errorMessage';
import { spacing } from '../../../src/theme';

const informationPages = [
    { title: 'À propos', subtitle: 'Version et application', href: '/settings/about', Icon: Info },
    { title: 'Confidentialité', subtitle: 'Données et vie privée', href: '/settings/privacy', Icon: ShieldCheck },
    { title: 'Mentions légales', subtitle: 'Éditeur et hébergement', href: '/settings/legal', Icon: Scale },
] as const;

function dateFromTime(time: string) {
    const [hour, minute] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hour, minute, 0, 0);
    return date;
}

function timeFromDate(date: Date) {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export default function SettingsScreen() {
    const { mode, setMode, colors } = useAppearance();
    const { user } = useAuth();
    const [reminderEnabled, setReminderEnabled] = useState(false);
    const [reminderTime, setReminderTime] = useState('20:00');
    const [reminderLoading, setReminderLoading] = useState(true);
    const [reminderError, setReminderError] = useState<string | null>(null);
    const [timePickerVisible, setTimePickerVisible] = useState(false);
    const [timePickerDate, setTimePickerDate] = useState(() => dateFromTime('20:00'));

    useEffect(() => {
        let isCurrent = true;
        if (!user) return () => { isCurrent = false; };
        void Promise.all([isCheckInReminderEnabled(user.id), getCheckInReminderTime(user.id)])
            .then(([enabled, time]) => {
                if (!isCurrent) return;
                setReminderEnabled(enabled);
                setReminderTime(time);
                setTimePickerDate(dateFromTime(time));
            })
            .catch((error: unknown) => { if (isCurrent) setReminderError(getErrorMessage(error)); })
            .finally(() => { if (isCurrent) setReminderLoading(false); });
        return () => { isCurrent = false; };
    }, [user]);

    const changeReminder = async (enabled: boolean) => {
        if (!user) return;
        setReminderLoading(true);
        setReminderError(null);
        try {
            const lastCheckIn = enabled ? await checkinsApi.last() : null;
            const configured = await configureCheckInReminder(user.id, enabled, lastCheckIn?.createdAt ?? null);
            if (enabled && !configured) {
                setReminderError('Autorisez les notifications dans les réglages du téléphone pour activer le rappel.');
            }
            setReminderEnabled(configured);
        } catch (error: unknown) {
            setReminderError(getErrorMessage(error));
        } finally {
            setReminderLoading(false);
        }
    };

    const saveReminderTime = async (date: Date) => {
        if (!user) return;
        setReminderLoading(true);
        setReminderError(null);
        const time = timeFromDate(date);
        try {
            const lastCheckIn = reminderEnabled ? await checkinsApi.last() : null;
            await saveCheckInReminderTime(user.id, time, lastCheckIn?.createdAt ?? null);
            setReminderTime(time);
        } catch (error: unknown) {
            setReminderError(getErrorMessage(error));
        } finally {
            setReminderLoading(false);
            setTimePickerVisible(false);
        }
    };

    const handleTimeChange = (event: { type: string }, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setTimePickerVisible(false);
            if (event.type === 'set' && selectedDate) void saveReminderTime(selectedDate);
            return;
        }
        if (selectedDate) setTimePickerDate(selectedDate);
    };

    return (
        <Screen reserveTabBarSpace>
            <AppText variant="title">Paramètres</AppText>

            <View style={styles.section}>
                <AppText variant="small" color={colors.inkSoft} style={styles.sectionTitle}>APPARENCE</AppText>
                <Card style={styles.card}>
                    <View style={styles.settingRow}>
                        <View style={[styles.iconBox, { backgroundColor: colors.primarySoft }]}>
                            <Moon size={22} color={colors.primary} />
                        </View>
                        <AppText style={styles.settingLabel}>Mode sombre</AppText>
                        <Switch
                            accessibilityLabel="Activer le mode sombre"
                            value={mode === 'dark'}
                            onValueChange={(enabled) => setMode(enabled ? 'dark' : 'light')}
                            trackColor={{ false: colors.line, true: colors.primary }}
                            thumbColor={colors.surface}
                            style={styles.modeSwitch}
                        />
                    </View>
                </Card>
            </View>

            {Platform.OS !== 'web' && (
                <View style={styles.section}>
                    <AppText variant="small" color={colors.inkSoft} style={styles.sectionTitle}>POINTAGE</AppText>
                    <Card style={styles.card}>
                        <View style={styles.settingRow}>
                            <View style={[styles.iconBox, { backgroundColor: colors.primarySoft }]}>
                                <BellRing size={22} color={colors.primary} />
                            </View>
                            <View style={styles.linkCopy}>
                                <AppText style={styles.settingLabel}>Rappel quotidien</AppText>
                                <AppText variant="small" color={colors.inkSoft}>À {reminderTime} si vous n’avez pas pointé</AppText>
                            </View>
                            <Switch
                                accessibilityLabel="Activer le rappel quotidien de pointage"
                                value={reminderEnabled}
                                disabled={reminderLoading || !user}
                                onValueChange={(enabled) => { void changeReminder(enabled); }}
                                trackColor={{ false: colors.line, true: colors.primary }}
                                thumbColor={colors.surface}
                            />
                        </View>
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={`Choisir l’heure du rappel, ${reminderTime}`}
                            disabled={reminderLoading || !user}
                            onPress={() => {
                                setTimePickerDate(dateFromTime(reminderTime));
                                setTimePickerVisible(true);
                            }}
                            style={({ pressed }) => [
                                styles.settingRow,
                                styles.dividedRow,
                                { borderTopColor: colors.line },
                                pressed && styles.pressed,
                            ]}
                        >
                            <View style={[styles.iconBox, { backgroundColor: colors.primarySoft }]}>
                                <Clock3 size={22} color={colors.primary} />
                            </View>
                            <AppText style={styles.settingLabel}>Heure du rappel</AppText>
                            <AppText style={{ color: colors.primary, fontWeight: '700' }}>{reminderTime}</AppText>
                            <ChevronRight size={20} color={colors.inkSoft} />
                        </Pressable>
                    </Card>
                    <ErrorText message={reminderError} />
                    {timePickerVisible && Platform.OS === 'android' && (
                        <DateTimePicker
                            value={timePickerDate}
                            mode="time"
                            display="default"
                            onChange={handleTimeChange}
                        />
                    )}
                    <Modal
                        visible={timePickerVisible && Platform.OS === 'ios'}
                        transparent
                        animationType="fade"
                        onRequestClose={() => setTimePickerVisible(false)}
                    >
                        <View style={styles.modalOverlay}>
                            <View style={[styles.timePickerDialog, { backgroundColor: colors.surface }]}>
                                <AppText variant="title">Heure du rappel</AppText>
                                <DateTimePicker
                                    value={timePickerDate}
                                    mode="time"
                                    display="spinner"
                                    onChange={handleTimeChange}
                                />
                                <View style={styles.pickerActions}>
                                    <Button label="Annuler" variant="ghost" onPress={() => setTimePickerVisible(false)} />
                                    <Button label="Enregistrer" onPress={() => { void saveReminderTime(timePickerDate); }} />
                                </View>
                            </View>
                        </View>
                    </Modal>
                </View>
            )}

            <View style={styles.section}>
                <AppText variant="small" color={colors.inkSoft} style={styles.sectionTitle}>INFORMATIONS</AppText>
                <Card style={styles.card}>
                    {informationPages.map(({ title, subtitle, href, Icon }, index) => (
                        <Pressable
                            key={href}
                            accessibilityRole="button"
                            accessibilityLabel={`${title}, ${subtitle}`}
                            onPress={() => router.push(href)}
                            style={({ pressed }) => [
                                styles.settingRow,
                                index > 0 && [styles.dividedRow, { borderTopColor: colors.line }],
                                pressed && styles.pressed,
                            ]}
                        >
                            <View style={[styles.iconBox, { backgroundColor: colors.primarySoft }]}>
                                <Icon size={22} color={colors.primary} />
                            </View>
                            <View style={styles.linkCopy}>
                                <AppText style={styles.settingLabel}>{title}</AppText>
                                <AppText variant="small" color={colors.inkSoft}>{subtitle}</AppText>
                            </View>
                            <ChevronRight size={20} color={colors.inkSoft} />
                        </Pressable>
                    ))}
                </Card>
            </View>
        </Screen>
    );
}

const styles = StyleSheet.create({
    section: { gap: spacing.sm },
    sectionTitle: { fontWeight: '700' },
    card: { paddingVertical: spacing.xs, paddingHorizontal: spacing.md },
    settingRow: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    modeSwitch: { alignSelf: 'center', transform: [{ translateY: 4 }] },
    iconBox: { width: 40, height: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    settingLabel: { flex: 1, fontWeight: '600' },
    linkCopy: { flex: 1, gap: spacing.xs },
    dividedRow: { borderTopWidth: 1, paddingTop: spacing.sm, marginTop: spacing.xs },
    pressed: { opacity: 0.7 },
    modalOverlay: { flex: 1, justifyContent: 'center', padding: spacing.lg, backgroundColor: 'rgba(0, 0, 0, 0.45)' },
    timePickerDialog: { borderRadius: 8, padding: spacing.md, gap: spacing.sm },
    pickerActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm },
});