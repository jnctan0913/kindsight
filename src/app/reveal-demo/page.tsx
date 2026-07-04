import React, {Suspense} from 'react';
import type {Metadata} from 'next';

import {RevealDemo} from './RevealDemo';

export const metadata: Metadata = {
  title: 'Reveal ritual demo | Kindsight',
};

export default function RevealDemoPage() {
  return (
    <Suspense fallback={null}>
      <RevealDemo />
    </Suspense>
  );
}
