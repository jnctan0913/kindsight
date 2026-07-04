import React, {Suspense} from 'react';
import type {Metadata} from 'next';

import {PlayerFlow} from './r/PlayerFlow';

export const metadata: Metadata = {
  title: 'Kindsight',
  description: 'The light behind you',
};

// The base route is the player entry point: a returning player resumes their
// session, and a new player sees the join screen with a secondary host entry.
export default function Home() {
  return (
    <Suspense fallback={null}>
      <PlayerFlow />
    </Suspense>
  );
}
