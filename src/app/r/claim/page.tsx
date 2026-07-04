import React from 'react';
import type {Metadata} from 'next';

import {ClaimScreen} from './ClaimScreen';

export const metadata: Metadata = {
  title: 'Claim your name | Kindsight',
};

export default function ClaimPage() {
  return <ClaimScreen />;
}
