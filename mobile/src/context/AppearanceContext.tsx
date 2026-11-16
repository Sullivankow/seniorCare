import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { AppColors, getColors, ThemeMode } from '../theme';

const STORAGE_KEY = 'seniorcare.appearance';

interface AppearanceContextValue {
    readonly mode: ThemeMode;
    readonly colors: AppColors;
    readonly setMode: (mode: ThemeMode) => void;
}

const AppearanceContext = createContext<AppearanceContextValue | null>(null);

async function readStoredMode(): Promise<ThemeMode | null> {
    try {
        let stored: string | null = null;
        if (Platform.OS === 'web') {
            if (typeof localStorage !== 'undefined') stored = localStorage.getItem(STORAGE_KEY);
        } else {
            stored = await SecureStore.getItemAsync(STORAGE_KEY);
        }
        return stored === 'dark' || stored === 'light' ? stored : null;
    } catch {
        return null;
    }
}

async function persistMode(mode: ThemeMode) {
    try {
        if (Platform.OS === 'web') {
            if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, mode);
        } else {
            await SecureStore.setItemAsync(STORAGE_KEY, mode);
        }
    } catch {
        // Le changement de thème reste actif même si le stockage local est indisponible.
    }
}

/** Expose une palette réactive et persiste le choix d'apparence de l'utilisateur. */
export function AppearanceProvider({ children }: { readonly children: React.ReactNode }) {
    const [mode, setModeState] = useState<ThemeMode>('light');

    useEffect(() => {
        void readStoredMode().then((storedMode) => {
            if (storedMode) setModeState(storedMode);
        });
    }, []);

    useEffect(() => {
        Appearance.setColorScheme(mode);
    }, [mode]);

    const setMode = useCallback((nextMode: ThemeMode) => {
        setModeState(nextMode);
        void persistMode(nextMode);
    }, []);

    const value = useMemo(() => ({ mode, colors: getColors(mode), setMode }), [mode, setMode]);
    return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
}

export function useAppearance() {
    const context = useContext(AppearanceContext);
    if (!context) throw new Error('useAppearance doit être utilisé dans <AppearanceProvider>');
    return context;
}