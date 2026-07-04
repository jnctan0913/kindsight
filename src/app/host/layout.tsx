import React from 'react';

// Marks the whole host (admin) surface so the global mobile-app width cap on
// #app (see src/scss/_id.scss) is lifted and the console uses the full viewport.
export default function HostLayout({children}: {children: React.ReactNode}) {
  return <div data-surface='host'>{children}</div>;
}
