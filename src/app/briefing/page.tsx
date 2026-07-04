import React from 'react';
import type {Metadata} from 'next';

import {BriefingScreen} from './BriefingScreen';

export const metadata: Metadata = {
  title: 'How this works | Kindsight',
};

export default function BriefingPage() {
  return <BriefingScreen />;
}
