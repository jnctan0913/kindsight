import React from 'react';
import type {Metadata} from 'next';

import {HostConsole} from './HostConsole';

export const metadata: Metadata = {
  title: 'Host console | Kindsight',
};

export default function HostPage() {
  return <HostConsole />;
}
