import React, {Suspense} from 'react';
import type {Metadata} from 'next';

import {PlayerFlow} from './PlayerFlow';

export const metadata: Metadata = {
  title: 'Join a room | Kindsight',
};

export default function PlayerPage() {
  return (
    <Suspense fallback={null}>
      <PlayerFlow />
    </Suspense>
  );
}
