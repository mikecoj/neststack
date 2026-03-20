import type { Metadata } from 'next';
import { Head } from 'nextra/components';
import { getPageMap } from 'nextra/page-map';
import { Footer, Layout, Navbar } from 'nextra-theme-docs';
import type { ReactNode } from 'react';
import 'nextra-theme-docs/style.css';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'NestStack',
    template: '%s | NestStack',
  },
  description:
    'Enterprise-grade NestJS packages for type-safe configuration, secret management, and more.',
  metadataBase: new URL('https://mikecoj.github.io/neststack'),
};

const REPO_BASE = 'https://github.com/mikecoj/neststack';

export default async function RootLayout({ children }: { children: ReactNode }) {
  const pageMap = await getPageMap();
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <Head faviconGlyph="N" />
      <body>
        <Layout
          pageMap={pageMap}
          docsRepositoryBase={`${REPO_BASE}/tree/main/apps/docs`}
          nextThemes={{ defaultTheme: 'dark' }}
          editLink="Edit this page on GitHub"
          feedback={{ content: null }}
          sidebar={{ defaultMenuCollapseLevel: 2, toggleButton: true }}
          navbar={
            <Navbar
              logo={<span style={{ fontWeight: 800, fontSize: '1.1rem' }}>NestStack</span>}
              projectLink={REPO_BASE}
            />
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
