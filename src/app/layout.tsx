import {Dosis, League_Spartan, Noto_Sans_SC} from 'next/font/google';
import type {Metadata} from 'next';

import '../scss/_index.scss';

const dosis = Dosis({
  variable: '--font-dosis',
  subsets: ['latin'],
});

const leagueSpartan = League_Spartan({
  variable: '--font-league-spartan',
  subsets: ['latin'],
});

const notoSansSC = Noto_Sans_SC({
  variable: '--font-noto-sc',
  subsets: ['latin'],
});

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export const metadata: Metadata = {
  title: 'Kindsight',
  description: 'The light behind you',
  manifest: `${basePath}/manifest.json`,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <head>
        <meta
          name='viewport'
          content='width=device-width, initial-scale=1.0, user-scalable=no, maximum-scale=1.0, minimum-scale=1.0'
        />
        <meta
          name='theme-color'
          content='#1E2538'
        />
      </head>

      <body
        id='app'
        className={`${dosis.variable} ${leagueSpartan.variable} ${notoSansSC.variable}`}
        style={{backgroundColor: 'var(--night-surface)'}}
      >
        {children}
      </body>
    </html>
  );
}
