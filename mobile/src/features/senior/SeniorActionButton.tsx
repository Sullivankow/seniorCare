import React from 'react';
import { ActivityIndicator, Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { AppText } from '../../components/ui';
import { useAppearance } from '../../context/AppearanceContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { font, radius, spacing } from '../../theme';

interface Props {
    readonly title: string;
    readonly subtitle: string;
    readonly icon: React.ReactNode;
    readonly color: string;
    readonly onPress: () => void;
    readonly loading?: boolean;
    readonly trailing?: React.ReactNode;
    readonly accessibilityLabel?: string;
    readonly style?: StyleProp<ViewStyle>;
}

export function SeniorActionButton({ title, subtitle, icon, color, onPress, loading, trailing, accessibilityLabel, style }: Props) {
    const { colors } = useAppearance();
    const { textScale } = useAccessibility();
    let trailingContent: React.ReactNode = null;
    if (loading) trailingContent = <ActivityIndicator color={colors.white} />;
    else if (trailing) trailingContent = trailing;

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel ?? `${title}. ${subtitle}`}
            disabled={loading}
            onPress={onPress}
            style={({ pressed }) => [styles.button, { backgroundColor: color }, style, pressed && styles.pressed]}
        >
            <View style={styles.topRow}>
                <View style={styles.iconBox}>
                    {icon}
                </View>
                {trailingContent}
            </View>
            <View style={styles.copy}>
                <AppText color={colors.white} style={[styles.title, { fontSize: (font.action - 2) * textScale, lineHeight: (font.action - 2) * textScale * 1.2 }]}>{title}</AppText>
                <AppText color={colors.white} style={[styles.subtitle, { fontSize: font.small * textScale, lineHeight: font.small * textScale * 1.3 }]}>{subtitle}</AppText>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    button: {
        minHeight: 184,
        borderRadius: radius.lg,
        padding: spacing.md,
        justifyContent: 'space-between',
        gap: spacing.sm,
    },
    pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
    topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    iconBox: {
        width: 52,
        height: 52,
        borderRadius: radius.md,
        backgroundColor: 'rgba(0, 0, 0, 0.16)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    copy: { gap: spacing.xs },
    title: { fontWeight: '700' },
    subtitle: { opacity: 0.9 },
});