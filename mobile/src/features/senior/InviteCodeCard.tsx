import React from 'react';
import { Card, AppText } from '../../components/ui';

/** Affiche le code à communiquer à la famille pour qu'elle puisse suivre ce senior. */
export function InviteCodeCard({ code }: { code?: string | null }) {
  if (!code) return null;
  return (
    <Card>
      <AppText variant="small">Code à donner à votre famille</AppText>
      <AppText variant="huge" style={{ letterSpacing: 6 }}>
        {code}
      </AppText>
    </Card>
  );
}
