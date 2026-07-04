import React, {Suspense} from 'react';
import type {Metadata} from 'next';

import {BigScreen} from './BigScreen';

export const metadata: Metadata = {
  title: 'Big screen | Kindsight',
};

export default function ScreenPage() {
  return (
    <Suspense fallback={null}>
      <BigScreen />
    </Suspense>
  );
}
