import React from 'react';
import { colors } from '../../theme';
import { AppText } from './AppText';

/** Message d'erreur : dit ce qui s'est passé, sans jargon. N'affiche rien s'il n'y a pas d'erreur. */
export function ErrorText({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <AppText variant="small" color={colors.danger} style={{ fontWeight: '600' }}>
      {message}
    </AppText>
  );
}
