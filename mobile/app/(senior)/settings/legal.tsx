import React from 'react';
import { SettingsInfoPage } from '../../../src/features/settings/SettingsInfoPage';

// Ne pas publier avant d’avoir remplacé ces éléments par les informations juridiques vérifiées.
const sections = [
    { title: 'Éditeur', body: 'À renseigner.' },
    { title: 'Responsable de publication', body: 'À renseigner.' },
    { title: 'Hébergement', body: 'À renseigner.' },
    { title: 'Contact', body: 'À renseigner.' },
];

export default function LegalSettingsScreen() {
    return <SettingsInfoPage title="Mentions légales" sections={sections} />;
}