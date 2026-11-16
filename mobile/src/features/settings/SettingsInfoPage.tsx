import React from 'react';
import { router } from 'expo-router';
import { AppText, Button, Card, Screen } from '../../components/ui';

export interface SettingsInfoSection {
    readonly title: string;
    readonly body: string;
}

export function SettingsInfoPage({ title, sections }: { readonly title: string; readonly sections: readonly SettingsInfoSection[] }) {
    return (
        <Screen>
            <Button label="Retour aux paramètres" variant="ghost" onPress={() => router.back()} />
            <AppText variant="title">{title}</AppText>
            {sections.map((section) => (
                <Card key={section.title}>
                    <AppText variant="title">{section.title}</AppText>
                    <AppText>{section.body}</AppText>
                </Card>
            ))}
        </Screen>
    );
}