import React from 'react';
import { Linking } from 'react-native';
import { Button } from '../../components/ui';
import { Alert } from '../../types';

/** Affiche une action cartographique uniquement si la position a été consentie et reçue. */
export function AlertLocationButton({ alert }: Readonly<{ alert: Pick<Alert, 'latitude' | 'longitude'> }>) {
    const { latitude, longitude } = alert;
    if (typeof latitude !== 'number' || typeof longitude !== 'number') return null;

    const openLocation = () => {
        const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
        void Linking.openURL(url).catch(() => undefined);
    };

    return <Button label="Voir la position" variant="ghost" onPress={openLocation} />;
}