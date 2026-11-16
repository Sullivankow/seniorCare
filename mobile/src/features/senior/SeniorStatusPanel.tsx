import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../components/ui';
import { useAppearance } from '../../context/AppearanceContext';
import { font, radius, spacing } from '../../theme';

function formatDate(date: Date) {
    const value = date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    return value.charAt(0).toUpperCase() + value.slice(1);
}

export function SeniorStatusPanel() {
    const { colors } = useAppearance();
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 30_000);
        return () => clearInterval(timer);
    }, []);

    return (
        <View style={[styles.panel, { backgroundColor: colors.seniorPanel, borderColor: colors.seniorLine }]}>
            <AppText color={colors.white} style={styles.date}>{formatDate(now)}</AppText>
            <AppText color={colors.white} style={styles.time}>
                {now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </AppText>
            <View style={styles.footer}>
                <AppText color={colors.white} center>Vous êtes entouré(e), nous sommes là pour vous.</AppText>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    panel: {
        borderRadius: radius.lg,
        borderWidth: 1,
        padding: spacing.md,
        alignItems: 'center',
    },
    date: { alignSelf: 'flex-start' },
    time: { fontSize: font.huge + 8, lineHeight: font.huge + 12, fontWeight: '800', letterSpacing: 3 },
    footer: { borderTopColor: 'rgba(255, 255, 255, 0.32)', borderTopWidth: 1, marginTop: spacing.sm, paddingTop: spacing.sm, width: '100%' },
});