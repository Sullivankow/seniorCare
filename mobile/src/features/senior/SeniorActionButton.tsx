import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../components/ui';
import { colors, font, radius, spacing } from '../../theme';

interface Props {
    readonly title: string;
    readonly subtitle: string;
    readonly icon: string;
    readonly color: string;
    readonly onPress: () => void;
    readonly loading?: boolean;
    readonly trailing?: string;
    readonly accessibilityLabel?: string;
}

export function SeniorActionButton({ title, subtitle, icon, color, onPress, loading, trailing, accessibilityLabel }: Props) {
    let trailingContent: React.ReactNode = null;
    if (loading) trailingContent = <ActivityIndicator color={colors.white} />;
    else if (trailing) trailingContent = <AppText color={colors.white} style={styles.trailing}>{trailing}</AppText>;

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel ?? `${title}. ${subtitle}`}
            disabled={loading}
            onPress={onPress}
            style={({ pressed }) => [styles.button, { backgroundColor: color }, pressed && styles.pressed]}
        >
            <View style={styles.iconBox}>
                <AppText color={colors.white} style={styles.icon}>{icon}</AppText>
            </View>
            <View style={styles.copy}>
                <AppText color={colors.white} style={styles.title}>{title}</AppText>
                <AppText color={colors.white} style={styles.subtitle}>{subtitle}</AppText>
            </View>
            {trailingContent}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    button: {
        minHeight: 104,
        borderRadius: radius.lg,
        padding: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
    iconBox: {
        width: 60,
        height: 60,
        borderRadius: radius.md,
        backgroundColor: 'rgba(0, 0, 0, 0.16)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    icon: { fontSize: 30, fontWeight: '700' },
    copy: { flex: 1, gap: 2 },
    title: { fontSize: font.action, lineHeight: font.action * 1.2, fontWeight: '700' },
    subtitle: { fontSize: font.small, lineHeight: font.small * 1.3, opacity: 0.9 },
    trailing: { fontSize: 27, fontWeight: '700' },
});