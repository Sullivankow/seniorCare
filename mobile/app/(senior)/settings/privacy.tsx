import React from 'react';
import { SettingsInfoPage } from '../../../src/features/settings/SettingsInfoPage';

const sections = [
    {
        title: 'Données utilisées',
        body: 'SeniorCare traite les informations de profil, les pointages et alertes, ainsi que les photos et messages vocaux échangés entre les comptes reliés.',
    },
    {
        title: 'Informations à compléter',
        body: 'Le responsable du traitement, les durées de conservation, l’hébergement et les modalités d’exercice des droits doivent être précisés par l’éditeur avant publication.',
    },
];

export default function PrivacySettingsScreen() {
    return <SettingsInfoPage title="Confidentialité" sections={sections} reserveTabBarSpace />;
}