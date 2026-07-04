import React, {Suspense} from 'react';
import type {Metadata} from 'next';

import {PlayerPreview} from '../host/components/PlayerPreview';

export const metadata: Metadata = {
  title: 'Player preview | Kindsight',
};

// The host rehearsal target. Previews every player screen (join to reveal) with
// scripted demo data and a Mode A / Mode B toggle, using the exact components
// the player runs at /r. Replaces the earlier reveal-only demo.
export default function RehearsalPreviewPage() {
  return (
    <div style={{padding: '24px 16px', minHeight: '100dvh'}}>
      <Suspense fallback={null}>
        <PlayerPreview initialStep='join' initialMode='round_robin' />
      </Suspense>
    </div>
  );
}
