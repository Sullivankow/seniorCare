import React from 'react';
import Constants from 'expo-constants';
import { SettingsInfoPage } from '../../../src/features/settings/SettingsInfoPage';

const version = Constants.expoConfig?.version ?? 'Version inconnue';

const sections = [
    {
        title: 'SeniorCare',
        body: 'Une application de veille bienveillante entre les seniors et leurs proches.',
    },
    {
        title: 'Version',
        body: version,
    },
];

export default function AboutSettingsScreen() {
    return <SettingsInfoPage title="À propos" sections={sections} reserveTabBarSpace />;
}