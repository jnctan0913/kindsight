import {Dosis, League_Spartan, Noto_Sans_SC} from 'next/font/google';
import type {Metadata} from 'next';

import '../scss/_index.scss';

import {LocaleProvider} from '../i18n';

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
        {/*
          Defense-in-depth CSP. GitHub Pages cannot set HTTP headers, so this
          rides a meta tag. Static export inlines Next's bootstrap scripts and
          styled-jsx/swiper inject inline styles, so 'unsafe-inline' is required
          for script/style. The one external origin is Supabase (REST + realtime
          websocket); fonts are self-hosted by next/font, no analytics.
          (frame-ancestors/X-Frame-Options are header-only and ignored in meta,
          so clickjacking cannot be blocked on this host.)
        */}
        <meta
          httpEquiv='Content-Security-Policy'
          content={[
            "default-src 'self'",
            "base-uri 'self'",
            "object-src 'none'",
            "script-src 'self' 'unsafe-inline'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: blob:",
            "font-src 'self' data:",
            "media-src 'self'",
            "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
            "worker-src 'self' blob:",
            "manifest-src 'self'",
            "form-action 'self'",
          ].join('; ')}
        />
        <meta
          name='viewport'
          content='width=device-width, initial-scale=1.0, user-scalable=no, maximum-scale=1.0, minimum-scale=1.0'
        />
        <meta
          name='theme-color'
          content='#F5FAFB'
        />
      </head>

      <body
        id='app'
        className={`${dosis.variable} ${leagueSpartan.variable} ${notoSansSC.variable}`}
        style={{backgroundColor: 'var(--neon-white)'}}
      >
        <LocaleProvider>{children}</LocaleProvider>
      </body>
    </html>
  );
}
