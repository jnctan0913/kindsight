import React, {Suspense} from 'react';
import type {Metadata} from 'next';

import {JoinScreen} from './JoinScreen';

export const metadata: Metadata = {
  title: 'Join a room | Kindsight',
};

export default function JoinPage() {
  return (
    <Suspense fallback={null}>
      <JoinScreen />
    </Suspense>
  );
}
