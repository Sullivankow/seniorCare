import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, TextStyle } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { font } from '../theme';

export type TextSize = 'standard' | 'large' | 'extraLarge';
export type TextVariant = 'body' | 'small' | 'title' | 'huge';

const STORAGE_KEY = 'seniorcare.accessibility.textSize';
const TEXT_SCALES: Record<TextSize, number> = {
    standard: 1,
    large: 1.15,
    extraLarge: 1.3,
};

interface AccessibilityContextValue {
    readonly textSize: TextSize;
    readonly textScale: number;
    readonly textStyles: Record<TextVariant, TextStyle>;
    readonly setTextSize: (size: TextSize) => void;
}

const AccessibilityContext = createContext<AccessibilityContextValue | null>(null);

async function readStoredTextSize(): Promise<TextSize | null> {
    try {
        let stored: string | null = null;
        if (Platform.OS === 'web') {
            if (typeof localStorage !== 'undefined') stored = localStorage.getItem(STORAGE_KEY);
        } else {
            stored = await SecureStore.getItemAsync(STORAGE_KEY);
        }
        return stored === 'standard' || stored === 'large' || stored === 'extraLarge' ? stored : null;
    } catch {
        return null;
    }
}

async function persistTextSize(size: TextSize) {
    try {
        if (Platform.OS === 'web') {
            if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, size);
        } else {
            await SecureStore.setItemAsync(STORAGE_KEY, size);
        }
    } catch {
        // Le choix reste appliqué pendant la session si le stockage local est indisponible.
    }
}

/** Fournit une échelle typographique globale et persiste le choix sur l'appareil. */
export function AccessibilityProvider({ children }: { readonly children: React.ReactNode }) {
    const [textSize, setTextSizeState] = useState<TextSize>('standard');
    const hasUserSelected = useRef(false);
    const textScale = TEXT_SCALES[textSize];

    useEffect(() => {
        void readStoredTextSize().then((storedSize) => {
            if (storedSize && !hasUserSelected.current) setTextSizeState(storedSize);
        });
    }, []);

    const setTextSize = useCallback((size: TextSize) => {
        hasUserSelected.current = true;
        setTextSizeState(size);
        void persistTextSize(size);
    }, []);

    const textStyles = useMemo<Record<TextVariant, TextStyle>>(() => ({
        body: { fontSize: font.body * textScale, lineHeight: font.body * textScale * 1.4 },
        small: { fontSize: font.small * textScale, lineHeight: font.small * textScale * 1.4 },
        title: { fontSize: font.title * textScale, fontWeight: '700', lineHeight: font.title * textScale * 1.2 },
        huge: { fontSize: font.huge * textScale, fontWeight: '800', lineHeight: font.huge * textScale * 1.15 },
    }), [textScale]);

    const value = useMemo(
        () => ({ textSize, textScale, textStyles, setTextSize }),
        [textSize, textScale, textStyles, setTextSize],
    );

    return <AccessibilityContext.Provider value={value}>{children}</AccessibilityContext.Provider>;
}

export function useAccessibility() {
    const context = useContext(AccessibilityContext);
    if (!context) throw new Error('useAccessibility doit être utilisé dans <AccessibilityProvider>');
    return context;
}