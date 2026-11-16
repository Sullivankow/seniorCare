import React from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';
import { router } from 'expo-router';
import { ChevronRight, Moon, Scale, ShieldCheck } from 'lucide-react-native';
import { AppText, Card, Screen } from '../../../src/components/ui';
import { useAppearance } from '../../../src/context/AppearanceContext';
import { spacing } from '../../../src/theme';

const informationPages = [
    { title: 'Confidentialité', subtitle: 'Données et vie privée', href: '/settings/privacy', Icon: ShieldCheck },
    { title: 'Mentions légales', subtitle: 'Éditeur et hébergement', href: '/settings/legal', Icon: Scale },
] as const;

export default function SettingsScreen() {
    const { mode, setMode, colors } = useAppearance();

    return (
        <Screen>
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
                        />
                    </View>
                </Card>
            </View>

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
    iconBox: { width: 40, height: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    settingLabel: { flex: 1, fontWeight: '600' },
    linkCopy: { flex: 1, gap: spacing.xs },
    dividedRow: { borderTopWidth: 1, paddingTop: spacing.sm, marginTop: spacing.xs },
    pressed: { opacity: 0.7 },
});