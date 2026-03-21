import type { Metadata } from 'next';
import { Head } from 'nextra/components';
import { getPageMap } from 'nextra/page-map';
import { Footer, Layout, Navbar, ThemeSwitch } from 'nextra-theme-docs';
import type { ReactNode } from 'react';
import 'nextra-theme-docs/style.css';
import './globals.css';

const SITE_URL = 'https://mikecoj.github.io/neststack';
const SITE_NAME = 'NestStack';
const SITE_DESCRIPTION =
  'Enterprise-grade NestJS packages for type-safe configuration, secret management, and more.';

export const metadata: Metadata = {
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  metadataBase: new URL(SITE_URL),
  icons: {
    icon: '/neststack/icon.svg',
  },
  keywords: [
    'NestJS',
    'TypeScript',
    'configuration',
    'config module',
    'fintech',
    'banking',
    'enterprise',
    'zod',
    'type-safe',
    'secret management',
  ],
  authors: [{ name: 'Mike Cojocari', url: 'https://github.com/mikecoj' }],
  creator: 'Mike Cojocari',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: {
      default: SITE_NAME,
      template: `%s | ${SITE_NAME}`,
    },
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: {
      default: SITE_NAME,
      template: `%s | ${SITE_NAME}`,
    },
    description: SITE_DESCRIPTION,
    creator: '@mikecoj',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${SITE_URL}/docs?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/icon.svg`,
      sameAs: ['https://github.com/mikecoj/neststack'],
    },
  ],
};

const REPO_BASE = 'https://github.com/mikecoj/neststack';

export default async function RootLayout({ children }: { children: ReactNode }) {
  const pageMap = await getPageMap();
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <Head>
        {/* Security signal meta tags */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta httpEquiv="Permissions-Policy" content="camera=(), microphone=(), geolocation=()" />
      </Head>
      <body>
        {/* JSON-LD structured data — WebSite + Organization schema (hardcoded constant, no user input) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Layout
          pageMap={pageMap}
          docsRepositoryBase={`${REPO_BASE}/tree/main/apps/docs`}
          nextThemes={{ defaultTheme: 'dark' }}
          editLink="Edit this page on GitHub"
          feedback={{ content: null }}
          sidebar={{ defaultMenuCollapseLevel: 2, toggleButton: true }}
          navbar={
            <Navbar
              logo={
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <img src="/neststack/icon.svg" width={28} height={28} alt="NestStack logo" />
                  <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>NestStack</span>
                </span>
              }
              projectLink={REPO_BASE}
            >
              <ThemeSwitch />
            </Navbar>
          }
          footer={
            <Footer>
              <span>
                MIT {new Date().getFullYear()} &copy;{' '}
                <a href="https://github.com/mikecoj" target="_blank" rel="noopener noreferrer">
                  Mike Cojocari
                </a>
              </span>
            </Footer>
          }
        >
          {children}
        </Layout>
      </body>
    </html>
  );
}
