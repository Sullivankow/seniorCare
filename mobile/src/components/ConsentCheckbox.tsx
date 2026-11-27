import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { useAppearance } from '../context/AppearanceContext';
import { spacing } from '../theme';
import { AppText } from './ui';

interface Props {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}

export function ConsentCheckbox({ label, checked, onChange }: Readonly<Props>) {
    const { colors } = useAppearance();

    return (
        <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked }}
            onPress={() => onChange(!checked)}
            style={styles.row}
        >
            <View
                style={[
                    styles.box,
                    {
                        backgroundColor: checked ? colors.primary : colors.surface,
                        borderColor: checked ? colors.primary : colors.line,
                    },
                ]}
            >
                {checked && <Check size={18} color={colors.white} strokeWidth={3} />}
            </View>
            <AppText style={styles.label}>{label}</AppText>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    row: {
        minHeight: 48,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    box: {
        width: 26,
        height: 26,
        borderWidth: 2,
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: { flex: 1 },
});